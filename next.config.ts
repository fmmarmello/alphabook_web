import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Block production builds on ESLint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
