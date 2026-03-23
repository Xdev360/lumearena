/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return []
  },
  images: {
    domains: ['lh3.googleusercontent.com']
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
