import React, { FC, useEffect } from "react";
import NcImage from "components/NcImage/NcImage";
import { useAppDispatch } from "app/hooks";
import { changeCurrentPage } from "app/pages/pages";
import SingleHeader from "./SingleHeader";
import SingleContentPreview from "./SingleContentPreview";
import { SinglePageType } from "./PageSingle";

export interface PageSinglePreviewProps {
  className?: string;
  pageData: SinglePageType
}

const PageSinglePreview: FC<PageSinglePreviewProps> = ({ className = "", pageData }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // UPDATE CURRENTPAGE DATA IN PAGE-REDUCERS
    dispatch(changeCurrentPage({ type: "/single/:slug", data: pageData }));

    return () => {
      dispatch(changeCurrentPage({ type: "/", data: {} }));
    };
  }, []);

  return (
    <>
      <div
        className={`nc-PageSingle pt-8 lg:pt-16 ${className}`}
        data-nc-id="PageSingle"
      >
        {/* SINGLE HEADER */}
        <header className="container rounded-xl">
          <div className="max-w-screen-md mx-auto">
            <SingleHeader pageData={pageData} />
          </div>
        </header>

        {/* FEATURED IMAGE */}
        <NcImage
          containerClassName="container my-10 sm:my-12"
          className="object-cover w-full h-full rounded-xl"
          src={pageData.featuredImage}
        />

        {/* SINGLE MAIN CONTENT */}
        <div className="container">
          <SingleContentPreview data={pageData} />
        </div>
      </div>
    </>
  );
};

export default PageSinglePreview;
