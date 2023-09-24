import React, { FormEvent, useEffect, useState } from "react";
import Input from "components/Input/Input";
import ButtonPrimary from "components/Button/ButtonPrimary";
import Select from "components/Select/Select";
import Textarea from "components/Textarea/Textarea";
import Label from "components/Label/Label";
import { useAuth } from "firebase/authManager";
import { useDb } from "firebase/firestoreManager";
import handleError from "utils/firebaseErrorHandler";
import { Post } from "models/Post";
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import '../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import CreatableSelect from "react-select/creatable";
import { Dropzone, FileItem, FileValidated, FullScreenPreview } from "@dropzone-ui/react";
import ButtonSecondary from "components/Button/ButtonSecondary";
import swal from "sweetalert";
import { formatDistance } from "date-fns";
import { TaxonomyType } from "data/types";
import { SinglePageType } from "containers/PageSingle/PageSingle";
import PageSingleGalleryPreview from "containers/PageSingleGallery/PageSingleGalleryPreview";
import PageSinglePreview from "containers/PageSingle/PageSinglePreview";
import Modal from 'react-modal';
import { MultiValue } from "react-select";
import LZString from "lz-string";
import draftToHtml from "draftjs-to-html";
import { Editor } from "react-draft-wysiwyg";
import { deleteFile, downloadFile, getFileUrl, uploadFile } from "firebase/storageManager";
import ButtonClose from "components/ButtonClose/ButtonClose";

