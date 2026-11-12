import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./src/app/fonts/**"],
  },
  async redirects() {
    return [{ source: "/how-it-works", destination: "/docs", permanent: true }];
  },
};

export default nextConfig;
