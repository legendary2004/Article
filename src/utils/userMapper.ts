import ExtendedUser from "models/User";

const buildDisplayName = (extendedUserData: ExtendedUser) => {
    if(!extendedUserData) return ""
    return `${extendedUserData.firstName || ""}|${extendedUserData.lastName || ""}|${extendedUserData.about || ""}`;
}

const formatDisplayName = (displayName: string | null | undefined) => {
    if(!displayName) return "";
    const segments = displayName.split("|");
    switch (segments.length) {
        case 1: return segments[0];
        case 2: case 3: return `${segments[0]} ${segments[1]}`;
        default: return displayName;
    };
}

const readDisplayName = (currentDisplayName: string | null, extendedUserData : ExtendedUser) => {
    // displayName has the following structure in Firebase: 
    // firstName | lastName | about
    if(!currentDisplayName) return extendedUserData;
    const segments = currentDisplayName.split("|");
    switch (segments.length) {
        case 1:
            extendedUserData.firstName = segments[0];
            extendedUserData.displayName = segments[0];
            break;
        case 2:
            extendedUserData.firstName = segments[0];
            extendedUserData.lastName = segments[1];
            extendedUserData.displayName = `${segments[0]} ${segments[1]}`;
            break;
        case 3:
            extendedUserData.firstName = segments[0];
            extendedUserData.lastName = segments[1];
            extendedUserData.about = segments[2];
            extendedUserData.displayName = `${segments[0]} ${segments[1]}`;
            break;
        default:
            break;
    }
    return extendedUserData;
}

export {
    buildDisplayName,
    readDisplayName,
    formatDisplayName
}