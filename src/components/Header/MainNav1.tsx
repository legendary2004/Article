import React, { FC, useEffect, useState } from "react";
import Logo from "components/Logo/Logo";
import Navigation from "components/Navigation/Navigation";
import SearchDropdown from "./SearchDropdown";
import ButtonPrimary from "components/Button/ButtonPrimary";
import MenuBar from "components/MenuBar/MenuBar";
import DarkModeContainer from "containers/DarkModeContainer/DarkModeContainer";
import NavigationItem, { NavItemType } from "components/Navigation/NavigationItem";
import ncNanoId from "utils/ncNanoId";
import { useAuth } from "firebase/authManager";

export interface MainNav1Props {
  isTop: boolean;
}

const MainNav1: FC<MainNav1Props> = ({ isTop }) => {

  const { author, auth } = useAuth();

  const userDropdown: NavItemType = {
    id: ncNanoId(),
    href: "#",
    name: author?.displayName || "",
    type: "dropdown",
    children: [
      {
        id: ncNanoId(),
        href: "/dashboard/root",
        name: "Dash board"
      },
      {
        id: ncNanoId(),
        href: "/dashboard/posts",
        name: "My articles"
      },
      {
        id: ncNanoId(),
        href: "/dashboard/submit-post",
        name: "New article"
      },
      {
        id: ncNanoId(),
        href: "/dashboard/edit-profile",
        name: "Profile"
      },
      {
        id: ncNanoId(),
        href: "/dashboard/change-pass",
        name: "Change password"
      },
      {
        id: ncNanoId(),
        href: "#",
        name: "Sign out",
        onClick: (e) => {
          e.preventDefault();
          auth.signOut();
        }
      }
    ]
  };

  return (
    <div
      className={`nc-MainNav1 relative z-10 ${isTop ? "onTop " : "notOnTop backdrop-filter"
        }`}
    >
      <div className="container py-5 relative flex justify-between items-center space-x-4 xl:space-x-8">
        <div className="flex justify-start flex-grow items-center space-x-4 sm:space-x-10 2xl:space-x-14">
          <Logo />
          <Navigation />
        </div>
        <div className="flex-shrink-0 flex items-center justify-end text-neutral-700 dark:text-neutral-100 space-x-1">
          <div className="hidden items-center xl:flex space-x-1">
            <DarkModeContainer />
            <SearchDropdown />
            <div className="px-1" />
            {
              author
                ? <ul><NavigationItem menuItem={userDropdown} key={ncNanoId()} /></ul>
                : <ButtonPrimary href="/login">Sign up</ButtonPrimary>
            }
          </div>
          <div className="flex items-center xl:hidden">
            {
              author != null
                ? <ul><NavigationItem menuItem={userDropdown} key={ncNanoId()} /></ul>
                : <ButtonPrimary href="/login">Sign up</ButtonPrimary>
            }
            <div className="px-1" />
            <MenuBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNav1;
