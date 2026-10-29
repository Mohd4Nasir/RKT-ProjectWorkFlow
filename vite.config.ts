import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({

  server: {
    host: "0.0.0.0",
     port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    // Pre-bundle deps that are imported lazily, so Vite doesn't re-optimize
    // (and force a full page reload) the first time a route that uses them loads.
    include: ["@radix-ui/react-alert-dialog"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
