import { ref, getDownloadURL, uploadBytesResumable, getBlob, deleteObject, StorageReference } from "firebase/storage";
import { FileValidated } from "@dropzone-ui/react";
import { storage } from "firebase";
import ncNanoId from "utils/ncNanoId";

const downloadFile = async (path: string, fileName: string): Promise<FileValidated> => {
    if(!path) throw new Error(`File path is not valid: ${path}`);
    if(!fileName) throw new Error("File name is not valid.");

    try {
        const blob = await getBlob(ref(storage, `${path}/${fileName}`));
        const newFile: FileValidated = { 
            id: ncNanoId(), 
            file: new File([blob], fileName, { type: blob.type }), 
            valid: true 
        };
        console.log(`File with name: "${fileName}" successfully downloaded as blob from storage.`);
        return newFile;
    }
    catch(error: any) {
        return error;
    }
}

const getFileUrl = async (storageRef: StorageReference): Promise<string> => {
    try {
        const url = await getDownloadURL(storageRef);
        return url;
    } catch(error: any) {
        return error;
    }
}

const uploadFile = (
    path: string, 
    file: FileValidated, 
    onBytesTransferred: (progress: number) => void,
    onSuccess: (storageRef: StorageReference) => void, 
    onError: (error: any) => void) => {

    if(!path) throw new Error(`File path is not valid: ${path}`);
    if(!file || !file.valid) throw new Error("File is not valid.");

    try {
        const storageRef = ref(storage, `${path}/${file.file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file.file);
    
        uploadTask.on("state_changed",
          snapshot => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onBytesTransferred(progress);
            if (progress === 100) {
              console.log(`File with name: "${file.file.name}" successfully uploaded to storage.`);
            }
          },
          (err) => onError(err),
          () => onSuccess(uploadTask.snapshot.ref));
    } catch(error) {
        onError(error);
    }
}

const deleteFile = async (path: string, fileName: string) : Promise<boolean> => {
    if(!path) throw new Error(`File path is not valid: ${path}`);
    if(!fileName) throw new Error("File name is not valid.");
    try {
        const fileRefToDelete = ref(storage, `${path}/${fileName}`);
        await deleteObject(fileRefToDelete);
        console.log(`File with name: "${fileName}" successfully deleted from storage.`);
        return true;
    } catch(error) {
        console.log(error);
        return false;
    }
}

export {
    uploadFile,
    downloadFile,
    getFileUrl,
    deleteFile
};