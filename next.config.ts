import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
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
