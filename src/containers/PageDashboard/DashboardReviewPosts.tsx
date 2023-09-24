import React, { useEffect, useState } from "react";
import NcImage from "components/NcImage/NcImage";
import { useDb } from "firebase/firestoreManager";
import handleError from "utils/firebaseErrorHandler";
import { Post } from "models/Post";
import ncNanoId from "utils/ncNanoId";
import { formatPostStatus } from "utils/StringUtils";
import { formatDistance } from "date-fns";
import Modal from 'react-modal';
import ButtonSecondary from "components/Button/ButtonSecondary";
import PageSingleGalleryPreview from "containers/PageSingleGallery/PageSingleGalleryPreview";
import PageSinglePreview from "containers/PageSingle/PageSinglePreview";
import { SinglePageType } from "containers/PageSingle/PageSingle";
import { PostAuthorType, ReviewAction, TaxonomyType } from "data/types";
import NcModal from "components/NcModal/NcModal";
import ButtonClose from "components/ButtonClose/ButtonClose";
import { XIcon } from "@heroicons/react/solid";
import ButtonPrimary from "components/Button/ButtonPrimary";
import ButtonDanger from "components/Button/ButtonDanger";
import swal from "sweetalert";
import Label from "components/Label/Label";
import Textarea from "components/Textarea/Textarea";
import LZString from "lz-string";
import NextPrev from "components/NextPrev/NextPrev";
import { where } from "firebase/firestore";

