import LayoutPage from "components/LayoutPage/LayoutPage";
import React, { ComponentType, FC } from "react";
import { Redirect, Route, Switch, useRouteMatch } from "react-router";
import { NavLink } from "react-router-dom";
import DashboardBillingAddress from "./DashboardBillingAddress";
import DashboardEditProfile from "./DashboardEditProfile";
import DashboardPosts from "./DashboardPosts";
import DashboardRoot from "./DashboardRoot";
import DashboardSubcription from "./DashboardSubcription";
import DashboardSubmitPost from "./DashboardSubmitPost";
import { Helmet } from "react-helmet";
import DashboardChangePassword from "./DashboardChangePassword";
import { useAuth } from "firebase/authManager";
import DashboardReviewPosts from "./DashboardReviewPosts";

export interface PageDashboardProps {
  className?: string;
}

interface DashboardLocationState {
  "/root"?: {};
  "/posts"?: {};
  "/review-posts"?: {};
  "/edit-profile"?: {};
  "/change-pass"?: {};
  "/subscription"?: {};
  "/billing-address"?: {};
  "/submit-post"?: {};
  "/account"?: {};
}

interface DashboardPage {
  sPath: keyof DashboardLocationState;
  exact?: boolean;
  component: ComponentType<Object>;
  emoij: string;
  pageName: string;
  isAuthorized: boolean;
}

const PageDashboard: FC<PageDashboardProps> = ({ className = "" }) => {
  let { path, url } = useRouteMatch();
  const { user, author } = useAuth();

  const loggedIn = user ? true : false;
  const canReviewPosts = author && (author.isModerator || author.isAdmin) ? true : false;

  const subPages: DashboardPage[] = [
    {
      sPath: "/root",
      exact: true,
      component: DashboardRoot,
      emoij: "🕹",
      pageName: "Dash board",
      isAuthorized: loggedIn
    },
    {
      sPath: "/submit-post",
      component: DashboardSubmitPost,
      emoij: "✍",
      pageName: "Submit post",
      isAuthorized: loggedIn
    },
    {
      sPath: "/posts",
      component: DashboardPosts,
      emoij: "📕",
      pageName: "Posts",
      isAuthorized: loggedIn
    },
    {
      sPath: "/edit-profile",
      component: DashboardEditProfile,
      emoij: "🛠",
      pageName: "Edit profile",
      isAuthorized: loggedIn
    },
    {
      sPath: "/change-pass",
      component: DashboardChangePassword,
      emoij: "🔑",
      pageName: "Change password",
      isAuthorized: loggedIn
    },
    /* {
      sPath: "/subscription",
      component: DashboardSubcription,
      emoij: "📃",
      pageName: "Subscription",
      isAuthorized: loggedIn
    },
    {
      sPath: "/billing-address",
      component: DashboardBillingAddress,
      emoij: "✈",
      pageName: "Billing address",
      isAuthorized: loggedIn
    }, */
    {
      sPath: "/review-posts",
      component: DashboardReviewPosts,
      emoij: "🔍",
      pageName: "Review posts",
      isAuthorized: loggedIn && canReviewPosts
    },
  ];

  const filteredPages = subPages.filter(p =>p.isAuthorized);

  return (
    <div className={`nc-PageDashboard ${className}`} data-nc-id="PageDashboard">
      <Helmet>
        <title>Dashboard || Blog Magazine React Template</title>
      </Helmet>
      <LayoutPage
        subHeading="View your dashboard, manage your Posts, Subscription, edit password and profile"
        headingEmoji="⚙"
        heading="Dash board"
      >
        <div className="flex flex-col space-y-8 xl:space-y-0 xl:flex-row">
          {/* SIDEBAR */}

          <div className="flex-shrink-0 max-w-xl xl:w-80 xl:pr-8">
            <ul className="text-base space-y-1 text-neutral-6000 dark:text-neutral-400">
              {filteredPages.map(({ sPath, pageName, emoij }, index) => {
                return (
                  <li key={index}>
                    <NavLink
                      className="flex px-6 py-2.5 font-medium rounded-lg hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      to={`${url}${sPath}`}
                      activeClassName="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    >
                      <span className="w-8 mr-1">{emoij}</span>
                      {pageName}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border border-neutral-100 dark:border-neutral-800 md:hidden"></div>
          <div className="flex-grow">
            <Switch>
              {filteredPages.map(({ component, sPath, exact }, index) => {
                return (
                  <Route
                    key={index}
                    exact={exact}
                    component={component}
                    path={!!sPath ? `${path}${sPath}` : path}
                  />
                );
              })}
              <Redirect to={path + "/root"} />
            </Switch>
          </div>
        </div>
      </LayoutPage>
    </div>
  );
};

export default PageDashboard;
