import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // base './' garantit des chemins relatifs dans dist/index.html
  // indispensable pour que Electron charge les assets via file://
  base: "./",

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    // electron-dist contient les copies compilées (CommonJS) des tests
    exclude: ["**/node_modules/**", "**/dist/**", "**/electron-dist/**", "**/.smoke-build/**"],
  },
});
