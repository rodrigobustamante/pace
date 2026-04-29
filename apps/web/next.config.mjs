import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default withNextIntl(withVanillaExtract(nextConfig));
