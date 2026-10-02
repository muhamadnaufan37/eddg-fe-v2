import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";
import RolesGuard from "./RolesGuard";
import Loader from "@/components/loader";

const AuthGuard = ({
  children,
  role,
}: {
  children: ReactNode;
  role?: string | string[];
}) => {
  const { isLoggedIn, isInitialised } = useAuth();

  if (!isInitialised) {
    return <Loader />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role && !RolesGuard({ role })) {
    return <Navigate to="/404" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthGuard;
