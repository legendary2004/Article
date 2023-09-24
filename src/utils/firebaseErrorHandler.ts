import swal from "sweetalert";

const handleError = (error: any) => {
    console.log(`${error.code} ${error.message}`);
    if(error.code === "auth/email-already-in-use") {
        swal("Email already in use!", 
            "This email exists and is being used by an existing account. Did you mean to Login?" ,
            "info");
    }
    else if(error.code === "auth/too-many-requests") {
        swal('Login failed!', 
            'Access to this account has been temporarily disabled due to many failed login attempts. ' +
            'You can immediately restore it by resetting your password or you can try again later.',
            'error');
    }
    else if(error.code === "auth/wrong-password") {
        swal('Login failed!', "Please check your credentials and try again.", "error");
    }
    else if(error.code === "auth/user-disabled") {
        swal('Login failed!', "This account is no longer active, please contact an administrator.", "error");
    }
    else if(error.code === "auth/user-not-found") {
        swal('Login failed!', "No account found with this email. Do you want to Sign Up instead?", "error");
    } else if(error.message) {
        swal("Error!", error.message, "error");
    }
    else {
        swal("Error!", "There was a problem, please try again later.", "error");
    }
}

export default handleError;