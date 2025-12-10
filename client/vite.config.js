import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-192.png",
        "icons/maskable-512.png"
      ],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        
        // ==========================================================
        // 🛠️ CORRECCIÓN CRÍTICA: EXCLUIR RUTAS DEL BACKEND DEL SERVICE WORKER
        // ==========================================================
        navigateFallbackDenylist: [
            /^\/auth/,     // Ignora rutas de autenticación
            /^\/api/,      // Ignora llamadas a la API
            /^\/webhook/   // Ignora el webhook
        ],
        
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/"),
            handler: "NetworkFirst",
            options: { cacheName: "pages" }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VITE_SERVER_PORT || 3003}`,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        cookiePathRewrite: '/'
      },
      '/auth': {
        target: `http://localhost:${process.env.VITE_SERVER_PORT || 3003}`,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        cookiePathRewrite: '/'
      },
      '/webhook': {
        target: `http://localhost:${process.env.VITE_SERVER_PORT || 3003}`,
        changeOrigin: true,
        secure: false
      }
    }
  }
});