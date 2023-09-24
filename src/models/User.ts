export default interface ExtendedUser {
    uid: string,
    firstName?: string,
    lastName?: string,
    role?: string,
    email: string | null,
    emailVerified: boolean,
    photoURL?: string | null,
    displayName?: string | null,
    about?: string | null,
    isAnonymous: boolean,
}