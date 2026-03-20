/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  telemetry: false,
  
  // Disable Turbopack for production builds (use webpack)
  experimental: {
    turbo: false,
  },
  
  // Ensure path aliases work in production
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
}

export default nextConfig;