import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      "@contract": path.resolve(__dirname, "../src"),
    },
  },
  server: {
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
