export interface VersionInfo {
  frontend: string;
  backend?: string;
  buildDate?: string;
}

// Get frontend version from package.json
export const getFrontendVersion = (): string => {
  return "2.3.10"; // This will be replaced during build
};

// Get combined version info
export const getVersionInfo = async (): Promise<VersionInfo> => {
  const frontend = getFrontendVersion();

  return {
    frontend,
    buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  };
};
