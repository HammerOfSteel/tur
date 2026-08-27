# Phase 1 implementation plan: Shared Design System

**Spec:** `docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md` (§4)
**Roadmap:** `TODO.md` — Phase 1 — Shared Design System
**Depends on:** Phase 0 (done) — `content/products.json`, `content/pages.sv.json`,
`assets/products/`, `assets/gallery/`

**Goal:** Produce the single source of truth for the "Skogsstig" design system — exact color/
type/spacing values for both variants (Classic, Varm) as machine-readable tokens, a
human-readable doc, and a static HTML/CSS style-tile to sanity-check the look before any
WordPress or React code is written. Phase 2 (`theme.json`) and Phase 4 (Tailwind config) will
both read the token values produced here — they must not re-derive or drift from them.

This project folder is **NOT a git repo** — every "Commit" step below is a no-op; do not run
git commands.

---

## Design tokens (author once, both variants read from here)

### Shared tokens (same for both variants)

| Token | Value |
|---|---|
| `--font-body` | `"Inter", "Helvetica Neue", Arial, sans-serif` |
| `--space-1` … `--space-9` | `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px` |
| `--radius-sm` / `--radius-md` / `--radius-lg` | `4px / 10px / 20px` |
| `--shadow-sm` | `0 1px 2px rgba(20, 20, 10, 0.08)` |
| `--shadow-md` | `0 4px 16px rgba(20, 20, 10, 0.12)` |
| `--text-sm` / `--text-base` / `--text-lg` | `0.875rem / 1rem / 1.25rem` |
| `--text-xl` / `--text-2xl` / `--text-3xl` | `1.75rem / 2.5rem / 3.5rem` |
| `--container-max` | `1200px` |
| `--color-success` | `#3f7d4e` |
| `--color-error` | `#a4442b` |
| `--color-base` (shared warm birch/cream, both variants) | `#f5f0e6` |

### Variant A — "Skogsstig Classic" (forest green + serif)

| Token | Value |
|---|---|
| `--font-heading` | `"Fraunces", Georgia, serif` |
| `--color-primary` | `#2b3a2a` |
| `--color-primary-dark` | `#1c271b` |
| `--color-on-primary` | `#f5f0e6` |
| `--color-surface` | `#ffffff` |
| `--color-text` | `#232922` |
| `--color-text-muted` | `#5c6b58` |
| `--color-border` | `#ddd4c2` |
| `--color-accent` | `#8a6d3b` |

### Variant B — "Skogsstig Varm" (terracotta/rust + humanist sans)

| Token | Value |
|---|---|
| `--font-heading` | `"Work Sans", "Helvetica Neue", Arial, sans-serif` |
| `--color-primary` | `#c9603a` |
| `--color-primary-dark` | `#9c4527` |
| `--color-on-primary` | `#f5f0e6` |
| `--color-surface` | `#fbf5ee` |
| `--color-text` | `#2c2420` |
| `--color-text-muted` | `#6b5d54` |
| `--color-border` | `#e3d6c8` |
| `--color-accent` | `#4b6b4f` |

`--font-heading` fonts (Fraunces, Work Sans) and `--font-body` (Inter) should be loaded from
Google Fonts `<link>`/`@import` in the style-tile and later in each demo — no local font files
needed.

---

## Tasks

### Task 1: Machine-readable token files

**Files:**
- Create: `design-system/tokens/shared.json`
- Create: `design-system/tokens/classic.json`
- Create: `design-system/tokens/varm.json`

- [ ] **Step 1:** Create `design-system/tokens/shared.json` containing every "Shared tokens" row
  above as flat key/value pairs, keys without the `--` prefix and camelCase (e.g. `fontBody`,
  `space1`…`space9`, `radiusSm`, `radiusMd`, `radiusLg`, `shadowSm`, `shadowMd`, `textSm`,
  `textBase`, `textLg`, `textXl`, `text2xl`, `text3xl`, `containerMax`, `colorSuccess`,
  `colorError`, `colorBase`). Use plain JSON (no comments).

- [ ] **Step 2:** Create `design-system/tokens/classic.json` with keys `fontHeading`,
  `colorPrimary`, `colorPrimaryDark`, `colorOnPrimary`, `colorSurface`, `colorText`,
  `colorTextMuted`, `colorBorder`, `colorAccent` using the "Variant A" values above.

