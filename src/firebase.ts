// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { 
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    sendEmailVerification,
    updatePassword,
    setPersistence,
    browserSessionPersistence
    
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ExtendedUser from "models/User";
import { buildDisplayName, readDisplayName } from "utils/userMapper";

const firebaseConfig = {
  apiKey: "AIzaSyAteTAZnyDOlaz3rOyjr83WuWC5X5WTFBw",
  authDomain: "uneshkruaj-dev.firebaseapp.com",
  projectId: "uneshkruaj-dev",
  storageBucket: "uneshkruaj-dev.appspot.com",
  messagingSenderId: "188405549540",
  appId: "1:188405549540:web:805d5458f58bf3e6dd9ff1",
  measurementId: "G-WTV5R3YW6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
export const storage = getStorage(app);

const _signInWithEmailAndPassword = async (email: string, password: string) => {

    // https://firebase.google.com/docs/auth/web/auth-state-persistence
    await setPersistence(auth, browserSessionPersistence);
    
    const userCredentials = await signInWithEmailAndPassword(auth, email, password);
    console.log(userCredentials.user);
    let extendedUser: ExtendedUser =  { 
        uid: userCredentials.user.uid, 
        email: userCredentials.user.email, 
        emailVerified: userCredentials.user.emailVerified,
        photoURL: userCredentials.user.photoURL,
        isAnonymous: userCredentials.user.isAnonymous
    };
    
    extendedUser = readDisplayName(userCredentials.user.displayName, extendedUser);
    console.log(extendedUser);
    return { extendedUser, userCredentials };
}

const _createUserWithEmailAndPassword = async (email: string, password: string, firstName: string, lastName: string) => {
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredentials.user;
    await updateProfile(user, { displayName: `${firstName}|${lastName}` })
    await sendEmailVerification(user);
    const extendedUser: ExtendedUser =  { 
        uid: user.uid, 
        email: user.email, 
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        firstName: firstName,
        lastName: lastName,
        displayName: `${firstName} ${lastName}`
    };
    return extendedUser;
}

const _sendPasswordResetEmail = async (email: string) => {
    return await sendPasswordResetEmail(auth, email);
}

const _updateProfile = async (extendedUserData: ExtendedUser) => {
    if(!auth.currentUser) {
        const error = {code: "auth/missing_user", message: "Authenticated user is missing"};
        throw(error);
    }
    const displayName = buildDisplayName(extendedUserData);
    return await updateProfile(auth.currentUser, {...extendedUserData, displayName: displayName});
}

const _sendEmailVerification = async (user: any) => {
    return await sendEmailVerification(user);
}

const _updatePassword = async (user: any, newPassword: string) => {
    return await updatePassword(user, newPassword)
}

const _signOut = async () => {
    return await signOut(auth);
}

export {
    _signInWithEmailAndPassword as signInWithEmailAndPassword,
    _sendPasswordResetEmail as sendPasswordResetEmail,
    _createUserWithEmailAndPassword as createUserWithEmailAndPassword,
    _updatePassword as updatePassword,
    _sendEmailVerification as sendEmailVerification,
    _signOut as signOut
};