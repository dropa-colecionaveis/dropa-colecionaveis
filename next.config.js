/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Fix for WSL/Windows path issues
    esmExternals: 'loose',
    // Disable instrumentation that can cause EPERM errors
    instrumentationHook: false,
  },
  webpack: (config, { isServer, dev }) => {
    // Fix for Windows/WSL path issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Fix module resolution issues in WSL
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };

      // Disable cache in development to prevent EPERM errors
      config.cache = false;
    }

    // Disable webpack persistent cache to prevent permission issues
    config.cache = false;
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif']
  }
};

module.exports = nextConfig;