const DashboardReviewPosts = () => {
  const { countPosts, getPostsToReview, getAuthor, reviewPost } = useDb();
  const [posts, setPosts] = useState([] as Post[]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [previewPostModal, setPreviewPostModal] = useState(false);
  const [postIsRead, setPostIsRead] = useState(false);
  const [postToReview, setPostToReview] = useState({} as Post);
  const [pageData, setPageData] = useState({} as SinglePageType);
  const [comment, setComment] = useState("" as string);

  const pageSize = 5;
  const [totalSize, setTotalSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [firstPostEachPage, setFirstPostEachPage] = useState(new Map<number, string>());

  useEffect(() => {
    const constraints = [where('status', '==', "IN_REVIEW")];
    countPosts(constraints).then(numDocs => {
      setTotalSize(numDocs);
      setTotalPages(Math.ceil(numDocs / pageSize));
      getPostsToReview("", pageSize, "next").then(snapshot => {
        setPagePosts(snapshot);
        setCurrentPage(1);
      });
    }).catch(error => handleError(error));

  }, []);

  async function approveOrReject(action: ReviewAction) {
    try {
      if (postToReview.uid) {
        await reviewPost(action, postToReview);
        if (action === "approve") {
          swal("Success!", "The post was approved successfully!", "success");
        }
        else if (action === "reject") {
          swal("Info!", "The post was rejected!", "info");
        }
        setPosts(posts.filter(post => post.uid !== postToReview.uid));
        
        // fix pagination
        setTotalSize(totalSize - 1);
        setTotalPages(Math.ceil((totalSize - 1) / pageSize));
        if (currentPage > 1 && posts.length === 1) {
          // go to previous page
          paginate("prev");
        }
      }
    } catch (error) {
      handleError(error);
    }
  }

  function setPagePosts(snapshot: any) {
    let _posts = [] as Post[];
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      let post = {
        ...data,
        uid: doc.id,
        createdDate: new Date(data["createdDate"].toDate())
      } as Post;

      _posts.push(post);
    });

    setPosts(_posts);

    if (_posts.length > 0) {
      let _firstPostEachPage = firstPostEachPage;

      // currentPage has delayed update
      _firstPostEachPage.set(currentPage + 1, _posts[0].uid || "");
      setFirstPostEachPage(_firstPostEachPage);
    }
  }

  async function paginate(operation: string) {
    if (operation === "next") {
      if (currentPage === totalPages || posts.length === 0) {
        return;
      }
      const snapshot = await getPostsToReview(posts[posts.length - 1].uid || "", pageSize, operation);
      setPagePosts(snapshot);
      setCurrentPage(currentPage + 1);
    } else {
      // prev
      if (currentPage <= 1 || !firstPostEachPage.has(currentPage - 1)) {
        return;
      }
      const snapshot = await getPostsToReview(firstPostEachPage.get(currentPage - 1) || "", pageSize, operation);
      setPagePosts(snapshot);
      setCurrentPage(currentPage - 1);
    }
  }

  async function getPageData(authorId: string, postId: string) {
    const postToReview = posts.filter(post => post.uid === postId)[0];
    const document = await getAuthor(authorId);
    let author = { id: document.id } as PostAuthorType;
    const data = document.data();
    if (data["firstName"]) {
      author.firstName = data["firstName"];
    }
    if (data["lastName"]) {
      author.lastName = data["lastName"];
    }
    if (data["displayName"]) {
      author.displayName = data["displayName"];
    }

    const pageData = {
      content: LZString.decompressFromUTF16(postToReview.content),
      tags: (postToReview?.tags || []).map(tag => { return { name: tag } as TaxonomyType }),
      comments: [],
      id: "createPreview",
      author: {
        avatar: author.avatar,
        firstName: author.firstName,
        lastName: author.lastName,
        id: author.id,
        count: 1,
        displayName: author.displayName,
      } as PostAuthorType,
      date: formatDistance(postToReview.createdDate ?? new Date(), new Date(), { includeSeconds: true, addSuffix: true }),
      href: "",
      categories: [{ name: postToReview.category } as TaxonomyType],
      title: postToReview.title,
      featuredImage: postToReview?.photoName && postToReview?.photoName.length > 0 ? postToReview?.photoName[0] : "",
      galleryImgs: postToReview?.photoURL || [],
      like: { count: 0, isLiked: false },
      bookmark: { count: 0, isBookmarked: false },
      commentCount: 0,
      viewdCount: 0,
      readingTime: 1,
      postType:postToReview?.photoName && postToReview?.photoName.length > 0 ? "gallery" : "standard",
      desc: postToReview.description ?? ""
    } as SinglePageType;

    setPageData(pageData);
  }

  const renderContent = () => {
    return (
      <form action="#" onSubmit={(e) => { e.preventDefault(); approveOrReject("reject") }}>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-200">
          Approve or Reject this post
        </h3>
        <span className="text-sm text-neutral-500">
          Please review this post carefully before deciding on an action.
        </span>
        {postIsRead &&
          <label className="block md:col-span-2 mt-1">
            <Label>Comments *</Label>

            <Textarea required name="description" className="mt-1" rows={4} onChange={(e) => setComment(e.target.value)} />
            {(!comment || comment.length < 10) &&
              <p className="mt-1 text-sm text-red-500">
                A valid reason must be specified for rejection (min 10 characters).
              </p>
            }
          </label>
        }
        <div className="mt-4 space-x-3">
          <ButtonSecondary type="button" onClick={() => {
            setPreviewPostModal(true);
            setPostIsRead(true);
          }}>Preview post
          </ButtonSecondary>

          <div style={{ float: "right" }}>

            <ButtonDanger disabled={!postIsRead} className="mr-1" type="submit">
              Reject
            </ButtonDanger>

            <ButtonPrimary disabled={!postIsRead} type="button" onClick={() => approveOrReject("approve")}>
              Approve
            </ButtonPrimary>
          </div>

        </div>
      </form>
    );
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full px-1 sm:px-6 lg:px-8">
          <div className="shadow dark:border dark:border-neutral-800 overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">
                    Article
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Created at
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                {posts.map((post) => (
                  <tr key={ncNanoId()}>
                    <td className="px-6 py-4">
                      <div className="flex items-center w-96 lg:w-auto max-w-md overflow-hidden">
                        <NcImage
                          containerClassName="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden lg:h-14 lg:w-14"
                          src={post.photoURL ? post.photoURL[0] : ""}
                        />
                        <div className="ml-4 flex-grow">
                          <h2 className="inline-flex line-clamp-2 text-sm font-semibold  dark:text-neutral-300">
                            {post.title}
                          </h2>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-sm text-neutral-500 dark:text-neutral-400 rounded-full">
                        {formatPostStatus(post.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <span> {formatDistance(post.createdDate, new Date(), { includeSeconds: true, addSuffix: true })}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-neutral-300">
                      <a onClick={function (e) {
                        e.preventDefault();
                        setPostToReview(post);
                        getPageData(post.authorId, post.uid || "");
                        setShowReviewModal(true);
                      }}
                        href="/#"
                        className="text-primary-800 dark:text-primary-500 hover:text-primary-900"
                      >
                        Review
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <NextPrev
        totalPage={totalPages}
        currentPage={currentPage}
        showPageInfo={true}
        onClickNext={() => paginate("next")}
        onClickPrev={() => paginate("prev")}>
      </NextPrev>

      <NcModal
        isOpenProp={showReviewModal}
        onCloseModal={() => setShowReviewModal(false)}
        contentExtraClass="max-w-screen-sm"
        renderContent={renderContent}
        renderTrigger={() => { return null; }}
        modalTitle="" />
      <Modal
        isOpen={previewPostModal}
        onRequestClose={() => { setPreviewPostModal(false); setShowReviewModal(true); }}
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
        <ButtonClose onClick={() => { setPreviewPostModal(false); setShowReviewModal(true); }}>
          <XIcon className="w-5 h-5" />
        </ButtonClose>
        {postToReview.photoName && postToReview.photoName.length > 1
          ? (<PageSingleGalleryPreview pageData={pageData} />)
          : (<PageSinglePreview pageData={pageData} />)}
      </Modal>
    </div>
  );
};

export default DashboardReviewPosts;
