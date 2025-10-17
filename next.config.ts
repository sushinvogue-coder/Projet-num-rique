import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: [
      "ffmpeg-static",
      "ffprobe-static",
      "fluent-ffmpeg",
    ],
  },
};

export default nextConfig;
