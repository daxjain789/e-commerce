/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next start` is unsupported with standalone output, so only emit the
  // self-contained server bundle when building the Docker image
  // (the Dockerfile sets BUILD_STANDALONE=1).
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
};

export default nextConfig;
