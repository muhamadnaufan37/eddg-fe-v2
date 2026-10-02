import axios from "axios";
import { getLocalStorage } from "./localStorageService";

// Use proxy in development to avoid CORS, direct API URL in production
const baseURL = import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API;
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

export const axiosServices = () => {
  const Axios = axios.create({
    baseURL: baseURL,
    headers: {
      // "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Set the AUTH token for any request
  Axios.interceptors.request.use(function (config) {
    const userToken = getLocalStorage("userData")?.token;
    config.headers.Authorization = userToken ? `Bearer ${userToken}` : "";
    return config;
  });

  Axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const isLoginRequest = error.config?.url?.includes("/api/v1/login");

      if (
        error.response?.status === 401 &&
        !isLoginRequest &&
        getLocalStorage("userData")?.token
      ) {
        const message =
          error.response?.data?.message || null;
        window.dispatchEvent(
          new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { message } }),
        );
      }

      return Promise.reject(error);
    },
  );

  return Axios;
};
