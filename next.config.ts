import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static", "fluent-ffmpeg"],
};

export default nextConfig;
