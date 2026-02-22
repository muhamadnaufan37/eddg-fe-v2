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
    element: React.lazy(() => import("../pages/digital-data/sensus")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/create",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/digital-data/sensus/modal/CreateSensus"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/detail",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/digital-data/sensus/modal/DetailSensus"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/update",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/digital-data/sensus/modal/UpdateSensus"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/sensus/presensi",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/digital-data/sensus/modal/PresensiDashboard"),
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
    path: "/auth/roles",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/roles")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/roles/update",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/roles/modal/UpdateRoles")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/roles/create",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/roles/modal/CreateRoles")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/roles/detail",
    role: ["admin"],
    element: React.lazy(() => import("../pages/auth/roles/modal/DetailRoles")),
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
    element: React.lazy(() => import("../pages/digital-data/laporan-bulanan")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/laporan-bulanan/check",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/digital-data/monitoring-laporan"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/laporan-bulanan/warnings",
    role: ["admin"],
    element: React.lazy(
      () => import("../pages/digital-data/laporan-bulanan/warnings"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/pekerjaan",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/master-data/pekerjaan")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/pekerjaan/create",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/pekerjaan/modal/CreatePekerjaan"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/pekerjaan/detail",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/pekerjaan/modal/DetailPekerjaan"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/pekerjaan/update",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/pekerjaan/modal/UpdatePekerjaan"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/daerah",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/daerah"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/daerah/create",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/daerah/modal/Create"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/daerah/detail",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/daerah/modal/Detail"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/daerah/update",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/daerah/modal/Update"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/desa",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/desa"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/desa/create",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/desa/modal/Create"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/desa/detail",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/desa/modal/Detail"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/desa/update",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/desa/modal/Update"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/kelompok",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/kelompok"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/kelompok/create",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/kelompok/modal/Create"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/kelompok/detail",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/kelompok/modal/Detail"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/tempat-sambung/kelompok/update",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(
      () => import("../pages/master-data/tempat-sambung/kelompok/modal/Update"),
    ),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/master-data/pindah-sambung",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/master-data/pindah-sambung")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/profile",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/auth/profile")),
    fullScreen: false,
  },
  {
    exact: true,
    layout: Layout,
    guard: AuthGuard,
    path: "/auth/change-password",
    role: ["admin", "ptgs-sensus"],
    element: React.lazy(() => import("../pages/auth/profile/change-password")),
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
