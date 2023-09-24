import React, { FC, useEffect, useState } from "react";
import { DEMO_POSTS } from "data/posts";
import { PostAuthorType, PostDataType } from "data/types";
import Pagination from "components/Pagination/Pagination";
import ButtonPrimary from "components/Button/ButtonPrimary";
import { DEMO_AUTHORS } from "data/authors";
import Nav from "components/Nav/Nav";
import NavItem from "components/NavItem/NavItem";
import Avatar from "components/Avatar/Avatar";
import SocialsList from "components/SocialsList/SocialsList";
import ArchiveFilterListBox from "components/ArchiveFilterListBox/ArchiveFilterListBox";
import { Helmet } from "react-helmet";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import Card11 from "components/Card11/Card11";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import SectionGridCategoryBox from "components/SectionGridCategoryBox/SectionGridCategoryBox";
import { DEMO_CATEGORIES } from "data/taxonomies";
import ButtonSecondary from "components/Button/ButtonSecondary";
import SectionSliderNewAuthors from "components/SectionSliderNewAthors/SectionSliderNewAuthors";
import NcImage from "components/NcImage/NcImage";
import { useParams } from "react-router-dom";
import { useDb } from "firebase/firestoreManager";
import { mapDocumentToPostDataType } from "data/mapper";
import SectionBecomeAnAuthor from "components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import { where } from "firebase/firestore";
import { useAuth } from "firebase/authManager";

export interface PageAuthorProps {
  className?: string;
}

interface Params { slug: string };

//const posts: PostDataType[] = DEMO_POSTS.filter((_, i) => i < 12);
//const AUTHOR: PostAuthorType = DEMO_AUTHORS[0];
const FILTERS = [
  { name: "Most Recent" },
  { name: "Curated by Admin" },
  { name: "Most Appreciated" },
  { name: "Most Discussed" },
  { name: "Most Viewed" },
];
//const TABS = ["Articles", "Favorites", "Saved"];
const TABS = ["Articles"];

const PageAuthor: FC<PageAuthorProps> = ({ className = "" }) => {
  const [tabActive, setTabActive] = useState<string>(TABS[0]);
  const { author } = useAuth();
  const { allAuthors, allAuthorsFirstLoad, countPosts, getPaginatedPublicPosts } = useDb();
  const { slug } = useParams<Params>();
  const AUTHOR: PostAuthorType | undefined = allAuthors.find(a => a.id === slug);

  const batchSize = 4;
  const [totalPostCount, setTotalPostCount] = useState(0);
  const [posts, setPosts] = useState([] as PostDataType[]);

  const defaultBgImage = "https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";

  useEffect(() => {
    if (posts.length > 0) return;
    if (!AUTHOR) return;
    const constraints = [where('authorId', '==', AUTHOR.id), where('published', '==', true)];
    countPosts(constraints).then(count => {
      if (count > 0) {
        getPaginatedPublicPosts(AUTHOR.id, "", batchSize, "next")
          .then(snapshot => {
            let _posts = [...posts];
            snapshot.forEach(docData => {
              const _post = mapDocumentToPostDataType(docData, allAuthors);
              _posts.push(_post);
            });
            setPosts(_posts);
            setTotalPostCount(count);
          });
      }
    });
  }, [allAuthorsFirstLoad]);

  const handleClickTab = (item: string) => {
    if (item === tabActive) {
      return;
    }
    setTabActive(item);
  };

  const showMore = async () => {
    if (posts.length >= totalPostCount) return;
    if (!AUTHOR) return;

    getPaginatedPublicPosts(AUTHOR.id, posts[posts.length - 1].id.toString(), batchSize, "next")
      .then(snapshot => {
        let _posts = [...posts];
        snapshot.forEach(docData => {
          const _post = mapDocumentToPostDataType(docData, allAuthors);
          _posts.push(_post);
        });
        setPosts(_posts);
      });
  }

  return (
    <div className={`nc-PageAuthor  ${className}`} data-nc-id="PageAuthor">
      <Helmet>
        <title>Author || Blog Magazine React Template</title>
      </Helmet>

      {/* HEADER */}
      <div className="w-screen px-2 xl:max-w-screen-2xl mx-auto">
        <div className="rounded-3xl relative aspect-w-16 aspect-h-16 sm:aspect-h-9 lg:aspect-h-6 overflow-hidden ">
          <NcImage
            containerClassName="absolute inset-0"
            src={AUTHOR?.bgImage ?? defaultBgImage}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="relative container -mt-20 lg:-mt-48">
          <div className=" bg-white dark:bg-neutral-900 dark:border dark:border-neutral-700 p-5 lg:p-16 rounded-[40px] shadow-2xl flex flex-col sm:flex-row sm:items-center">
            <Avatar
              containerClassName="ring-4 ring-white dark:ring-0 shadow-2xl"
              imgUrl={AUTHOR?.avatar}
              sizeClass="w-20 h-20 text-xl lg:text-2xl lg:w-36 lg:h-36"
              radius="rounded-full"
            />
            <div className="mt-5 sm:mt-0 sm:ml-8 space-y-4 max-w-lg">
              <h2 className="inline-block text-2xl sm:text-3xl md:text-4xl font-semibold">
                {AUTHOR?.displayName}
              </h2>
              <span className="block text-sm text-neutral-6000 dark:text-neutral-300 md:text-base">
                {AUTHOR?.desc}
              </span>
              <SocialsList />
            </div>
          </div>
        </div>
      </div>
      {/* ====================== END HEADER ====================== */}

      <div className="container py-16 lg:py-28 space-y-16 lg:space-y-28">
        <main>
          {/* TABS FILTER */}
          <div className="flex flex-col sm:items-center sm:justify-between sm:flex-row">
            <Nav className="sm:space-x-2">
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
            {/*             <div className="flex justify-end">
              <ArchiveFilterListBox lists={FILTERS} />
            </div> */}
          </div>

          {/* LOOP ITEMS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mt-8 lg:mt-10">
            {posts.map((post) => (
              <Card11 key={post.id} post={post} />
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col mt-12 lg:mt-16 space-y-5 sm:space-y-0 sm:space-x-3 sm:flex-row sm:justify-between sm:items-center">
            {/* <Pagination /> */}
            <span className="text-neutral-500"> Showing {posts.length} out of {totalPostCount} articles</span>
            <ButtonPrimary disabled={posts.length >= totalPostCount} onClick={showMore}>Show me more</ButtonPrimary>
          </div>
        </main>

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
          authors={allAuthors.sort((a, b) => b.count - a.count).filter((_, i) => i < 10)}
        />

        {/* === SECTION 8 === */}
        {!author && (
          <div className="relative py-16">
            <BackgroundSection />
            <SectionBecomeAnAuthor />
          </div>
        )}

        {/* SUBCRIBES */}
        {/* <SectionSubscribe2 /> */}
      </div>
    </div>
  );
};

export default PageAuthor;
