import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import { apiDevPlugin } from "./plugins/vite-api-dev";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    prerender: {
      enabled: false,
    },
  },
  plugins: [
    nitro({
      preset: "vercel",
      externals: {
        inline: ["@prisma/client", /\.prisma\/client/],
      },
    }),
  ],
  vite: {
    plugins: [apiDevPlugin()],
  },
});
