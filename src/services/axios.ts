import axios from "axios";
import { getLocalStorage } from "./localStorageService";

// Use proxy in development to avoid CORS, direct API URL in production
const baseURL = import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API;

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

  return Axios;
};
