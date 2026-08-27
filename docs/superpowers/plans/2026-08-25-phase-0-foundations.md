# Phase 0 — Foundations & Content Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the single shared content source (product catalog + page copy), the shared
processed image set, and image-credit notes that every later phase (WordPress design A/B,
React design A/B) reads from — so all four demos show identical products and text.

**Architecture:** Content lives as plain JSON files in `content/` at the repo root, validated
by a small Python script in `tests/` that both humans and later phases can re-run. Images are
selected from the existing `unsplash/` folder, resized/optimized into `assets/`, and referenced
by filename from `content/products.json` / `content/pages.sv.json`. No web framework, database,
or Docker is touched in this phase — it produces static files only.

**Tech Stack:** Python 3 (stdlib + Pillow, already available in this environment — used only
for image resizing and a validation script), plain JSON.

---

## File Structure

```
content/
  products.json       # shared product catalog (Phase 2-5 read this)
  pages.sv.json        # shared Swedish page copy (Phase 2-5 read this)
  contact-map-decision.md   # decision: live embed vs static map image
assets/
  products/             # 12+ resized product photos, referenced by content/products.json
  gallery/              # 8+ resized gallery photos, referenced by content/pages.sv.json
  credits.md             # sourcing/licensing notes for every file in assets/
tests/
  validate_content.py   # standalone validation script (also runnable as pytest)
```

---

### Task 1: Content validation script (write first, red)

**Files:**
- Create: `tests/validate_content.py`

- [ ] **Step 1: Write the validation script (will fail — no content yet)**

