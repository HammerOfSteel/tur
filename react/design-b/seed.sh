#!/bin/sh

set -eu

# Headless-backend seed script (React track, Design A). This WordPress instance is
# admin/API-only: it never installs the Skogsstig theme and never creates the Om
# oss/Kontakt/Galleri/Hem pages, because the Next.js app in react/app/ owns every
# customer-facing page and sources its copy directly from content/pages.sv.json. Only
# WooCommerce + its Store API + the shared product catalog are seeded here, so the owner
# manages products/orders for this track from the exact same wp-admin/WooCommerce screens
# used by the WordPress track (see OVERVIEW.md decisions log).
WP="wp --allow-root --path=/var/www/html"
INTERNAL_URL="http://wordpress"
PUBLIC_URL="http://localhost:8094"
PRODUCTS_JSON="/mnt/content/products.json"
PRODUCTS_DIR="/mnt/assets/products"

log() {
  # See wordpress/design-a/seed.sh for why this must go to stderr: ensure_attachment
  # below calls log() and then returns its real value via a final `printf` to stdout,
  # captured via command substitution by its callers.
  printf '%s\n' "$*" >&2
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

# Read product source rows without depending on jq in the container.
product_rows() {
  php -r '
    $products = json_decode(file_get_contents($argv[1]), true);
    if (!is_array($products)) {
        fwrite(STDERR, "Invalid products JSON" . PHP_EOL);
        exit(1);
    }
    foreach ($products as $product) {
        printf(
            "%s\t%s\t%s\t%s\t%s\t%s\n",
            $product["id"],
            $product["name"],
            $product["price_sek"],
            $product["condition"],
            $product["category"],
            $product["image"]
        );
    }
  ' "$1"
}

attachment_id_by_source() {
  $WP post list \
    --post_type=attachment \
    --post_status=inherit \
    --meta_key=_tsh_source_file \
    --meta_value="$1" \
    --field=ID \
    --posts_per_page=1 2>/dev/null | head -n 1
}

ensure_attachment() {
  source_path="$1"
  source_name="$2"

  [ -f "$source_path" ] || fail "Missing media file: $source_path"

  attachment_id=$(attachment_id_by_source "$source_name")
  if [ -z "$attachment_id" ]; then
    log "Importing media $source_name"
    attachment_id=$($WP media import "$source_path" --porcelain)
    [ -n "$attachment_id" ] || fail "Failed to import media: $source_name"
    $WP post meta update "$attachment_id" _tsh_source_file "$source_name" >/dev/null
  fi

  printf '%s' "$attachment_id"
}

category_slug_for_name() {
  case "$1" in
    "Jackor") printf 'jackor' ;;
    "Ryggsäckar") printf 'ryggsackar' ;;
    "Skidor & Pjäxor") printf 'skidor-pjaxor' ;;
    "Sovsäckar") printf 'sovsackar' ;;
    "Kläder") printf 'klader' ;;
    *) fail "Unknown category name: $1" ;;
  esac
}

category_id_by_slug() {
  $WP term list product_cat --slug="$1" --field=term_id --number=1 2>/dev/null | head -n 1
}

ensure_category() {
  name="$1"
  slug="$2"

  category_id=$(category_id_by_slug "$slug")
  if [ -z "$category_id" ]; then
    log "Creating category $name ($slug)"
    $WP wc product_cat create --user=admin --name="$name" --slug="$slug" >/dev/null
    category_id=$(category_id_by_slug "$slug")
  fi

  [ -n "$category_id" ] || fail "Failed to resolve category ID for slug $slug"
  printf '%s' "$category_id"
}

set_gateway_enabled() {
  option_name="$1"
  enabled="$2"
  title="${3:-}"

  OPTION_NAME="$option_name" ENABLED="$enabled" GATEWAY_TITLE="$title" $WP eval '
    $option_name = getenv("OPTION_NAME");
    $settings = get_option($option_name, array());
    if (!is_array($settings)) {
        $settings = array();
    }
    $settings["enabled"] = getenv("ENABLED");
    $title = getenv("GATEWAY_TITLE");
    if ($title !== "") {
        $settings["title"] = $title;
    }
    update_option($option_name, $settings);
  ' >/dev/null
}

