# Tur Second Hand — Redesign Pitch Prototypes

Local, self-contained prototype websites built to pitch a redesign to **Tur Second Hand**, a
secondhand outdoor/ski gear shop in Östersund. Their live site
([tursecondhand.se](https://tursecondhand.se/)) is currently the default WordPress "Twenty
Twenty-Five" theme with no custom content — this project builds real, demoable alternatives.

Not a production deployment: no live payments, no real hosting, no real inventory system.
Everything here runs locally via Docker for an in-person pitch demo.

See [`OVERVIEW.md`](OVERVIEW.md) for brand direction/content rationale and
[`TODO.md`](TODO.md) for the phased task breakdown. The full design spec lives at
[`docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md`](docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md).

## What's here

Four independent demos, two tech stacks × two design variants of the same "Skogsstig" brand
direction (see OVERVIEW.md):

| Folder | Stack | Design variant |
|---|---|---|
| `wordpress/design-a/` | WordPress + WooCommerce (theme frontend) | Skogsstig Classic (forest green / serif) |
| `wordpress/design-b/` | WordPress + WooCommerce (theme frontend) | Skogsstig Varm (terracotta / sans) |
| `react/design-a/` | Next.js + Tailwind + shadcn/ui, **headless WooCommerce backend** | Skogsstig Classic |
| `react/design-b/` | Next.js + Tailwind + shadcn/ui, **headless WooCommerce backend** | Skogsstig Varm |

**Admin:** every demo — WordPress or React — is managed through the exact same wp-admin /
WooCommerce dashboard. The React demos are just a different storefront in front of the same
WooCommerce data (via its Store API); there is no separate/custom admin to learn. This means
whichever track the owner picks after the pitch, they already know how to add products and
view orders.

Shared, non-duplicated source lives in `wordpress/theme/` (one custom child theme, two
`theme.json` variants) and `react/app/` (one Next.js app, variant selected by env var, talking
to the WooCommerce Store API) — see each track's section in the design spec for how each demo
folder wires up the shared source.

Other top-level folders:
- `unsplash/` — source photography provided for this project.
- `assets/` — processed/optimized images used across the demos, plus `assets/credits.md` for
  sourcing/licensing notes.
- `content/` — shared content inventory (product catalog, page copy) reused by both stacks so
  all four demos show identical products/text (see OVERVIEW.md).

## Running a demo

*(Filled in as each track is built — see TODO.md for status.)*

Each demo folder is independently runnable:

```bash
cd wordpress/design-a   # or wordpress/design-b, react/design-a, react/design-b
docker compose up
```

- WordPress demos seed themselves on first `up` (WooCommerce install, demo products, theme
  activation) — no manual setup required.
- React demos spin up their own WordPress+WooCommerce backend (headless, seeded the same way)
  alongside the shared Next.js app pinned to that folder's design variant — `docker compose up`
  gives a fully working headless storefront, not just a frontend shell.

### WordPress Design A ("Skogsstig Classic") — tested, ready to demo

```bash
cd wordpress/design-a
docker compose up -d
```

First run takes **2-4 minutes**: WordPress core install, WooCommerce install/config, Swedish
(`sv_SE`) language pack, 5 product categories, 12 demo products (with images), and the
shop/cart/checkout/Om oss/Galleri/Kontakt/Hem pages are all created automatically by the
`wpcli` service's seed script. Watch progress with `docker compose logs -f wpcli`; it exits
once seeding is done (`Seed script completed.`). Re-running `docker compose up -d` (or
`docker compose run --rm wpcli sh /mnt/seed.sh`) is safe — the script updates existing
content instead of duplicating it.

- **Storefront:** http://localhost:8091
- **wp-admin:** http://localhost:8091/wp-admin/ — login `admin` / `demo1234`
  (demo-only credential, not for production use)
- Stop the demo: `docker compose down` (add `-v` to also wipe the database/uploads volumes
  for a fully clean next run).

### WordPress Design B ("Skogsstig Varm") — tested, ready to demo

Identical setup to Design A, just a different folder and port — same shared theme, same
content, only the color/type tokens differ (terracotta/forest-green primary, Work Sans
headings instead of Fraunces):

```bash
cd wordpress/design-b
docker compose up -d
```

- **Storefront:** http://localhost:8092
- **wp-admin:** http://localhost:8092/wp-admin/ — login `admin` / `demo1234`
- Stop the demo: `docker compose down` (add `-v` for a fully clean next run).

## Project docs

- [`OVERVIEW.md`](OVERVIEW.md) — brand direction, content inventory, decisions log.
- [`TODO.md`](TODO.md) — phased task breakdown.
- [`docs/superpowers/specs/`](docs/superpowers/specs/) — approved design spec.
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — detailed step-by-step implementation
  plans, written per phase as we reach them.
