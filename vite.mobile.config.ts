// Mobile (Capacitor) build ONLY.
// Plain Vite SPA — no TanStack Start, no nitro, no SSR. Emits fully static
// HTML/JS/CSS into dist/mobile so the APK/AAB bundles everything locally and
// never loads the Lovable-hosted site. The web build keeps using vite.config.ts.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./mobile", import.meta.url)),
  // Relative asset URLs are required inside the WebView.
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  build: {
    outDir: fileURLToPath(new URL("./dist/mobile", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
  },
});
