import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Block production builds on ESLint errors
    ignoreDuringBuilds: false,
  },
  // Configure for Netlify deployment
  images: {
    unoptimized: true,
  },
  // Ensure API routes work correctly
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
