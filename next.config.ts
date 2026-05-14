import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.hok.com" },
      { protocol: "https", hostname: "miro.medium.com" },
      { protocol: "https", hostname: "blog.novatr.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Prevent Node.js-only packages from being bundled for the browser.
  // mariadb and its dependencies use Node.js built-ins (net, tls, crypto, etc.)
  // and must never appear in the client bundle.
  serverExternalPackages: [
    "mariadb",
    "bcryptjs",
    "geoip-lite",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
