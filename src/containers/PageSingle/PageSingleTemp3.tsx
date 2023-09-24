import React, { FC, ReactNode, useEffect, useState } from "react";
import { PostAuthorType, PostDataType, TaxonomyType } from "data/types";
import { SINGLE } from "data/single";
import SingleContent from "./SingleContent";
import { CommentType } from "components/CommentCard/CommentCard";
import SingleRelatedPosts from "./SingleRelatedPosts";
import { useAppDispatch } from "app/hooks";
import { changeCurrentPage } from "app/pages/pages";
import SingleHeader from "./SingleHeader";
import { useParams } from "react-router-dom";
import { useDb } from "firebase/firestoreManager";
import { mapDocumentToPostDataType, mapPostDataToSinglePage } from "data/mapper";
import handleError from "utils/firebaseErrorHandler";

export interface PageSingleTemplate3Props {
  className?: string;
}

export interface SinglePageType extends PostDataType {
  tags: TaxonomyType[];
  content: string | ReactNode;
  comments: CommentType[];
}

type Params = { slug: string };

const PageSingleTemplate3: FC<PageSingleTemplate3Props> = ({
  className = "",
}) => {

  const { slug } = useParams<Params>();
  const { getSinglePost, getPaginatedPublicPosts, getPaginatedRelatedPosts, allAuthors, allAuthorsFirstLoad } = useDb();
  const [pageData, setPageData] = useState({} as SinglePageType);
  const [moreFromAuthor, setMoreFromAuthor] = useState([] as PostDataType[]);
  const [relatedPosts, setRelatedPosts] = useState([] as PostDataType[]);

  const defaultFeaturedImage =
    "https://images.unsplash.com/photo-1554941068-a252680d25d9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80";

  //const dispatch = useAppDispatch();

  // UPDATE CURRENTPAGE DATA IN PAGEREDUCERS
  useEffect(() => {
    /*     dispatch(changeCurrentPage({ type: "/single/:slug", data: SINGLE }));
        return () => {
          dispatch(changeCurrentPage({ type: "/", data: {} }));
        }; */
    if (allAuthors.length === 0) {
      return;
    }

    getSinglePost(slug).then(snapshot => {
      const pageData = mapPostDataToSinglePage(snapshot, allAuthors);
      if (pageData) {
        setPageData(pageData);
        getRelatedPosts(pageData);
      }
    });
  }, [allAuthorsFirstLoad]);

  const getRelatedPosts = async (_pageData: SinglePageType) => {
    try {
      const AUTHOR = allAuthors.filter(a => a.id === _pageData.author.id)[0];

      const snapshot = await getPaginatedPublicPosts(AUTHOR.id, "", 5, "next");
      let _posts: PostDataType[] = [];
      snapshot.forEach(docData => {
        if (docData.id !== _pageData.id) {
          const _post = mapDocumentToPostDataType(docData, allAuthors);
          _posts.push(_post);
        }
      });
      setMoreFromAuthor(_posts);

      if (_pageData.tags.length > 0) {
        const relatedSnapshot = await getPaginatedRelatedPosts(_pageData.id.toString(), _pageData.tags.flatMap(x => x.name), 4);
        _posts = [];
        relatedSnapshot.forEach(docData => {
          const _post = mapDocumentToPostDataType(docData, allAuthors);
          _posts.push(_post);

        });
        setRelatedPosts(_posts);
      }
    } catch (error) {
      handleError(error);
    }
  }

  if (!pageData.id) return <></>;

  return (
    <>
      <div
        className={`nc-PageSingleTemplate3 ${className}`}
        data-nc-id="PageSingleTemplate3"
      >
        <header className="relative pt-16 z-10 md:py-20 lg:py-28 bg-neutral-900 dark:bg-black">
          {/* SINGLE HEADER */}
          <div className="dark container relative z-10">
            <div className="max-w-screen-md">
              <SingleHeader
                hiddenDesc
                metaActionStyle="style2"
                pageData={pageData}
              />
            </div>
          </div>

          {/* FEATURED IMAGE */}
          <div className="mt-8 md:mt-0 md:absolute md:top-0 md:right-0 md:bottom-0 md:w-1/2 lg:w-2/5 2xl:w-1/3">
            <div className="hidden md:block absolute top-0 left-0 bottom-0 w-1/5 from-neutral-900 dark:from-black bg-gradient-to-r"></div>
            <img
              className="block w-full h-full object-cover"
              src={pageData.featuredImage || defaultFeaturedImage}
              alt=""
            />
          </div>
        </header>

        {/* SINGLE MAIN CONTENT */}
        <div className="container mt-10">
          <SingleContent data={pageData} />
        </div>

        {/* RELATED POSTS */}
        <SingleRelatedPosts relatedPosts={relatedPosts} moreFromAuthorPosts={moreFromAuthor.filter((_, i) => i < 4)} />
      </div>
    </>
  );
};

export default PageSingleTemplate3;
