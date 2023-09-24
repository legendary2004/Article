import React, { FC, useEffect, useState } from "react";
import { DEMO_POSTS } from "data/posts";
import { PostDataType } from "data/types";
import Pagination from "components/Pagination/Pagination";
import ButtonPrimary from "components/Button/ButtonPrimary";
import Nav from "components/Nav/Nav";
import NavItem from "components/NavItem/NavItem";
import ArchiveFilterListBox from "components/ArchiveFilterListBox/ArchiveFilterListBox";
import Input from "components/Input/Input";
import HeadBackgroundCommon from "components/HeadBackgroundCommon/HeadBackgroundCommon";
import { Helmet } from "react-helmet";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import ButtonSecondary from "components/Button/ButtonSecondary";
import SectionGridCategoryBox from "components/SectionGridCategoryBox/SectionGridCategoryBox";
import { DEMO_CATEGORIES } from "data/taxonomies";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import SectionSliderNewAuthors from "components/SectionSliderNewAthors/SectionSliderNewAuthors";
import { DEMO_AUTHORS } from "data/authors";
import Card11 from "components/Card11/Card11";
import CardCategory2 from "components/CardCategory2/CardCategory2";
import Tag from "components/Tag/Tag";
import CardAuthorBox2 from "components/CardAuthorBox2/CardAuthorBox2";
import handleError from "utils/firebaseErrorHandler";
import { mapDocumentToPostDataType } from "data/mapper";
import { useParams } from "react-router-dom";
import { useDb } from "firebase/firestoreManager";
import { ListBoxItemType } from "components/NcListBox/NcListBox";
import { where } from "firebase/firestore";
import { upperCaseFirstLetterEachWord } from "utils/StringUtils";

export interface PageSearchV2Props {
  className?: string;
}

const posts: PostDataType[] = DEMO_POSTS.filter((_, i) => i < 12);
const cats = DEMO_CATEGORIES.filter((_, i) => i < 15);
const tags = DEMO_CATEGORIES.filter((_, i) => i < 32);
const authors = DEMO_AUTHORS.filter((_, i) => i < 12);

const FILTERS = [
  { name: "Most Recent" },
  //{ name: "Curated by Admin" },
  { name: "Most Appreciated" },
  //{ name: "Most Discussed" },
  //{ name: "Most Viewed" },
];
const TABS = ["Articles"];
//const TABS = ["Articles", "Categories", "Tags", "Authors"];

