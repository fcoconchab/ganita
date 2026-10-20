import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base relativa: funciona en GitHub Pages (/ganita/) y en local.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
