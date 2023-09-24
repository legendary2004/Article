import LayoutPage from "components/LayoutPage/LayoutPage";
import { FC, FormEvent, useState } from "react";
import facebookSvg from "images/Facebook.svg";
import twitterSvg from "images/Twitter.svg";
import googleSvg from "images/Google.svg";
import Input from "components/Input/Input";
import ButtonPrimary from "components/Button/ButtonPrimary";
import NcLink from "components/NcLink/NcLink";
import { Helmet } from "react-helmet";
import { useHistory } from "react-router-dom";
import swal from "sweetalert";
import handleError from "utils/firebaseErrorHandler";
import { useTranslation } from "react-i18next";
import { useAuth } from "firebase/authManager";

export interface PageLoginProps {
  className?: string;
}

const loginSocials = [
  {
    name: "Continue with Facebook",
    href: "#",
    icon: facebookSvg,
  },
  {
    name: "Continue with Twitter",
    href: "#",
    icon: twitterSvg,
  },
  {
    name: "Continue with Google",
    href: "#",
    icon: googleSvg,
  },
];

const PageLogin: FC<PageLoginProps> = ({ className = "" }) => {

  const [t] = useTranslation();
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      const user = await signIn(email, password);
      setLoading(false);
      history.push("/");
      swal(`${'Welcome'} ${user?.user?.displayName?.replace("|", " ") || ""}!`, "", "success");

    } catch (error: any) {
      setLoading(false);
      handleError(error);
    }
  }

  function handleChange(event: FormEvent<HTMLInputElement>) {
    const element = event.currentTarget;
    if (element.name === "email") {
      setEmail(element.value);
    }
    else if (element.name === "password") {
      setPassword(element.value);
    }
  }

  return (
    <div className={`nc-PageLogin ${className}`} data-nc-id="PageLogin">
      <Helmet>
        <title>Login || Blog Magazine React Template</title>
      </Helmet>
      <LayoutPage
        subHeading="Welcome to our blog magazine Community"
        headingEmoji="🔑"
        heading="Login"
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
          */}
          <form className="grid grid-cols-1 gap-6" method="POST" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-neutral-800 dark:text-neutral-200">
                Email address
              </span>
              <Input required type="email" name="email" placeholder="example@example.com" className="mt-1" onChange={handleChange} />
            </label>
            <label className="block">
              <span className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                Password
                <NcLink to="/forgot-pass" className="text-sm">
                  Forgot password?
                </NcLink>
              </span>
              <Input required type="password" name="password" className="mt-1" onChange={handleChange} />
            </label>
            <ButtonPrimary loading={loading} type="submit">{t("continue")}</ButtonPrimary>
          </form>

          {/* ==== */}
          <span className="block text-center text-neutral-700 dark:text-neutral-300">
            New user? {` `}
            <NcLink to="/signup">{t("create_account")}</NcLink>
          </span>
        </div>
      </LayoutPage>
    </div>
  );
};

export default PageLogin;
