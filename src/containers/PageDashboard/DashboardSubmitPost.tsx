import React, { FormEvent, useState } from "react";
import Input from "components/Input/Input";
import ButtonPrimary from "components/Button/ButtonPrimary";
import Select from "components/Select/Select";
import Textarea from "components/Textarea/Textarea";
import Label from "components/Label/Label";
import { useAuth } from "firebase/authManager";
import { useDb } from "firebase/firestoreManager";
import handleError from "utils/firebaseErrorHandler";
import swal from "sweetalert";
import { CreatePost, Post } from "models/Post";
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw } from 'draft-js';
import CreatableSelect from 'react-select/creatable';
import draftToHtml from 'draftjs-to-html';
import LZString from 'lz-string';
import '../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Dropzone, FileItem, FileValidated, FullScreenPreview } from "@dropzone-ui/react";
import ButtonSecondary from "components/Button/ButtonSecondary";
import Modal from 'react-modal';
import { TaxonomyType } from "data/types";
import { formatDistance } from "date-fns";
import PageSingleGalleryPreview from "containers/PageSingleGallery/PageSingleGalleryPreview";
import { SinglePageType } from "containers/PageSingle/PageSingle";
import PageSinglePreview from "containers/PageSingle/PageSinglePreview";
import { getFileUrl, uploadFile } from "firebase/storageManager";
import ButtonClose from "components/ButtonClose/ButtonClose";

