import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true }, // ← ligne unique pour ignorer ESLint au build
  // ... autres options éventuelles
}
const nextConfig: NextConfig = {
  /* config options here */
    serverExternalPackages: [
      "ffmpeg-static",
      "ffprobe-static",
      "fluent-ffmpeg",
    ],
  },
};

export default nextConfig;
