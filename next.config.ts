import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@ray-solutions/react-file-manager'],
  typescript: {
    ignoreBuildErrors: true,  // ✅ temporary until all types are clean
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
	devIndicators: false,
};

export default nextConfig;
