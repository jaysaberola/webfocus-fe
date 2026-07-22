import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@ray-solutions/react-file-manager'],
  allowedDevOrigins: [
    "127.0.0.1",
    "127.0.0.1:3000",
    "localhost",
    "localhost:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "projects.wsiph2.com",
        pathname: "/webdirectory/cerebro/webfocusph/template/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,  // ✅ temporary until all types are clean
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
	devIndicators: false,
};

export default nextConfig;
