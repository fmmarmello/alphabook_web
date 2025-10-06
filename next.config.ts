import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during builds for deployment
    ignoreDuringBuilds: true,
  },
  // Configure for Netlify deployment
  images: {
    unoptimized: true,
  },
  // Ensure API routes work correctly
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
