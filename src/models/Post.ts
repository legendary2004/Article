import { PostStatusType } from "data/types";

export interface Post {
    uid: string | null;
    authorId: string,
    title: string,
    description: string | null,
    category: string,
    tags: string[],
    content: string,
    photoName?: string[],
    photoURL?: string[],
    status: PostStatusType,
    published: boolean,
    createdDate: Date,
    comment?: string
}

export interface CreatePost {
    uid: string | null;
    authorId: string,
    title: string,
    description: string | null,
    category: string,
    tags: string[],
    content: string,
    status: PostStatusType,
    published: boolean,
    photoName?: string[],
    photoURL?: string[],
    createdDate: Date
}

export interface EditPost {
    title: string,
    description: string | null,
    category: string,
    tags: string[],
    content: string,
    status: PostStatusType,
    published?: boolean,
    photoName?: string[],
    photoURL?: string[],
    textIndex?: string[]
}