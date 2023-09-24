//  ######  CustomLink  ######## //
export interface CustomLink {
  label: string;
  href: string;
  targetBlank?: boolean;
}

//  ##########  PostDataType ######## //
export interface TaxonomyType {
  id: string | number;
  name: string;
  href: string;
  count?: number;
  thumbnail?: string;
  desc?: string;
  color?: TwMainColor | string;
  taxonomy: "category" | "tag";
}

export interface PostAuthorType {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string;
  avatarPhotoName?: string;
  bgImage?: string;
  bgImageName?: string;
  email: string;
  emailVerified: boolean,
  count: number;
  desc: string;
  jobName: string;
  href: string;
  role: RoleType;
  isVerifiedAuthor: boolean,
  isModerator: boolean,
  isAdmin: boolean,
  likedPosts? : string[],
  bookmarkedPosts?: string[],
  createdDate: Date
}

export interface PostDataType {
  id: string | number;
  author: PostAuthorType;
  date: string;
  href: string;
  categories: TaxonomyType[];
  title: string;
  featuredImage: string;
  desc?: string;
  like: {
    count: number;
    isLiked: boolean;
  };
  bookmark: {
    count: number;
    isBookmarked: boolean;
  };
  commentCount: number;
  viewdCount: number;
  readingTime: number;
  postType: "standard" | "video" | "gallery" | "audio";
  videoUrl?: string;
  audioUrl?: string;
  galleryImgs?: string[];
}

export type TwMainColor =
  | "pink"
  | "green"
  | "yellow"
  | "red"
  | "indigo"
  | "blue"
  | "purple"
  | "gray";

export interface VideoType {
  id: string;
  title: string;
  thumbnail: string;
}

export type ReviewAction = "approve" | "reject";
export type RoleType = "none" | "author" | "moderator" | "admin";
export type PostStatusType = "DRAFT" | "IN_REVIEW" | "REJECTED" | "ACCEPTED";