import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import Loader from "@/components/loader";
import { getRoleName } from "@/constants/roles";

const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, isInitialised, user } = useAuth();

  if (!isInitialised) {
    return <Loader />;
  }

  if (isLoggedIn) {
    const roleName = getRoleName(user?.role_id);
    const defaultPath =
      roleName === "koordinator-barokahiin" ? "/barokahiin-admin" : "/";
    return <Navigate to={defaultPath} replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default GuestGuard;
