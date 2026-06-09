import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'http://127.0.0.1:81',
    'http://localhost:81',
    'http://21.0.14.1:3000',
    'http://127.0.0.1',
    'http://localhost',
    'http://21.0.14.1:81',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ],
};

export default nextConfig;
