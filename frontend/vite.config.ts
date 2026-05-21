/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core libraries
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "react-vendor";
          }
          // UI libraries
          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/lucide-react")
          ) {
            return "ui-vendor";
          }
          // State management
          if (
            id.includes("node_modules/@reduxjs") ||
            id.includes("node_modules/react-redux") ||
            id.includes("node_modules/@tanstack")
          ) {
            return "state-vendor";
          }
          // i18n libraries
          if (
            id.includes("node_modules/i18next") ||
            id.includes("node_modules/react-i18next")
          ) {
            return "i18n-vendor";
          }
          // Animation library
          if (id.includes("node_modules/gsap")) {
            return "animation";
          }
          // Utilities
          if (
            id.includes("node_modules/axios") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge")
          ) {
            return "utils";
          }
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional, remove if not needed)
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
