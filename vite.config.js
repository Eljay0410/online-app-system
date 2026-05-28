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

    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },

    build: {
      chunkSizeWarningLimit: 1000,
    },
  }
})