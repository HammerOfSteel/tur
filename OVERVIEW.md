# Overview: Brand Direction & Content

Context for anyone (human or agent) picking this project up. For the full technical spec, see
`docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md`.

## Why this project exists

Tur Second Hand is a newly opened secondhand shop in Östersund selling outdoor and ski gear —
a great fit for the municipality's circular-economy focus. Their live site is an unmodified
default WordPress theme with no real content. This project builds four polished, demoable
prototype sites (two tech stacks × two design variants) to show the owner in person, so they
can pick a direction without committing to any build work up front.

## Real business facts (use verbatim everywhere)

- **Name:** Tur Second Hand
- **Address:** Hamngatan 10, 831 33 Östersund
- **Phone:** 070-976 13 37
- **Instagram:** [@tur.secondhand](https://www.instagram.com/tur.secondhand/)
- **Opening hours:** Tisdag Stängt · Onsdag 11–18 · Torsdag 11–18 · Fredag 11–18 ·
  Lördag 11–16 · Söndag Stängt · Måndag Stängt
- **Focus:** secondhand outdoor & ski gear — jackets, backpacks, sleeping bags, clothing, skis
  & ski boots (seasonal).
- **Angle to emphasize:** circular economy / giving outdoor gear a second life.
- **Language:** Swedish primary copy; structure should be translation-ready, but only Swedish
  text needs to be authored for the pitch.

## Brand direction: "Skogsstig" (Forest Trail)

Chosen after comparing four personality directions (rustic/outdoorsy, modern eco-minimalist,
cozy Nordic, bold adventure) and two initial layout mockups — rustic/outdoorsy won clearly.
Both design variants below share the same photography style, layout DNA, and tone (calm,
editorial, nature-forward — not sleek-tech, not cutesy) and differ only in color/typography:

- **Variant A — "Skogsstig Classic":** forest green (`#2b3a2a`) primary, warm birch/cream
  (`#f5f0e6`) base, serif display headings (Fraunces or similar).
- **Variant B — "Skogsstig Varm":** same layout, warm terracotta/rust accent (`~#c9603a`)
  instead of green, humanist sans-serif headings instead of serif.

## Content inventory

### Pages (same set, all four demos)
Home · Butik (Shop) · Produkt (Product detail) · Varukorg (Cart) · Kassa (Checkout, mocked) ·
Om oss (About) · Kontakt (Contact) · Galleri (Gallery).

### Product catalog (shared across all four demos)
At least 12 seed products, at least 2 per category — Jackor, Ryggsäckar, Skidor & Pjäxor,
Sovsäckar, Kläder. Each needs: name, price (SEK), one photo, a short condition line (e.g.
"Mycket gott skick"), category. Canonical source: `content/products.json` (authored in Phase
0) — imported into WooCommerce via WP-CLI in **all four** demos (WordPress tracks display it
through their theme; React tracks fetch it at runtime from their own WooCommerce backend via
the Store API), so every demo always shows identical products.

### Images
Primary pool: the 10 photos in `unsplash/`. Any additional imagery pulled from the live site
will be re-checked at implementation time (the live site currently has no substantial content
of its own). Licensing/sourcing notes for anything not provided directly by the shop owner are
tracked in `assets/credits.md`.

## Decisions log (from brainstorm)

- Full WooCommerce shop scope, cart/checkout works end-to-end but never touches a real payment
  processor.
- **React version is a headless WooCommerce storefront**, not a separately mocked shop: it
  reads products and drives cart/checkout through the WooCommerce Store API against its own
  WordPress+WooCommerce backend, so the owner manages products/orders for *either* track
  through the exact same wp-admin/WooCommerce screens — one admin system to learn, not two.
  (Decided after initial brainstorm, prompted by wanting an easy, free, open-source admin UI
  for someone with no coding knowledge; considered and rejected Medusa/Saleor/Vendure as
  separate admin systems the owner would have to learn in addition to/instead of WooCommerce.)
- Swedish primary, English-ready structure (no English copy required for the pitch).
- Rustic/outdoorsy personality chosen over modern-minimalist, cozy-Nordic, and bold-adventure
  alternatives.
- Two design variants are close siblings of one direction (not two unrelated designs), so both
  read as coming from the same brand.
- Next.js chosen over plain Vite+React for the React track (pairs well with shadcn/ui, easier
  path to a polished demo).
- Cart/checkout acceptance criteria (empty-cart state, validation, cart-clearing on success,
  etc.) are defined once in the spec (§7.1) and apply identically to both stacks.

## Live site re-check (Phase 0)

_2026-08-25, end of Phase 0._ Re-fetched `https://tursecondhand.se/`, `/kontakt/`, `/om-oss/`,
and `/butik/`. Homepage still renders only the bare default WordPress "Twenty Twenty-Five"
theme footer text ("Utformad med WordPress"), no real content. All three sub-paths still
return 404. No change since the original brainstorm — the content and images authored in
Phase 0 (`content/products.json`, `content/pages.sv.json`, `assets/products/`,
`assets/gallery/`) stand as-is with no need to reconcile against anything new on the live
site.

## Design system (Phase 1)

`design-system/tokens/shared.json`, `classic.json`, and `varm.json` are the machine-readable
source of truth for all color/type/spacing values. `docs/design/tokens.md` is the human-readable
companion, and `design-system/style-tile/` (plus a rendered preview at
`docs/design/style-tile-preview.png` / `docs/design/style-tile.md`) is the visual reference.
Phase 2's WordPress `theme.json` and Phase 4's React Tailwind config must read these values
directly — no color/type/spacing value should be redefined ad hoc in a later phase.

## WordPress Design A (Phase 2)

_2026-08-26._ The shared child theme lives in `wordpress/theme/tur-secondhand/` (templates,
template parts, patterns, static assets) and is reused **unmodified** by Design B in Phase 3 —
only `theme-overrides/theme.json` + `theme-overrides/variant.css` differ per design variant.
Variant A ("Skogsstig Classic") is wired up in `wordpress/design-a/` (docker-compose.yml +
seed.sh), running WordPress 6.9 + WooCommerce, seeded entirely via WP-CLI on first
`docker compose up` (categories, 12 products with images, all content pages, cart/checkout
gateway config, theme activation).

The Task 6 end-to-end smoke test passed on a clean-start Docker stack: all five pages (Hem,
Om oss, Kontakt, Galleri, Butik) return 200, all 12 products are visible via the WooCommerce
Store API with correct prices/condition text/stock status, and a full cart → checkout → order
confirmation walkthrough was verified live (cart add/contents, Swedish empty-cart message,
checkout submission, order confirmation page with order number/total/payment method, cart
emptied after checkout). The seed script was also confirmed idempotent (safe to re-run without
duplicating content). See `docs/superpowers/plans/2026-08-25-phase-2-wordpress-design-a.md` for
the full task-by-task spec and a note on real infrastructure bugs found only by running the
stack live (WordPress/WooCommerce version floor, cross-image UID mismatch on the WP-CLI
container, a stale WP-CLI `--stock_status` flag that should have been `--in_stock`).

## WordPress Design B (Phase 3)

_2026-08-26._ Design B ("Skogsstig Varm") reuses `wordpress/theme/tur-secondhand/`
**unmodified** — only `wordpress/design-b/theme-overrides/theme.json` (Variant B tokens from
`design-system/tokens/varm.json`: terracotta primary `#c9603a`, Work Sans headings) and its
`docker-compose.yml`/`seed.sh` (identical to Design A's, port 8092 instead of 8091) differ.
Every token value was verified programmatically against `varm.json`/`shared.json` before
running Docker. The same end-to-end smoke test used for Design A (5 pages, 12 products, full
cart → checkout → order confirmation, idempotent re-seed) passed on a clean-start stack, and
the rendered CSS custom properties were checked live to confirm the terracotta/Work Sans
variant actually applies (not a leftover of Design A's Classic tokens). One live Docker-daemon
restart occurred mid-verification (this shared environment, unrelated to the seed script); data
survived on the persistent volume and the idempotent re-seed afterward completed cleanly.

## WordPress quality-fix pass + real product photos (post-Phase-3)

_2026-08-26._ Fixed a hero/button/footer text-contrast bug affecting both design-a and
design-b: the color palette had a slug literally named `text`, which collided with
Gutenberg's own hardcoded `has-text-color` marker class (always emitted alongside a specific
color class). Because `text` sorted after `on-primary` in palette order, its dark color rule
won the CSS cascade tie-break everywhere light text was intended. **Fix: never name a palette
slug `text`, `background`, or `link`** — these are WordPress reserved marker classes. Renamed
the slug to `ink` in both `theme.json` overrides and the two hand-authored files that
referenced it directly. Also softened design-b's hero overlay opacity (0.5 → 0.38, too strong
an orange tint) and added a shared hero text-shadow for extra legibility insurance. Also
redesigned Om oss and Kontakt (real OpenStreetMap embed + hours list) and dropped Galleri from
the primary nav, per feedback that the initial content pages weren't polished enough to show.

Swapped all 12 product photos from Unsplash stand-ins to the shop's own real inventory photos
(`assets/products/`, filenames = product title). Also fixed WooCommerce price display —
default SEK formatting rendered as `kr650.00`; added `woocommerce_currency_pos=right_space`
and `woocommerce_price_num_decimals=0` to every seed script so prices now read `650 kr`
(idiomatic Swedish), applied consistently across both WordPress stacks and the React track's
headless backend. All three affected stacks were re-seeded and verified live (12/12 images
resolve including `.webp`/`.avif`, correct price format on `:8091/butik/` and `:8092/butik/`).

**Docker Compose project-name collision incident**: `react/design-a/` and `wordpress/design-a/`
share a basename, and Compose defaults to using the directory basename as the project name
when no `name:` is set — this briefly caused `docker compose up` in one to silently reuse/
recreate the other's containers (took port 8091 offline for a few minutes). No data was lost
(recovered via `docker compose down` without `-v`, preserving the volume, then restarting from
the correct folder). **Fix applied project-wide**: every compose file now declares an explicit
unique `name:` (e.g. `tur-secondhand-wordpress-design-a`, `tur-secondhand-react-design-a`).
Any new compose file (`react/design-b/docker-compose.yml` included) must set this from the
very first version, before ever running `docker compose up`.

A separate environment hiccup (unrelated to this project) also occurred: the local Rancher
Desktop Docker daemon's host-side socket stopped responding mid-session. Recovered by force-
killing the stale `limactl hostagent` process and fully quitting/relaunching Rancher Desktop;
all containers (including the four Tur Second Hand stacks) auto-restarted cleanly from their
persistent volumes with no data loss.

## Phase 4 complete — React headless storefront (Design A), 2026-08-26

Built the first React/Next.js demo end-to-end and verified it fully containerized:

- **Backend**: `react/design-a/` is a headless WordPress+WooCommerce install (no theme —
  Store API only), seeded by the same `seed.sh` pattern as the WordPress track (12 products,
  5 categories, real product photos, "650 kr" pricing, coming-soon disabled, "Betalning vid
  upphämtning" (cheque) as the only enabled payment gateway).
- **Frontend**: `react/app/` — Next.js 16 (App Router, TS), Tailwind v4 + shadcn/ui, themed via
  a token pipeline (`scripts/generate-theme.mjs`) that reads the same `design-system/tokens/`
  JSON the WordPress `theme.json` overrides consume — single source of truth for both tracks.
  Cart/checkout flow through a same-origin `/api/store/[...path]` proxy that translates
  WooCommerce Store API's Cart-Token/Nonce headers into httpOnly cookies (required — the Store
  API can't be called directly cross-origin with session state from a browser).
- **Pages built**: Home (hero, category grid, circular-economy blurb, hours teaser), Butik
  (category-filterable product grid), Produkt detail, Varukorg (cart), Kassa (checkout form →
  confirmation), Om oss, Kontakt (real OpenStreetMap embed, same coordinates as the WordPress
  track), Galleri — all sourcing copy from the shared `content/pages.sv.json` and products live
  from the Store API (never a static copy of the catalog).
- **Contrast lessons applied**: reused the WordPress track's on-primary/ink token separation
  and hero text-shadow so light-on-photo text and button contrast are correct from the start
  (no repeat of the earlier WordPress readability bugs).
- **Docker**: added a multi-stage `react/app/Dockerfile` (deps → builder → runner, Next.js
  `output: "standalone"`) and wired a `nextjs` service into `react/design-a/docker-compose.yml`
  on port 3001. The build context is the **monorepo root**, not `react/app/`, because two pages
  (Om oss, Kontakt, Galleri) are statically prerendered at build time and need
  `content/pages.sv.json` + `design-system/tokens/` available during `next build`, not just at
  runtime — both are copied into the image and `CONTENT_DIR`/`DESIGN_TOKENS_DIR` point at them.
- **Verified fully containerized** (`docker compose build nextjs && docker compose up -d
  nextjs`): all 8 routes return 200, prices render as "189 kr"/"650 kr", product photos load via
  Next/Image through the internal `wordpress` Docker hostname, and a full add-to-cart →
  checkout run produced a real WooCommerce order (confirmed via `wp post list` in the `wpcli`
  service) with the cart correctly clearing afterward.

**Second Rancher Desktop / Docker daemon outage this project**, root-caused differently this
time: the VM's own memory was exhausted (6GB allocated, ~67MB free, under load from this
project's containers plus unrelated k8s/other local services sharing the same Rancher Desktop
instance) — the host-side docker.sock died under memory pressure mid-`npm ci`/mid-build rather
than from a stale process. Fixed by bumping the VM allocation to 8GB (`rdctl set
--virtual-machine.memory-in-gb 8`), which requires Rancher Desktop to reconfigure/restart; all
four Tur Second Hand stacks auto-restarted cleanly afterward with no data loss, as in the first
incident. If this recurs, check `rdctl shell -- free -h` first — a starved VM is the likely
cause, not necessarily a stale process.

Remaining phases: Phase 5 (React Design B — same app, `varm.json` tokens, own headless backend
on a new port, remember the `name:` pinning lesson from the start) and Phase 6 (final polish +
pitch prep across all four demos).

## Phase 5 complete — React headless storefront (Design B), 2026-08-26

Duplicated the Phase 4 pattern for the second React demo — same shared `react/app/` Next.js
codebase, only the theme variant and backend differ:

- **Backend**: `react/design-b/` — own WordPress+WooCommerce headless install (own DB, own
  volumes), seeded via a copy of `react/design-a/seed.sh` with `PUBLIC_URL` pointed at
  `:8094`. 12 products, 5 categories, real photos, "kr" pricing, cheque-only payment gateway —
  identical catalog/config to Design A, just an independent instance.
- **Frontend**: same `react/app/Dockerfile`/codebase, built with `NEXT_PUBLIC_THEME_VARIANT=b`
  (baked in at build time, since it's a `NEXT_PUBLIC_*` var) so the generated CSS uses
  `design-system/tokens/varm.json`'s warm terracotta primary (`#c9603a`) instead of Design A's
  dark green (`#2b3a2a`) — confirmed by inspecting the compiled CSS chunk inside the running
  container, not just the token source file.
- **Ports**: storefront `http://localhost:3002`, wp-admin `http://localhost:8094/wp-admin`
  (admin/demo1234). `name: tur-secondhand-react-design-b` pinned from the very first version of
  the compose file, per the collision lesson from Design A.
- **Verified**: `docker compose up -d --build` from a clean state — WP-CLI seed completed (12
  products imported with real photos), all 8 storefront routes return 200, prices render as
  "189 kr" etc., and a full add-to-cart → checkout run produced a real WooCommerce order
  (on-hold status) that clears the cart afterward — same acceptance bar as Design A.

All four demos are now live and independently runnable:

| Demo | Storefront | wp-admin |
|---|---|---|
| WordPress Design A (Skogsstig Classic) | http://localhost:8091 | http://localhost:8091/wp-admin |
| WordPress Design B (Skogsstig Varm) | http://localhost:8092 | http://localhost:8092/wp-admin |
| React Design A (Skogsstig Classic) | http://localhost:3001 | http://localhost:8093/wp-admin |
| React Design B (Skogsstig Varm) | http://localhost:3002 | http://localhost:8094/wp-admin |

All wp-admin logins: `admin` / `demo1234` (separate accounts/DBs per stack).

## React QA fix pass

A follow-up review of the React demos (both design variants share one `react/app/`
codebase, so any bug in it affects both) found two real issues:

1. **Double-HTML-entity encoding**: the WooCommerce Store API returns `name` fields (product
   and category titles) already HTML-entity-encoded, e.g. `"Skidor &amp; Pj\u00e4xor"`. Places
   that rendered these as plain JSX text (not `dangerouslySetInnerHTML`) re-escaped that string,
   producing a visibly broken `Skidor &amp;amp; Pjäxor` on the category grid, the butik filter
   pills, and cart/checkout line items. Fixed by adding a `decodeHtmlEntities()` helper in
   `react/app/src/lib/store-api.ts`, applied once at the source in `getProducts`/`getProduct`/
   `getCategories` (so every consumer gets clean text for free) and, for the cart/checkout paths
   that read `item.name` straight from the Store API's cart endpoint rather than through those
   functions, at the two remaining render sites in `varukorg-client.tsx` and `kassa-client.tsx`.
2. **Headless backend root URL usability bug**: `http://localhost:8093/` and `.../8094/`
   returned 200 and rendered WordPress's default "Twenty Twenty-Four" blog theme (a stray "Blog"
   title, "Hello world!" sample post, unrelated nav/footer links) instead of pointing at
   `/wp-admin`, since these backends were seeded headless (no theme content) but nothing guarded
   the bare front end. Fixed with a small `mu-plugin` (auto-loaded, no activation step) dropped
   onto the shared `wp_data` volume by both `react/design-a/seed.sh` and `react/design-b/seed.sh`
   that 302-redirects any request outside `/wp-admin`, `/wp-json`, and `/wp-login.php` to
   `wp-admin`. Verified via curl: `/` now 302s to `/wp-admin/`, which itself still correctly 302s
   to the login screen for unauthenticated visitors.

Both fixes were rebuilt into the running containers and re-verified with curl across all 4
storefront routes on both React ports (:3001/:3002) plus their backend ports (:8093/:8094); no
regressions found in the rest of the previously-verified content (product names/prices/
descriptions, gallery images, contact/hours info).

A third issue surfaced right after, visually (product photos showing as broken-image icons on
the butik grid): WooCommerce builds product image URLs from the site's public `home_url` (e.g.
`http://localhost:8093/wp-content/uploads/...`), but next/image's server-side optimizer runs
inside the nextjs container, where that address resolves back to the container itself, not the
wordpress container — and Next.js 16 also outright refuses to fetch any hostname that resolves
to a private/loopback IP as a built-in SSRF guard, even for hostnames already allow-listed via
`images.remotePatterns`. Fixed with two changes in `react/app`: (1) a `rewriteImageOrigin()`
helper in `lib/store-api.ts` that swaps the `localhost:<port>` origin for the internal Docker
Compose hostname (`WORDPRESS_STORE_API_URL`, i.e. `http://wordpress`) on every product image URL
returned by `getProducts`/`getProduct`, plus the same rewrite applied to the raw JSON text in the
`/api/store/[...path]` cart proxy route (so cart/checkout line-item images are covered too); and
(2) `images.dangerouslyAllowLocalIP = true` in `next.config.ts`, since this is a fully
self-contained local Docker network with no untrusted input in the image URL. Verified via curl
that `/_next/image?url=http%3A%2F%2Fwordpress%2F...` now returns 200 on both `:3001` and `:3002`
for butik-grid and product-detail images.

