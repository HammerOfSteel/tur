# TODO — Phased Task Breakdown

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

Detailed, step-by-step implementation plans (with exact files/commands, written in the
writing-plans style) are added to `docs/superpowers/plans/` as each phase is picked up. Phase 0
already has one: `docs/superpowers/plans/2026-08-25-phase-0-foundations.md`.

## Phase 0 — Foundations & Content
_Blocks every other phase. Produces the shared content/assets both stacks consume._

- [x] Author shared product catalog `content/products.json` (12+ products, 5 categories, per
      OVERVIEW.md)
- [x] Author shared page copy `content/pages.sv.json` (Home, Om oss, Kontakt, Galleri intro
      text)
- [x] Process/select images: pick 12+ product photos + 8+ gallery photos from `unsplash/`,
      resize/optimize into `assets/`
- [x] Write `assets/credits.md` documenting image sources
- [x] Decide + record contact-map approach (live Google Maps embed vs static image) based on
      expected pitch-demo network conditions
- [x] Sanity-check current live site once more right before build starts (in case content has
      changed) and note findings in OVERVIEW.md

## Phase 1 — Shared Design System
_Defines the reusable design tokens both tracks implement against._

- [x] Write design tokens doc: exact color values, font choices/fallbacks, spacing scale for
      both variants (Classic + Varm)
- [x] Produce a static HTML/CSS style-tile (colors, type samples, button/card samples) for both
      variants to sanity-check before wiring into WordPress/React
- [x] Note in OVERVIEW.md that `design-system/tokens/*.json` + `design-system/style-tile/` are
      the source of truth later phases must read from, not redefine

## Phase 2 — WordPress: Shared Theme + Design A (Skogsstig Classic)
- [x] Scaffold shared child theme in `wordpress/theme/` (templates, template parts, patterns
      for header/footer/hero/product card)
- [x] Implement `theme.json` + stylesheet for Variant A (Classic)
- [x] Build `wordpress/design-a/docker-compose.yml` (wordpress + mysql + WP-CLI seed service)
- [x] WP-CLI seed script: install/activate WooCommerce, import product catalog from
      `content/products.json`, create pages from `content/pages.sv.json`, activate theme +
      Variant A styles
- [x] Configure WooCommerce manual/COD gateway so checkout completes without real payment
- [x] Verify cart/checkout against acceptance criteria in the spec (§7.1)
- [x] `docker compose up` end-to-end smoke test from a clean state

## Phase 3 — WordPress: Design B (Skogsstig Varm)
_Reuses the shared theme from Phase 2 — no template/pattern duplication._

- [x] Implement `theme.json` + stylesheet for Variant B (Varm)
- [x] Build `wordpress/design-b/docker-compose.yml` (mirrors design-a, points at Variant B
      styles)
- [x] `docker compose up` end-to-end smoke test from a clean state
- [x] Visual side-by-side check against Design A (same content, different theme.json only)

## Phase 4 — React: Shared App + Design A (Skogsstig Classic)
_React is a headless WooCommerce storefront: its own WordPress+WooCommerce backend (seeded the
same way as the WordPress track, minus the Skogsstig theme) plus a Next.js frontend calling the
WooCommerce Store API. Admin stays wp-admin/WooCommerce — no custom admin is built._

- [x] Build `react/design-a/docker-compose.yml` (wordpress + mysql + WP-CLI seed service,
      headless-only: WooCommerce active, no theme install, Store API enabled)
- [x] WP-CLI seed script: install/activate WooCommerce, import product catalog from
      `content/products.json`, disable stock management on seeded products
- [x] Scaffold Next.js app in `react/app/` (App Router, Tailwind, shadcn/ui)
- [x] Build a WooCommerce Store API client module (product listing, cart, checkout endpoints)
- [x] Build shared layout/components: header, footer, hero, product card, category grid
- [x] Implement pages: Home, Butik, Produkt (dynamic route), Om oss, Kontakt, Galleri, sourcing
      copy from `content/pages.sv.json` and products from the Store API
- [x] Implement cart page + mocked-payment multi-step checkout using the Store API's cart and
      checkout endpoints (same manual/COD gateway as the WordPress track)
- [x] Wire Variant A design tokens via `NEXT_PUBLIC_THEME_VARIANT=a` (Tailwind config/CSS vars)
- [x] Add `react/design-a/docker-compose.yml` `nextjs` service (build context → `react/app/`,
      variant + Store API URL env vars, `next build && next start`)
- [x] Verify cart/checkout against acceptance criteria in the spec (§7.1)
- [x] `docker compose up` end-to-end smoke test from a clean state (confirm wp-admin is
      reachable and shows the same products/orders as the storefront)

## Phase 5 — React: Design B (Skogsstig Varm)
_Reuses the shared app from Phase 4 and the same headless-WooCommerce backend approach — only
the variant env var/tokens differ._

- [x] Build `react/design-b/docker-compose.yml` (own wordpress + mysql + WP-CLI seed service,
      mirrors design-a's headless setup)
- [x] Wire Variant B design tokens via `NEXT_PUBLIC_THEME_VARIANT=b`
- [x] Add `nextjs` service pointed at this folder's own WooCommerce backend
- [x] `docker compose up` end-to-end smoke test from a clean state
- [x] Visual side-by-side check against Design A (same content, different tokens only)

## Phase 6 — Polish & Pitch Prep
- [ ] Cross-demo consistency pass: confirm all 4 demos show identical products/copy
- [ ] Mobile/responsive check on all 4 demos
- [ ] Fill in "Running a demo" section of README.md with final, tested commands
- [ ] Write a short one-page pitch summary (what each variant emphasizes, why) for use in the
      in-person meeting
- [ ] Final full reset-and-run test of all four `docker compose up` flows from clean state
