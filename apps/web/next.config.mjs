import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**",
    ],
  },
};

export default nextConfig;
