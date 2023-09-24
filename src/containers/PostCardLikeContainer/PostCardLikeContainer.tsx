import React, { FC, useState } from "react";
import { useAppDispatch, useAppSelector } from "app/hooks";
import {
  selectRecentLikeds,
  selectRecentRemoveds,
  removeLikedByPostId,
  addNewLikedByPostId,
} from "app/postLikes/postLikes";

import { PostDataType } from "data/types";
import PostCardLikeAction, {
  PostCardLikeActionProps,
} from "components/PostCardLikeAction/PostCardLikeAction";
import { useDb } from "firebase/firestoreManager";

export interface PostCardLikeContainerProps
  extends Omit<PostCardLikeActionProps, "isLiked" | "likeCount"> {
  like: PostDataType["like"];
}

const PostCardLikeContainer: FC<PostCardLikeContainerProps> = ({
  like,
  postId,
  onClickLike,
  ...args
}) => {
  const recentLikeds = useAppSelector(selectRecentLikeds);
  const recentRemoveds = useAppSelector(selectRecentRemoveds);
  const dispatch = useAppDispatch();
  const { likePost, unlikePost } = useDb();
  const [loading, setLoading] = useState(false);

  const isLiked = () => {
    if (recentLikeds.includes(postId)) {
      return true;
    }
    if (like.isLiked && !recentRemoveds.includes(postId)) {
      return true;
    }
    return false;
  };

  const getLikeCount = (): number => {
    // Recent Liked
    if (recentLikeds.includes(postId) && !like.isLiked) {
      return like.count + 1;
    }
    if (like.isLiked && recentRemoveds.includes(postId)) {
      return like.count - 1;
    }
    return like.count;
  };

  const handleClickLike = async () => {
    if(loading) {
      return;
    }
    setLoading(true);
    if (isLiked()) {
      await unlikePost(postId.toString(), getLikeCount());
      dispatch(removeLikedByPostId(postId));
    } else {
      await likePost(postId.toString(), getLikeCount());
      dispatch(addNewLikedByPostId(postId));
    }
    onClickLike && onClickLike(postId);
    setLoading(false);
  };

  return (
    <PostCardLikeAction
      {...args}
      isLiked={isLiked()}
      likeCount={getLikeCount()}
      postId={postId}
      onClickLike={handleClickLike}
    />
  );
};

export default PostCardLikeContainer;