```python
"""Validates content/products.json and content/pages.sv.json against the rules in
docs/superpowers/specs/2026-08-25-tur-secondhand-redesign-design.md (section 5).

Run directly: python3 tests/validate_content.py
Or via pytest: pytest tests/validate_content.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(ROOT, "content")
ASSETS_DIR = os.path.join(ROOT, "assets")

REQUIRED_CATEGORIES = {
    "Jackor", "Ryggsäckar", "Skidor & Pjäxor", "Sovsäckar", "Kläder",
}
REQUIRED_PRODUCT_FIELDS = {"id", "name", "price_sek", "condition", "category", "image"}
MIN_PRODUCTS = 12
MIN_PER_CATEGORY = 2
MIN_GALLERY_IMAGES = 8


def load_json(relative_path):
    full_path = os.path.join(CONTENT_DIR, relative_path)
    if not os.path.exists(full_path):
        raise AssertionError(f"missing required file: content/{relative_path}")
    with open(full_path, encoding="utf-8") as f:
        return json.load(f)


def validate_products():
    products = load_json("products.json")
    assert isinstance(products, list), "products.json must be a JSON array"
    assert len(products) >= MIN_PRODUCTS, (
        f"expected at least {MIN_PRODUCTS} products, got {len(products)}"
    )

    counts_by_category = {}
    seen_ids = set()
    for i, product in enumerate(products):
        missing = REQUIRED_PRODUCT_FIELDS - product.keys()
        assert not missing, f"product[{i}] missing fields: {missing}"
        assert product["id"] not in seen_ids, f"product[{i}] has duplicate id: {product['id']!r}"
        seen_ids.add(product["id"])
        assert isinstance(product["name"], str) and product["name"].strip(), (
            f"product[{i}] name must be a non-empty string"
        )
        assert isinstance(product["condition"], str) and product["condition"].strip(), (
            f"product[{i}] condition must be a non-empty string"
        )
        assert isinstance(product["price_sek"], (int, float)) and product["price_sek"] > 0, (
            f"product[{i}] price_sek must be a positive number"
        )
        assert product["category"] in REQUIRED_CATEGORIES, (
            f"product[{i}] has unknown category: {product['category']!r}"
        )
        image_path = os.path.join(ASSETS_DIR, "products", product["image"])
        assert os.path.exists(image_path), (
            f"product[{i}] references missing image: assets/products/{product['image']}"
        )
        counts_by_category[product["category"]] = (
            counts_by_category.get(product["category"], 0) + 1
        )

    for category in REQUIRED_CATEGORIES:
        count = counts_by_category.get(category, 0)
        assert count >= MIN_PER_CATEGORY, (
            f"category {category!r} has {count} products, needs at least {MIN_PER_CATEGORY}"
        )


REQUIRED_PAGE_FIELDS = {
    "home": (
        "hero_tagline", "hero_subtext", "circular_economy_blurb", "featured_categories_title",
        "hours_location_teaser",
    ),
    "om_oss": ("title", "body"),
    "kontakt": ("title", "address", "phone", "hours", "instagram_url"),
    "galleri": ("title", "images"),
    "butik": ("title", "intro", "categories"),
    "produkt": ("add_to_cart_label", "condition_label", "price_label", "category_label"),
    "varukorg": (
        "title", "empty_state_text", "empty_state_link_text", "quantity_label",
        "subtotal_label", "remove_label", "checkout_button_label",
    ),
    "kassa": (
        "title", "name_label", "email_label", "address_label", "validation_required_text",
        "submit_button_label", "order_summary_title", "confirmation_title",
        "confirmation_order_number_label",
    ),
}


def validate_pages():
    pages = load_json("pages.sv.json")
    missing_pages = REQUIRED_PAGE_FIELDS.keys() - pages.keys()
    assert not missing_pages, f"pages.sv.json missing required pages: {missing_pages}"

    for page_name, required_fields in REQUIRED_PAGE_FIELDS.items():
        page = pages[page_name]
        for field in required_fields:
            assert page.get(field), f"pages.sv.json {page_name}.{field} is empty or missing"

    assert set(pages["butik"]["categories"]) == REQUIRED_CATEGORIES, (
        "pages.sv.json butik.categories must list exactly the 5 required categories"
    )

    gallery_images = pages["galleri"]["images"]
    assert len(gallery_images) >= MIN_GALLERY_IMAGES, (
        f"expected at least {MIN_GALLERY_IMAGES} gallery images, got {len(gallery_images)}"
    )
    for image in gallery_images:
        image_path = os.path.join(ASSETS_DIR, "gallery", image)
        assert os.path.exists(image_path), f"gallery references missing image: assets/gallery/{image}"


def test_products_valid():
    validate_products()


def test_pages_valid():
    validate_pages()


if __name__ == "__main__":
    validate_products()
    validate_pages()
    print("OK: content/products.json and content/pages.sv.json are valid")
```

- [ ] **Step 2: Run it to verify it fails (no content yet)**

Run: `python3 tests/validate_content.py`
Expected: `AssertionError: missing required file: content/products.json`

- [ ] **Step 3: Commit the validation script**

```bash
git add tests/validate_content.py
git commit -m "test: add content validation script for shared product/page content"
```
_(If this folder is not a git repo, skip commits in this plan and just save files — confirm
with `git status` first.)_

---

### Task 2: Author the shared product catalog

**Files:**
- Create: `content/products.json`

- [ ] **Step 1: Write 12 products using these exact filenames** (chosen to match the concrete
  image mapping in Task 4, so no filename mismatches occur later) — 2–3 per category. Fill in
  the name, price, and condition sentence for each; the `image` and `category` values below
  must be used as-is:

  | image | category |
  |---|---|
  | `jacka-fjallraven-nuuk.jpg` | Jackor |
  | `jacka-haglofs-roc.jpg` | Jackor |
  | `ryggsack-osprey-atmos.jpg` | Ryggsäckar |
  | `ryggsack-fjallraven-kanken.jpg` | Ryggsäckar |
  | `skidor-alpina-nova.jpg` | Skidor & Pjäxor |
  | `pjaxor-salomon-qst.jpg` | Skidor & Pjäxor |
  | `sovsack-nordisk-puk.jpg` | Sovsäckar |
  | `sovsack-fjallraven-singi.jpg` | Sovsäckar |
  | `klader-devold-ull.jpg` | Kläder |
  | `klader-haglofs-fleece.jpg` | Kläder |

  That's 10 — add 2 more (any category, reusing an existing image filename from the table
  above is fine since Task 4's mapping already covers reuse) so the array has at least 12
  entries and at least 2 per category. Example entry format:

