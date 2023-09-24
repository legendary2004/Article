import { db } from "firebase";
import { useAuth } from "./authManager";
import { CreatePost, EditPost, Post } from "models/Post";
import { PostAuthorType, ReviewAction, TaxonomyType } from "data/types";
import { upperCaseFirstLetterEachWord } from "utils/StringUtils";
import React, { ReactNode, useEffect, useState, useContext } from "react";
import {
  doc, collection, addDoc, getDoc, getDocs, query, where, DocumentReference, DocumentData,
  QuerySnapshot, serverTimestamp, orderBy, updateDoc, onSnapshot, startAfter,
  startAt, limit, runTransaction, getCountFromServer, QueryConstraint
} from "firebase/firestore";
import { mapTagsToTaxonomy } from "data/mapper";

export interface DBModel {
  tags: TaxonomyType[],
  allAuthors: PostAuthorType[],
  allAuthorsFirstLoad: PostAuthorType[],
  editPost: (post: Post) => Promise<void>;
  setPhotoUrl: (post: Post) => Promise<void>;
  deletePost: (post: Post) => Promise<void>;
  getAuthor: (id: string) => Promise<DocumentData>;
  getTopPosts: () => Promise<QuerySnapshot<DocumentData>>;
  getSinglePost: (postId: string) => Promise<DocumentData>;
  countPosts: (constraints: QueryConstraint[]) => Promise<number>;
  reviewPost: (action: ReviewAction, post: Post) => Promise<void>;
  likePost: (postId: string, currentLikeCount: number) => Promise<void>;
  unlikePost: (postId: string, currentLikeCount: number) => Promise<void>;
  addPost: (post: CreatePost) => Promise<DocumentReference<DocumentData>>;
  bookmarkPost: (postId: string, currentBookmarkCount: number) => Promise<void>;
  removeBookmark: (postId: string, currentBookmarkCount: number) => Promise<void>;
  getPaginatedRelatedPosts: (postId: string, tags: string[], pageSize: number) => Promise<QuerySnapshot<DocumentData>>;
  getPostsToReview: (referenceDoc: string, pageSize: number, operation: string) => Promise<QuerySnapshot<DocumentData>>;
  searchPaginatedPosts: (referenceDoc: string, pageSize: number, keywords: string[], orderType?: string) => Promise<QuerySnapshot<DocumentData>>;
  getPaginatedPosts: (authorId: string, referenceDoc: string, pageSize: number, operation: string) => Promise<QuerySnapshot<DocumentData>>;
  getPaginatedLatestPosts: (referenceDoc: string, pageSize: number, tag?: string, orderType?: string) => Promise<QuerySnapshot<DocumentData>>;
  getPaginatedPublicPosts: (authorId: string, referenceDoc: string, pageSize: number, operation: string) => Promise<QuerySnapshot<DocumentData>>;
}

export const DbContext = React.createContext<DBModel>({} as DBModel);
export function useDb(): DBModel { return useContext(DbContext); }
export interface AuthProviderProps { children?: ReactNode; }

