import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    qualities: [75, 82, 84, 85, 86],
    // Retina portrait tablets need about 1640–1720 physical pixels. Avoid
    // jumping straight to 1920 while keeping a full-resolution photograph.
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1728, 1920],
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
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
