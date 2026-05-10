import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);

export default withSentryConfig(withPWAConfig, {
  org: "nanolab",
  project: "javascript-nextjs",
  // Upload source maps only in CI to avoid slowing local builds
  silent: !process.env.CI,
  // Disable source map upload in local dev (no SENTRY_AUTH_TOKEN needed locally)
  sourcemaps: { disable: process.env.NODE_ENV !== "production" },
  // Reduce bundle size by tree-shaking unused Sentry features
  disableLogger: true,
  automaticVercelMonitors: false,
});
