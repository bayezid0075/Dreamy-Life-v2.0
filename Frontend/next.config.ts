import type { NextConfig } from "next";

/**
 * Target for Next.js rewrites (server-side only). In Docker this must be reachable
 * from the frontend container (e.g. http://backend:8888). Browsers call /api/* on
 * the same origin; Next proxies to this URL.
 */
const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8888";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const base = backendInternalUrl.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
