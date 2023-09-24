import React from "react";
import NcLink from "components/NcLink/NcLink";
import { useAuth } from "firebase/authManager";

const DashboardRoot = () => {
  const { auth, author } = useAuth();

  return (
    <div className="rounded-xl min-h-full text-sm border border-neutral-100 dark:border-neutral-800 p-6 md:text-base">
      <span className="block text-lg mb-3">
        👋 Hello <strong>{author?.displayName}</strong>, (not <strong>{author?.displayName}</strong>?{" "}
        <NcLink onClick={async () => await auth.signOut()} to="#">Sign out</NcLink>)
      </span>
      From your account dashboard you can view your dashboard, manage your
      {` `}
      <NcLink to="/dashboard/posts">Posts</NcLink>, {/* <NcLink to="#">Subscription</NcLink>, */}
      <NcLink to="/dashboard/change-pass">change your password</NcLink> and <NcLink to="/dashboard/edit-profile">edit your profile</NcLink>. 
    </div>
  );
};

export default DashboardRoot;
