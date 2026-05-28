import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiPort = env.SERVER_PORT || env.API_PORT || "5000"

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-router-dom")) return "router";
            if (id.includes("react-dom")) return "react";
            if (id.includes("react")) return "react";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("framer-motion")) return "motion";
            return "vendor";
          },
        },
      },
    },
    server: {
      port: Number(env.PORT || env.VITE_PORT || 5173),
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
