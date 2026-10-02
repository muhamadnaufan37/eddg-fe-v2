import axios, { type AxiosRequestConfig } from "axios";
import { getLocalStorage, setLocalStorage } from "./localStorageService";

// Use proxy in development to avoid CORS, direct API URL in production
const baseURL = import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API;
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
      return;
    }

    prom.resolve(token);
  });

  failedQueue = [];
};

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshClient = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      Accept: "application/json",
    },
  });

  const response = await refreshClient.post("/api/v1/refresh-token");
  const token = response?.data?.data?.token ?? null;

  if (!token) {
    return null;
  }

  setAccessToken(token);

  const stored = getLocalStorage("userData") || {};
  const refreshedUser = response?.data?.data?.user;
  const user =
    refreshedUser && stored.user
      ? { ...stored.user, ...refreshedUser }
      : refreshedUser ?? stored.user ?? null;
  const expiresAt = response?.data?.data?.expires_at ?? stored.expires_at ?? null;

  setLocalStorage("userData", {
    ...stored,
    ...(user ? { user } : {}),
    ...(expiresAt ? { expires_at: expiresAt } : {}),
  });

  return token;
};

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = getAccessToken();
  const requestHeaders = (config.headers ?? {}) as Record<string, string>;

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  } else {
    delete requestHeaders.Authorization;
  }

  config.headers = requestHeaders;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isLoginRequest = originalRequest?.url?.includes("/api/v1/login");
    const isRefreshRequest = originalRequest?.url?.includes("/api/v1/refresh-token");
    const isLogoutRequest = originalRequest?.url?.includes("/api/v1/logout");

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !isRefreshRequest &&
      !isLogoutRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (!token) {
              return Promise.reject(new Error("Failed to refresh token"));
            }

            const requestHeaders = (originalRequest.headers ?? {}) as Record<string, string>;
            requestHeaders.Authorization = `Bearer ${token}`;
            originalRequest.headers = requestHeaders;

            return api(originalRequest);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await refreshAccessToken();

        if (!token) {
          throw new Error("Refresh token gagal");
        }

        processQueue(null, token);

        const requestHeaders = (originalRequest.headers ?? {}) as Record<string, string>;
        requestHeaders.Authorization = `Bearer ${token}`;
        originalRequest.headers = requestHeaders;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        const message = error.response?.data?.message || "Sesi Anda telah berakhir";
        window.dispatchEvent(
          new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { message } }),
        );

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !isRefreshRequest &&
      !isLogoutRequest &&
      getAccessToken()
    ) {
      const message = error.response?.data?.message || null;
      window.dispatchEvent(
        new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { message } }),
      );
    }

    return Promise.reject(error);
  },
);

export const axiosServices = () => api;
