import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { importHistoryPlugin } from "./vite-plugin-import-history";

export default defineConfig({
  plugins: [
    importHistoryPlugin(),
    react(),
  ],

  // base './' garantit des chemins relatifs dans dist/index.html
  // indispensable pour que Electron charge les assets via file://
  base: "./",

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
  },
});
