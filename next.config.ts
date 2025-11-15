import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://secure.gravatar.com https://ui-avatars.com;
      media-src 'self' blob: data:;
      font-src 'self';
      connect-src 'self'
        ${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}
        ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^http/, "wss") || ""};
      object-src 'none';
      base-uri 'self';
      frame-ancestors 'none';
      form-action 'self';
    `.replace(/\s{2,}/g, " ").trim(),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    reactCompiler: { compilationMode: "annotation" }, // عطّله لو مش محتاجه
  },
  eslint: {
    // لدينا خطوة lint منفصلة، لذلك لا نريد أن يُسقِط build بسبب ESLint
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["node-unrar-js"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // ✅ Google OAuth avatars
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // ✅ GitHub avatars
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com", // ✅ Gravatar
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // ✅ UI Avatars service
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/:locale/api/:path*",
        destination: "/api/:path*",
      },
    ];
  },
};

export default withNextIntl(config);
