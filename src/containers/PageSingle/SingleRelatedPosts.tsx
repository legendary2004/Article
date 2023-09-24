import React, { FC } from "react";
import Heading from "components/Heading/Heading";
import { PostDataType } from "data/types";
import Card11 from "components/Card11/Card11";
import Card9 from "components/Card9/Card9";

export interface SingleRelatedPostsProps {
  relatedPosts?: PostDataType[];
  moreFromAuthorPosts?: PostDataType[];
}

const SingleRelatedPosts: FC<SingleRelatedPostsProps> = ({
  relatedPosts = [],
  moreFromAuthorPosts = [],
}) => {
  return (
    <div className="relative bg-neutral-100 dark:bg-neutral-800 py-16 lg:py-28 mt-16 lg:mt-28">
      {/* RELATED  */}
      <div className="container">
        {relatedPosts.length > 0 && (
          <div>
            <Heading
              className="mb-10 text-neutral-900 dark:text-neutral-50"
              desc=""
            >
              Related posts
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {relatedPosts.map((post) => (
                <Card11 key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
        {/* MORE FROM AUTHOR */}
        {moreFromAuthorPosts.length > 0 && (
          <div className="mt-20">
            <Heading
              className="mb-10 text-neutral-900 dark:text-neutral-50"
              desc=""
            >
              More from author
            </Heading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {moreFromAuthorPosts.map((post) => (
                <Card9 key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleRelatedPosts;
