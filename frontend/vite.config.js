// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        // log all proxy requests to verify
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("🔁 Proxying:", req.url);
          });
          proxy.on("error", (err, req, res) => {
            console.error("❌ Proxy error:", err);
          });
        },
      },
    },
  },
});
