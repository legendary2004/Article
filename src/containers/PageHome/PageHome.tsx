import React, { useEffect, useState } from "react";
import SectionLatestPosts from "./SectionLatestPosts";
import SectionSliderPosts from "./SectionSliderPosts";
import SectionMagazine1 from "./SectionMagazine1";
import SectionVideos from "./SectionVideos";
import SectionLargeSlider from "./SectionLargeSlider";
import { Helmet } from "react-helmet";
import BackgroundSection from "components/BackgroundSection/BackgroundSection";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import SectionGridAuthorBox from "components/SectionGridAuthorBox/SectionGridAuthorBox";
import { PostDataType, TaxonomyType } from "data/types";
import {
  DEMO_POSTS,
  DEMO_POSTS_AUDIO,
  DEMO_POSTS_GALLERY,
  DEMO_POSTS_VIDEO,
} from "data/posts";
import { DEMO_CATEGORIES } from "data/taxonomies";
import { DEMO_AUTHORS } from "data/authors";
import SectionBecomeAnAuthor from "components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import SectionSliderNewCategories from "components/SectionSliderNewCategories/SectionSliderNewCategories";
import SectionSliderNewAuthors from "components/SectionSliderNewAthors/SectionSliderNewAuthors";
import SectionMagazine4 from "./SectionMagazine4";
import SectionAds from "./SectionAds";
import SectionGridPosts from "./SectionGridPosts";
import SectionMagazine7 from "./SectionMagazine7";
import SectionMagazine8 from "./SectionMagazine8";
import SectionMagazine9 from "./SectionMagazine9";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import { useDb } from "firebase/firestoreManager";
import { useAuth } from "firebase/authManager";
import { mapDocumentToPostDataType } from "data/mapper";
import handleError from "utils/firebaseErrorHandler";
import { where } from "firebase/firestore";

//
let POSTS: PostDataType[] = [] as PostDataType[]; //DEMO_POSTS;
//
//const MAGAZINE1_TABS = ["all", "Garden", "Fitness", "Design"];
const MAGAZINE1_TABS = [] as string[];
const MAGAZINE1_POSTS = DEMO_POSTS.filter((_, i) => i >= 8 && i < 16);
const MAGAZINE2_POSTS = DEMO_POSTS.filter((_, i) => i >= 0 && i < 7);
//