```json
[
  {
    "id": "jacka-fjallraven-nuuk",
    "name": "Fjällräven Nuuk Parka",
    "price_sek": 899,
    "condition": "Mycket gott skick, få tecken på användning",
    "category": "Jackor",
    "image": "jacka-fjallraven-nuuk.jpg"
  }
]
```

  Note: every `image` filename here must match a file that will exist in `assets/products/`
  after Task 4 — the table above is already aligned with Task 4's mapping, so no new filenames
  need to be invented.

- [ ] **Step 2: Save the full 12+ item array to `content/products.json`**

- [ ] **Step 3: Run the validation script and confirm the products check passes (pages check
  can still fail at this point)**

Run: `python3 tests/validate_content.py`
Expected: `AssertionError: missing required file: content/pages.sv.json` (products validation no
longer the failure)

- [ ] **Step 4: Commit**

```bash
git add content/products.json
git commit -m "content: author shared product catalog"
```

---

### Task 3: Author the shared page copy

**Files:**
- Create: `content/pages.sv.json`

- [ ] **Step 1: Write Swedish copy for Home, Om oss, Kontakt, Galleri**, using the real
  business facts from `OVERVIEW.md` verbatim for Kontakt. Structure:

```json
{
  "home": {
    "hero_tagline": "Ge friluftslivet ett nytt liv",
    "hero_subtext": "Secondhand outdoor- och skidutrustning i hjärtat av Östersund",
    "circular_economy_blurb": "Varje plagg och pryl vi säljer är en sak mindre som slängs och en sak mer som får leva vidare på fjället, i skogen eller på pisten.",
    "featured_categories_title": "Handla efter kategori",
    "hours_location_teaser": "Hamngatan 10, Östersund · Ons–Fre 11–18 · Lör 11–16"
  },
  "om_oss": {
    "title": "Om oss",
    "body": "Tur Second Hand öppnade nyligen på Hamngatan 10 i Östersund. Vi säljer noga utvalda begagnade friluftsprylar och skidutrustning \u2014 för plånboken, för friluftslivet och för miljön."
  },
  "kontakt": {
    "title": "Kontakt",
    "address": "Hamngatan 10, 831 33 Östersund",
    "phone": "070-976 13 37",
    "hours": "Tisdag Stängt · Onsdag 11–18 · Torsdag 11–18 · Fredag 11–18 · Lördag 11–16 · Söndag Stängt · Måndag Stängt",
    "instagram_url": "https://www.instagram.com/tur.secondhand/"
  },
  "galleri": {
    "title": "Galleri",
    "images": [
      "trail-1.jpg", "trail-2.jpg", "trail-3.jpg", "trail-4.jpg",
      "trail-5.jpg", "trail-6.jpg", "trail-7.jpg", "trail-8.jpg"
    ]
  },
  "butik": {
    "title": "Butik",
    "intro": "Bläddra bland våra kategorier av begagnad outdoor- och skidutrustning.",
    "categories": ["Jackor", "Ryggsäckar", "Skidor & Pjäxor", "Sovsäckar", "Kläder"]
  },
  "produkt": {
    "add_to_cart_label": "Lägg i varukorg",
    "condition_label": "Skick",
    "price_label": "Pris",
    "category_label": "Kategori"
  },
  "varukorg": {
    "title": "Varukorg",
    "empty_state_text": "Din varukorg är tom.",
    "empty_state_link_text": "Fortsätt handla",
    "quantity_label": "Antal",
    "subtotal_label": "Delsumma",
    "remove_label": "Ta bort",
    "checkout_button_label": "Till kassan"
  },
  "kassa": {
    "title": "Kassa",
    "name_label": "Namn",
    "email_label": "E-post",
    "address_label": "Adress",
    "validation_required_text": "Det här fältet är obligatoriskt.",
    "submit_button_label": "Genomför köp",
    "order_summary_title": "Ordersammanfattning",
    "confirmation_title": "Tack för ditt köp!",
    "confirmation_order_number_label": "Ordernummer"
  }
}
```

  Gallery `images` list must end up with 8+ entries matching files placed in
  `assets/gallery/` in Task 4. The `butik`, `produkt`, `varukorg`, and `kassa` sections are the
  single shared source of shop/cart/checkout copy — both the WordPress track (Phase 2/3) and
  the React track (Phase 4/5) must read these strings rather than each inventing their own, so
  the empty-cart state, validation messages, and checkout labels described in the spec's §7.1
  acceptance criteria read identically across all four demos.

