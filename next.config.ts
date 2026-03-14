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
};

export default nextConfig;
