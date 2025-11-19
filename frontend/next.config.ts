/** next.config.js */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '7000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '7000',
        pathname: '/uploads/**',
      }
    ],
  },
};

module.exports = {
  images: {
    domains: ["localhost"],
  },
};


module.exports = nextConfig;