The cart-proxy half of that fix initially looked applied (compiled bundle contained the new
regex) but still failed for cart-page images specifically: WordPress's `json_encode` escapes
forward slashes by default, so the raw Store API response text actually reads
`"http:\/\/localhost:8093\/..."` (backslash before every slash), not the plain `http://...` a
naive URL regex expects — the original regex silently matched nothing. Fixed by making the proxy
route's regex tolerate an optional backslash before each slash (`https?:\\?\/\\?\/localhost:\d+`)
and unescaping the matched slashes before calling `rewriteImageOrigin`. Confirmed via a raw
add-to-cart curl call that the response's image `src` now reads `http://wordpress/wp-content/...`
and that `/_next/image` returns 200 for it on both `:3001` and `:3002` varukorg/kassa pages.

Remaining: Phase 6 — final cross-demo consistency pass and pitch-prep polish.

## WordPress cart/checkout blank-page fix

Both WordPress demos' Cart and Checkout pages (`http://localhost:8091/cart/`,
`.../checkout/`, and the `:8092` equivalents) rendered visibly blank — header, page title,
and footer showed, but the entire cart/checkout UI in between was missing. Root cause: our own
`wordpress/design-a/seed.sh` and `wordpress/design-b/seed.sh` create these pages with just a
bare, self-closing `<!-- wp:woocommerce/cart /-->` / `<!-- wp:woocommerce/checkout /-->` block
comment and no inner-block content. That's not an equivalent shorthand — WooCommerce's
`Cart.php`/`Checkout.php` block render methods contain a back-compat shim that pattern-matches
specific `<div data-block-name="...">` wrapper markup in the block's *existing* inner content to
upgrade older page versions to the current block structure; given genuinely empty inner content,
the pattern match finds nothing to upgrade and the shim produces almost no output (confirmed via
`wp eval 'echo do_blocks(...)'`, which returned literally `"</div>"`, 6 bytes). Fixed by
regenerating both pages' `post_content` from WooCommerce's own canonical block markup — the same
markup `WC_Install::create_pages()` writes for a brand-new install — pulled via `ReflectionMethod`
against `WC_Install::get_cart_block_content()`/`get_checkout_block_content()` (both are
intentionally non-public API, but the only source of truth that stays correct across WooCommerce
version bumps rather than hardcoding a large HTML blob in the seed script that could drift). This
fix now runs as a new "Step 7a" in both seed scripts, right after the cart/checkout pages are
created/verified, so re-seeding never reintroduces the bug. Verified end-to-end on both stacks:
added a product via `?add-to-cart=<id>`, then confirmed `/cart/` and `/checkout/` render the full
line-items/totals/payment UI (~10KB of markup, vs. the ~9-byte broken shell before).

