import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendFromEnv = env.VITE_BACKEND_ORIGIN
    ? normalizeUrl(env.VITE_BACKEND_ORIGIN)
    : null;

  const derivedFromApiUrl = env.VITE_API_URL
    ? normalizeUrl(env.VITE_API_URL).replace(/\/api$/, "")
    : null;

  const backendTarget =
    backendFromEnv ?? derivedFromApiUrl ?? "http://localhost:8000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
