import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import Loader from "@/components/loader";

const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, isInitialised } = useAuth();

  if (!isInitialised) {
    return <Loader />;
  }

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default GuestGuard;
