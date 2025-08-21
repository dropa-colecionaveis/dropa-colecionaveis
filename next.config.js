/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  }
};

module.exports = nextConfig;