const DashboardSubmitPost = () => {
  const { user, author } = useAuth();
  const { tags, addPost, setPhotoUrl } = useDb();
  const [selectedTags, setSelectedTags] = useState([] as string[]);
  const [formData, setFormData] = useState({ category: "article", authorId: user?.uid, status: "DRAFT" } as CreatePost);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [files, setFiles] = useState([] as FileValidated[]);
  const [imageSrc, setImageSrc] = useState("" as string | undefined);
  const [percent, setPercent] = useState(0);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { currentTarget } = event;
    const newFormData = { ...formData, [currentTarget.name]: currentTarget.value };
    setFormData(newFormData);
  }

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { currentTarget } = event;
    const newFormData = { ...formData, [currentTarget.name]: currentTarget.value };
    setFormData(newFormData);
  }

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { target } = event;
    const newFormData = { ...formData, [target.name]: target.value };
    setFormData(newFormData);
  }

  const doSubmit = async (source: string) => {
    try {
      if (!author) {
        swal("Warning!", "Please log in again to continue with this action.", "warning");
        return;
      }
      if (!formData.title) {
        swal("Title is required!", "Please give your post a title.", "warning");
        return;
      }

      const editorContent = editorState.getCurrentContent();
      if (!editorContent.getPlainText().trim()) {
        swal("Content is empty!", "Your post must have some valid content.", "warning");
        return;
      }

      setLoading(true);
      const rawContent = convertToRaw(editorContent);
      const htmlContent = draftToHtml(rawContent);

      formData.content = LZString.compressToUTF16(htmlContent);
      if (source === "SAVE_DRAFT") {
        formData.status = "DRAFT";
      }
      else if (source === "SAVE_PUBLISH") {
        if (author.isVerifiedAuthor || author.isModerator || author.isAdmin) {
          formData.status = "ACCEPTED";
          formData.published = true;
        }
        else {
          formData.status = "IN_REVIEW";
        }
      }
      formData.tags = selectedTags;
      formData.photoName = files.filter(file => file.valid).flatMap(file => file.file.name);
      const newDoc = await addPost(formData);

      if (files.filter(f => f.valid).length === 0) {
        swal("Success!", `Article was saved successfully.`, "success");
        setLoading(false);
      }
      else {
        uploadFiles(newDoc.id);
      }

    } catch (error: any) {
      handleError(error);
      setLoading(false);
    }
  }

  const handleSubmit = async (event: FormEvent, source: string = "SAVE_PUBLISH") => {
    event.preventDefault();
    await doSubmit(source);
  }

  const uploadFiles = (postId: string) => {
    const filesToUpload = files.filter(file => file.valid);
    let fileUploadCount = filesToUpload.length;
    const imageUrls = [] as string[];

    filesToUpload.forEach(file => {
      uploadFile(`/images/posts/${postId}`, file,
        (progress) => setPercent(progress),
        (storageRef) => {
          getFileUrl(storageRef)
            .then(url => {
              --fileUploadCount;
              imageUrls.push(url);
              if (fileUploadCount === 0) {
                setPhotoUrl({ uid: postId, photoURL: imageUrls } as Post)
                  .then(() => swal("Success!", `Article was saved successfully.`, "success"))
                  .catch((error) => console.log(error))
                  .finally(() => setLoading(false));
              }
            });
        },
        (error) => {
          console.log(error);
          setLoading(false);
        });
    });
  }

  function getFeaturedImage(): string {
    const validFiles = files.filter(file => file.valid).length;
    return validFiles === 1 ? URL.createObjectURL(files[0].file) : "";
  }

  const pageData = {
    content: draftToHtml(convertToRaw(editorState.getCurrentContent())),
    tags: selectedTags.map(value => { return { name: value } as TaxonomyType }),
    comments: [],
    id: "createPreview",
    author: author,
    date: formatDistance(new Date(), new Date(), { includeSeconds: true, addSuffix: true }),
    href: "",
    categories: [{ name: formData.category } as TaxonomyType],
    title: formData.title,
    featuredImage: getFeaturedImage(),
    galleryImgs: files.filter(file => file.valid).map(file => URL.createObjectURL(file.file)),
    like: { count: 0, isLiked: false },
    bookmark: { count: 0, isBookmarked: false },
    commentCount: 0,
    viewdCount: 0,
    readingTime: 1,
    postType: files.filter(file => file.valid).length > 1 ? "gallery" : "standard",
    desc: formData.description ?? ""
  } as SinglePageType;

  return (
    <div className="rounded-xl md:border md:border-neutral-100 dark:border-neutral-800 md:p-6">
      <form className="grid md:grid-cols-2 gap-6" action="#" method="post" onSubmit={handleSubmit}>
        <label className="block md:col-span-2">
          <Label>Post Title *</Label>

          <Input name="title" type="text" className="mt-1" onChange={handleChange} />
        </label>
        <label className="block md:col-span-2">
          <Label>Post Excerpt</Label>

          <Textarea name="description" className="mt-1" rows={4} onChange={handleTextAreaChange} />
          <p className="mt-1 text-sm text-neutral-500">
            Brief description for your article. URLs are hyperlinked.
          </p>
        </label>
        <label className="block">
          <Label>Category</Label>

          <Select onChange={handleSelectChange} className="mt-1" name="category">
            <option value="article">Article</option>
            <option value="guide">'How to' guide</option>
          </Select>
        </label>
        <label className="block">
          <Label>Tags</Label>
          <CreatableSelect
            isMulti
            onChange={(newValue) => setSelectedTags(newValue.flatMap(selectedTag => selectedTag.value))}
            options={tags.map(tag => ({ value: tag.name, label: tag.name }))}
            classNames={{
              control: (state) => 'text-sm py-0.5 mt-1',
              input: (state) => "clean"
            }} />
        </label>

        <div className="block md:col-span-2">
          <Label>Featured Image</Label>
          <div className="text-sm dark:bg-neutral-900">
            <Dropzone
              accept=".png, image/*"
              footer={false}
              maxFiles={5}
              onChange={(incommingFiles: FileValidated[]) => setFiles(incommingFiles)}
              value={files}
              disableScroll
            >
              {files.length > 0 &&
                files.map((file) => (
                  <FileItem {...file} key={file.id}
                    onDelete={(fileId) => setFiles(files.filter((x) => x.id !== fileId))}
                    onSee={(imageSource: string | undefined) => setImageSrc(imageSource)}
                    preview info hd />
                ))}
            </Dropzone>
            <FullScreenPreview
              imgSource={imageSrc}
              openImage={imageSrc ? true : false}
              onClose={() => setImageSrc(undefined)}
            />
          </div>

        </div>
        <label className="block md:col-span-2">
          <Label> Post Content *</Label>
          <Editor placeholder="Start typing..."
            onEditorStateChange={(editorState: any) => setEditorState(editorState)}
            editorState={editorState}
            editorClassName="md:border md:border-neutral-100 dark:border-neutral-800 " />
        </label>
        <div className="block md:col-span-2">
          <ButtonSecondary className="rounded-lg" type="button" onClick={() => setIsOpen(true)}>
            Preview post
          </ButtonSecondary>
          <div style={{ float: "right" }}>
            <ButtonSecondary loading={loading} type="button" className="rounded-lg" onClick={() => doSubmit("SAVE_DRAFT")}>
              Save as draft
            </ButtonSecondary>
            <ButtonPrimary loading={loading} type="submit" className="ml-1">
              {author?.isVerifiedAuthor || author?.isModerator || author?.isAdmin ? "Save and publish" : "Send for Review"}
            </ButtonPrimary>
          </div>
        </div>
      </form>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setIsOpen(false)}
        style={{
          overlay: {
            backgroundColor: "gray",
            zIndex: 1000
          }, content: {
            position: "absolute",
            inset: "40px",
            border: "1px solid rgb(204, 204, 204)",
            overflow: "auto",
            borderRadius: "4px",
            outline: "none",
            padding: "20px"
          }
        }}
        className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200"
        contentLabel="Example Modal">
        <ButtonClose onClick={() => setIsOpen(false)} />
        {files.filter(file => file.valid).length > 1
          ? (<PageSingleGalleryPreview pageData={pageData} />)
          : (<PageSinglePreview pageData={pageData} />)}
      </Modal>
    </div>
  );
};

export default DashboardSubmitPost;

