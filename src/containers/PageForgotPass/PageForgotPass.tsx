import React, { FC, FormEvent, useState } from "react";
import LayoutPage from "components/LayoutPage/LayoutPage";
import Input from "components/Input/Input";
import ButtonPrimary from "components/Button/ButtonPrimary";
import NcLink from "components/NcLink/NcLink";
import { Helmet } from "react-helmet";
import swal from "sweetalert";
import handleError from "utils/firebaseErrorHandler";
import { useAuth } from "firebase/authManager";

export interface PageForgotPassProps {
  className?: string;
}

const PageForgotPass: FC<PageForgotPassProps> = ({ className = "" }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setIsLoading] = useState(false);

  function handleChange(event: FormEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setIsLoading(true);
      await resetPassword(email);
      setIsLoading(false);
      swal("Email sent!", "An email has been sent to you with instructions how to reset your password." , "success");
    } catch (error) {
      setIsLoading(false);
      handleError(error);
    }
  }
  return (
    <div
      className={`nc-PageForgotPass ${className}`}
      data-nc-id="PageForgotPass"
    >
      <Helmet>
        <title>Forgot Password || Blog Magazine React Template</title>
      </Helmet>
      <LayoutPage
        subHeading="We will sent reset password instruction to your email"
        headingEmoji="🔐"
        heading="Forgot password"
      >
        <div className="max-w-md mx-auto space-y-6">
          {/* FORM */}
          <form className="grid grid-cols-1 gap-6" method="POST" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                Email address
              </span>
              <Input
                required
                type="email"
                name="email"
                placeholder="example@example.com"
                className="mt-1"
                onChange={handleChange}
              />
            </label>
            <ButtonPrimary loading={loading} type="submit">Continue</ButtonPrimary>
          </form>

          {/* ==== */}
          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            Go back for {` `}
            <NcLink to="/login">Sign in</NcLink>
            {` / `}
            <NcLink to="/signup">Sign up</NcLink>
          </span>
        </div>
      </LayoutPage>
    </div>
  );
};

export default PageForgotPass;
