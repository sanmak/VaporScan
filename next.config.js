

const withBundleAnalyzer = (() => {
  try {
    return require('@next/bundle-analyzer')({
      enabled: process.env.ANALYZE === 'true',
    });
  } catch (e) {
    /** @type {(config: import('next').NextConfig) => import('next').NextConfig} */
    return (config) => config;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  pageExtensions: ['ts', 'tsx'],
  output: 'export',

  images: {
    unoptimized: true,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  turbopack: {},

  /**
   * @param {any} config
   * @param {{ isServer: boolean }} context
   * @returns {any}
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /node_modules/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|recharts|reactflow)/,
          name: 'ui',
          priority: 20,
          reuseExistingChunk: true,
        },
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
