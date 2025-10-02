import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Block production builds on ESLint errors
    ignoreDuringBuilds: false,
  },
  // Configure for Netlify Functions
  images: {
    unoptimized: true,
  },
  // Ensure API routes work correctly
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
