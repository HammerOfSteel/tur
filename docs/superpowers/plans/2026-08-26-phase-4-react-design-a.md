# Phase 4 implementation plan: React shared app + Design A (Skogsstig Classic)

**Spec:** `docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md` (§7, §7.1)
**Roadmap:** `TODO.md` — Phase 4 — React: Shared App + Design A
**Depends on:** Phase 0 (content/assets, done), Phase 1 (design tokens, done), Phase 2/3
(WordPress tracks + the quality-fix pass, done — the WP-CLI seeding pattern is reused here).

**Goal:** `docker compose up` in `react/design-a/` produces a headless WooCommerce backend
(WordPress on its default theme, WooCommerce active, Store API enabled, seeded with the shared
product catalog) plus a Next.js storefront (`react/app/`, built once and reused by Design B)
that reads that catalog via the Store API and drives real cart/checkout, styled with Design A's
tokens. No custom admin is built — `/wp-admin` on that backend is the only admin surface.

This project folder is **NOT a git repo** — every "Commit" step below is a no-op.

---

## Architecture recap

- `react/design-a/docker-compose.yml`: `db` (MySQL) + `wordpress` (headless, default theme,
  never visited by a customer) + one-shot `wpcli` seed service + `nextjs` (builds `react/app/`
  via Docker build context, `next build && next start`).
- `wpcli` seed script is a **trimmed copy** of the WordPress track's seed script: WooCommerce
  install/config, product categories, product import from `content/products.json`, manual/COD
  gateway, Store API check, stock management left off. It explicitly **skips** theme
  activation, page creation (Om oss/Kontakt/Galleri/Hem), and nav/footer — none of that is
  needed since Next.js owns all customer-facing pages and sources copy directly from
  `content/pages.sv.json` at build/runtime, not from WordPress Pages.
- `react/app/`: Next.js App Router + Tailwind + shadcn/ui, single shared codebase.
  - `lib/store-api.ts`: thin fetch wrapper over `${WORDPRESS_STORE_API_URL}/wp-json/wc/store/v1/*`
    (products, cart, checkout), forwarding the WooCommerce cart-token/nonce headers so cart
    state persists across requests (session-based, matching spec §7).
  - `lib/content.ts`: reads `content/pages.sv.json` (mounted read-only into the Next.js
    container, same file the WordPress track's seed script reads) for Om oss/Kontakt/Galleri/
    Home copy — never duplicated into a separate copy file.
  - `lib/theme.ts` + Tailwind config: reads `NEXT_PUBLIC_THEME_VARIANT` (`a`|`b`) and the
    `design-system/tokens/*.json` files (also mounted read-only) to drive Tailwind CSS
    variables — same source of truth as the WordPress `theme.json`s, per OVERVIEW.md.
  - Components: `Header`, `Footer`, `Hero`, `ProductCard`, `CategoryGrid`, `Cart` (mini +
    page), `CheckoutForm` — built once, styled entirely via CSS variables/Tailwind theme so
    Design B needs zero component changes.
  - Pages: `/` (Home), `/butik` (shop + category filter), `/butik/[slug]` (product detail),
    `/varukorg` (cart), `/kassa` (checkout), `/om-oss`, `/kontakt`, `/galleri`.
- `react/design-a/.env` (or compose `environment:`): `NEXT_PUBLIC_THEME_VARIANT=a`,
  `WORDPRESS_STORE_API_URL=http://wordpress` (internal Docker network hostname) — Design B
  later reuses the exact same `react/app/` build context with only these two values changed.

## Tasks

### Task 1 — Headless WooCommerce backend (`react/design-a/`)
1. `react/design-a/docker-compose.yml`: `db` + `wordpress` (no theme bind mount — stays on
   whatever default theme ships with the image) + `wpcli` mounting `content/` read-only and a
   trimmed `seed.sh`.
2. Write `react/design-a/seed.sh` by trimming `wordpress/design-a/seed.sh` down to: core
   install, WooCommerce install/activate, Swedish locale, permalinks, payment gateway
   (manual/COD), product categories, product import (reuse the exact same PHP/product-loop
   logic — same `log()`-writes-to-stderr fix applied from the start this time), Store API
   availability check. Remove theme activation + all page-creation steps.
3. Validate: `sh -n seed.sh`, then `docker compose up -d`, confirm `wp-json/wc/store/v1/products`
   returns 12 products, confirm `/wp-admin` reachable, confirm idempotent re-seed.

### Task 2 — Next.js app scaffold
1. Scaffold `react/app/` with `create-next-app` (App Router, TypeScript, Tailwind, ESLint).
2. Install/init shadcn/ui; pull in the handful of primitives actually needed (button, card,
   input, label, badge, separator, sheet/drawer for mobile nav + mini-cart).
3. Wire Tailwind theme (colors/fonts/spacing) to read from `design-system/tokens/shared.json` +
   `classic.json`/`varm.json` per `NEXT_PUBLIC_THEME_VARIANT` — via a small build-time script
   that emits CSS custom properties (mirrors how the WordPress `theme.json`s consume the same
   token files), so no color/spacing value is hand-copied into Tailwind config literally.

### Task 3 — Store API client + content loader
1. `lib/store-api.ts`: `getProducts()`, `getProduct(slug)`, `getCart()`, `addToCart()`,
   `updateCartItem()`, `removeCartItem()`, `checkout()` — all against
   `${WORDPRESS_STORE_API_URL}/wp-json/wc/store/v1/...`, propagating the `Cart-Token`/nonce
   response headers back into the browser (Next.js route handlers acting as a thin
   same-origin proxy so the cart-token cookie/header dance works cleanly from the browser).
2. `lib/content.ts`: loads and types `content/pages.sv.json` for the static-copy pages.

### Task 4 — Shared components + pages
1. Build `Header`, `Footer`, `Hero`, `CategoryGrid`, `ProductCard`, mini-cart indicator.
2. Build pages: Home, Butik (+ category query param filter), Produkt detail, Varukorg (cart),
   Kassa (checkout form → Store API checkout → order confirmation), Om oss, Kontakt (static
   map + hours list, same content/approach as the WordPress track), Galleri.
3. Apply the same contrast lessons learned in the WordPress quality-fix pass: never rely on a
   generic/ambiguous color token name; verify hero text and any color-on-color button/badge
   combination for contrast before calling a page done.

### Task 5 — Wire it up + verify against §7.1
1. Add the `nextjs` service to `react/design-a/docker-compose.yml` (build context `react/app/`,
   variant + Store API env vars, `next build && next start`).
2. Full smoke test: `docker compose up` from clean state → browse Home/Butik/Produkt, add to
   cart, view cart (empty-cart state check too), checkout with validation errors then a valid
   submission, confirm order number + WooCommerce order shows in `/wp-admin`, confirm cart
   clears after checkout.
3. Update `TODO.md` (check off Phase 4 items) and `OVERVIEW.md` (short dated note) once green.

## Explicitly deferred to Phase 5
Design B's own `react/design-b/docker-compose.yml` + variant env — no new component/page code.
