/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@coachcore/shared'],
  serverExternalPackages: ['@node-rs/argon2', 'ws'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets-bucket.deadlock-api.com' },
      { protocol: 'https', hostname: 'avatars.steamstatic.com' },
      { protocol: 'https', hostname: 'avatars.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'statlocker.gg' },
    ],
  },
};

module.exports = nextConfig;