verify_store_api() {
  attempts=0
  while [ "$attempts" -lt 30 ]; do
    response=$(curl -sS -w '\n%{http_code}' "$INTERNAL_URL/wp-json/wc/store/v1/products" || true)
    status_code=$(printf '%s\n' "$response" | tail -n 1)
    body=$(printf '%s\n' "$response" | sed '$d')

    if [ "$status_code" = "200" ] && STORE_BODY="$body" php -r '
      $decoded = json_decode(getenv("STORE_BODY"), true);
      exit(is_array($decoded) ? 0 : 1);
    '; then
      log "Verified Store API availability."
      return 0
    fi

    attempts=$((attempts + 1))
    sleep 2
  done

  fail "WooCommerce Store API did not return HTTP 200 with a JSON array."
}

wait_for_wordpress() {
  attempts=0
  while [ "$attempts" -lt 60 ]; do
    if [ -f /var/www/html/wp-config.php ]; then
      output=$($WP core is-installed 2>&1) && { log "WordPress is already installed and reachable."; return 0; }
      if ! printf '%s' "$output" | grep -qi "error establishing a database connection"; then
        log "Database connection is ready."
        return 0
      fi
    fi

    attempts=$((attempts + 1))
    sleep 2
  done

  fail "Timed out waiting for WordPress/MySQL readiness."
}

# Step 0: wait until the shared WordPress volume and MySQL are actually ready.
wait_for_wordpress

# Step 1: install WordPress once (default theme — never switched, this instance is
# admin/API-only and is never visited by a customer).
log "Step 1: Core install"
if ! $WP core is-installed >/dev/null 2>&1; then
  $WP core install \
    --url="$PUBLIC_URL" \
    --title="Tur Second Hand (headless backend — Design A)" \
    --admin_user="admin" \
    --admin_password="demo1234" \
    --admin_email="admin@example.test" \
    --skip-email >/dev/null
fi

# Step 1a: switch the site to Swedish (product/category names are Swedish).
log "Step 1a: Swedish locale"
if ! $WP language core is-installed sv_SE >/dev/null 2>&1; then
  $WP language core install sv_SE --activate >/dev/null
else
  $WP site switch-language sv_SE >/dev/null
fi

# Step 1b: redirect the bare front end to /wp-admin/. This backend is headless (no theme
# content is ever seeded — see the file header), but WordPress's default active theme still
# renders its own blog/sample-content view at "/" by default. Left unguarded, anyone who visits
# http://localhost:8094/ directly (instead of the real storefront on :3002) sees a confusing,
# broken-looking default WordPress theme instead of being pointed at wp-admin. This mu-plugin
# (auto-loaded, no activation needed) 302-redirects any front-end request that isn't
# /wp-admin, /wp-json, or /wp-login.php over to /wp-admin/.
log "Step 1b: Guard headless backend root URL"
mkdir -p /var/www/html/wp-content/mu-plugins
cat > /var/www/html/wp-content/mu-plugins/headless-redirect.php <<'PHP'
<?php
/**
 * Plugin Name: Headless backend root redirect
 * Description: This WordPress instance is an admin/API-only backend for the Next.js storefront.
 * It has no theme content of its own, so bounce any bare front-end request to /wp-admin/ instead
 * of letting the default theme render its blog/sample-content view.
 */
add_action('template_redirect', function () {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    $allowed_prefixes = ['/wp-admin', '/wp-json', '/wp-login.php'];
    foreach ($allowed_prefixes as $prefix) {
        if (strpos($path, $prefix) === 0) {
            return;
        }
    }
    wp_safe_redirect(admin_url(), 302);
    exit;
});
PHP

# Step 2: pretty permalinks (required for the Store API's product routes).
log "Step 2: Pretty permalinks"
$WP rewrite structure '/%postname%/' >/dev/null
$WP rewrite flush --hard >/dev/null

# Step 3: install/activate WooCommerce and apply store settings.
log "Step 3: WooCommerce install and configuration"
if $WP plugin is-installed woocommerce >/dev/null 2>&1; then
  if ! $WP plugin is-active woocommerce >/dev/null 2>&1; then
    $WP plugin activate woocommerce >/dev/null
  fi
