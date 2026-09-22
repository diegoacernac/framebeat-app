import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF primero (más liviano), WebP para navegadores sin soporte
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
};

export default nextConfig;
