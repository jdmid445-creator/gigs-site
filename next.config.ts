import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the share-card images read these font files at runtime
  outputFileTracingIncludes: {
    "/**": ["./src/app/fonts/**"],
  },
};

export default nextConfig;
