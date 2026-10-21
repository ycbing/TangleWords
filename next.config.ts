import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/tangle",
  trailingSlash: true,
  cacheComponents: false,
  partialPrefetching: false,
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