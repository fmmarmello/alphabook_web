import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during builds for faster compilation
    ignoreDuringBuilds: true,
  },
  turbopack: {
    // Enable Turbopack for faster builds (experimental)
    root : './',
  },
  // Configure for Netlify deployment
  images: {
    unoptimized: true,
  },
  // Ensure API routes work correctly
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
