import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // UI bundles are content-hashed by scripts/build-lynk.mjs, so they can be cached forever.
  async headers() {
    return [
      {
        source: "/lynk/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
