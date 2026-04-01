import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["fluent-ffmpeg"],
  experimental: {
    proxyClientMaxBodySize: "600mb",
  },
};

export default nextConfig;
