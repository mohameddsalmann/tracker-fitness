import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { apiDevPlugin } from "./plugins/vite-api-dev";

export default defineConfig({
  vite: {
    plugins: [apiDevPlugin()],
  },
});
