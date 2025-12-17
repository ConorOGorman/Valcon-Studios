/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Prevent dev-time cross-origin chunk warnings/errors when accessing the dev server via
  // `127.0.0.1` or `localhost`.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

module.exports = nextConfig;
