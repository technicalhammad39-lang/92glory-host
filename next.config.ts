import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  async headers() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '.*text/html.*'
          }
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
