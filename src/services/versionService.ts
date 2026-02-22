import { axiosServices } from "./axios";

export interface VersionInfo {
  frontend: string;
  backend?: string;
  buildDate?: string;
}

// Get frontend version from package.json
export const getFrontendVersion = (): string => {
  return "2.0.0"; // This will be replaced during build
};

// Get backend version from API
export const getBackendVersion = async (): Promise<string | null> => {
  try {
    const response = await axiosServices().get("/api/v1/version");
    return response.data?.version || response.data?.data?.version || null;
  } catch (error) {
    console.warn("Failed to fetch backend version:", error);
    return null;
  }
};

// Get combined version info
export const getVersionInfo = async (): Promise<VersionInfo> => {
  const frontend = getFrontendVersion();
  const backend = await getBackendVersion();

  return {
    frontend,
    backend: backend || undefined,
    buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  };
};