const DashboardEditPost = (props: any) => {
  const { author } = useAuth();
  const { tags, editPost } = useDb();
  const { post, afterUpdate } = props;
  const [formData, setFormData] = useState({ ...post } as Post);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([] as FileValidated[]);
  const [imageSrc, setImageSrc] = useState("" as string | undefined);
  const [percent, setPercent] = useState(0);
  const [filesChanged, setFilesChanged] = useState(false);
  const blocksFromHtml = htmlToDraft(LZString.decompressFromUTF16(formData.content) || "");
  const { contentBlocks, entityMap } = blocksFromHtml;
  const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
  const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState));
  const [loading, setLoading] = useState(false);

  const defaultTags = formData.tags
    ? formData.tags.map(tag => ({ value: tag, label: tag }))
    : [];
  const [selectedTags, setSelectedTags] = useState(formData.tags.map(tag => ({ value: tag, label: tag })));

  useEffect(() => {
    let count = 0;
    let _files = [] as FileValidated[];
    let fileNames = formData.photoName || [];

    fileNames.forEach(fileName => {
      downloadFile(`/images/posts/${formData.uid}/`, fileName)
        .then(newFile => {
          _files.push(newFile);
          if (++count === fileNames.length) {
            setFiles(_files);
          }
        }).catch(error => console.error(error));
    });

  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { currentTarget } = event;
    const newFormData = { ...formData, [currentTarget.name]: currentTarget.value };
    setFormData(newFormData);
  }

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const { currentTarget } = event;
    const newFormData = { ...formData, [currentTarget.name]: currentTarget.value };
    setFormData(newFormData);
  }

  function handleTextAreaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const { target } = event;
    const newFormData = { ...formData, [target.name]: target.value };
    setFormData(newFormData);
  }

  const updateFiles = (incommingFiles: FileValidated[]) => {
    setFilesChanged(true);
    setFiles(incommingFiles);
  };

  const onDelete = (id: string | number | undefined) => {
    setFilesChanged(true);
    setFiles(files.filter((x) => x.id !== id));
  };

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
        if (author.isAdmin || author.isModerator || author.isVerifiedAuthor) {
          formData.published = false;
        }
      }
      else if (source === "SAVE_PUBLISH") {
        if (author.isAdmin || author.isModerator || author.isVerifiedAuthor) {
          formData.status = "ACCEPTED";
          formData.published = true;
        }
        else {
          formData.status = "IN_REVIEW";
        }
      }
      formData.tags = selectedTags.flatMap(tag => tag.value);
      if (filesChanged) {
        const formDataWithImages = {
          ...formData,
          photoName: files.filter(file => file.valid).flatMap(file => file.file.name),
        };
        if (files.filter(file => file.valid).length === 0) {
          // all files deleted
          formDataWithImages.photoURL = [];
          await editPost(formDataWithImages);
          deleteFiles(() => { });
          setLoading(false);
          await afterUpdate(formDataWithImages);
          swal("Success", "Article was saved successfully", "success");
        }
        else {
          await uploadFiles(async (imageUrls) => {
            formDataWithImages.photoURL = imageUrls;
            await editPost(formDataWithImages);
            deleteFiles(() => { });
            setLoading(false);
            await afterUpdate(formDataWithImages);
            swal("Success", "Article was saved successfully", "success");
          });
        }
      }
      else {
        await editPost(formData);
        setLoading(false);
        await afterUpdate(formData);
        swal("Success", "Article was saved successfully", "success");
      }
    } catch (error: any) {
      setLoading(false);
      handleError(error);
    }
  }

  async function handleSubmit(event: FormEvent, source: string = "SAVE_PUBLISH") {
    event.preventDefault();
    await doSubmit(source);
  }

  const uploadFiles = async (afterUpload: (imageUrls: string[]) => void) => {
    let uploadCount = 0;
    const imageUrls: string[] = [];
    const filesToUpload = files.filter(file => file.valid);
    filesToUpload.forEach(file => {
      uploadFile(`/images/posts/${formData.uid}`, file,
        (progress) => setPercent(progress),
        async (storageRef) => {
          const url = await getFileUrl(storageRef);
          imageUrls.push(url);
          uploadCount++;
          if (uploadCount === filesToUpload.length) {
            await afterUpload(imageUrls);
          }
        },
        (error) => console.log(error));
    })
  };

  const deleteFiles = (afterDelete: () => void) => {
    // remove deleted files from storage
    if (!post?.photoName) return;

    const filesBeforeUpdate: string[] = post.photoName || [];
    const filesToDelete: string[] = [];
    filesBeforeUpdate.forEach(fileToCheck => {
      if (!files.find(file => file.file.name === fileToCheck)) {
        // file is deleted from user, remove from storage
        filesToDelete.push(fileToCheck);
      }
    });

    let count = filesToDelete.length;
    filesToDelete.forEach(fileToCheck => {
      try {
        deleteFile(`/images/posts/${formData.uid}`, fileToCheck).then(() => {
          if (++count === filesToDelete.length) {
            afterDelete();
          }
        });
      } catch (error) {
        console.error(error);
      }
    });
  };

  function getFeaturedImage(): string {
    const validFiles = files.filter(file => file.valid).length;
    return validFiles === 1 ? URL.createObjectURL(files[0].file) : "";
  }

  const pageData = {
    content: draftToHtml(convertToRaw(editorState.getCurrentContent())),
    tags: selectedTags.map(x => { return { name: x.value } as TaxonomyType }),
    comments: [],
    id: "createPreview",
    author: author,
    date: formatDistance(formData.createdDate ?? new Date(), new Date(), { includeSeconds: true, addSuffix: true }),
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
          <Input required value={formData.title} name="title" type="text" className="mt-1" onChange={handleChange} />
        </label>
        <label className="block md:col-span-2">
          <Label>Post Excerpt</Label>
          <Textarea name="description" value={formData.description || ""} className="mt-1" rows={4} onChange={handleTextAreaChange} />
          <p className="mt-1 text-sm text-neutral-500">
            Brief description for your article. URLs are hyperlinked.
          </p>
        </label>
        <label className="block">
          <Label>Category</Label>
          <Select required value={formData.category} className="mt-1" name="category" onChange={handleSelectChange}>
            <option value="article">Article</option>
            <option value="guide">'How to' guide</option>
          </Select>
        </label>
        <label className="block">
          <Label>Tags</Label>
          <CreatableSelect
            isMulti
            defaultValue={defaultTags}
            onChange={(newVal) => setSelectedTags(newVal.map(selectedTag => ({ value: selectedTag.value, label: selectedTag.label })))}
            options={tags.map(tag => ({ value: tag.name, label: tag.name }))}
            classNames={{
              control: () => 'text-sm py-0.5 mt-1',
              input: () => "clean"
            }} />
        </label>

        <div className="block md:col-span-2">
          <Label>Featured Image</Label>
          <Dropzone
            accept=".png, image/*"
            minHeight="50px"
            maxFiles={5}
            onChange={updateFiles}
            onReset={() => setFilesChanged(true)}
            value={files}
            disableScroll
          >
            {files.length > 0 &&
              files.map((file) => (
                <FileItem
                  {...file}
                  key={file.id}
                  onDelete={onDelete}
                  onSee={(imageSrc) => setImageSrc(imageSrc)}
                  preview
                  info
                  hd />
              ))}
          </Dropzone>
          <FullScreenPreview
            imgSource={imageSrc}
            openImage={imageSrc ? true : false}
            onClose={() => setImageSrc(undefined)} />
        </div>
        <label className="block md:col-span-2">
          <Label> Post Content</Label>
          <Editor
            onEditorStateChange={(editorState: any) => setEditorState(editorState)} editorState={editorState}
            editorClassName="md:border md:border-neutral-100 dark:border-neutral-800 md:p-4" />
        </label>
        <div className="block md:col-span-2">
          <ButtonSecondary className="rounded-lg" type="button" onClick={() => setIsOpen(true)}>
            Preview
          </ButtonSecondary>
          <div style={{ float: "right" }}>
            {(author?.isAdmin || author?.isModerator || author?.isVerifiedAuthor) &&
              <div className="nc_Actions">
                <ButtonSecondary loading={loading} type="button" onClick={() => doSubmit("SAVE_DRAFT")}>
                  {formData.published ? "Unpublish" : "Save as draft"}
                </ButtonSecondary>
                <ButtonPrimary loading={loading} type="button" onClick={() => doSubmit("SAVE_PUBLISH")} className="ml-1">Save and publish</ButtonPrimary>
              </div>
            }
            {(!author?.isAdmin && !author?.isModerator && !author?.isVerifiedAuthor && !formData.published) &&
              <div className="nc_Actions">
                { (formData.status === "DRAFT") &&
                  <ButtonSecondary loading={loading} type="button" onClick={() => doSubmit("SAVE_DRAFT")}>
                    Save as Draft
                  </ButtonSecondary>
                }
                <ButtonPrimary loading={loading} type="button" onClick={() => doSubmit("SAVE_PUBLISH")} className="ml-1">
                  {formData.status === "IN_REVIEW" ? "Save" : "Send for Review"}
                </ButtonPrimary>
              </div>
            }

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

export default DashboardEditPost;