- [ ] **Step 3:** Create `design-system/tokens/varm.json` with the same keys using the
  "Variant B" values above.

- [ ] **Step 4:** Validate all three files parse as JSON: run
  `python3 -c "import json; [json.load(open(f)) for f in ['design-system/tokens/shared.json','design-system/tokens/classic.json','design-system/tokens/varm.json']]; print('OK: tokens are valid JSON')"`
  Expected output: `OK: tokens are valid JSON`

- [ ] **Step 5: Commit** — SKIP (not a git repo).

---

### Task 2: Human-readable design tokens doc

**Files:**
- Create: `docs/design/tokens.md`

- [ ] **Step 1:** Write `docs/design/tokens.md` with these sections, transcribing the exact
  values from the "Design tokens" block above (do not invent new values — this doc must match
  the JSON files exactly):
  - A one-paragraph intro: this doc is the single source of truth for colors/type/spacing;
    Phase 2 (`theme.json`) and Phase 4 (Tailwind config) must read from
    `design-system/tokens/*.json`, not redefine values independently.
  - "Shared foundations" table (fonts, spacing scale, radii, shadows, type scale, container
    width, success/error colors, shared base color).
  - "Variant A — Skogsstig Classic" table (heading font + all 8 color tokens) with a one-line
    description: forest green + cream, serif display headings, calm editorial magazine feel.
  - "Variant B — Skogsstig Varm" table (heading font + all 8 color tokens) with a one-line
    description: same layout DNA, warm terracotta/rust accent, humanist sans-serif headings.
  - A short "Usage" note: both variants share one layout/component implementation; only the
    token values swap. WordPress reads them via `theme.json` per variant; React reads them via
    Tailwind theme config / CSS variables per variant. Non-token layout/spacing decisions
    (breakpoints beyond `--container-max`, grid columns, etc.) will be defined per-phase as
    needed and are out of scope for this doc.

- [ ] **Step 2: Commit** — SKIP (not a git repo).

---

### Task 3: Static style-tile (HTML/CSS)

**Files:**
- Create: `design-system/style-tile/index.html`
- Create: `design-system/style-tile/shared.css`
- Create: `design-system/style-tile/classic.css`
- Create: `design-system/style-tile/varm.css`

Purpose: a single static page, viewable by opening the HTML file directly in a browser (no
build step, no server required), that renders the same content twice — once styled as Classic,
once styled as Varm — stacked vertically in that order on one page, so both variants can be
visually compared before any real templates are built.

- [ ] **Step 1:** Write `design-system/style-tile/shared.css` with the shared, variant-agnostic
  CSS: base resets, `--space-*`/`--radius-*`/`--shadow-*`/`--text-*`/`--container-max` custom
  properties and `--color-success`/`--color-error`/`--color-base` (values from
  `design-system/tokens/shared.json`), and structural rules (layout, `.swatch`, `.swatch-grid`,
  `.type-sample`, `.button`, `.button--secondary`, `.card`, `.card-grid`, `.badge`,
  `.form-field`) that reference variant-specific custom properties (`--color-primary`,
  `--color-text`, `--font-heading`, etc.) without defining their values — those come from
  `classic.css`/`varm.css`.

- [ ] **Step 2:** Write `design-system/style-tile/classic.css` and
  `design-system/style-tile/varm.css`, each defining the 9 variant-specific custom properties
  (`--font-heading`, `--color-primary`, `--color-primary-dark`, `--color-on-primary`,
  `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`)
  scoped under a class selector — `.variant-classic { ... }` and `.variant-varm { ... }`
  respectively — using the exact values from the corresponding token JSON file. Do not scope to
  `:root` since both variants render on the same page.

