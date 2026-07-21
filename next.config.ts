import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@ray-solutions/react-file-manager'],
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
