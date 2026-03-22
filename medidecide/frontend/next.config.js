/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow reading NEXT_PUBLIC_ env vars at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  },
};

module.exports = nextConfig;
