# Tur Second Hand — Redesign Pitch Prototypes: Design Spec

Date: 2026-08-25
Status: Approved (brainstorm phase)

## 1. Background & Goal

Tur Second Hand is a newly opened secondhand shop in Östersund focused on outdoor and ski
gear, fitting the municipality's circular-economy focus. Their live site
(https://tursecondhand.se/) is an out-of-the-box WordPress "Twenty Twenty-Five" theme with
WooCommerce installed but essentially empty — no custom content, branding, or products
(confirmed: homepage renders only the theme's default site title text; no other pages exist,
e.g. `/kontakt/`, `wp-sitemap.xml` return 404).

Goal: build a small set of **local, self-contained prototype demos** — real content, real
brand direction, real (but non-live-payment) shop flow — that can be shown to the shop owner
in person to pitch a redesign. Not a production deployment; no live payments, no real hosting
required for the pitch itself.

**Admin usability requirement:** whichever track (WordPress or React) the owner picks after
the pitch, they must be able to manage products/orders themselves with zero coding knowledge,
using a free, open-source, well-supported admin tool. Decision: **WooCommerce (wp-admin) is
the single admin system for both tracks** — the React track is a *headless WooCommerce*
storefront (Next.js frontend calling the WooCommerce Store API), not a separate static/mocked
shop. This means the owner learns exactly one admin UI regardless of which frontend they
choose, and can rely on the enormous WordPress/WooCommerce hosting and support ecosystem
either way.

## 2. Scope

Build **four demos**, each independently runnable via its own `docker-compose.yml`. All four
are backed by the same underlying system — WordPress + WooCommerce — either presented directly
(WordPress track) or consumed headlessly by a Next.js frontend (React track):

| # | Stack | Design variant | Admin |
|---|-------|----------------|-------|
| 1 | WordPress + WooCommerce (theme frontend) | Skogsstig Classic | wp-admin / WooCommerce |
| 2 | WordPress + WooCommerce (theme frontend) | Skogsstig Varm | wp-admin / WooCommerce |
| 3 | Next.js + Tailwind + shadcn/ui, headless WooCommerce backend | Skogsstig Classic | wp-admin / WooCommerce (same system, different frontend) |
| 4 | Next.js + Tailwind + shadcn/ui, headless WooCommerce backend | Skogsstig Varm | wp-admin / WooCommerce (same system, different frontend) |

Out of scope: real payment processing, production hosting/deployment, real inventory
management, multi-tenant/staff accounts, actual translation into English (structure should be
translation-ready, but only Swedish copy needs to be written), building a custom admin UI (use
stock wp-admin/WooCommerce as-is).

## 3. Brand facts (use verbatim across all four demos)

- Name: Tur Second Hand
- Address: Hamngatan 10, 831 33 Östersund
- Phone: 070-976 13 37
- Instagram: https://www.instagram.com/tur.secondhand/
- Opening hours: Tisdag Stängt · Onsdag 11–18 · Torsdag 11–18 · Fredag 11–18 · Lördag 11–16 ·
  Söndag Stängt · Måndag Stängt
- Focus: secondhand outdoor & ski gear — jackets, backpacks, sleeping bags, clothing, skis &
  ski boots (seasonal).
- Angle to emphasize in copy: circular economy / giving outdoor gear a second life, fits
  Östersund municipality's sustainability focus.
- Language: Swedish primary copy; code/content structure should be translation-ready
  (externalized strings), but only Swedish text needs to be authored for the pitch.

## 4. Design system: "Skogsstig" (shared DNA, two variants)

Both variants share: deep-nature editorial photography (from local `unsplash/` folder and any
usable imagery pulled from the live site), generous whitespace, soft-edged cards/buttons,
rustic-outdoorsy tone (not sleek-tech, not cutesy).

- **Variant A — "Skogsstig Classic":** forest green (#2b3a2a) primary, warm birch/cream
  (#f5f0e6) base, serif display headings (Fraunces or similar), calm editorial magazine feel.
- **Variant B — "Skogsstig Varm":** same layout DNA and imagery style as Classic, swapped to a
  warm terracotta/rust accent (~#c9603a) instead of green, humanist sans-serif headings
  instead of serif. Distinct sibling, not a random alternative.

Both variants must be implemented as **swappable design tokens** (WP: `theme.json` + variant
stylesheet; React: CSS variables/Tailwind theme config) on top of one shared
layout/component implementation — write the structure once, vary color/type per demo.

## 5. Content & page set (same for all four demos)

All four demos use the **same catalog and content** so they are directly comparable —
only the visual design system (§4) differs between variants.

### 5.1 Product catalog (shared, minimum viable seed)

At least 12 seed products, at least 2 per category, spanning:
Jackor, Ryggsäckar, Skidor & Pjäxor, Sovsäckar, Kläder. Each product needs: name, price (SEK),
one photo (from `unsplash/` or `assets/`), a short condition/description line (e.g.
"Mycket gott skick", "Använd men fungerar bra"), and its category. The same 12+ products (same
names/prices/photos) are authored once (`content/products.json`, produced in Phase 0) and
imported into WooCommerce via WP-CLI in **all four** demos — including the two React demos,
since their WooCommerce backend is the single source of product data, fetched at runtime via
the Store API rather than duplicated into a separate JSON file.

### 5.2 Pages

- **Home** — hero (real photo + tagline), featured categories, circular-economy blurb, hours/
  location teaser.
- **Butik / Shop** — category grid: Jackor, Ryggsäckar, Skidor & Pjäxor, Sovsäckar, Kläder,
  listing the shared product catalog above.
- **Produkt / Product detail** — image, price, condition/description, add-to-cart.
- **Varukorg / Cart**
- **Kassa / Checkout** — completes without a real payment processor, on **both** tracks, using
  the same WooCommerce manual/"Cash on delivery"-style gateway (WordPress track: native
  checkout page; React track: a checkout UI built in Next.js that submits to the WooCommerce
  Store API's checkout endpoint using that same gateway). No mocked/fake client-only flow — see
  §7.1 for shared acceptance criteria.
- **Om oss / About** — story + circular economy angle. Sourced directly from
  `content/pages.sv.json` (§5, authored once in Phase 0) on both tracks — not stored as
  WordPress page content, so React doesn't need to fetch non-product copy from WordPress at
  all, only products/cart/checkout go through WooCommerce.
- **Kontakt / Contact** — address, phone, hours, embedded map, Instagram link, likewise sourced
  from `content/pages.sv.json`. The embedded map may use a live external embed (e.g. Google
  Maps iframe) since the pitch demo will run with internet access; if internet access cannot be
  guaranteed at pitch time, fall back to a static map image instead — decide at implementation
  time based on where the demo will run.
- **Galleri / Gallery** — curated shop/outdoor imagery, at least 8 images drawn from the
  `unsplash/` folder, listed in `content/pages.sv.json` on both tracks.

## 6. WordPress track

- `docker-compose.yml` per variant folder (`wordpress/design-a/`, `wordpress/design-b/`):
  `wordpress` + `mysql` services, plus a one-shot WP-CLI service that on first `up`:
  installs/activates WooCommerce, imports demo product data (CSV or WP-CLI commands) into the
  categories above, activates the custom theme, and imports the seed pages listed in §5 — so
  `docker compose up` produces a fully seeded, ready-to-demo site (not a blank install).
- One shared **custom WordPress child theme** of Twenty Twenty-Five (block/FSE theme:
  templates, template parts, block patterns for header/footer/hero/product cards
  implementing the Skogsstig layout), living once in `wordpress/theme/`. Each variant folder
  (`wordpress/design-a/`, `wordpress/design-b/`) mounts/copies this same shared theme directory
  into its WordPress container (e.g. via a Docker bind mount or `COPY` in a small per-variant
  Dockerfile) plus its own variant-specific `theme.json` + companion stylesheet override (per
  §4) — the shared theme's block templates/patterns are never duplicated or forked, only the
  color/typography token files differ per variant. The WP-CLI seed service selects/activates
  the correct variant style automatically on `up`.
- WooCommerce checkout uses a manual/"Cash on delivery"-style gateway so cart → checkout
  completes without integrating a real payment provider.
- The WordPress track's WooCommerce REST/Store API is also consumed headlessly by the React
  track (§7) — no additional backend work is needed to support React; enabling/confirming the
  Store API is available is part of the standard WooCommerce install used here.

## 7. React track (headless WooCommerce frontend)

- Next.js (App Router) + Tailwind CSS + shadcn/ui, talking to a WordPress + WooCommerce
  backend via the **WooCommerce Store API** (`/wp-json/wc/store/v1/...`) — the same public,
  cookie/session-based API WooCommerce ships for headless/blocks use, requiring no API keys
  for browsing products or running cart/checkout. There is no separate database, mocked data
  layer, or custom admin: **wp-admin/WooCommerce on that same WordPress instance is the admin
  UI**, identical to the WordPress track.
- Architecture: each React demo folder (`react/design-a/`, `react/design-b/`) is a
  self-contained `docker-compose.yml` running its own `wordpress` + `mysql` + WP-CLI seed
  service. This WordPress instance is **backend/admin/API-only** — it intentionally never
  installs or activates the Skogsstig theme (or any custom theme); it stays on WordPress's
  default theme, exists purely so WooCommerce and its Store API are available, and is only
  ever visited by the owner via `/wp-admin`, never by an end customer. It mirrors the
  WordPress track's seeding approach (§6) so the same WP-CLI seed logic/content is reused.
- A single shared Next.js application lives in `react/app/` (components, pages, Store API
  client, cart/checkout UI written once). `react/design-a/` and `react/design-b/` each add only
  a `docker-compose.yml` + variant `.env` (setting `NEXT_PUBLIC_THEME_VARIANT=a|b` and the
  `WORDPRESS_STORE_API_URL` pointing at that folder's own `wordpress` service) that builds and
  runs the shared app from `react/app/` via a Docker build context — there is no second copy of
  the app code to drift out of sync.
- The variant env var selects the design tokens (colors/typography, per §4) at build time via
  Tailwind theme config/CSS variables — no other behavioral differences between variants.
- Each variant's `docker-compose.yml` runs `next build && next start` (production mode) so the
  demo is stable for in-person pitching; `next dev` is not used for the packaged demo.
- Product data: fetched at runtime from that folder's own WooCommerce Store API, seeded from
  the same `content/products.json` used by the WordPress track (§5.1) — never duplicated into
  a separate static file.
- Cart state: managed via the WooCommerce Store API's cart endpoints (session/cart-token based,
  as designed for headless use), not a client-only mock — so the React track exercises the same
  real WooCommerce cart engine as the WordPress track.
- Checkout: a Next.js-built checkout form (address, email, etc.) that submits to the Store
  API's checkout endpoint using the same manual/COD gateway as §6, ending on a real WooCommerce
  order confirmation. See §7.1 for acceptance criteria shared with the WordPress track.

### 7.1 Cart & checkout acceptance criteria (both tracks)

Both tracks are backed by the same WooCommerce cart/checkout engine (WordPress track via its
native theme UI, React track via the Store API), so they must satisfy the same observable
behavior end-to-end:

- Adding a product to the cart updates a visible cart item count/indicator immediately.
- The cart page lists each item with image, name, price, quantity, and a per-item remove
  action; it shows a running subtotal.
- An empty cart shows an explicit "din varukorg är tom" (cart is empty) state with a link back
  to the shop — not a blank page.
- Checkout requires at minimum a name, email, and address before allowing submission; missing
  required fields show inline validation messages and block submission.
- Submitting checkout always succeeds (no real payment/stock failure paths need to be modeled)
  and ends on a confirmation screen showing an order summary and the real WooCommerce order
  number.
- After a successful checkout, the cart is cleared.
- Stock management is disabled on all seeded products (WooCommerce "Manage stock" left off), so
  products are never marked "sold out" as a result of demo checkouts on either track.

## 8. Images

- Use the 10 photos already in `unsplash/` as the primary asset pool.
- Pull any additional usable imagery from the current live site (there appears to be none of
  substance today, since the site is essentially blank — re-check at implementation time in
  case content changes before build begins).
- Maintain an `assets/credits.md` noting image sources/licensing for anything not originally
  provided by the shop owner.

## 9. Deliverables (written at repo root)

- `README.md` — what this project is and how to run each of the four demos locally.
- `OVERVIEW.md` — brand direction rationale, content inventory, image sourcing/credits,
  decisions captured from this brainstorm.
- `TODO.md` — phased task breakdown (small, checkable tasks/subtasks) covering: foundations/
  content prep, shared design system, WordPress variant A, WordPress variant B, React variant
  A, React variant B, polish/pitch-prep.

## 10. Explicitly out of scope / non-goals

- Real payment integration.
- Production hosting or domain setup.
- Real English translation (structure only).
- Any change to the actual live tursecondhand.se site.
- User accounts, staff/admin workflows beyond what WooCommerce/Next.js need for the demo.
