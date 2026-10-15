import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolusi alias "@/*" langsung dari tsconfig (tanpa plugin tambahan).
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