- [ ] **Step 2: Save to `content/pages.sv.json`**

- [ ] **Step 3: Run the validation script — should still fail on missing images until Task 4**

Run: `python3 tests/validate_content.py`
Expected: `AssertionError: product[...] references missing image: assets/products/...`

- [ ] **Step 4: Commit**

```bash
git add content/pages.sv.json
git commit -m "content: author shared Swedish page copy"
```

---

### Task 4: Process images into `assets/`

**Files:**
- Create: `assets/products/*.jpg` (10 unique files, matching the 10 image filenames in
  Task 2's table — 2 of the 12 products intentionally reuse an existing product image
  filename rather than requiring 12 unique photos, since only 10 source photos exist)
- Create: `assets/gallery/*.jpg` (8 files: 7 from unique source photos + 1 reused, matching
  `galleri.images` from Task 3)
- Create: `assets/credits.md`

- [ ] **Step 1: Write a small one-off resize script** (not committed as project code — a
  throwaway helper is fine here since this task is a content-prep step, not app logic):

```python
# scratch_resize.py (delete after running, or keep under tests/ if useful later)
from PIL import Image
import os

SRC = "unsplash"
# Concrete source -> destination mapping. There are only 10 source photos and we need 12+
# product photos + 8+ gallery photos, so several source photos are intentionally reused
# across more than one destination (noted here and mirrored in assets/credits.md).
MAPPING = {
    "1.jpg": "products/jacka-fjallraven-nuuk.jpg",
    "2.jpg": "gallery/trail-1.jpg",
    "3.jpg": "gallery/trail-2.jpg",
    "4.jpg": "products/ryggsack-osprey-atmos.jpg",
    "5.jpg": "products/ryggsack-fjallraven-kanken.jpg",
    "6.jpg": "gallery/trail-3.jpg",
    "7.jpg": "gallery/trail-4.jpg",
    "8.jpg": "gallery/trail-5.jpg",
    "9.jpg": "gallery/trail-6.jpg",
    "10.jpg": "gallery/trail-7.jpg",
    # Reused source photos for remaining product slots (2+ per category needs more product
    # photos than we have unique sources) — same source file, different destination filename:
    "1.jpg-reuse-1": ("1.jpg", "products/jacka-haglofs-roc.jpg"),
    "4.jpg-reuse-1": ("4.jpg", "products/sovsack-nordisk-puk.jpg"),
    "5.jpg-reuse-1": ("5.jpg", "products/sovsack-fjallraven-singi.jpg"),
    "6.jpg-reuse-1": ("6.jpg", "products/skidor-alpina-nova.jpg"),
    "7.jpg-reuse-1": ("7.jpg", "products/pjaxor-salomon-qst.jpg"),
    "8.jpg-reuse-1": ("8.jpg", "products/klader-devold-ull.jpg"),
    "9.jpg-reuse-1": ("9.jpg", "products/klader-haglofs-fleece.jpg"),
    "2.jpg-reuse-1": ("2.jpg", "gallery/trail-8.jpg"),
}

for key, value in MAPPING.items():
    src_name, dest_rel = (value if isinstance(value, tuple) else (key, value))
    im = Image.open(os.path.join(SRC, src_name))
    im.thumbnail((1600, 1600))
    dest_path = os.path.join("assets", dest_rel)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    im.save(dest_path, quality=85)
    print("wrote", dest_path)
```