const PageSearchV2: FC<PageSearchV2Props> = ({ className = "" }) => {
  const [tabActive, setTabActive] = useState<string>(TABS[0]);
  const inputRef = React.createRef<HTMLInputElement>();

  const handleClickTab = (item: string) => {
    if (item === tabActive) {
      return;
    }
    setTabActive(item);
  };

  type Params = { slug: string };

  const { slug } = useParams<Params>();
  const { tags, allAuthors, allAuthorsFirstLoad, countPosts, searchPaginatedPosts } = useDb();
  const [keyword, setKeyword] = useState(slug ?? "");
  const [showSearchSummary, setShowSearchSummary] = useState(slug ? true : false);
  const [posts, setPosts] = useState([] as PostDataType[]);
  const [postCount, setPostCount] = useState(0);
  const [filterType, setFilterType] = useState(FILTERS[0] as ListBoxItemType);
  const [lastPostShowing, setLastPostShowing] = useState("");
  const pageSize = 4;

  useEffect(() => {
    if (allAuthors.length === 0) return;
    if (keyword) {
      inputRef.current?.focus();
    }
    searchPosts();
  }, [filterType, allAuthorsFirstLoad]);

  const searchPosts = async () => {
    if (!keyword) {
      return;
    }

    const searchTerm = keyword.split(" ").filter(val => val).map(val => upperCaseFirstLetterEachWord(val));
    const constraints = [where('published', '==', true), where("textIndex", "array-contains-any", searchTerm)];
    const postCount = await countPosts(constraints);
    setPostCount(postCount);

    try {
      const searchTerm = keyword.split(" ").filter(val => val).map(val => upperCaseFirstLetterEachWord(val));
      const snapshot = await searchPaginatedPosts("", pageSize, searchTerm, filterType.id);
      let _newPosts = [] as PostDataType[];
      snapshot.forEach(document => {
        let _post = mapDocumentToPostDataType(document, allAuthors);
        _newPosts.push(_post);
      });
      setPosts(_newPosts);
      if (_newPosts.length > 0) {
        setLastPostShowing(_newPosts[_newPosts.length - 1].id.toString());
      }
    } catch (error) {
      handleError(error);
    }
    setShowSearchSummary(true);
  }

  const loadPosts = async () => {
    try {
      if (posts.length >= postCount) {
        return;
      }
      const searchTerm = keyword.split(" ").filter(val => val).map(val => upperCaseFirstLetterEachWord(val));
      const snapshot = await searchPaginatedPosts(lastPostShowing, pageSize, searchTerm, filterType.id);
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
    <div className={`nc-PageSearchV2 ${className}`} data-nc-id="PageSearchV2">
      <HeadBackgroundCommon className="h-24 2xl:h-28" />
      <Helmet>
        <title>Nc || Search Page Template</title>
      </Helmet>
      <div className="container">
        <header className="max-w-2xl mx-auto -mt-10 flex flex-col lg:-mt-7">
          <form className="relative" action="#"
            onSubmit={(e) => {
              e.preventDefault();
              searchPosts();
            }}
            method="post">
            <label
              htmlFor="search-input"
              className="text-neutral-500 dark:text-neutral-300"
            >
              <span className="sr-only">Search all icons</span>
              <Input
                ref={inputRef}
                id="search-input"
                type="search"
                placeholder="Type and press enter"
                className="shadow-lg rounded-xl border-opacity-0"
                sizeClass="pl-14 py-5 pr-5 md:pl-16"
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setShowSearchSummary(false);
                  setLastPostShowing("");
                }}
                defaultValue={slug}
              />
              <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl md:left-6">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19.25 19.25L15.5 15.5M4.75 11C4.75 7.54822 7.54822 4.75 11 4.75C14.4518 4.75 17.25 7.54822 17.25 11C17.25 14.4518 14.4518 17.25 11 17.25C7.54822 17.25 4.75 14.4518 4.75 11Z"
                  ></path>
                </svg>
              </span>
            </label>
          </form>
          {showSearchSummary && (
            <span className="block text-sm mt-4 text-neutral-500 dark:text-neutral-300">
              We found{" "}
              <strong className="font-semibold text-neutral-800 dark:text-neutral-100">
                {postCount}
              </strong>{" "}
              {postCount === 1 ? "article" : "articles"} for{" "}
              <strong className="font-semibold text-neutral-800 dark:text-neutral-100">
                "{keyword}"
              </strong>
            </span>
          )}
        </header>
      </div>
      <div className="container py-16 lg:py-28 space-y-16 lg:space-y-28">
        <main>
          {/* TABS FILTER */}
          <div className="flex flex-col sm:items-center sm:justify-between sm:flex-row ">
            <Nav
              containerClassName="w-full overflow-x-auto hiddenScrollbar"
              className=" sm:space-x-2"
            >
              {TABS.map((item, index) => (
                <NavItem
                  key={index}
                  isActive={tabActive === item}
                  onClick={() => handleClickTab(item)}
                >
                  {item}
                </NavItem>
              ))}
            </Nav>
            <div className="block my-4 border-b w-full border-neutral-100 sm:hidden"></div>
            <div className="flex justify-end">
              <ArchiveFilterListBox onFilterChange={setFilterType} lists={FILTERS} />
            </div>
          </div>

          {/* LOOP ITEMS */}
          {/* LOOP ITEMS POSTS */}
          {tabActive === "Articles" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8 mt-8 lg:mt-10">
              {posts.map((post) => (
                <Card11 key={post.id} post={post} />
              ))}
            </div>
          )}
          {/* LOOP ITEMS CATEGORIES */}
          {tabActive === "Categories" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-8 mt-8 lg:mt-10">
              {cats.map((cat) => (
                <CardCategory2 key={cat.id} taxonomy={cat} />
              ))}
            </div>
          )}
          {/* LOOP ITEMS TAGS */}
          {tabActive === "Tags" && (
            <div className="flex flex-wrap mt-12 ">
              {tags.map((tag) => (
                <Tag className="mb-3 mr-3" key={tag.id} tag={tag} />
              ))}
            </div>
          )}
          {/* LOOP ITEMS POSTS */}
          {tabActive === "Authors" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-8 mt-8 lg:mt-10">
              {authors.map((author) => (
                <CardAuthorBox2 key={author.id} author={author} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex flex-col mt-12 lg:mt-16 space-y-5 sm:space-y-0 sm:space-x-3 sm:flex-row sm:justify-between sm:items-center">
            {/* <Pagination /> */}
            {posts.length < postCount && (
              <ButtonPrimary disabled={posts.length >= postCount} onClick={loadPosts}>Show me more</ButtonPrimary>
            )}
          </div>
        </main>

        {/* MORE SECTIONS */}
        {/* === SECTION 5 === */}
        {/* <div className="relative py-16">
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

export default PageSearchV2;
