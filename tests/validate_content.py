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
    "home": ("hero_tagline", "hero_subtext", "circular_economy_blurb", "featured_categories_title", "hours_location_teaser"),
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
        assert isinstance(image, str) and image.strip(), "gallery image filenames must be non-empty strings"
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
