import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [
    {
      name: "exclude-local-observatory",
      apply: "build",
      enforce: "pre",
      transform(_, id) {
        // Strip the preview entry before Vite expands its glob and emits local images.
        if (id.endsWith("/src/dev/observatoryPreview.ts")) {
          return "export const loadObservatoryPreview = undefined;";
        }
      },
    },
    react(),
  ],
});
