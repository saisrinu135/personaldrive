/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // telemetry is not a valid Next.js config key — removed
  // Next.js 16 uses Turbopack by default; @/* alias is handled by tsconfig.json paths
  turbopack: {},
}

export default nextConfig;
