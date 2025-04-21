/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['../../../../src/ai-sdk'],
  webpack: (config) => {
    // Allow importing TypeScript files from outside the Next.js project
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  }
}

module.exports = nextConfig