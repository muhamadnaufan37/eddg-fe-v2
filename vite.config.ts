import path from "path";
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const copyHtaccessPlugin = () => {
  let projectRoot = process.cwd();
  let buildOutput = resolve(projectRoot, "dist");

  return {
    name: "copy-root-htaccess",
    apply: "build" as const,
    configResolved(config: { root: string; build: { outDir: string } }) {
      projectRoot = config.root;
      buildOutput = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await copyFile(
        resolve(projectRoot, ".htaccess"),
        resolve(buildOutput, ".htaccess"),
      );
    },
  };
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_PUBLIC_REACT_APP_BASE_URL_API;

  console.log("🔧 [Vite Config] Mode:", mode);
  console.log("🔧 [Vite Config] API URL from .env:", apiUrl);

  return {
    plugins: [react(), tailwindcss(), copyHtaccessPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Better chunk splitting strategy
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
            ui: ["lucide-react", "sonner", "framer-motion"],
            forms: ["formik", "yup", "react-hook-form"],
            charts: ["recharts"],
          },
        },
      },
      // Prevent memory issues during build
      minify: "esbuild",
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
      ],
    },
    // Prevent ENOENT errors
    server: {
      fs: {
        strict: false,
      },
    },
  };
});
