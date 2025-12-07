import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack config (Next.js 16 usa Turbopack por padrão)
  turbopack: {},
};

export default nextConfig;
