import { SinglePageType } from "containers/PageSingle/PageSingleTemp3Sidebar";
import { DocumentData } from "firebase/firestore";
import { formatDistance } from "date-fns";
import LZString from "lz-string";
import { PostAuthorType, PostDataType, TaxonomyType } from "./types";
import ncNanoId from "utils/ncNanoId";
import * as firebase from "firebase"

const mapPostDataToSinglePage = (
  snapshot: DocumentData,
  authors: PostAuthorType[]
): SinglePageType | undefined => {
  let user = firebase.auth.currentUser;
  let userLikedPosts;
  let userBookmarkedPosts;
  if (user) {
    for (let author of authors) {
      if (author.id === user.uid) {
        userLikedPosts = author.likedPosts;
        userBookmarkedPosts = author.bookmarkedPosts;
        break;
      }
    }
  }
  const docData = snapshot.data();
  if (docData) {
    let author = authors.find((a) => a.id === docData.authorId);
    if (!author) throw new Error("Author is missing!");

    let _pageData: SinglePageType = {
      content: LZString.decompressFromUTF16(docData.content),
      tags: (docData.tags || []).map((tag: string) => {
        return { name: tag, id: ncNanoId(), href: `/archive/${tag}` } as TaxonomyType;
      }),
      comments: [],
      id: snapshot.id,
      author: { ...author, href: `/author/${author.id}` },
      date: formatDistance(docData.createdDate.toDate(), new Date(), {
        addSuffix: true,
      }),
      href:
        docData.photoName && docData.photoName.length > 1
          ? `/single-gallery/${docData.uid}`
          : `/single-sidebar/${docData.uid}`,
      categories: [
        { id: docData.category, name: docData.category } as TaxonomyType,
      ],
      title: docData.title,
      featuredImage:
        docData.photoURL && docData.photoURL.length > 0
          ? docData.photoURL[0]
          : "",
      galleryImgs: docData.photoURL || [],
      like: { count: docData.likeCount, isLiked: userLikedPosts?.includes(snapshot.id) ?? false },
      bookmark: { count: docData.bookmarkCount, isBookmarked: userLikedPosts?.includes(snapshot.id) ?? false },
      commentCount: 0,
      viewdCount: 0,
      readingTime: 1,
      postType:
        docData.photoName && docData.photoName.length > 1
          ? "gallery"
          : "standard",
      desc: docData.description,
    };

    return _pageData;
  }
};

const mapDocumentToPostDataType = (
  snapshot: DocumentData,
  allAuthors: PostAuthorType[]
) => {
  const data = snapshot.data();
  const authorId = data.authorId;
  const author = allAuthors.filter((a) => a.id === authorId)[0];
  author.href = `/author/${authorId}`;
  let user = firebase.auth.currentUser;
  let userLikedPosts;
  let userBookmarkedPosts;
  if (user) {
    for (let author of allAuthors) {
      if (author.id === user.uid) {
        userLikedPosts = author.likedPosts;
        userBookmarkedPosts = author.bookmarkedPosts;
        break;
      }
    }
  }

  let post: PostDataType = {
    id: snapshot.id,
    date: formatDistance(data.createdDate?.toDate() ?? new Date(), new Date(), {
      addSuffix: true,
    }),
    href:
      data.photoURL && data.photoURL.length > 1
        ? `/single-gallery/${snapshot.id}`
        : `/single-sidebar/${snapshot.id}`,
    categories: [{ name: data.category } as TaxonomyType],
    title: data.title,
    featuredImage:
      data.photoURL && data.photoURL.length > 0 ? data.photoURL[0] : "",
    galleryImgs: data.photoURL,
    like: {
      count: data.likeCount ?? 0,
      isLiked: userLikedPosts?.includes(snapshot.id) ?? false,
    },
    bookmark: {
      count: data.bookmarkCount ?? 0,
      isBookmarked: userBookmarkedPosts?.includes(snapshot.id) ?? false,
    },
    commentCount: 0,
    viewdCount: data.viewCount ?? 0,
    readingTime: data.readingTime ?? 0,
    postType: data.photoURL && data.photoURL.length > 1 ? "gallery" : "standard",
    desc: data.description,
    author: author,
  };

  return post;
};

const mapTagsToTaxonomy = (docData: DocumentData): TaxonomyType[] => {
  let taxonomies: TaxonomyType[] = [];
  const allTags = docData.get("tagsArray");
  let i = 0;
  allTags.forEach((element: TaxonomyType) => {
    taxonomies.push({
      ...element,
      id: ++i,
      href: `/archive/${i}`,
    } as TaxonomyType);
  });

  return taxonomies;
};

export {
  mapPostDataToSinglePage,
  mapDocumentToPostDataType,
  mapTagsToTaxonomy,
};
