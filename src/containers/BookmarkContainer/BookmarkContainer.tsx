import NcBookmark, { NcBookmarkProps } from "components/NcBookmark/NcBookmark";
import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "app/hooks";
import {
  addNewSavedByPostId,
  removeSavedByPostId,
  selectRecentSaveds,
  selectRecentRemoveds,
} from "app/bookmarks/bookmarksSlice";
import { useDb } from "firebase/firestoreManager";

export type BookmarkContainerProps = Omit<NcBookmarkProps, "isBookmarked"> & {
  initBookmarked: boolean;
  bookmarkCount?: number;
};

const BookmarkContainer: React.FC<BookmarkContainerProps> = (props) => {
  const { postId, initBookmarked, bookmarkCount } = props;
  const count = bookmarkCount ?? 0;
  
  const recentSaveds = useAppSelector(selectRecentSaveds);
  const recentRemoveds = useAppSelector(selectRecentRemoveds);
  const dispatch = useAppDispatch();

  const { bookmarkPost, removeBookmark } = useDb();
  const [loading, setLoading] = useState(false);

  const isBookmarked = () => {
    if (recentSaveds.includes(postId)) {
      return true;
    }
    if (initBookmarked && !recentRemoveds.includes(postId)) {
      return true;
    }
    return false;
  };

  const getBookmarkCount = (): number => {
    // Recent Liked
    if (recentSaveds.includes(postId) && !initBookmarked) {
      return count + 1;
    }
    if (initBookmarked && recentRemoveds.includes(postId)) {
      return count - 1;
    }
    return count;
  };

  const handleClickBookmark = async () => {
    if(loading) {
      return true;
    }

    setLoading(true);
    if (isBookmarked()) {
      await removeBookmark(postId.toString(), getBookmarkCount());
      dispatch(removeSavedByPostId(postId));
    } else {
      await bookmarkPost(postId.toString(), getBookmarkCount());
      dispatch(addNewSavedByPostId(postId));
    }
    setLoading(false);
  };

  return (
    <NcBookmark
      onClick={handleClickBookmark}
      isBookmarked={isBookmarked()}
      {...props}
    />
  );
};

export default BookmarkContainer;
