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
};

export default nextConfig;