export const DBProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const { author } = useAuth();
  const [tags, setTags] = useState([] as TaxonomyType[]);
  const [allAuthors, setAllAuthors] = useState([] as PostAuthorType[]);
  const [allAuthorsFirstLoad, setAllAuthorsFirstLoad] = useState([] as PostAuthorType[]);

  const allAuthorsStateRef = React.useRef(allAuthors);
  
  const setAllAuthorsStateWithRef = (data: PostAuthorType[]) => {
    allAuthorsStateRef.current = data;
    setAllAuthors(data);
  };

    // SNAPSHOT LISTENER FOR TAGS
    useEffect(() => {
      const docRef = doc(db, "tags", "all");
      const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
        setTags(mapTagsToTaxonomy(querySnapshot));
      });
      return unsubscribe;
    }, []);
  
    // SNAPSHOT LISTENER FOR AUTHORS
    useEffect(() => {
      const docRef = collection(db, "authors");
      const q = query(docRef, where("count", ">", 0), orderBy("count", "desc"));
      const unsubscribe = onSnapshot(q, querySnapshot => {
        if (querySnapshot.metadata.hasPendingWrites) {
          return;
        }
        const _authors = [] as PostAuthorType[];
        const _authorsFirstLoad = [] as PostAuthorType[];
        querySnapshot.docChanges().forEach(docData => {
          const data = docData.doc.data();
          let _author = {
            ...data,
            id: docData.doc.id,
            role: "none",
            isVerifiedAuthor: false,
            isModerator: false,
            isAdmin: false,
            count: data.count ?? 0,
            createdDate: data.createdDate.toDate(),
            href: `/author/${docData.doc.id}`
          } as PostAuthorType;
  
          _authors.push(_author);
          if (docData.type === "added") {
            _authorsFirstLoad.push({ ..._author });
          }
        });
        if(allAuthorsStateRef.current.length === 0) {
          setAllAuthorsStateWithRef(_authors);
        }
        else {
         let _existingAuthors = [...allAuthorsStateRef.current];
         _authors.forEach((val, index) => {
          let existingIndex = _existingAuthors.findIndex(x => x.id === val.id);
          if(existingIndex !== -1) {
            _existingAuthors[existingIndex] = val;
          }
          else {
            _existingAuthors.push(val);
          }
          setAllAuthorsStateWithRef(_existingAuthors);
         })
        }
        //setAllAuthors(_authors);
        if (_authorsFirstLoad.length > 0) {
          setAllAuthorsFirstLoad(_authorsFirstLoad);
        }
      });
      return unsubscribe;
    }, []);

  // GET SINGLE POST
  async function getSinglePost(postId: string): Promise<DocumentData> {
    return await getDoc(doc(db, "posts", postId));
  }

  // CREATE A NEW POST
  async function addPost(post: CreatePost): Promise<DocumentReference<DocumentData>> {
    post.tags = post.tags
      .map(tag => upperCaseFirstLetterEachWord(tag))
      .filter((tag, index, array) => array.indexOf(tag) === index);

    const data = await addDoc(collection(db, "posts"), { ...post, createdDate: serverTimestamp(), likeCount: 0, bookmarkCount: 0 });

    await runTransaction(db, async (transaction) => {
      // update author post count if published is true
      if (post.published && author) {
        const authorRef = doc(db, "authors", author.id);
        await transaction.update(authorRef, { count: author.count + 1 });
      }

      // update tags
      if (post.tags && post.published && (author?.isVerifiedAuthor || author?.isModerator || author?.isAdmin)) {
        const _tags = updateTags(post.tags, "add");
        await transaction.update(doc(db, "tags", "all"), {
          tagsArray: _tags.map(tag => ({ name: tag.name, count: tag.count }))
        });
      }
    });

    return data;
  }

  // EDIT A POST
  async function editPost(post: Post): Promise<void> {
    const docRef = doc(db, "posts", post.uid ?? "");
    let validDbObject: EditPost = {
      title: post.title ?? "",
      description: post.description ?? "",
      category: post.category ?? "",
      status: post.status,
      content: post.content,
      photoName: post.photoName ?? [],
      photoURL: post.photoURL ?? [],
      tags: [],
    };

    validDbObject.tags = post.tags
      .map(tag => upperCaseFirstLetterEachWord(tag))
      .filter((tag, index, array) => array.indexOf(tag) === index);

    validDbObject.textIndex = post.tags.concat(
      post.title.split(" ")
        .filter(val => val)
        .map(val => upperCaseFirstLetterEachWord(val)));

    if (author?.isAdmin || author?.isModerator || author?.isVerifiedAuthor) {
      validDbObject.published = post.published;
    }

    await runTransaction(db, async (transaction) => {
      await transaction.update(docRef, { ...validDbObject });

      // update author post count if published is true
      if (author && (author.isAdmin || author.isModerator || author.isVerifiedAuthor)) {
        const authorRef = doc(db, "authors", author.id);
        const currentPublishStatus = await ((await getDoc(docRef)).get("published"));
        if (post.published === true && currentPublishStatus !== true) {
          // publish an article
          await transaction.update(authorRef, { count: author.count + 1 });

          const _tags = updateTags(post.tags, "add");
          await transaction.update(doc(db, "tags", "all"), {
            tagsArray: _tags.map(tag => ({ name: tag.name, count: tag.count }))
          });
        }
        else if (post.published !== true && currentPublishStatus === true) {
          // unpublish
          await transaction.update(authorRef, { count: author.count - 1 });

          const _tags = updateTags(post.tags, "delete");
          await transaction.update(doc(db, "tags", "all"), {
            tagsArray: _tags.map(tag => ({ name: tag.name, count: tag.count }))
          });
        }
      }
    });
  }

  // APPROVE OR REJECT A CERTAIN POST
  async function reviewPost(action: ReviewAction, post: Post): Promise<void> {
    const validDbObject = action === "approve"
      ? { status: "ACCEPTED", published: true }
      : action === "reject" ? { status: "REJECTED", published: false, comment: post.comment } : {};

    await runTransaction(db, async (transaction) => {
      const docRef = doc(db, "posts", post.uid || "");
      await transaction.update(docRef, validDbObject);

      // update author post count if published is true
      const authorOfPost = allAuthors.find(a => a.id === post.authorId);
      if (action === "approve" && authorOfPost) {
        const authorRef = doc(db, "authors", authorOfPost.id);
        await transaction.update(authorRef, { count: authorOfPost.count + 1 });
      }
    });

    // update tags
    if (post.tags && action === "approve") {
      await updateTags(post.tags, "add");
    }
  }

  // UPDATE POST IMAGES AFTER CREATING THE DOCUMENT
  async function setPhotoUrl(post: Post): Promise<void> {
    const docRef = doc(db, "posts", post.uid ?? "");
    await updateDoc(docRef, { photoURL: post.photoURL });
    return;
  }

  // UPDATE ALL TAGS AFTER A POST IS PUBLISHED AND RETURN THE UPDATED TAGS
  function updateTags(newTags: string[], postCountAction: string): TaxonomyType[] {
    // update tags
    let _tags = [...tags];
    if (newTags && newTags.length > 0) {
      newTags = newTags.map(newTag => upperCaseFirstLetterEachWord(newTag));
      newTags.forEach(key => {
        let existing = tags.find(t => t.name === key);
        if (existing) {
          // update
          if (postCountAction === "add") {
            existing.count = (existing.count ?? 0) + 1;
          }
          else if (postCountAction === "delete") {
            existing.count = (existing.count ?? 0) - 1;
          }
        }
        else {
          // new
          _tags.push({ name: key, count: 1 } as TaxonomyType);
        }
      });
    }

    return _tags;
  }

  // GET PAGINATED LIST OF POSTS TO REVIEW
  async function getPostsToReview(referenceDoc: string, pageSize: number, operation: string): Promise<QuerySnapshot<DocumentData>> {
    const ref = collection(db, "posts");
    if (referenceDoc) {
      const docSnap = await getDoc(doc(ref, referenceDoc));
      if (operation === "next") {
        const q = query(ref,
          where("status", "==", "IN_REVIEW"),
          orderBy("createdDate", "desc"),
          startAfter(docSnap), limit(pageSize));
        return getDocs(q);
      }
      else {
        const q = query(ref,
          where("status", "==", "IN_REVIEW"),
          orderBy("createdDate", "desc"),
          startAt(docSnap), limit(pageSize));
        return getDocs(q);
      }
    }
    else {
      // initial load of first page
      const q = query(ref,
        where("status", "==", "IN_REVIEW"),
        orderBy("createdDate", "desc"), limit(pageSize));
      return getDocs(q);
    }
  }

  // DELETE A POST
  async function deletePost(post: Post): Promise<void> {
    if (!post?.uid) throw new Error("Missing post id");
    const docRef = doc(db, "posts", post.uid);

    await runTransaction(db, async (transaction) => {
      await transaction.delete(docRef);

      // update author post count if published is true
      if (author && post.published === true) {
        const authorRef = doc(db, "authors", post.authorId);
        await transaction.update(authorRef, { count: author.count - 1 });

        const _tags = updateTags(post.tags, "delete");
        await transaction.update(doc(db, "tags", "all"), {
          tagsArray: _tags.map(tag => ({ name: tag.name, count: tag.count }))
        });
      }
    });
  }

  // GET AUTHOR DATA
  async function getAuthor(id: string): Promise<DocumentData> {
    return await getDoc(doc(db, "authors", id));
  }

  // COUNT ALL POSTS FOR AN AUTHOR. USED FOR PAGINATION
  async function countPosts(constraints: QueryConstraint[]) {
    const coll = collection(db, "posts");
    const query_ = query(coll, ...constraints);
    const snapshot = await getCountFromServer(query_);

    return snapshot.data().count;
  }

  // GET AUTHOR PAGINATED POSTS
  async function getPaginatedPosts(authorId: string, referenceDoc: string, pageSize: number, operation: string): Promise<QuerySnapshot<DocumentData>> {
    const ref = collection(db, "posts");
    if (referenceDoc) {
      const docSnap = await getDoc(doc(ref, referenceDoc));
      if (operation === "next") {
        const q = query(ref, where("authorId", "==", authorId), orderBy("createdDate", "desc"), startAfter(docSnap), limit(pageSize));
        return getDocs(q);
      }
      else {
        const q = query(ref, where("authorId", "==", authorId), orderBy("createdDate", "desc"), startAt(docSnap), limit(pageSize));
        return getDocs(q);
      }
    }
    else {
      // initial load of first page
      const q = query(ref, where("authorId", "==", authorId), orderBy("createdDate", "desc"), limit(pageSize));
      return getDocs(q);
    }
  }

  // GET AUTHOR PAGINATED POSTS THAT ARE PUBLISHED
  async function getPaginatedPublicPosts(authorId: string, referenceDoc: string, pageSize: number, operation: string): Promise<QuerySnapshot<DocumentData>> {
    const ref = collection(db, "posts");
    if (referenceDoc) {
      const docSnap = await getDoc(doc(ref, referenceDoc));
      if (operation === "next") {
        const q = query(ref, where("authorId", "==", authorId), where("published", "==", true), orderBy("createdDate", "desc"), startAfter(docSnap), limit(pageSize));
        return getDocs(q);
      }
      else {
        const q = query(ref, where("authorId", "==", authorId), where("published", "==", true), orderBy("createdDate", "desc"), startAt(docSnap), limit(pageSize));
        return getDocs(q);
      }
    }
    else {
      // initial load of first page
      const q = query(ref, where("authorId", "==", authorId), where("published", "==", true), orderBy("createdDate", "desc"), limit(pageSize));
      return getDocs(q);
    }
  }

  // LIKE A POST
  const likePost = async (postId: string, currentLikeCount: number) => {
    if (!author) return;
    let newLikeCount = currentLikeCount;
    let likedPosts = allAuthors.find(a => a.id === author.id)?.likedPosts || [];
    if (likedPosts.filter(p => p === postId).length === 0) {
      likedPosts.push(postId);
      newLikeCount = newLikeCount + 1;
    }

    const postRef = doc(db, "posts", postId);
    const authorRef = doc(db, "authors", author.id);

    await runTransaction(db, async (transaction) => {
      // remove postId from Authors liked posts
      await transaction.update(authorRef, { likedPosts: likedPosts });

      // decrease post like count
      await transaction.update(postRef, { likeCount: newLikeCount });
    });
  }

  // UNLIKE A POST
  const unlikePost = async (postId: string, currentLikeCount: number) => {
    if (!author) return;
    let newLikeCount = currentLikeCount;
    let likedPosts = allAuthors.find(a => a.id === author.id)?.likedPosts || [];
    if (likedPosts.includes(postId)) {
      newLikeCount = newLikeCount - 1;
    }
    likedPosts = likedPosts.filter(p => p !== postId);

    const postRef = doc(db, "posts", postId);
    const authorRef = doc(db, "authors", author.id);

    await runTransaction(db, async (transaction) => {
      // remove postId from Authors liked posts
      await transaction.update(authorRef, { likedPosts: likedPosts });

      // decrease post like count
      await transaction.update(postRef, { likeCount: newLikeCount });
    });
  }

  // BOOKMARK A POST
  const bookmarkPost = async (postId: string, currentBookmarkCount: number) => {
    if (!author) return;
    let newBookmarkCount = currentBookmarkCount;
    let bookmarkedPosts = allAuthors.find(a => a.id === author.id)?.bookmarkedPosts || [];
    if (bookmarkedPosts.filter(p => p === postId).length === 0) {
      bookmarkedPosts.push(postId);
      newBookmarkCount = newBookmarkCount + 1;
    }

    const postRef = doc(db, "posts", postId);
    const authorRef = doc(db, "authors", author.id);

    await runTransaction(db, async (transaction) => {
      // remove postId from Authors bookmarked posts
      await transaction.update(authorRef, { bookmarkedPosts: bookmarkedPosts });

      // increase post bookmark count
      await transaction.update(postRef, { bookmarkCount: newBookmarkCount });
    });
  }

  // REMOVE BOOKMARK FROM A POST
  const removeBookmark = async (postId: string, currentBookmarkCount: number) => {
    if (!author) return;
    let newBookmarkCount = currentBookmarkCount;
    let bookmarkedPosts = allAuthors.find(a => a.id === author.id)?.bookmarkedPosts || [];
    if (bookmarkedPosts.includes(postId)) {
      newBookmarkCount = newBookmarkCount - 1;
    }
    bookmarkedPosts = bookmarkedPosts.filter(p => p !== postId);

    const postRef = doc(db, "posts", postId);
    const authorRef = doc(db, "authors", author.id);

    await runTransaction(db, async (transaction) => {
      // remove postId from Authors liked posts
      await transaction.update(authorRef, { bookmarkedPosts: bookmarkedPosts });

      // decrease post like count
      await transaction.update(postRef, { bookmarkCount: newBookmarkCount });
    });
  }

  // GET TOP POSTS TO DISPLAY
  const getTopPosts = async (): Promise<QuerySnapshot<DocumentData>> => {
    const docRef = collection(db, "posts");
    const q = query(docRef,
      where("published", "==", true),
      orderBy("likeCount", "desc"),
      orderBy("bookmarkCount", "desc"),
      orderBy("createdDate", "desc"),
      limit(5));

    return await getDocs(q);
  }

  // GET THE LATEST POSTS TO DISPLAY
  const getPaginatedLatestPosts = async (referenceDoc: string, pageSize: number, tag?: string, orderType?: string): Promise<QuerySnapshot<DocumentData>> => {
    const ref = collection(db, "posts");
    let whereClause = [where("published", "==", true)];
    if (tag) {
      whereClause.push(where("tags", "array-contains", tag.trim()));
    }
    let sort = [orderBy("createdDate", "desc")];
    if (orderType) {
      if (orderType === "appreciated") {
        sort = [
          orderBy("likeCount", "desc"),
          orderBy("bookmarkCount", "desc"),
          orderBy("createdDate", "desc")
        ];
      }
    }
    if (referenceDoc) {
      const docSnap = await getDoc(doc(ref, referenceDoc));
      const q = query(ref, ...whereClause, ...sort, startAfter(docSnap), limit(pageSize));
      return await getDocs(q);

    }
    else {
      // initial load of first page
      const q = query(ref, ...whereClause, ...sort, limit(pageSize));
      return await getDocs(q);
    }
  }

  // SEARCH POSTS
  const searchPaginatedPosts = async (referenceDoc: string, pageSize: number, keywords: string[], orderType?: string): Promise<QuerySnapshot<DocumentData>> => {
    const ref = collection(db, "posts");
    let whereClause = [where("published", "==", true), where("textIndex", "array-contains-any", keywords)];
    let sort = [orderBy("createdDate", "desc")];
    if (orderType) {
      if (orderType === "appreciated") {
        sort = [
          orderBy("likeCount", "desc"),
          orderBy("bookmarkCount", "desc"),
          orderBy("createdDate", "desc")
        ];
      }
    }
    if (referenceDoc) {
      const docSnap = await getDoc(doc(ref, referenceDoc));
      const q = query(ref, ...whereClause, ...sort, startAfter(docSnap), limit(pageSize));
      return await getDocs(q);

    }
    else {
      // initial load of first page
      const q = query(ref, ...whereClause, ...sort, limit(pageSize));
      return await getDocs(q);
    }
  }

  // GET RELATED POSTS
  const getPaginatedRelatedPosts = async (postId: string, tags: string[], pageSize: number): Promise<QuerySnapshot<DocumentData>> => {
    const ref = collection(db, "posts");
    let whereClause = [where("published", "==", true), where("__name__", "!=", postId), where("tags", "array-contains-any", tags)];
    const q = query(ref, ...whereClause, orderBy("__name__", "desc"), limit(pageSize));
    return await getDocs(q);
  }

  // EXPORT MEMBERS
  const values = {
    allAuthors, allAuthorsFirstLoad, tags, addPost, getSinglePost,
    editPost, setPhotoUrl, deletePost, getPostsToReview, getAuthor,
    reviewPost, countPosts, getPaginatedPosts, getPaginatedPublicPosts, searchPaginatedPosts,
    likePost, unlikePost, bookmarkPost, removeBookmark, getTopPosts, getPaginatedLatestPosts, getPaginatedRelatedPosts
  };

  return <DbContext.Provider value={values}>{children}</DbContext.Provider>
};

