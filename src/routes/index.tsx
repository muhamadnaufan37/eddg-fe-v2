import React, {
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { Route, Routes } from "react-router-dom";

import Layout from "../layout";
import Loader from "@/components/loader";
import GuestGuard from "@/auth/GuestGuard";
import AuthGuard from "@/auth/AuthGuard";

type TRoute = {
  exact?: boolean;
  guard?: ComponentType<{
    children: React.ReactNode;
    role?: string | string[];
  }>;
  layout?: ComponentType<{ children: React.ReactNode; fullScreen?: boolean }>;
  path: string;
  element: LazyExoticComponent<ComponentType<any>>;
  role?: string | string[];
  routes?: TRoute[];
  fullScreen?: boolean;
};

export const routes: TRoute[] = [
  {
    exact: true,
    guard: GuestGuard,
    path: "/login",
    role: "all",
    element: React.lazy(() => import("../pages/login")),
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/beranda")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/sensus")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/create",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/sensus/modal/CreateSensus")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/detail",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/sensus/modal/DetailSensus")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/update",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/sensus/modal/UpdateSensus")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/presensi",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/sensus/modal/PresensiDashboard"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/users",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/users")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/users/update",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/users/modal/UpdateUsers")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/users/create",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/users/modal/CreateUsers")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/users/detail",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/users/modal/DetailUsers")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/logs",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/logs")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/logs/:id",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/logs/detail")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/laporan-bulanan",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/laporan-bulanan")),
    fullScreen: false,
  },

  //Path 404
  {
    layout: Layout,
    guard: AuthGuard,
    path: "*",
    role: "all",
    element: React.lazy(() => import("../pages/error/404")),
  },
];

const renderRoutes = (routes: TRoute[] = []) => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {routes.map((route, i) => {
          const Guard = route.guard || React.Fragment;
          const LayoutComponent = route.layout || React.Fragment;
          const Element = route.element;
          const layoutProps = route.fullScreen ? { fullScreen: true } : {};

          return (
            <Route
              key={i}
              path={route.path}
              element={
                <Guard role={route.role}>
                  <LayoutComponent {...layoutProps}>
                    {route.routes ? renderRoutes(route.routes) : <Element />}
                    {/* <Toaster /> */}
                  </LayoutComponent>
                </Guard>
              }
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

export default renderRoutes;
