/** Static export: the web app runs without a server (demo mode) or talks to the API when NEXT_PUBLIC_API_URL is set. */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_BASE_PATH || '',
  transpilePackages: ['@apexora/shared'],
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH || '' },
};
export default nextConfig;
