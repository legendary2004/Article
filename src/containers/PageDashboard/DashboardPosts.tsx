import React, { useEffect, useState } from "react";
import NcImage from "components/NcImage/NcImage";
import { useAuth, } from "firebase/authManager";
import { useDb } from "firebase/firestoreManager";
import handleError from "utils/firebaseErrorHandler";
import swal from "sweetalert";
import { Post } from "models/Post";
import ncNanoId from "utils/ncNanoId";
import { formatPostStatus } from "utils/StringUtils";
import { formatDistance } from "date-fns"
import DashboardEditPost from "./DashboardEditPost";
import ButtonInfo from "components/Button/ButtonInfo";
import { InformationCircleIcon } from "@heroicons/react/outline";
import NextPrev from "components/NextPrev/NextPrev";
import { deleteFile } from "firebase/storageManager";
import { where } from "firebase/firestore";

const DashboardPosts = () => {
  const { user, author } = useAuth();
  const { deletePost, countPosts, getPaginatedPosts } = useDb();
  const [posts, setPosts] = useState([] as Post[]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState({} as Post);

  const pageSize = 5;
  const [totalSize, setTotalSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [firstPostEachPage, setFirstPostEachPage] = useState(new Map<number, string>());

  useEffect(() => {
    if (author?.id) {
      const constraints = [where('authorId', '==', author.id)];
      countPosts(constraints).then(numDocs => {
        setTotalSize(numDocs);
        setTotalPages(Math.ceil(numDocs / pageSize));
        getPaginatedPosts(author.id, "", pageSize, "next").then(snapshot => {
          setPagePosts(snapshot);
          setCurrentPage(1);
        });
      }).catch(error => handleError(error));
    }
  }, []);

  function afterUpdate(afterEditPost: Post) {
    setIsEditing(false);
    setPosts([]);

    const _posts = posts;
    for (let i: number = 0; i < _posts.length; i = i + 1) {
      if (_posts[i].uid === afterEditPost.uid) {
        _posts[i] = { ..._posts[i], ...afterEditPost };
      }
    }

    setPosts(_posts);
  }

  async function doDelete(postToDelete: Post) {
    try {
      await deletePost(postToDelete);

      // delete files from storage related to this post
      const photoList = postToDelete.photoName || [];
      photoList.forEach(fileName => deleteFile(`/images/posts/${postToDelete.uid}`, fileName));

      swal("Success", "Post was deleted successfully!", "success");
      setPosts(posts.filter(p => p.uid !== postToDelete.uid));

      // fix pagination
      setTotalSize(totalSize - 1);
      setTotalPages(Math.ceil((totalSize - 1) / pageSize));
      if (currentPage > 1 && posts.length === 1) {
        // go to previous page
        paginate("prev");
      }
    }
    catch (error) {
      handleError(error);
    }
  }

  function handleDelete(postToDelete: Post) {
    swal("Are you sure you want to delete this Article?", {
      buttons: {
        cancel: {
          text: "Cancel",
          value: "cancel",
          closeModal: true
        },
        delete: {
          text: "Delete",
          value: "delete"
        }
      },
    })
      .then((value) => {
        if (value === "delete") {
          doDelete(postToDelete);
        }
      });
  }

  function showInfo(post: Post) {
    if (post?.comment) {
      swal("Reason of rejection.", post.comment, "info");
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
    if (!author?.id) return;
    if (operation === "next") {
      if (currentPage === totalPages || posts.length === 0) {
        return;
      }
      const snapshot = await getPaginatedPosts(author.id, posts[posts.length - 1].uid || "", pageSize, operation);
      setPagePosts(snapshot);
      setCurrentPage(currentPage + 1);
    } else {
      // prev
      if (currentPage <= 1 || !firstPostEachPage.has(currentPage - 1)) {
        return;
      }
      const snapshot = await getPaginatedPosts(author.id, firstPostEachPage.get(currentPage - 1) || "", pageSize, operation);
      setPagePosts(snapshot);
      setCurrentPage(currentPage - 1);
    }
  }

  if (isEditing) {
    return <DashboardEditPost post={editingPost} afterUpdate={afterUpdate}></DashboardEditPost>
  }

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
                      {post.published && post.status === "ACCEPTED" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-teal-100 text-teal-900 lg:text-sm">
                          Published
                        </span>
                      ) : post.status === "REJECTED" ? (
                        <><span className="px-2 inline-flex text-sm bg-rose-50 font-medium text-red-500 rounded-full">
                          {formatPostStatus(post.status)}
                        </span>
                          {
                            post && post.comment &&
                            <ButtonInfo title="See the reason for the rejection" className="ml-1 w-1/5 h-1/2" onClick={() => showInfo(post)}>
                              <InformationCircleIcon />
                            </ButtonInfo>
                          }
                        </>
                      ) : (
                        <span className="px-2 inline-flex text-sm text-neutral-500 dark:text-neutral-400 rounded-full">
                          {formatPostStatus(post.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      <span> {formatDistance(post.createdDate, new Date(), { includeSeconds: true, addSuffix: true })}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-neutral-300">
                      <a onClick={function (e) {
                        e.preventDefault();
                        setIsEditing(true);
                        setEditingPost(post);
                      }}
                        href="#/"
                        className="text-primary-800 dark:text-primary-500 hover:text-primary-900"
                      >
                        Edit
                      </a>
                      {` | `}
                      <a
                        onClick={(e) => { e.preventDefault(); if (post.uid) handleDelete(post); }}
                        href="/#"
                        className="text-rose-600 hover:text-rose-900"
                      >
                        Delete
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
    </div>
  );
};

export default DashboardPosts;