- [ ] **Step 3:** Write `design-system/style-tile/index.html` — a single static page (no JS
  framework, no build step) that:
  - Loads Google Fonts for Inter, Fraunces, and Work Sans via `<link>` tag(s) in `<head>`.
  - Loads `shared.css`, then `classic.css`, then `varm.css`.
  - Contains two full sections, `<section class="variant-classic">` and
    `<section class="variant-varm">`, each with identical markup showing:
    - A labelled color swatch grid (all 8 variant color tokens — i.e. the 9 variant-specific
      custom properties from Step 2 minus `--font-heading`, which is not a color — plus the 3
      shared colors `--color-base`, `--color-success`, `--color-error`; each swatch shows its
      token name and hex value as text, e.g. `--color-primary #2b3a2a`).
    - Type samples using this exact copy, taken verbatim from `content/pages.sv.json`'s `home`
      section: an `h1` with the text of `home.hero_tagline` ("Ge friluftslivet ett nytt liv"),
      an `h2` with the text "Handla efter kategori" (`home.featured_categories_title`), an `h3`
      with the text "Öppettider & plats" (a static label, not from JSON), and a paragraph with
      the text of `home.circular_economy_blurb`. `h1`/`h2`/`h3` use `--font-heading`; the
      paragraph uses `--font-body`.
    - Two buttons with the exact labels "Lägg i varukorg" (primary, `--color-primary`
      background, `--color-on-primary` text) and "Visa produkt" (secondary/outline style,
      transparent background, `--color-primary` border and text).
    - A product card sample using the product with `id: "jacka-fjallraven-nuuk"` from
      `content/products.json` (name: "Fjällräven Nuuk Parka", price_sek: 899, condition:
      "Mycket gott skick, varm och fin med bara lätta spår av användning"). Show its image
      using `<img src="../../assets/products/jacka-fjallraven-nuuk.jpg" alt="Fjällräven Nuuk
      Parka" style="width:100%;border-radius:var(--radius-md);">` (path is relative from
      `design-system/style-tile/index.html` up two levels to the repo root, then into
      `assets/products/`), the name as a card heading, "899 kr" as the price line, the
      condition text below it, and a `.badge` element containing the text "Begagnad".
    - One form field sample: a `<label>` with text "E-post" for a `<input type="email"
      placeholder="din@epost.se">`, wrapped in a `.form-field` div.
  - Include an `h2`-level page heading above each section (outside the `.variant-classic`/
    `.variant-varm` div, in plain shared styling) labelling it "Variant A — Skogsstig Classic"
    / "Variant B — Skogsstig Varm".

- [ ] **Step 4: Sanity-check markup/CSS validity.** Run:
  `python3 -c "import html.parser; p = html.parser.HTMLParser(); p.feed(open('design-system/style-tile/index.html', encoding='utf-8').read()); print('OK: index.html parses as HTML')"`
  Expected output: `OK: index.html parses as HTML`. Also confirm no `.css` file references a
  variant color/font variable without it being defined in `classic.css`/`varm.css`/`shared.css`
  (spot-check by reading the files back).

- [ ] **Step 5: Commit** — SKIP (not a git repo).

---

### Task 4: Close out Phase 1

**Files:**
- Modify: `TODO.md` (check off Phase 1 boxes)
- Modify: `OVERVIEW.md` (append a short note)

- [ ] **Step 1:** Open `design-system/style-tile/index.html` in a browser. Because the page
  references `../../assets/products/...` with a relative path, either open the file directly
  via a `file://` URL (relative paths resolve correctly this way), or if a local server is
  preferred, serve the **repo root** — not the `style-tile` folder — e.g.
  `python3 -m http.server 8123` run from the repo root, then fetch
  `http://localhost:8123/design-system/style-tile/index.html`. Visually confirm: both variant
  sections render with visibly distinct colors/fonts, the product image loads (not a
  broken-image icon), and swatches show the correct hex values as labels. Stop the server
  afterward.

- [ ] **Step 2:** Re-run the Task 1 and Task 3 validation commands once more to confirm nothing
  regressed, plus the Phase 0 validator for good measure:
  `python3 tests/validate_content.py`
  Expected: `OK: content/products.json and content/pages.sv.json are valid`

- [ ] **Step 3:** Check off every Phase 1 box in `TODO.md`.

- [ ] **Step 4:** Append a short note under a new `## Design system (Phase 1)` heading in
  `OVERVIEW.md` pointing future phases at `design-system/tokens/*.json` (machine-readable, read
  by Phase 2's `theme.json` and Phase 4's Tailwind config) and `design-system/style-tile/` (the
  visual reference) as the sources of truth — no color/type value should be redefined ad hoc in
  a later phase.

- [ ] **Step 5: Commit** — SKIP (not a git repo).

---

## Handoff

Once this plan's tasks are checked off, Phase 2 (WordPress shared theme + Design A) can begin —
its `theme.json` for Variant A must read the exact values from
`design-system/tokens/shared.json` + `design-system/tokens/classic.json`, and its markup/visual
language should match what `design-system/style-tile/index.html` demonstrated.
