/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  outputFileTracingIncludes: {
    "/**": ["./.prisma/client/**"],
  },
};

export default nextConfig;
