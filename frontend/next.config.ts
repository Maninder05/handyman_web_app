/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "7000",         // your backend port
        pathname: "/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;
