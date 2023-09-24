import ButtonPrimary from "components/Button/ButtonPrimary";
import Input from "components/Input/Input";
import Label from "components/Label/Label";
import React, { FormEvent, useEffect, useState } from "react";
import { useAuth } from "firebase/authManager";
import handleError from "utils/firebaseErrorHandler";
import swal from "sweetalert";
import Textarea from "components/Textarea/Textarea";
import { Dropzone, FileItem, FileValidated, FullScreenPreview } from "@dropzone-ui/react";
import { deleteFile, downloadFile, getFileUrl, uploadFile } from "firebase/storageManager";

export interface EditProfileProps {
  firstName: string;
  lastName: string;
  displayName: string,
  jobName: string,
  avatar?: string;
  avatarPhotoName?: string;
  bgImage?: string;
  bgImageName?: string;
  desc?: string;
}

const DashboardEditProfile = () => {
  const { user, author, updateProfile, sendEmailVerificationLink } = useAuth();
  const [formData, setFormData] = useState({ ...author } as EditProfileProps);
  const [files, setFiles] = useState([] as FileValidated[]);
  const [imageSrc, setImageSrc] = useState("" as string | undefined);
  const [bgImageFiles, setBgImageFiles] = useState([] as FileValidated[]);
  const [bgImageSrc, setBgImageSrc] = useState("" as string | undefined);
  const [percent, setPercent] = useState(0);
  const [loading, setIsLoading] = useState(false);
  const [filesChanged, setFilesChanged] = useState(false);

  useEffect(() => {
    if (author && author.avatarPhotoName) {
      downloadFile(`/images/users/${author.id}`, author.avatarPhotoName)
        .then(file => setFiles([file]))
        .catch(error => console.error(error));
    }
    if (author && author.bgImageName) {
      downloadFile(`/images/users/${author.id}`, author.bgImageName)
        .then(file => setBgImageFiles([file]))
        .catch(error => console.error(error));
    }
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    const newFormData = { ...formData, [currentTarget.name]: currentTarget.value };
    setFormData(newFormData);
  }

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { target } = event;
    const newFormData = { ...formData, [target.name]: target.value };
    setFormData(newFormData);
  }

  const uploadFiles = async (afterUpload: any) => {
    let filesUploaded = 0;
    let imageMap: Map<string, FileValidated> = new Map();
    let resultMap: Map<string, {fileName: string, url: string}> = new Map();
    files.filter(file => file.valid).map(file => imageMap.set("avatar", file));
    bgImageFiles.filter(file => file.valid).map(file => imageMap.set("bg", file));

    // upload avatar
    imageMap.forEach((file, key) => {
      uploadFile(`/images/users/${author?.id}`, file,
        (progress) => setPercent(progress),
        (storageRef) => {
          getFileUrl(storageRef).then(url => {
            filesUploaded ++;
            resultMap.set(key, {fileName: file.file.name, url: url});
            if(filesUploaded === imageMap.size) {
              afterUpload(resultMap);
            }
          })
        },
        (error) => console.log(error));
    });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      swal("Authentication expired!", "Please log in again.", "warning");
      return;
    };

    try {
      setIsLoading(true);
      if (filesChanged && files.filter(file => file.valid).length > 0) {
        await uploadFiles(async (map:  Map<string, {fileName: string, url: string}>) => {
          let _formData = {...formData};
          if(map.has("avatar")) {
            _formData.avatar = map.get("avatar")?.url;
            _formData.avatarPhotoName = map.get("avatar")?.fileName;
          }
          if(map.has("bg")) {
            _formData.bgImage = map.get("bg")?.url;
            _formData.bgImageName = map.get("bg")?.fileName;
          }
          await updateProfile(user.uid, _formData);
          setFormData(_formData);
          setIsLoading(false);
          swal("Success!", `Profile was updated successfully.`, "success");
        });
      }
      else if (filesChanged) {
        await deleteFile(`/images/users/${user.uid}`, user.photoURL ?? "");
        await updateProfile(user.uid, { ...formData, avatarPhotoName: "" });
        setIsLoading(false);
        swal("Success!", `Profile was updated successfully.`, "success");
      }
      else {
        await updateProfile(user.uid, formData);
        swal("Success!", `Profile was updated successfully.`, "success");
        setIsLoading(false);
      }
    } catch (error: any) {
      handleError(error);
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl md:border md:border-neutral-100 dark:border-neutral-800 md:p-6">
      <form className="grid md:grid-cols-2 gap-6" action="#" method="post" onSubmit={handleSubmit}>
        <label className="block">
          <Label>First name *</Label>
          <Input required name="firstName" type="text" className="mt-1" value={formData.firstName} onChange={handleChange} />
        </label>
        <label className="block">
          <Label>Last name *</Label>
          <Input required name="lastName" type="text" className="mt-1" value={formData.lastName} onChange={handleChange} />
        </label>
        <label className="block">
          <Label>Display name *</Label>
          <Input required name="displayName" type="text" className="mt-1" value={formData.displayName} onChange={handleChange} />
          <p className="mt-1 text-sm text-neutral-500">
            Your public name.
          </p>
        </label>
        <label className="block">
          <Label>Job description</Label>
          <Input required name="jobName" type="text" className="mt-1" value={formData.jobName} onChange={handleChange} />
        </label>
        <label className="block md:col-span-2">
          <Label>About</Label>

          <Textarea name="desc" className="mt-1" value={formData.desc || ""} rows={4} onChange={handleTextAreaChange} />
          <p className="mt-1 text-sm text-neutral-500">
            Brief description of you.
          </p>
        </label>
        <div className="block">
          <Label>Avatar</Label>
          <Dropzone
            accept=".png, image/*"
            minHeight="50px"
            maxFiles={1}
            style={{}}
            onChange={(incommingFiles: FileValidated[]) => {
              setFiles(incommingFiles);
              setFilesChanged(true);
            }}
            value={files}
            disableScroll
          >
            {files && files.length > 0 &&

              <FileItem {...files[0]} key={files[0].id}
                onDelete={(fileId) => {
                  setFiles(files.filter((x) => x.id !== fileId));
                  setFilesChanged(true);
                }}
                onSee={(imageSource: string | undefined) => setImageSrc(imageSource)}
                preview info hd />
            }
          </Dropzone>
          <FullScreenPreview
            imgSource={imageSrc}
            openImage={imageSrc ? true : false}
            onClose={() => setImageSrc(undefined)}
          />
        </div>
        <div className="block">
          <Label>Background Image</Label>
          <Dropzone
            accept=".png, image/*"
            minHeight="50px"
            maxFiles={1}
            style={{}}
            onChange={(incommingFiles: FileValidated[]) => {
              setBgImageFiles(incommingFiles);
              setFilesChanged(true);
            }}
            value={bgImageFiles}
            disableScroll
          >
            {bgImageFiles && bgImageFiles.length > 0 &&

              <FileItem {...bgImageFiles[0]} key={bgImageFiles[0].id}
                onDelete={(fileId) => {
                  setBgImageFiles(bgImageFiles.filter((x) => x.id !== fileId));
                  setFilesChanged(true);
                }}
                onSee={(imageSource: string | undefined) => setBgImageSrc(imageSource)}
                preview info hd />
            }
          </Dropzone>
          <FullScreenPreview
            imgSource={bgImageSrc}
            openImage={bgImageSrc ? true : false}
            onClose={() => setBgImageSrc(undefined)}
          />
        </div>
        <label className="block">
          <Label> Email address</Label>
          <Input
            readOnly={true}
            type="email"
            placeholder={user?.email || "example@example.com"}
            className="mt-1"
          />
          {(user?.emailVerified === false) &&
            <p className="mt-1 text-sm text-rose-600">
              Your email is not yet verified. Click
              <a className="strong" href="/#"
                onClick={(e) => {
                  e.preventDefault();
                  sendEmailVerificationLink().then(() => {
                    swal("Check your Inbox!", "An email has been sent with instructions how to verify your email.", "success");
                  })
                }} >
                <strong> here </strong>
              </a> if you wish to receive another verification link.
            </p>
          }
        </label>
        <ButtonPrimary loading={loading} className="md:col-span-2" type="submit">
          Update profile
        </ButtonPrimary>
      </form>
    </div>
  );
};

export default DashboardEditProfile;
