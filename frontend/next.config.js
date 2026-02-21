const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /*
   * Explicit webpack alias — the DEFINITIVE fix for "@/" resolution.
   *
   * jsconfig.json paths work for editor intellisense but are NOT
   * guaranteed to be picked up by all Next.js 14.2.x patch versions
   * when the project is manually scaffolded.  Adding the alias
   * directly in webpack config ensures the bundler ALWAYS resolves
   * "@/components/X" → "<project_root>/components/X" regardless of
   * Next.js version quirks.
   */
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;