import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts", // service worker source
  swDest: "public/sw.js", // generated output
});

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
};

export default withSerwist(nextConfig);
