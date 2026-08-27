import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables the lean `.next/standalone` output copied into the production Docker image
  // (see react/app/Dockerfile) instead of shipping the full node_modules tree.
  output: "standalone",
  images: {
    // Product photos are served by the headless WooCommerce backend (see
    // WORDPRESS_STORE_API_URL) — allow any port on localhost for local dev, and the internal
    // Docker Compose service hostname ("wordpress") once this runs inside react/design-a's
    // docker-compose.yml (Task 5).
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "wordpress" },
    ],
    // The "wordpress" Compose service hostname resolves to a private container-network IP
    // (e.g. 172.x.x.x) — Next.js 16's image optimizer refuses to fetch any hostname resolving
    // to a private/loopback IP by default as a generic SSRF guard, even though it's already
    // allow-listed above via remotePatterns. This is our own self-contained local Docker
    // network with no untrusted input in the image URL (sourced only from our seeded product
    // catalog), so it's safe to opt back in here.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
