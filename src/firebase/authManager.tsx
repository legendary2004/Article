import React, { ReactNode, useEffect, useState, useContext, createContext } from "react";
import { auth, db, sendEmailVerification } from "firebase";
import {
  Auth,
  UserCredential,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, onSnapshot, DocumentData, serverTimestamp } from "firebase/firestore";
import { PostAuthorType } from "data/types";
import { EditProfileProps } from "containers/PageDashboard/DashboardEditProfile";

export interface AuthProviderProps {
  children?: ReactNode;
}

export interface UserContextState {
  isAuthenticated: boolean;
  isLoading: boolean;
  id?: string;
}

export const UserStateContext = createContext<UserContextState>(
  {} as UserContextState
);

export interface AuthContextModel {
  auth: Auth;
  user: User | null;
  author: PostAuthorType | null;
  sendEmailVerificationLink: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  checkPassword: (password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  updateProfile: (userId: string, profile: EditProfileProps) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<UserCredential>;
}

export const AuthContext = React.createContext<AuthContextModel>(
  {} as AuthContextModel
);

export function useAuth(): AuthContextModel {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [author, setAuthor] = useState<PostAuthorType | null>(null);

  async function signUp(email: string, password: string, firstName: string, lastName: string): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(userCredential.user, { displayName: `${firstName} ${lastName}`, photoURL: "" });
    await setDoc(doc(db, "authors", `${userCredential.user.uid}`), {
      firstName: firstName,
      lastName: lastName,
      displayName: `${firstName} ${lastName}`,
      createdDate: serverTimestamp(),
      count: 0,
      likedPosts: 0,
      bookmarkedPosts: 0
    });

    //send email verification link
    await sendEmailVerification(userCredential.user);

    return userCredential;
  }

  async function signIn(email: string, password: string): Promise<UserCredential> {
    // https://firebase.google.com/docs/auth/web/auth-state-persistence
    //await setPersistence(auth, browserLocalPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  function changePassword(newPassword: string): Promise<void> {
    if (auth.currentUser) {
      return updatePassword(auth.currentUser, newPassword);
    }

    throw new Error("User email is missing!");
  }

  function checkPassword(newPassword: string): Promise<UserCredential> {
    if (auth.currentUser && auth.currentUser.email) {
      const credential = EmailAuthProvider.credential(auth.currentUser?.email, newPassword);
      return reauthenticateWithCredential(auth.currentUser, credential);
    }

    throw new Error("User email is missing!");
  }

  async function updateProfile(userId: string, props: EditProfileProps): Promise<void> {
    if (auth.currentUser) {
      try {
        await firebaseUpdateProfile(auth.currentUser, { displayName: props.displayName, photoURL: props.avatar });

        await updateDoc(doc(db, "authors", userId), { ...props });

        await auth.currentUser.reload();
        setUser(auth.currentUser);

        await updateCurrentAuthor(auth.currentUser);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function sendEmailVerificationLink(): Promise<void> {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  }

  useEffect(() => {
    //function that firebase notifies you if a user is set
    const unsubsrcibe = auth.onAuthStateChanged(async (_user) => {
      setUser(_user);
      updateCurrentAuthor(_user);
    });
    return unsubsrcibe;
  }, []);

  async function updateCurrentAuthor(_user: User | null, authorData?: DocumentData) {
    if (!_user) {
      setAuthor(null);
    }
    else {
      // get author additional info
      if (!authorData) {
        authorData = (await getDoc(doc(db, "authors", _user.uid))).data();
      }

      let author = {
        ...authorData,
        id: _user.uid,
        email: _user.email,
        emailVerified: _user.emailVerified,
        role: "none",
        isVerifiedAuthor: false,
        isModerator: false,
        isAdmin: false,
      } as PostAuthorType;
      // get roles
      try {
        const data = (await getDoc(doc(db, "users", _user.uid))).data();
        if (data && data.role) {
          switch (data.role) {
            case "author":
              author.role = "author";
              author.isVerifiedAuthor = true;
              break;
            case "moderator":
              author.role = "moderator";
              author.isModerator = true;
              break;
            case "admin":
              author.role = "admin";
              author.isAdmin = true;
              break;
            default:
              author.role = "none";
              break;
          }
        }
      } catch (error) { }

      setAuthor(author);
    }
  }

  const values = {
    auth,
    user,
    author,
    signUp,
    signIn,
    resetPassword,
    changePassword,
    checkPassword,
    updateProfile,
    sendEmailVerificationLink
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
};

export const useUserContext = (): UserContextState => {
  return useContext(UserStateContext);
};