const PageHome: React.FC = () => {
  const { author } = useAuth();
  const { allAuthors, allAuthorsFirstLoad, tags, getTopPosts, countPosts, getPaginatedLatestPosts } = useDb();
  const [topPosts, setTopPosts] = useState([] as PostDataType[]);
  const [totalCount, setTotalCount] = useState(0);
  const [latestPosts, setLatestPosts] = useState([] as PostDataType[]);
  const [lastPostShowing, setLastPostShowing] = useState("");
  const [pageSize, setPageSize] = useState(8);
  const isMounted = React.useRef(true);

  useEffect(() => {
    if (isMounted.current) {
      setLatestPosts([]);
      if (!allAuthors || allAuthors.length === 0) return;
      try {
        const constraints = [where('published', '==', true)];
        loadTopPosts().then(() =>
          countPosts(constraints).then(count => {
            setTotalCount(count);
            loadLatestPosts(count);
          }));
      } catch (error) {
        handleError(error);
      }

      return () => {
        isMounted.current = false;
      };
    }
  }, [allAuthorsFirstLoad]);

  const loadTopPosts = async () => {
    try {
      const snapshot = await getTopPosts();
      let _topPosts = [] as PostDataType[];
      snapshot.forEach(document => {
        let _post = mapDocumentToPostDataType(document, allAuthors);
        _topPosts.push(_post);
      });
      setTopPosts(_topPosts);
    } catch (error) {
      handleError(error);
    }
  }

  const loadLatestPosts = async (totalPostCount: number) => {
    try {
      if (latestPosts.length >= totalPostCount) {
        return;
      }
      const snapshot = await getPaginatedLatestPosts(lastPostShowing, pageSize);
      let _newPosts = [] as PostDataType[];
      snapshot.forEach(document => {
        let _post = mapDocumentToPostDataType(document, allAuthors);
        _newPosts.push(_post);
      });
      setLatestPosts(latestPosts.concat(_newPosts));
      setPageSize(4);
      if (_newPosts.length > 0) {
        setLastPostShowing(_newPosts[_newPosts.length - 1].id.toString());
      }
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <div className="nc-PageHome relative">
      <Helmet>
        <title>Home || Blog Magazine React Template</title>
      </Helmet>

      {/* ======== ALL SECTIONS ======== */}
      <div className="relative overflow-hidden">
        {/* ======== BG GLASS ======== */}
        <BgGlassmorphism />

        {/* ======= START CONTAINER ============= */}
        <div className="container relative">
          {/* === SECTION  === */}
          <SectionLargeSlider
            className="pt-10 pb-16 md:py-16 lg:pb-28 lg:pt-24 "
            posts={topPosts}
          />

          {/* === SECTION  === */}
          <div className="relative py-16">
            <BackgroundSection />
            <SectionSliderNewAuthors
              heading="Newest authors"
              subHeading="Say hello to future creator potentials"
              authors={[...allAuthors].sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime()).filter((_, i) => i < 10)}
            />
          </div>

          {/* === SECTION 5 === */}
          {/*           <SectionSliderNewCategories
            className="py-16 lg:py-28"
            heading="Top trending topics"
            subHeading="Discover 233 topics"
            categories={DEMO_CATEGORIES.filter((_, i) => i < 10)}
            categoryCardType="card4"
          /> */}

          {/* === SECTION 6 === */}
          {/*           <div className="relative py-16">
            <BackgroundSection />
            <SectionSliderPosts
              postCardName="card9"
              heading="Explore latest audio articles"
              subHeading="Click on the icon to enjoy the music or podcast 🎧"
              sliderStype="style2"
              posts={DEMO_POSTS_AUDIO.filter((_, i) => i > 3 && i < 10)}
            />
          </div> */}

          {/* === SECTION 4 === */}
          <SectionMagazine1
            className="py-16 lg:py-28"
            posts={latestPosts.filter((_, i) => i < 4)}
            tabs={MAGAZINE1_TABS}
          />

          {/* === SECTION 3 === */}
          {/* <SectionAds /> */}

          {/* === SECTION 7 === */}
          {latestPosts.filter(post => post.postType === "gallery").length >= 6 && (
            <SectionMagazine7
              className="py-16 lg:py-28"
              posts={latestPosts.filter(post => post.postType === "gallery").filter((_, i) => i < 6)}
            />
          )}

        </div>

        {/* === SECTION 11 === */}
        {/*         <div className="dark bg-neutral-900 dark:bg-black dark:bg-opacity-20 text-neutral-100">
          <div className="relative container">
            <SectionGridPosts
              className="py-16 lg:py-28"
              headingIsCenter
              postCardName="card10V2"
              heading="Explore latest video articles"
              subHeading="Hover on the post card and preview video 🥡"
              posts={DEMO_POSTS_VIDEO.filter((_, i) => i > 5 && i < 12)}
              gridClass="md:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </div> */}

        <div className="container ">
          {/* === SECTION 9 === */}
          {/*           <SectionMagazine8
            className="py-16 lg:py-28"
            posts={DEMO_POSTS_AUDIO.filter((_, i) => i < 6)}
          /> */}

          {/* === SECTION 9 === */}
          {/*           <div className="relative py-16">
            <BackgroundSection />
            <SectionMagazine9
              posts={DEMO_POSTS_AUDIO.filter((_, i) => i >= 6 && i < 16)}
            />
          </div> */}

          {/* === SECTION 5 === */}
          <SectionGridAuthorBox
            heading="Top 5 authors"
            subHeading="Based on the number of published articles."
            className="py-16 lg:py-28"
            authors={allAuthors.filter((_, i) => i < 5)}
          />

          {/* === SECTION 8 === */}
          {!author && (
            <div className="relative py-16">
              <BackgroundSection />
              <SectionBecomeAnAuthor />
            </div>
          )}

          {/* === SECTION 11 === */}
          {/*           <SectionMagazine4
            className="py-16 lg:py-28"
            heading="Life styles 🎨 "
            posts={MAGAZINE2_POSTS}
            tabs={MAGAZINE1_TABS}
          /> */}

          {/* === SECTION 12 === */}
          {/*           <div className="relative py-16">
            <BackgroundSection />
            <SectionSliderPosts
              postCardName="card11"
              heading=" More design articles"
              subHeading="Over 1118 articles "
              posts={latestPosts.filter(
                (p, i) => i > 3 && i < 25 && p.postType === "standard"
              )}
              sliderStype="style2"
            />
          </div> */}

          {/* === SECTION 14 === */}
          {/* <SectionSubscribe2 className="pt-16 lg:pt-28" /> */}

          {/* === SECTION 15 === */}
          {/* <SectionVideos className="py-16 lg:py-28" /> */}

          {/* === SECTION 17 === */}
          <SectionLatestPosts
            heading="More Articles 🎈 "
            className="mt-20 pb-16 lg:pb-28"
            posts={latestPosts.filter((_, i) => i > 3)}
            widgetPosts={topPosts}
            authors={allAuthors.filter((_, i) => i >= 5)}
            //categories={DEMO_CATEGORIES.filter((_, i) => i > 2 && i < 8)}
            tags={tags}
            morePostsToShow={latestPosts.length < totalCount}
            onLoadMoreClick={() => loadLatestPosts(totalCount)}
          />
        </div>
        {/* ======= END CONTAINER ============= */}
      </div>
    </div>
  );
};

export default PageHome;