else
  $WP plugin install woocommerce --activate >/dev/null
fi

$WP option update woocommerce_store_address "Hamngatan 10" >/dev/null
$WP option update woocommerce_store_city "Östersund" >/dev/null
$WP option update woocommerce_store_postcode "831 33" >/dev/null
$WP option update woocommerce_default_country "SE" >/dev/null
$WP option update woocommerce_currency "SEK" >/dev/null
# Swedish retail convention: amount, space, then "kr" (e.g. "650 kr"), no decimals — not the
# WooCommerce SEK default of a leading symbol glued to two decimals (e.g. "kr650.00"). The
# React/Store API track formats prices in Next.js from the raw numeric value, but this backend
# option still governs what wp-admin itself shows the owner.
$WP option update woocommerce_currency_pos "right_space" >/dev/null
$WP option update woocommerce_price_num_decimals "0" >/dev/null
# Newer WooCommerce versions default fresh installs to "Coming Soon" mode. The Store API itself
# isn't blocked by it, but disable it anyway for consistency with the WordPress track and in
# case anyone visits /wp-admin's linked "view site" preview.
$WP option update woocommerce_coming_soon "no" >/dev/null

verify_store_api

if $WP language plugin install woocommerce sv_SE >/dev/null 2>&1; then
  log "Installed WooCommerce sv_SE translations."
else
  log "WooCommerce sv_SE translations unavailable; continuing with Swedish core only."
fi

# Step 4: make Cheque/pay-on-pickup the only enabled payment gateway — same manual/COD
# approach as the WordPress track, so checkout completes without a real payment processor.
log "Step 4: Payment gateway configuration"
set_gateway_enabled "woocommerce_cheque_settings" "yes" "Betalning vid upphämtning"
set_gateway_enabled "woocommerce_cod_settings" "no"
set_gateway_enabled "woocommerce_bacs_settings" "no"
set_gateway_enabled "woocommerce_paypal_settings" "no"

# Step 5: create the fixed category/slug mapping required by the plan.
log "Step 5: Product categories"
ensure_category "Jackor" "jackor" >/dev/null
ensure_category "Ryggsäckar" "ryggsackar" >/dev/null
ensure_category "Skidor & Pjäxor" "skidor-pjaxor" >/dev/null
ensure_category "Sovsäckar" "sovsackar" >/dev/null
ensure_category "Kläder" "klader" >/dev/null

# Step 6: import products (same content/products.json used by the WordPress track), reusing
# media and products on re-run. Stock management is left off so demo checkouts never mark a
# product "sold out" (spec §7.1).
log "Step 6: Product import"
product_rows "$PRODUCTS_JSON" | while IFS="$(printf '\t')" read -r product_id product_name price_sek condition category_name image_name; do
  category_slug=$(category_slug_for_name "$category_name")
  category_id=$(category_id_by_slug "$category_slug")
  [ -n "$category_id" ] || fail "Missing category for $category_name"

  attachment_id=$(ensure_attachment "$PRODUCTS_DIR/$image_name" "$image_name")
  categories_json=$(printf '[{"id":%s}]' "$category_id")
  images_json=$(printf '[{"id":%s}]' "$attachment_id")
  existing_product_id=$($WP wc product list --user=admin --sku="$product_id" --field=id 2>/dev/null | head -n 1)

  if [ -n "$existing_product_id" ]; then
    log "Updating product $product_id"
    $WP wc product update "$existing_product_id" \
      --user=admin \
      --name="$product_name" \
      --type=simple \
      --regular_price="$price_sek" \
      --sku="$product_id" \
      --description="$condition" \
      --short_description="$condition" \
      --categories="$categories_json" \
      --images="$images_json" \
      --manage_stock=false \
      --in_stock=1 >/dev/null
  else
    log "Creating product $product_id"
    $WP wc product create \
      --user=admin \
      --name="$product_name" \
      --type=simple \
      --regular_price="$price_sek" \
      --sku="$product_id" \
      --description="$condition" \
      --short_description="$condition" \
      --categories="$categories_json" \
      --images="$images_json" \
      --manage_stock=false \
      --in_stock=1 >/dev/null
  fi
done

log "Seed script completed."
