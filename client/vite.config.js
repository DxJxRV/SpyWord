import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  base: "/", // asegúrate de servir desde raíz del dominio
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
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
      manifest: false, // usamos el manifest del /public
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/"),
            handler: "NetworkFirst",
            options: { cacheName: "pages" },
          },
        ],
      },
    }),
  ],
});
