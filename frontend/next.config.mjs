import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Map @/ to the FRONTEND root so @/lib/* and @/components/* resolve
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd())
    };
    return config;
  },
  experimental: { serverActions: { allowedOrigins: ["*"] } }
};

export default nextConfig;
