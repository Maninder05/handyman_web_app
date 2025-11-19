
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "7000",
        pathname: "/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;

module.exports = nextConfig;