This concrete mapping already accounts for every unique `image` filename used in Task 2's
product table and every `galleri.images` entry from Task 3 — if you change a filename in
either JSON file, update the corresponding entry here so `MAPPING` stays the single source of
truth for which source photo backs which destination file. `assets/products/` ends up with 10
unique files (matching the 10 filenames in Task 2's table; the 2 extra products in Task 2
reuse one of these 10 filenames rather than requiring new photos) and `assets/gallery/` ends
up with 8 files (7 unique + 1 reused), satisfying the `MIN_PRODUCTS`/`MIN_GALLERY_IMAGES`
thresholds in the validator.

- [ ] **Step 2: Run the script**

Run: `python3 scratch_resize.py`
Expected: prints one `wrote assets/...` line per mapped file, no errors.

- [ ] **Step 3: Write `assets/credits.md`** listing, for every file in `assets/products/` and
  `assets/gallery/`: source filename from `unsplash/`, and a one-line note if the same source
  photo was reused for more than one catalog entry.

- [ ] **Step 4: Run the full validation script — should now pass**

Run: `python3 tests/validate_content.py`
Expected: `OK: content/products.json and content/pages.sv.json are valid`

- [ ] **Step 5: Remove the throwaway resize script (or move it under `tests/` if you expect to
  re-run it), and commit the assets**

```bash
rm scratch_resize.py   # or: git add tests/resize_images.py if kept
git add assets/
git commit -m "content: process shared product and gallery images"
```

---

### Task 5: Contact-map decision

**Files:**
- Create: `content/contact-map-decision.md`

- [ ] **Step 1: Decide** whether the Kontakt page will use a live Google Maps iframe embed (if
  the pitch demo will run with internet access) or a static map image (if it might run
  offline), per the spec's §5.2 note. Write the decision and one-sentence rationale to
  `content/contact-map-decision.md`.

- [ ] **Step 2: Commit**

```bash
git add content/contact-map-decision.md
git commit -m "docs: record contact page map approach decision"
```

---

### Task 6: Re-check live site + close out Phase 0

**Files:**
- Modify: `OVERVIEW.md` (append findings under a new `## Live site re-check (Phase 0)` heading)
- Modify: `TODO.md` (check off all Phase 0 boxes)

- [ ] **Step 1: Re-fetch https://tursecondhand.se/ and a couple of likely sub-paths (e.g.
  `/om-oss/`, `/kontakt/`, `/butik/`)** to confirm whether any real content has appeared since
  the spec was written.

- [ ] **Step 2: Confirm close-out prerequisites exist and are non-empty:** `assets/credits.md`
  (from Task 4) and `content/contact-map-decision.md` (from Task 5). If either is missing or
  still a stub, finish it before continuing.

- [ ] **Step 3: Append a short dated note to `OVERVIEW.md`** confirming the site is still
  blank, or describing what changed and whether it affects the content already authored.

- [ ] **Step 4: Check off every Phase 0 box in `TODO.md`**

- [ ] **Step 5: Final validation run**

Run: `python3 tests/validate_content.py`
Expected: `OK: content/products.json and content/pages.sv.json are valid`

- [ ] **Step 6: Commit**

```bash
git add OVERVIEW.md TODO.md
git commit -m "chore: close out Phase 0 foundations"
```

---

## Handoff

Once this plan's tasks are all checked off, Phase 1 (Shared Design System) and then Phase 2
(WordPress shared theme + Design A) can begin — write their detailed plans at that point,
following this same format. They will read `content/products.json` and `content/pages.sv.json`
as their content source, and `assets/products/` + `assets/gallery/` as their image source, so
no content decisions should need to be revisited.
