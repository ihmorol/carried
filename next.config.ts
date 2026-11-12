import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the review server from replacing the running application's build cache.
  ...(process.env.CARRIED_DESIGN_PREVIEW === "1" ? { distDir: ".next-design-preview" } : {}),
  // The satori OG routes read these TTFs from disk at runtime;
  // make sure the bundler keeps them.
  outputFileTracingIncludes: {
    "/l/**": ["./public/fonts/**/*.ttf"],
    "/b/**": ["./public/fonts/**/*.ttf"],
    "/": ["./public/fonts/**/*.ttf"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
