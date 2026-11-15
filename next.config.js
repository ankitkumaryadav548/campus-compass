/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence workspace-root warning caused by parent package-lock.json
  outputFileTracingRoot: __dirname,
  // Allow images from external sources if needed later
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