## WordPress button text-contrast fix

Both WordPress demos had near-invisible button/link text: "Lägg till i varukorg" (Add to
cart, product pages) and "Fortsätt till kassan" (Proceed to checkout, cart page) rendered as
very light/washed-out text, barely readable against their backgrounds. Root cause:
`wordpress/design-a/theme-overrides/theme.json` and the design-b equivalent define a full
custom color palette (`primary`, `on-primary`, `surface`, `ink`, etc.) but never define a
`contrast` palette slug, and neither defines `styles.elements.button`. WordPress's default
button-element style formula (inherited from the `twentytwentyfive` parent theme) is
`background-color: var(--wp--preset--color--contrast); color: var(--wp--preset--color--base)`.
Because our child theme.json replaces the parent's color palette wholesale (rather than
merging into it), `--wp--preset--color--contrast` became an undefined CSS variable — so the
button's background rule was invalid/ignored while its text still resolved to `base`
(a light cream, `#f5f0e6`), landing on top of whatever background happened to be present and
producing very low contrast. Fixed by adding an explicit `styles.elements.button` block to
both `wordpress/design-a/theme-overrides/theme.json` and `wordpress/design-b/theme-overrides/theme.json`,
setting background to the design's `primary` token and text to `on-primary` (with matching
`:hover`/`:focus` states using `primary-dark`) — the same token pairing already used
explicitly on the hand-authored front-page buttons. Verified via `wp_get_global_stylesheet()`
(button CSS now reads `background-color: var(--wp--preset--color--primary)` /
`color: var(--wp--preset--color--on-primary)`, both resolving to real, high-contrast hex
values) and visually via Playwright screenshots of the product page ("Lägg till i varukorg")
and cart page ("Fortsätt till kassan") on both `:8091` and `:8092` — button text is now clearly
legible on both.
