import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    qualities: [75, 82, 84, 85, 86],
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1920],
    imageSizes: [64, 80, 96, 128, 160, 192, 256, 320, 384, 640],
    localPatterns: [
      {
        pathname: "/api/placeholder/**",
        search: "?kind=landscape",
      },
      {
        pathname: "/api/placeholder/**",
        search: "?kind=portrait",
      },
      {
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "zhujinju.com",
          },
        ],
        destination: "https://www.zhujinju.com/:path*",
        permanent: true,
        basePath: false,
      },
    ];
  },
  outputFileTracingExcludes: {
    "/api/admin/sync-status": ["./public/uploads/**/*"],
    "/api/admin/upload": ["./public/uploads/**/*"],
  },
};

export default nextConfig;
