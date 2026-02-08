import React, { useEffect, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";
import RolesGuard from "./RolesGuard";

const AuthGuard = ({
  children,
  role,
}: {
  children: ReactNode;
  role?: string | string[];
}) => {
  const { isLoggedIn } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (role && !RolesGuard({ role })) {
    return <Navigate to="/404" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthGuard;
