# Phase 2 implementation plan: WordPress shared theme + Design A (Skogsstig Classic)

**Spec:** `docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md` (§4, §5, §6, §7.1)
**Roadmap:** `TODO.md` — Phase 2 — WordPress: Shared Theme + Design A
**Depends on:** Phase 0 (content/assets, done), Phase 1 (design tokens, done)

**Goal:** A `docker compose up` in `wordpress/design-a/` produces a fully seeded, ready-to-demo
WooCommerce site — real WordPress Pages for Home/Om oss/Kontakt/Galleri (content imported from
`content/pages.sv.json`), a real WooCommerce product catalog (imported from
`content/products.json`), a working cart/checkout that meets the spec's §7.1 acceptance
criteria, and the "Skogsstig Classic" look (Variant A design tokens from
`design-system/tokens/shared.json` + `classic.json`) applied via a custom **shared** child
theme living in `wordpress/theme/` plus a small **per-variant override** (`theme.json` +
companion stylesheet) living in each variant's own folder — shared because Phase 3 (Design B)
reuses the theme directory's templates/parts/patterns/base styles completely unmodified,
supplying only its own override files.

This project folder is **NOT a git repo** — every "Commit" step below is a no-op; do not run
git commands.

**Docker is available in this environment** (`docker --version` / `docker compose version`
both succeed) — every task's validation step assumes it can actually run
`docker compose up`/`down` locally.

---

## Architecture recap (from the spec, read in full before starting)

- One shared theme directory: `wordpress/theme/tur-secondhand/` — a child theme of the built-in
  "Twenty Twenty-Five" block/FSE theme. Contains `style.css` (theme header + `Template:
  twentytwentyfive`, plus variant-agnostic CSS that only ever reads `var(--wp--preset--*)`/
  `var(--wp--custom--*)` custom properties — never a literal color/px value), `functions.php`,
  template parts (header, footer), page/front-page templates, and a "product card" block
  pattern. A minimal placeholder `theme.json` also lives here as a fallback default, but the
  **real, active** `theme.json` for a given demo is supplied per-variant (see below) and
  layered on top at container-mount time — this directory's own `theme.json` is never the one
  actually used once a variant is running. This directory is never forked or edited per
  variant.
