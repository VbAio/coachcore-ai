/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@coachcore/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets-bucket.deadlock-api.com' },
      { protocol: 'https', hostname: 'avatars.steamstatic.com' },
      { protocol: 'https', hostname: 'avatars.akamai.steamstatic.com' },
    ],
  },
};

module.exports = nextConfig;
