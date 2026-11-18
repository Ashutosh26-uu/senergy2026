import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from /senergy2026/. Bundles go to /static so they never mix with public/assets.
export default defineConfig({
  base: "/senergy2026/",
  plugins: [react()],
  build: {
    assetsDir: "static",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // React loads with the page; three.js and the R3F stack load only with the lazy 3D stage
        manualChunks(id) {
          if (id.includes("preload-helper") || id.includes("commonjsHelpers")) return "react"; // tiny helpers the entry needs
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return "three";
          return "r3f";
        },
      },
    },
  },
  server: { port: 5173 },
});
