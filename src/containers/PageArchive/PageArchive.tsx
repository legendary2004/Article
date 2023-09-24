import React, { FC, useEffect, useState } from "react";
import ModalCategories from "./ModalCategories";
import ModalTags from "./ModalTags";
import { DEMO_POSTS } from "data/posts";
import { PostDataType, TaxonomyType } from "data/types";
import { DEMO_CATEGORIES, DEMO_TAGS } from "data/taxonomies";
import Pagination from "components/Pagination/Pagination";
import ButtonPrimary from "components/Button/ButtonPrimary";
import ArchiveFilterListBox from "components/ArchiveFilterListBox/ArchiveFilterListBox";
import { Helmet } from "react-helmet";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import NcImage from "components/NcImage/NcImage";
import Card11 from "components/Card11/Card11";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import SectionGridCategoryBox from "components/SectionGridCategoryBox/SectionGridCategoryBox";
import ButtonSecondary from "components/Button/ButtonSecondary";
import SectionSliderNewAuthors from "components/SectionSliderNewAthors/SectionSliderNewAuthors";
import { DEMO_AUTHORS } from "data/authors";
import { useDb } from "firebase/firestoreManager";
import { ListBoxItemType } from "components/NcListBox/NcListBox";
import { useParams } from "react-router-dom";
import { mapDocumentToPostDataType } from "data/mapper";
import handleError from "utils/firebaseErrorHandler";
import { where } from "firebase/firestore";

export interface PageArchiveProps {
  className?: string;
}

type Params = { slug: string };

// Tag and category have same data type - we will use one demo data
//const posts: PostDataType[] = DEMO_POSTS.filter((_, i) => i < 16);

const PageArchive: FC<PageArchiveProps> = ({ className = "" }) => {
  //const PAGE_DATA: TaxonomyType = DEMO_CATEGORIES[0];
  const FILTERS = [
    { id: "recent", name: "Most Recent" },
    //{ name: "Curated by Admin" },
    { id: "appreciated", name: "Most Appreciated" },
    //{ name: "Most Discussed" },
    //{ name: "Most Viewed" },
  ];

  const { slug } = useParams<Params>();
  const { tags, allAuthors, allAuthorsFirstLoad, countPosts, getPaginatedLatestPosts } = useDb();

  const selectedTag = tags.find(t => t.id === parseInt(slug));

  const [posts, setPosts] = useState([] as PostDataType[]);
  const [postCount, setPostCount] = useState(0);
  const [filterType, setFilterType] = useState(FILTERS[0] as ListBoxItemType);
  const [lastPostShowing, setLastPostShowing] = useState("");
  const pageSize = 4;

  useEffect(() => {
    if(allAuthors.length === 0) return;
    setPosts([]);
    loadPosts();
  }, [filterType, allAuthorsFirstLoad]);

  const loadPosts = async () => {
    let constraints = [where('published', '==', true)];
    if(selectedTag?.name) {
      constraints.push(where("tags", "array-contains", selectedTag.name.trim()));
    }
    const postCount = await countPosts(constraints);
    setPostCount(postCount);

    await loadLatestPosts(postCount);
  }

  const loadLatestPosts = async (totalPostCount: number) => {
    try {
      if (posts.length >= totalPostCount) {
        return;
      }
      const snapshot = await getPaginatedLatestPosts(lastPostShowing, pageSize, selectedTag?.name, filterType.id);
      let _newPosts = [] as PostDataType[];
      snapshot.forEach(document => {
        let _post = mapDocumentToPostDataType(document, allAuthors);
        _newPosts.push(_post);
      });
      setPosts(posts.concat(_newPosts));
      if (_newPosts.length > 0) {
        setLastPostShowing(_newPosts[_newPosts.length - 1].id.toString());
      }
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <div className={`nc-PageArchive ${className}`} data-nc-id="PageArchive">
      <Helmet>
        <title>Archive || Blog Magazine React Template</title>
      </Helmet>

      {/* HEADER */}
      <div className="w-full px-2 xl:max-w-screen-2xl mx-auto">
        <div className="rounded-3xl relative aspect-w-16 aspect-h-12 sm:aspect-h-7 lg:aspect-h-6 xl:aspect-h-5 2xl:aspect-h-4 overflow-hidden ">
          <NcImage
            containerClassName="absolute inset-0"
            src="https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
            className="object-cover w-full h-full"
          />
          {selectedTag && (
            <div className="absolute inset-0 bg-black text-white bg-opacity-30 flex flex-col items-center justify-center">
              <h2 className="inline-block align-middle text-5xl font-semibold md:text-7xl ">
                {selectedTag.name}
              </h2>
              <span className="block mt-4 text-neutral-300">
                {selectedTag.count} {selectedTag.count === 1 ? "Article" : "Articles"}
              </span>
            </div>
          )}
        </div>
      </div>
      {/* ====================== END HEADER ====================== */}

      <div className="container py-16 lg:py-28 space-y-16 lg:space-y-28">
        <div>
          <div className="flex flex-col sm:items-center sm:justify-between sm:flex-row">
            <div className="flex space-x-2.5">
              {/* <ModalCategories categories={DEMO_CATEGORIES} /> */}
              <ModalTags tags={tags} />
            </div>
            <div className="block my-4 border-b w-full border-neutral-100 sm:hidden"></div>
            <div className="flex justify-end">
              <ArchiveFilterListBox onFilterChange={setFilterType} lists={FILTERS} />
            </div>
          </div>

          {/* LOOP ITEMS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mt-8 lg:mt-10">
            {posts.map((post) => (
              <Card11 key={post.id} post={post} />
            ))}
          </div>

          {/* PAGINATIONS */}
          <div className="flex flex-col mt-12 lg:mt-16 space-y-5 sm:space-y-0 sm:space-x-3 sm:flex-row sm:justify-between sm:items-center">
            {/* <Pagination /> */}
            <ButtonPrimary disabled={posts.length >= postCount} onClick={() => loadLatestPosts(postCount)}>Show me more</ButtonPrimary>
          </div>
        </div>

        {/* MORE SECTIONS */}
        {/* === SECTION 5 === */}
        {/*         <div className="relative py-16">
          <BackgroundSection />
          <SectionGridCategoryBox
            categories={DEMO_CATEGORIES.filter((_, i) => i < 10)}
          />
          <div className="text-center mx-auto mt-10 md:mt-16">
            <ButtonSecondary>Show me more</ButtonSecondary>
          </div>
        </div> */}

        {/* === SECTION 5 === */}
        <SectionSliderNewAuthors
          heading="Top elite authors"
          subHeading="Discover our elite writers"
          authors={allAuthors.filter((_, i) => i < 10)}
        />

        {/* SUBCRIBES */}
        {/* <SectionSubscribe2 /> */}
      </div>
    </div>
  );
};

export default PageArchive;
