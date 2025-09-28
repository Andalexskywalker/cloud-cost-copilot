// next.config.mjs
const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://backend:8000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },
};
export default nextConfig;
