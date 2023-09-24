import React, { FC, useEffect, useRef } from "react";
import Tag from "components/Tag/Tag";
import SingleAuthor from "./SingleAuthor";
import { useLocation } from "react-router";
import { SingleContentProps } from "./SingleContent";

const SingleContentPreview: FC<SingleContentProps> = ({ data }) => {
  const { tags, author, content } = data;
  const commentRef = useRef<HTMLDivElement>(null);
  //
  const location = useLocation();

  useEffect(() => {
    //  SCROLL TO COMMENT AREA
    if (location.hash !== "#comment") {
      return;
    }
    //
    if (location.hash === "#comment") {
      setTimeout(() => {
        if (commentRef.current) {
          commentRef.current.scrollIntoView();
        }
      }, 500);
    }
  }, [location]);

  return (
    <div className="nc-SingleContent space-y-10">
      {/* ENTRY CONTENT */}
      <div
        id="single-entry-content"
        className="prose prose-sm !max-w-screen-md sm:prose lg:prose-lg mx-auto dark:prose-dark"
        dangerouslySetInnerHTML={{ __html: `${content}` }}>
      </div>

      {/* TAGS */}
      <div className="max-w-screen-md mx-auto flex flex-wrap">
        {tags.map((item) => (
          <Tag hideCount key={item.id} tag={item} className="mr-2 mb-2" />
        ))}
      </div>

      {/* AUTHOR */}
      <div className="max-w-screen-md mx-auto border-b border-t border-neutral-100 dark:border-neutral-700"></div>
      <div className="max-w-screen-md mx-auto ">
        <SingleAuthor author={author} />
      </div>
    </div>
  );
};

export default SingleContentPreview;
