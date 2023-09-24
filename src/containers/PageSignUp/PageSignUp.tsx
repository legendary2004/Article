import { FC, FormEvent, useState } from "react";
import LayoutPage from "components/LayoutPage/LayoutPage";
import Input from "components/Input/Input";
import ButtonPrimary from "components/Button/ButtonPrimary";
import NcLink from "components/NcLink/NcLink";
import { Helmet } from "react-helmet";
import { useAuth } from "firebase/authManager";
import swal from "sweetalert";
import handleError from "utils/firebaseErrorHandler";
import { useHistory } from "react-router-dom";

export interface PageSignUpProps {
  className?: string;
}

const initFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: ""
};

const PageSignUp: FC<PageSignUpProps> = ({ className = "" }) => {

  const [formData, setFormData] = useState(initFormData);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { signUp } = useAuth();

  function handleChange(event: FormEvent<HTMLInputElement>) {
    setFormData({ ...formData, [event.currentTarget.name]: event.currentTarget.value })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      const user = await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
      setLoading(false);
      history.push("/");
      swal("Success!", `Welcome ${user?.user?.displayName?.replace("|", " ") || ""}. Please check your Inbox for instructions how to verify your email address.`, "success");

    } catch (error: any) {
      setLoading(false);
      handleError(error);
    }
  }

  return (
    <div className={`nc-PageSignUp ${className}`} data-nc-id="PageSignUp">
      <Helmet>
        <title>Sign up || Blog Magazine React Template</title>
      </Helmet>
      <LayoutPage
        subHeading="Welcome to our blog magazine Community"
        headingEmoji="🎉"
        heading="Sign up"
      >
        <div className="max-w-md mx-auto space-y-6">
          {/*
          <div className="grid gap-3">
            {loginSocials.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="nc-will-change-transform flex w-full rounded-lg bg-primary-50 dark:bg-neutral-800 px-4 py-3 transform transition-transform sm:px-6 hover:translate-y-[-2px]"
              >
                <img
                  className="flex-shrink-0"
                  src={item.icon}
                  alt={item.name}
                />
                <h3 className="flex-grow text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {item.name}
                </h3>
              </a>
            ))}
          </div>

          <div className="relative text-center">
            <span className="relative z-10 inline-block px-4 font-medium text-sm bg-white dark:text-neutral-400 dark:bg-neutral-900">
              OR
            </span>
            <div className="absolute left-0 w-full top-1/2 transform -translate-y-1/2 border border-neutral-100 dark:border-neutral-800"></div>
          </div>
          {/* FORM */}
          <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">
                  First name
                </span>
                <Input required name="firstName" className="mt-1" onChange={handleChange} />
              </label>
              <label className="block">
                <span className="text-neutral-800 dark:text-neutral-200">
                  Last name
                </span>
                <Input required name="lastName" className="mt-1" onChange={handleChange} />
              </label>
            </div>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                Email address
              </span>
              <Input required name="email" type="email" placeholder="example@example.com" className="mt-1" onChange={handleChange} />
            </label>
            <label className="block">
              <span className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                Password
              </span>
              <Input required name="password" type="password" className="mt-1" onChange={handleChange} />
            </label>
            <ButtonPrimary loading={loading} type="submit">Continue</ButtonPrimary>
          </form>

          {/* ==== */}
          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            Already have an account? {` `}
            <NcLink to="/login">Sign in</NcLink>
          </span>
        </div>
      </LayoutPage>
    </div>
  );
};

export default PageSignUp;
