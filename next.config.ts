import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    localPatterns: [
      { pathname: "/assets/**" },
    ],
  },
};

export default nextConfig;
