import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Each response is scoped to one tenant, so Cache Components stay off.
  serverExternalPackages: ["xlsx"],
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
