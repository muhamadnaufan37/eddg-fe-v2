import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) {
    return <Navigate to="/" />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default GuestGuard;