- Each variant folder (`wordpress/design-a/`, and later `wordpress/design-b/`) has its own
  `theme-overrides/theme.json` (the variant's design tokens, per §4) and
  `theme-overrides/variant.css` (a companion stylesheet for anything not expressible as a
  theme.json setting — expected to be nearly empty for this project, since almost everything
  needed is a theme.json color/typography/spacing/custom-property value, but the file must
  exist so `functions.php` can unconditionally enqueue it). `docker-compose.yml` mounts the
  shared theme directory, then mounts these two override files on top at the same in-container
  paths (`.../tur-secondhand/theme.json` and `.../tur-secondhand/variant.css`), in **both** the
  `wordpress` and `wpcli` services identically. Docker generally allows layering a file bind
  mount inside an already-bind-mounted directory, so no build step or image is normally needed
  — but Task 4, Step 3 validates this actually works on the Docker version available in this
  environment, and falls back to a small shared Dockerfile (used by both services) that
  `COPY`s the theme directory and then the two override files on top at build time, if the
  bind-mount-layering approach is rejected. Either way, this is the concrete mechanism for
  "shared theme + per-variant theme.json + companion stylesheet" from the spec.
- `wordpress/design-a/docker-compose.yml`: `db` (MySQL) + `wordpress` + a one-shot `wpcli`
  service that seeds everything on first `up` (installs/activates WooCommerce, imports
  products, creates+populates pages, activates the theme, configures the checkout gateway). The
  `wordpress` and `wpcli` services share the *same* named volume mounted at `/var/www/html` (the
  standard official-image pattern), so `wp` commands run by `wpcli` operate on the exact same
  WordPress install the `wordpress` service serves.
- WooCommerce checkout uses the built-in "Cheque"/manual payment gateway (renamed "Betalning
  vid upphämtning" — pay on pickup) so checkout completes without a real payment integration.
- Product data source: `content/products.json` (12 products, Phase 0). Page copy source:
  `content/pages.sv.json` (Phase 0). Demo wp-admin login: username `admin`, password
  `demo1234` (fixed, documented here once — every later task and the final README reuses this
  exact value, it is not decided later).
- Any imagery needed as **theme chrome** (e.g. the front-page hero background) is bundled as a
  static theme asset file copied once into `wordpress/theme/tur-secondhand/assets/images/` and
  referenced by URL directly in the template markup — it does NOT go through the WordPress
  media library or the seed script, avoiding any ordering dependency between the theme task and
  the seeding task. Only true content media — product photos and the Galleri page's images —
  are uploaded to the media library, and only by the seed script (Task 5).

---

## Tasks

### Task 1: Shared theme skeleton

**Files:**
- Create: `wordpress/theme/tur-secondhand/style.css`
- Create: `wordpress/theme/tur-secondhand/functions.php`
- Create: `wordpress/theme/tur-secondhand/theme.json` (minimal placeholder, replaced fully in
  Task 2)
- Create: `wordpress/theme/tur-secondhand/templates/index.html` (FSE templates dir, minimal
  passthrough)
- Create: `wordpress/theme/tur-secondhand/screenshot.png` (any placeholder image is fine, e.g.
  reuse `assets/gallery/trail-1.jpg` resized/copied — WordPress requires this file to exist for
  the theme to show a thumbnail in wp-admin, content doesn't matter for this demo)

- [ ] **Step 1:** Create `wordpress/theme/tur-secondhand/style.css` with the required WordPress
  theme header comment block: `Theme Name: Tur Second Hand`, `Template: twentytwentyfive` (this
  makes it a child theme of the bundled Twenty Twenty-Five block theme), `Version: 0.1.0`,
  `Text Domain: tur-secondhand`. No CSS rules needed below the header yet (Task 3 adds them).

- [ ] **Step 2:** Create `wordpress/theme/tur-secondhand/functions.php` — a child theme
  functions file that: registers theme support for `woocommerce`
  (`add_theme_support('woocommerce')`) so WooCommerce recognizes this as a WooCommerce-compatible
  theme and serves its own block templates for shop/product/cart/checkout without a fatal
  notice; and unconditionally enqueues `variant.css` after the theme's own `style.css` (e.g.
  `wp_enqueue_style('tur-secondhand-variant', get_stylesheet_directory_uri() . '/variant.css',
  ['tur-secondhand-style'], null)`) — this file is expected to exist at runtime because Task 4's
  docker-compose mounts the active variant's `theme-overrides/variant.css` onto this exact path
  inside the container; a placeholder empty `variant.css` (Step 3a below) keeps things working
  before that mount is wired up.

- [ ] **Step 3:** Create `wordpress/theme/tur-secondhand/theme.json` — a placeholder fallback
  only (used if a variant override somehow isn't mounted): copy Twenty Twenty-Five's own
  `theme.json` `$schema` line and an empty `settings`/`styles` structure (`{"$schema":
  "https://schemas.wp.org/trunk/theme.json", "version": 3, "settings": {}, "styles": {}}`). The
  **real** Variant A `theme.json` is created in Task 2 at
  `wordpress/design-a/theme-overrides/theme.json`, not here — this file in the shared theme
  directory is never edited again after this task.

- [ ] **Step 3a:** Create an empty placeholder `wordpress/theme/tur-secondhand/variant.css`
  (may contain just a comment, e.g. `/* overridden per-variant at container mount time */`) so
  `functions.php`'s unconditional enqueue never 404s before a variant override is mounted. The
  **real** Variant A `variant.css` is created in Task 2 at
  `wordpress/design-a/theme-overrides/variant.css`, not here.

- [ ] **Step 4:** Create `wordpress/theme/tur-secondhand/templates/index.html` containing a
  minimal valid FSE template (a single `<!-- wp:template-part {"slug":"header"} /-->` /
  `<!-- wp:post-content /-->` / `<!-- wp:template-part {"slug":"footer"} /-->` block sequence)
  — placeholder only, Task 3 (theme content task) adds `templates/front-page.html`,
  `templates/page.html`, and the template parts.

- [ ] **Step 5:** Create a `wordpress/theme/tur-secondhand/screenshot.png` file (any valid PNG,
  e.g. `cp assets/gallery/trail-1.jpg wordpress/theme/tur-secondhand/screenshot.png` — the
  extension mismatch doesn't matter for a local demo, but if you have Pillow available convert
  it to a real PNG instead: `python3 -c "from PIL import Image; Image.open('assets/gallery/trail-1.jpg').save('wordpress/theme/tur-secondhand/screenshot.png')"`).

- [ ] **Step 6: Commit** — SKIP (not a git repo).

---

### Task 2: `theme-overrides/` for Variant A (Skogsstig Classic)

**Files:**
- Create: `wordpress/design-a/theme-overrides/theme.json`
- Create: `wordpress/design-a/theme-overrides/variant.css`

These two files are the concrete "variant-specific theme.json + companion stylesheet override"
from the spec — they live in the **variant folder**, not the shared theme directory, and get
mounted on top of the shared theme at the same in-container paths by Task 4's
docker-compose.yml. Phase 3 (Design B) will create its own
`wordpress/design-b/theme-overrides/theme.json` + `variant.css` with different values, without
touching anything under `wordpress/theme/tur-secondhand/`.

- [ ] **Step 1:** Create `wordpress/design-a/theme-overrides/theme.json` — a full theme.json
  (v3) that defines, under `settings.color.palette`, one named color entry per token in
  `design-system/tokens/shared.json` + `design-system/tokens/classic.json` (read both files —
  do not hardcode different values than what's in them). Use these exact slugs and values:

  | slug | value (from tokens) |
  |---|---|
  | `primary` | `classic.json` → `colorPrimary` (`#2b3a2a`) |
  | `primary-dark` | `classic.json` → `colorPrimaryDark` (`#1c271b`) |
  | `on-primary` | `classic.json` → `colorOnPrimary` (`#f5f0e6`) |
  | `surface` | `classic.json` → `colorSurface` (`#ffffff`) |
  | `text` | `classic.json` → `colorText` (`#232922`) |
  | `text-muted` | `classic.json` → `colorTextMuted` (`#5c6b58`) |
  | `border` | `classic.json` → `colorBorder` (`#ddd4c2`) |
  | `accent` | `classic.json` → `colorAccent` (`#8a6d3b`) |
  | `base` | `shared.json` → `colorBase` (`#f5f0e6`) |
  | `success` | `shared.json` → `colorSuccess` (`#3f7d4e`) |
  | `error` | `shared.json` → `colorError` (`#a4442b`) |


- [ ] **Step 2:** Under `settings.typography.fontFamilies`, define `heading` using
  `classic.json`'s `fontHeading` (`"Fraunces", Georgia, serif`) and `body` using
  `shared.json`'s `fontBody` (`"Inter", "Helvetica Neue", Arial, sans-serif`). Under
  `settings.typography.fontSizes`, define named sizes `small`/`medium`/`large`/`x-large`/
  `xx-large`/`xxx-large` from `shared.json`'s `textSm`/`textBase`/`textLg`/`textXl`/`text2xl`/
  `text3xl`.

- [ ] **Step 3:** Under `settings.spacing.spacingSizes`, define entries `1`–`9` from
  `shared.json`'s `space1`…`space9`. Under `settings.custom`, add `radiusSm`/`radiusMd`/
  `radiusLg` and `shadowSm`/`shadowMd` from `shared.json` (theme.json doesn't have first-class
  radius/shadow settings, so these become custom properties usable as `var(--wp--custom--radius-md)`
  etc. in block styles/CSS).

- [ ] **Step 4:** Under `styles`, set: `color.background` to the `base` palette color,
  `color.text` to the `text` palette color, `typography.fontFamily` to the `body` font family,
  and heading block styles (`styles.blocks.core/heading` or `elements.heading`) to use the
  `heading` font family and `text` color.

- [ ] **Step 5:** Create `wordpress/design-a/theme-overrides/variant.css` — for this phase it
  can be nearly empty (a comment header identifying it as the Variant A companion stylesheet is
  enough, e.g. `/* Skogsstig Classic — variant-only overrides not expressible in theme.json */`)
  since the color/type/spacing tokens above cover everything currently needed. This file must
  still exist so Task 4's mount and `functions.php`'s enqueue succeed.

- [ ] **Step 6: Validate.** Run:
  `python3 -c "import json; json.load(open('wordpress/design-a/theme-overrides/theme.json')); print('OK: theme.json is valid JSON')"`
  Expected: `OK: theme.json is valid JSON`. Also re-open `design-system/tokens/classic.json`
  and `shared.json` and diff every value used above against them by eye — no value in
  `theme.json` may differ from its token source.

- [ ] **Step 7: Commit** — SKIP (not a git repo).

---

### Task 3: Template parts, front page, and product-card pattern

**Files:**
- Create: `wordpress/theme/tur-secondhand/parts/header.html`
- Create: `wordpress/theme/tur-secondhand/parts/footer.html`
- Create: `wordpress/theme/tur-secondhand/templates/front-page.html`
- Create: `wordpress/theme/tur-secondhand/templates/page.html`
- Create: `wordpress/theme/tur-secondhand/patterns/product-card.php`
- Create: `wordpress/theme/tur-secondhand/style.css` (append rules)

- [ ] **Step 1:** Write `parts/header.html` as an FSE template part: site title/logo text
  "Tur Second Hand" linking to home, a nav with links to the four seeded pages (Butik, Om oss,
  Galleri, Kontakt — slugs match Task 5's seed script: `/butik/`, `/om-oss/`, `/galleri/`,
  `/kontakt/`) and a cart icon/count using WooCommerce's `<!-- wp:woocommerce/mini-cart /-->`
  block. Use `--wp--preset--color--surface` background and `--wp--preset--color--text` text via
  block-level `style` attributes or the `backgroundColor`/`textColor` block supports (referring
  to the `surface`/`text` palette slugs from Task 2), so it automatically reflects whichever
  variant's `theme.json` is active without any hardcoded hex values in the markup.

- [ ] **Step 2:** Write `parts/footer.html` with: the address/hours teaser copied verbatim from
  `content/pages.sv.json`'s `kontakt.address` and `kontakt.hours`, the Instagram link
  (`kontakt.instagram_url`), and a "© Tur Second Hand" line. Same palette-slug-only styling
  rule as Step 1 (no hardcoded hex values).

- [ ] **Step 3:** Copy `assets/gallery/trail-2.jpg` into
  `wordpress/theme/tur-secondhand/assets/images/hero.jpg` (a static theme asset, not a media
  library upload — see the plan's Architecture recap for why). Write
  `templates/front-page.html` composing, in order: the header part, a hero section (heading =
  `home.hero_tagline`, subtext = `home.hero_subtext`, background image referenced by a
  **root-relative URL string, hardcoded literally** —
  `/wp-content/themes/tur-secondhand/assets/images/hero.jpg` — in an inline `style` attribute or
  a `<!-- wp:cover -->` block's `url` attribute. Do **not** use `get_theme_file_uri()` or any
  other PHP call here: static FSE `.html` template files are parsed as block markup, not
  executed as PHP, so a PHP function call embedded in the markup would render as literal text,
  not a resolved URL. A root-relative path works regardless of host/port because it doesn't
  need to know the domain — WordPress always serves theme files at
  `/wp-content/themes/<theme-slug>/...` regardless of which install/port it's running on), a
  "featured categories" section titled `home.featured_categories_title` linking to
  `/butik/?product_cat=<slug>` for each of the 5 categories, using this fixed name→slug mapping
  (identical to Task 5, Step 5, which creates the WooCommerce terms with these same slugs — do
  not derive slugs any other way): `Jackor` → `jackor`, `Ryggsäckar` → `ryggsackar`,
  `Skidor & Pjäxor` → `skidor-pjaxor`, `Sovsäckar` → `sovsackar`, `Kläder` → `klader`. Use the
  Swedish name (left side) as the visible link label and the slug (right side) only in the URL,
  then a circular economy blurb section (`home.circular_economy_blurb`), an hours/location
  teaser (`home.hours_location_teaser`), and the footer part. Use real copy strings verbatim
  from `content/pages.sv.json` — do not paraphrase.

- [ ] **Step 4:** Write `templates/page.html` — a generic template for the plain content pages
  (Om oss, Kontakt, Galleri all use this same shared template — do not add Kontakt-specific
  markup or conditionals to this file; Kontakt's map placeholder is injected via its own page
  *content* in Task 5, not via template logic. Butik/Produkt/Varukorg/Kassa are WooCommerce's
  own built-in block templates, untouched): header part, page title,
  `<!-- wp:post-content /-->`, footer part.

- [ ] **Step 4a:** Per `content/contact-map-decision.md` (Phase 0), the Kontakt page uses a
  **static image**, not a live map embed. No real static map tile image exists in this project
  yet (`assets/` has no map graphic). Rather than depend on an external map-tiles service at
  build time (which would recreate the offline-fragility problem the static-image decision was
  meant to avoid), create a simple static placeholder graphic that reads clearly as "our
  location" without pretending to be a real street map: e.g. a plain image showing the address
  text large, on a `base`/`surface` colored background with a `border`, roughly map-tile
  proportioned (such as 4:3). If you have Pillow available, generate this as a real PNG file at
  `wordpress/theme/tur-secondhand/assets/images/kontakt-placeholder.png` (simple colored
  rectangle + text is sufficient). This file only needs to exist at this theme-relative path —
  Task 5 is responsible for referencing it (by the same root-relative URL convention as Step 3,
  `/wp-content/themes/tur-secondhand/assets/images/kontakt-placeholder.png`) inside the actual
  Kontakt page's `post_content` when it seeds that page; nothing about it belongs in
  `page.html` itself. This is a static theme asset, not a media library upload, for the same
  ordering reason as the hero image in Step 3.

- [ ] **Step 5:** Write `patterns/product-card.php` — a registered block pattern (PHP file with
  the standard block-pattern header comment: `Title`, `Slug: tur-secondhand/product-card`,
  `Categories: woocommerce`) providing a styled product card layout (image, name, price,
  "Begagnad"-style condition badge, add-to-cart button) matching the style-tile's `.card`
  appearance from `design-system/style-tile/shared.css` — reuse the same visual language
  (rounded corners via `--wp--custom--radius-md`, soft shadow via `--wp--custom--shadow-sm`,
  badge styling) but expressed as WooCommerce/Gutenberg blocks instead of raw HTML/CSS classes.
  This pattern is a visual reference for how WooCommerce's product loop item should be styled —
  register it via `register_block_pattern()` in `functions.php` and note in a comment that it
  is offered as an insertable pattern for the Shop archive design, not a hard requirement that
  every product-loop instance use it verbatim (WooCommerce's own archive template can be
  edited in the Site Editor to swap in this pattern).

- [ ] **Step 6:** Append to `wordpress/theme/tur-secondhand/style.css` (below the theme header):
  CSS rules for `.wc-block-mini-cart`, `.badge`/condition-label styling, and card/button
  refinements using `var(--wp--preset--color--*)`, `var(--wp--custom--radius-*)`, and
  `var(--wp--custom--shadow-*)` custom properties only — never a literal hex/px value — so
  Phase 3's Design B automatically re-skins by supplying its own
  `theme-overrides/theme.json` + `variant.css`, with zero changes to this shared file.

- [ ] **Step 7: Validate.** Run:
  `python3 -c "
import xml.etree.ElementTree as ET
for f in ['wordpress/theme/tur-secondhand/parts/header.html','wordpress/theme/tur-secondhand/parts/footer.html','wordpress/theme/tur-secondhand/templates/front-page.html','wordpress/theme/tur-secondhand/templates/page.html']:
    open(f, encoding='utf-8').read()
print('OK: template files readable')
"`
  (This is just a read-and-parse-doesn't-crash smoke check — full FSE template validation
  happens when WordPress actually loads the theme in Task 6.) Also grep the new `style.css`
  additions and `parts/*.html` for any literal `#` hex color or bare `px` value outside a CSS
  custom property definition — there should be none (all values must flow through the
  `--wp--preset--*`/`--wp--custom--*` variables defined in `theme.json`).

- [ ] **Step 8: Commit** — SKIP (not a git repo).

---

### Task 4: `docker-compose.yml` for `wordpress/design-a/`

**Files:**
- Create: `wordpress/design-a/docker-compose.yml`
- Create: `wordpress/design-a/.env` (or inline environment values — implementer's choice, but
  document whichever is chosen)

- [ ] **Step 1:** Write `wordpress/design-a/docker-compose.yml` with three services:
  - `db`: `mysql:8.0` (or `mariadb:10.11` — pick one and use it consistently across all four
    demos in later phases; note the choice in this task's report), with a named volume for
    persistence and `MYSQL_DATABASE`/`MYSQL_USER`/`MYSQL_PASSWORD`/`MYSQL_ROOT_PASSWORD` env
    vars (use simple demo-only credentials, e.g. `wordpress`/`wordpress`/`wordpress` — this is
    a local pitch demo, not production).
  - `wordpress`: official `wordpress:6.9-php8.2-apache` image — pin this exact tag (not
    `latest`/`6`/floating tags) so the bundled Twenty Twenty-Five parent theme this plan's child
    theme depends on (`Template: twentytwentyfive` in `style.css`) is guaranteed present; a
    future untested tag could ship without it or with a renamed/incompatible version. Task 5,
    Step 10 must verify the parent theme exists (`wp theme list --field=name | grep
    twentytwentyfive`) before activating the child theme, and fail loudly with a clear message
    if it's missing, rather than silently leaving WordPress on its fallback theme. Depends on
    `db`, exposes port `8081:80` on the host (choose a port that won't collide with
    Phase 1's `8123` or a typical dev server — document the chosen port clearly in this task's
    report and in Task 7's README update). Mounts:
    - a named volume (e.g. `wp_data`) at `/var/www/html` — this is the **same** named volume
      the `wpcli` service below also mounts, so both containers see the identical WordPress
      core/database-config filesystem (the standard official-image pattern, needed so `wp` CLI
      commands operate on the running site rather than a separate empty install).
    - `../theme/tur-secondhand` read-only, bind-mounted onto
      `/var/www/html/wp-content/themes/tur-secondhand`.
    - `./theme-overrides/theme.json` read-only, bind-mounted onto the single file path
      `/var/www/html/wp-content/themes/tur-secondhand/theme.json` (a file bind mount layered on
      top of the directory mount above, overriding just that one file).
    - `./theme-overrides/variant.css` read-only, bind-mounted onto
      `/var/www/html/wp-content/themes/tur-secondhand/variant.css` the same way.

    **Important:** bind mounts are per-container, not written into the underlying named
    volume — mounting `wp_data` into `wpcli` does **not** by itself make the theme/override
    files above visible there. The `wpcli` service below must repeat the identical three
    bind mounts at the identical in-container paths, in addition to sharing `wp_data`, so both
    containers see the same theme files at the same location.
  - `wpcli`: official `wordpress:cli-php8.2` image, `depends_on: [db, wordpress]` (a simple
    `restart: on-failure` plus the seed script's own "wait for DB/WP to be ready" retry loop —
    described in Task 5 — is more reliable here than a healthcheck condition, since the
    `wordpress` image doesn't ship a built-in healthcheck; document whatever approach you use).
    Mounts:
    - the **same** `wp_data` named volume at `/var/www/html` (so it operates on the exact same
      core install/config as the `wordpress` service).
    - the same three theme mounts as the `wordpress` service above, at the identical
      in-container paths: `../theme/tur-secondhand` (read-only) onto
      `/var/www/html/wp-content/themes/tur-secondhand`, `./theme-overrides/theme.json`
      (read-only) onto `.../tur-secondhand/theme.json`, and `./theme-overrides/variant.css`
      (read-only) onto `.../tur-secondhand/variant.css` — needed so `wp theme activate` and any
      theme-file-reading `wp` commands see the exact same theme contents the `wordpress`
      service serves.
    - the repo's `content/` and `assets/` directories, read-only, at (for example)
      `/mnt/content` and `/mnt/assets` inside the container (so the seed script in Task 5 can
      read `content/products.json`, `content/pages.sv.json`, and copy files from `assets/`).
    - `./seed.sh` (Task 5's script), read-only, at e.g. `/mnt/seed.sh`.
    Command: run the mounted seed script (e.g. `sh /mnt/seed.sh` or `bash /mnt/seed.sh`,
    matching whatever shebang/shell Task 5 uses). Task 5's seed script must be idempotent
    (check-before-create) so it's safe to invoke again on an already-seeded site — note that
    because `wpcli` is a one-shot container, a plain `docker compose up` typically will **not**
    re-invoke a service that already exited 0; forcing a genuine re-run (e.g. via
    `docker compose run --rm wpcli ...` or `--force-recreate`, as detailed in Task 5, Step 11)
    is what actually exercises idempotency, not repeated `docker compose up`.

- [ ] **Step 2:** Add a top-of-file comment documenting: the chosen host port, the fixed demo
  wp-admin credentials `admin` / `demo1234` (defined once in this plan's Architecture recap,
  not decided per-task), and that this compose file is entirely self-contained (no dependency
  on anything outside `wordpress/theme/`, `wordpress/design-a/theme-overrides/`, `content/`,
  `assets/`, and this folder).

- [ ] **Step 3: Validate config syntax** (without starting anything yet — Task 6 does the full
  smoke test): run `docker compose -f wordpress/design-a/docker-compose.yml config --quiet` from
  the repo root. Expected: no output, exit code 0 (a syntax/reference error would print to
  stderr and exit non-zero). If your Docker version rejects layering a file bind mount inside a
  directory bind/volume mount at the same path (some versions are stricter about this), fall
  back to a small `Dockerfile`, shared/reused by **both** the `wordpress` and `wpcli` services
  (via a `build:` key pointing at the same Dockerfile, or by building one custom image and
  referencing it as `image:` for both), that `COPY`s the shared theme directory then `COPY`s
  the two override files on top at build time instead — this keeps both containers' views of
  the theme identical, which is the whole point of the mount duplication above. Note in your
  report which approach (bind-mount layering vs. shared Dockerfile) you used and why.

- [ ] **Step 4: Commit** — SKIP (not a git repo).

---

### Task 5: WP-CLI seed script

**Files:**
- Create: `wordpress/design-a/seed.sh` (or `seed.php` — implementer's choice of the more
  natural tool for each step; a shell script driving `wp` CLI commands is the simplest default)

Write an idempotent seed script (referenced as the `wpcli` service's command in Task 4) that,
given a fresh (or already-seeded) WordPress + MySQL pair, ends in a fully demo-ready state:

- [ ] **Step 1: Core install.** If WordPress isn't already installed (`wp core is-installed`
  check), run `wp core install` with: site title "Tur Second Hand", admin user `admin`,
  admin password `demo1234` (a demo-only credential — call this out clearly in Task 7's README
  update so it's not mistaken for anything security-sensitive), an admin email
  (`admin@example.test` is fine for a local demo), `--skip-email`.

- [ ] **Step 1a: Swedish locale.** Install and activate the Swedish language pack so
  WordPress/WooCommerce's own built-in UI strings (menus, cart/checkout labels, form
  validation messages, the default empty-cart notice, etc.) render in Swedish, matching the
  spec's Swedish-primary requirement: `wp language core install sv_SE --activate`, then, once
  WooCommerce is active (after Step 3), also run `wp language plugin install woocommerce sv_SE`
  if that translation is available (log a note in your report if it isn't — the site still
  works, just with a mix of Swedish core/Swedish-authored-content and English WooCommerce
  chrome, which is an acceptable fallback for the pitch demo but should be flagged).

- [ ] **Step 2: Permalinks.** Set pretty permalinks: `wp rewrite structure '/%postname%/'` then
  `wp rewrite flush --hard` (WooCommerce and the theme's page slugs assume pretty permalinks).

- [ ] **Step 3: WooCommerce.** If not already active, install+activate the WooCommerce plugin:
  `wp plugin install woocommerce --activate`. Skip/short-circuit the WooCommerce setup wizard
  (set the relevant options directly via `wp option update` rather than requiring interactive
  setup) using these exact option names and values from `content/pages.sv.json`'s `kontakt`
  section: `woocommerce_store_address` = `"Hamngatan 10"`, `woocommerce_store_city` =
  `"Östersund"`, `woocommerce_store_postcode` = `"831 33"`, `woocommerce_default_country` =
  `"SE"`, `woocommerce_currency` = `"SEK"`. Confirm the **Store API** (not the legacy REST API —
  a different thing) is reachable by curling `/wp-json/wc/store/v1/products` on the running
  site from inside the `wpcli` container (or from the host, against the mapped port) and
  checking for a `200` response with a JSON array — do not rely on any single option value to
  infer this, WooCommerce Blocks/Store API routes register automatically once WooCommerce is
  active and there's no dedicated "is Store API enabled" option to check instead.

- [ ] **Step 4: Payment gateway.** Enable WooCommerce's built-in "Cheque" gateway
  (`wp option update woocommerce_cheque_settings` — or the equivalent `wc` CLI command — to set
  `enabled => yes` and `title => "Betalning vid upphämtning"`), disable all other default
  gateways (COD/BACS/PayPal) so the manual gateway is the only option at checkout.

- [ ] **Step 5: Categories.** Create the 5 WooCommerce product categories from
  `content/products.json`, using this exact, fixed name→slug mapping (do not let WordPress
  auto-sanitize the Swedish names into slugs implicitly — pass the slug explicitly so Task 3's
  `front-page.html` links resolve correctly): `Jackor` → `jackor`, `Ryggsäckar` → `ryggsackar`,
  `Skidor & Pjäxor` → `skidor-pjaxor`, `Sovsäckar` → `sovsackar`, `Kläder` → `klader`. Create via
  `wp wc product_cat create --name="..." --slug="..."` (check-before-create by slug so re-runs
  don't duplicate).

- [ ] **Step 6: Products.** For each of the 12 products in `content/products.json`: import its
  image from the mounted `assets/products/<image>` path into the media library. Make this
  import idempotent by first checking for an existing attachment tagged with that source
  filename (e.g. `wp post list --post_type=attachment --meta_key=_tsh_source_file
  --meta_value=<image> --field=ID`) — if found, reuse that attachment ID; if not, run `wp media
  import` and then set a `_tsh_source_file` custom meta on the new attachment to the source
  filename (`wp post meta update <id> _tsh_source_file <image>`) so subsequent runs can find
  it. Then create (or update, matched by SKU = the product's `id` field) a WooCommerce simple
  product via `wp wc product create`/`update` with: `name`, `regular_price` = `price_sek`,
  `sku` = `id`, `description`/short description = `condition`, category = the mapped term from
  Step 5, featured image = the (found-or-imported) media ID, `manage_stock` = false (per spec
  §7.1 — products must never show as sold out), `stock_status` = `instock`. Use SKU as the
  product idempotency key: check `wp wc product list --sku=<id>` before creating.

- [ ] **Step 7: Cart, Checkout, and Shop pages.** WooCommerce auto-creates Shop/Cart/Checkout/
  My-Account pages on plugin activation (Step 3) using shortcodes/blocks — do not assume this
  silently succeeded. Explicitly verify each of `woocommerce_shop_page_id`,
  `woocommerce_cart_page_id`, `woocommerce_checkout_page_id` (`wp option get <name>`) resolves
  to a real, published page (`wp post get <id> --field=post_status` = `publish`); if any is
  `0`/missing/not published, create the missing page directly (Shop: empty content, WooCommerce
  renders its own archive template for it; Cart: content `<!-- wp:woocommerce/cart /-->`;
  Checkout: content `<!-- wp:woocommerce/checkout /-->`) and set the corresponding
  `woocommerce_*_page_id` option to point at it. Once confirmed, rename the Shop page's slug to
  `butik` if it defaulted to `shop` (`wp post update <id> --post_name=butik`, then re-flush
  permalinks) — `woocommerce_shop_page_id` keeps pointing at the same page ID across the rename,
  no separate update needed there.

- [ ] **Step 8: Content pages.** For Om oss and Galleri: create (idempotent, matched by slug) a
  WordPress Page per `content/pages.sv.json`'s `om_oss`/`galleri` sections, at slugs `/om-oss/`,
  `/galleri/`, using the `page.html` template from Task 3, with `post_content` built from that
  section's fields (for Galleri: import the 8 `assets/gallery/trail-*.jpg` files to the media
  library — same idempotency approach as Step 6 — and embed them as a gallery block). For
  Kontakt: same idempotent-by-slug approach at `/kontakt/`, with `post_content` built from
  `kontakt.address`/`phone`/`hours`/`instagram_url` plus an `<!-- wp:image -->` block whose
  `url` is the literal root-relative path
  `/wp-content/themes/tur-secondhand/assets/images/kontakt-placeholder.png` (Task 3's Step 4a
  asset — a plain root-relative URL string in the block markup, same convention as the hero
  image, no PHP call).

- [ ] **Step 9: Home page.** Create (idempotent, matched by slug) a WordPress Page titled "Hem"
  at slug `/hem/` using the `front-page.html` template from Task 3 — its own `post_content` can
  stay minimal/empty because `front-page.html` (per Task 3, Step 3) contains its Home copy as
  literal strings transcribed verbatim from `content/pages.sv.json` at authoring time, not
  read from the JSON file at request time (static FSE templates cannot read arbitrary files at
  runtime). Set it as the site's static front page:
  `wp option update show_on_front page` then `wp option update page_on_front <hem-page-id>` (do
  not use `/` as a literal slug — WordPress pages always have a real slug, and the front-page
  *display* is controlled by these two options, not by the slug itself).

- [ ] **Step 10: Theme + variant activation.** First verify the parent theme is present —
  `wp theme list --field=name | grep -qx twentytwentyfive`, failing loudly (non-zero exit,
  clear error message) if it's missing, since the child theme's `style.css` declares
  `Template: twentytwentyfive` and cannot activate correctly without it (this guards against
  the pinned `wordpress` image tag ever being changed to one that drops the bundled theme).
  Then activate the theme: `wp theme activate tur-secondhand`. (Variant selection happens via
  which `theme-overrides/` folder Task 4's compose file mounts — Design A's is the only one
  wired up in this phase; Phase 3 mounts its own `wordpress/design-b/theme-overrides/` instead,
  with no change to this step or to the shared theme directory.)

- [ ] **Step 11: Idempotency check.** Re-run the entire script a second time against the same
  running stack. Because `wpcli` is a one-shot container, a plain `docker compose up` will
  usually not re-execute it if it already exited 0 (Compose only (re)starts services whose
  config changed or that aren't already in the desired state) — so exercise the actual re-run
  explicitly with `docker compose run --rm wpcli <same command as the service's `command:`>`
  (or force it via `docker compose up --force-recreate wpcli`), not by assuming a second
  `docker compose up` reruns it. Confirm: no duplicate products, categories, media attachments,
  or pages are created, and the script exits 0 both times.

- [ ] **Step 12: Commit** — SKIP (not a git repo).

---

### Task 6: End-to-end smoke test (spec §7.1 acceptance criteria)

**Files:** none (validation-only task)

- [ ] **Step 1: Clean start.** From the repo root:
  `docker compose -f wordpress/design-a/docker-compose.yml down -v` (tear down any prior state
  including volumes) then `docker compose -f wordpress/design-a/docker-compose.yml up -d` and
  wait for the `wpcli` seed service to exit 0 (`docker compose -f
  wordpress/design-a/docker-compose.yml logs wpcli` should show the seed script completing
  without errors).

- [ ] **Step 2: Page checks.** `curl -s -o /dev/null -w '%{http_code}\n'` each of: the site
  root `/`, `/om-oss/`, `/kontakt/`, `/galleri/`, `/butik/` on the mapped host port from Task 4
  — all must return `200`.

- [ ] **Step 3: Product checks.** Confirm all 12 products are visible on `/butik/` (curl the
  page HTML and grep for a few known product names, e.g. "Fjällräven Nuuk Parka"). Then get one
  real product's actual single-product permalink — do not guess the URL structure — via
  `wp post list --post_type=product --field=url` inside the `wpcli` container (or by clicking
  through from `/butik/` in the browser canvas), and curl/open that exact URL: it must return
  200 and show image, price, condition text, and an add-to-cart control.

- [ ] **Step 4: Cart/checkout walkthrough against spec §7.1.** Using either a real browser
  (open the browser canvas at the mapped host URL) or `curl` with a cookie jar to simulate the
  flow, verify each of:
  - Adding a product to the cart updates a visible cart count indicator.
  - The cart page lists item image/name/price/quantity/remove action and a subtotal.
  - Emptying the cart shows a clear Swedish empty-cart message with a link back to the shop.
    This does not need to byte-match `content/pages.sv.json`'s `varukorg.empty_state_text`
    verbatim — WooCommerce's own bundled Swedish translation (installed in Task 5's Step 1a)
    supplies its own default empty-cart string, and that is an acceptable outcome as long as it
    reads clearly in Swedish and communicates the cart is empty; only flag it as a problem if
    the message renders in English (indicating the `sv_SE` language pack didn't take effect) or
    is missing/broken entirely.
  - Checkout blocks submission with inline validation if name/email/address are missing.
  - A fully filled checkout using the "Betalning vid upphämtning" gateway succeeds and shows an
    order confirmation with an order number, and that confirmation screen also shows an order
    summary (the purchased item(s), quantities, and totals) — not just a bare "thank you" +
    order number with no line-item detail.
  - After successful checkout, the cart is empty again.
  - No product ever shows as "Slut i lager"/out-of-stock (stock management is off).
  Use the browser canvas for this walkthrough if it's easier to confirm visually than via curl
  — either is acceptable evidence, but be explicit in your report about which you used and what
  you observed at each bullet.

- [ ] **Step 5: Visual check against Variant A tokens.** Open the site's front page in the
  browser canvas and visually confirm the forest-green/cream Skogsstig Classic palette and
  serif headings are actually applied (not the default Twenty Twenty-Five look) — compare
  against `docs/design/style-tile-preview.png`'s top ("Variant A") section.

- [ ] **Step 6: Tear down cleanly.** `docker compose -f wordpress/design-a/docker-compose.yml
  down` (keep volumes this time, so the state is preserved for demo purposes going forward —
  only use `-v` for the clean-start step above, never as the final action of this task).

---

### Task 7: Close out Phase 2

**Files:**
- Modify: `README.md` (fill in real "Running Design A (WordPress)" instructions — host port,
  wp-admin URL + credentials, first-run seed wait time)
- Modify: `TODO.md` (check off all Phase 2 boxes)
- Modify: `OVERVIEW.md` (append a short dated note)

- [ ] **Step 1:** Replace README.md's placeholder run instructions for the WordPress Design A
  demo with the real, tested commands and URLs from Tasks 4–6 (compose file path, host port,
  wp-admin login URL + the `admin`/`demo1234` demo credentials, expected first-run seed time).

- [ ] **Step 2:** Check off every Phase 2 box in `TODO.md`.

- [ ] **Step 3:** Append a short dated note under a new `## WordPress Design A (Phase 2)`
  heading in `OVERVIEW.md`: theme lives in `wordpress/theme/tur-secondhand/` (shared, reused
  unmodified by Design B in Phase 3 — only its `theme-overrides/theme.json` +
  `theme-overrides/variant.css` differ per variant), compose stack in `wordpress/design-a/`,
  confirms the smoke test in Task 6 passed.

- [ ] **Step 4: Final re-validation.** Re-run `python3 tests/validate_content.py` (still
  `content/`-based, unaffected by this phase, but cheap to confirm nothing regressed) and the
  Task 6 clean-start smoke test one more time end-to-end before considering Phase 2 closed.

- [ ] **Step 5: Commit** — SKIP (not a git repo).

---

## Handoff

Once this plan's tasks are checked off, Phase 3 (WordPress Design B — "Skogsstig Varm") can
begin: it reuses `wordpress/theme/tur-secondhand/` **unmodified**, supplying its own
`wordpress/design-b/theme-overrides/theme.json` + `theme-overrides/variant.css` (Variant B
values from `design-system/tokens/varm.json`), and a near-identical
`wordpress/design-b/docker-compose.yml` + `seed.sh` (same content sources, different host
port). Its plan should explicitly call out reusing Task 5's seed script logic rather than
rewriting it from scratch.
