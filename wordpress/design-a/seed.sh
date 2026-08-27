#!/bin/sh

set -eu

# Shared configuration for WP-CLI and mounted content sources.
WP="wp --allow-root --path=/var/www/html"
# Internal-only URL: reachable from the wpcli container over the Docker network, used only
# for health-check curls before WordPress is fully installed/configured.
INTERNAL_URL="http://wordpress"
# Public-facing URL: the actual host-mapped port a browser/smoke-test uses (docker-compose.yml
# maps 8091:80). WordPress's siteurl/home options MUST match this, or WordPress will generate
# internal-only links (nav, assets, checkout redirects) that don't resolve from the host.
PUBLIC_URL="http://localhost:8091"
PRODUCTS_JSON="/mnt/content/products.json"
PAGES_JSON="/mnt/content/pages.sv.json"
PRODUCTS_DIR="/mnt/assets/products"
GALLERY_DIR="/mnt/assets/gallery"
# Real coordinates for Hamngatan 10, Östersund (via OpenStreetMap Nominatim), used to embed an
# actual map on the Kontakt page instead of a static "map goes here later" placeholder graphic.
STORE_LAT="63.1760791"
STORE_LON="14.6362029"

log() {
  # Must go to stderr: several helper functions (ensure_page, ensure_attachment,
  # ensure_wc_page) call log() and then return their real value via a final
  # `printf` to stdout, and are invoked via command substitution (`x=$(...)`)
  # by their callers. If log() also wrote to stdout, its message text would be
  # concatenated into the captured return value (this previously corrupted
  # page_on_front, silently leaving the site on the default blog listing).
  printf '%s\n' "$*" >&2
}

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

json_value() {
  php -r '
    $file = $argv[1];
    $path = explode(".", $argv[2]);
    $data = json_decode(file_get_contents($file), true);
    if (!is_array($data)) {
        fwrite(STDERR, "Invalid JSON: " . $file . PHP_EOL);
        exit(1);
    }
    $value = $data;
    foreach ($path as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            fwrite(STDERR, "Missing JSON path: " . $argv[2] . PHP_EOL);
            exit(1);
        }
        $value = $value[$segment];
    }
    if (is_array($value)) {
        foreach ($value as $item) {
            echo $item, PHP_EOL;
        }
        exit(0);
    }
    echo $value;
  ' "$1" "$2"
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

page_id_by_slug() {
  SLUG="$1" $WP eval '
    $page = get_page_by_path(getenv("SLUG"), OBJECT, "page");
    echo $page ? $page->ID : "";
  '
}

post_slug() {
  $WP post get "$1" --field=post_name 2>/dev/null || true
}

attachment_url() {
  ATTACHMENT_ID="$1" $WP eval '
    $url = wp_get_attachment_url((int) getenv("ATTACHMENT_ID"));
    echo $url ? $url : "";
  '
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

ensure_page() {
  title="$1"
  slug="$2"
  content="$3"

  page_id=$(page_id_by_slug "$slug")
  if [ -n "$page_id" ]; then
    log "Updating page $slug"
    $WP post update "$page_id" \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --post_content="$content" >/dev/null
  else
    log "Creating page $slug"
    page_id=$($WP post create \
      --post_type=page \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --post_content="$content" \
      --porcelain)
  fi

  [ -n "$page_id" ] || fail "Failed to resolve page ID for slug $slug"
  printf '%s' "$page_id"
}

ensure_wc_page() {
  option_name="$1"
  title="$2"
  slug="$3"
  content="$4"

  page_id=$($WP option get "$option_name" 2>/dev/null || true)
  if [ -n "$page_id" ] && [ "$page_id" != "0" ]; then
    post_status=$($WP post get "$page_id" --field=post_status 2>/dev/null || true)
    if [ "$post_status" = "publish" ]; then
      $WP post update "$page_id" \
        --post_title="$title" \
        --post_status=publish \
        --post_content="$content" >/dev/null
      printf '%s' "$page_id"
      return 0
    fi
  fi

  page_id=$(page_id_by_slug "$slug")
  if [ -n "$page_id" ]; then
    $WP post update "$page_id" \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --post_content="$content" >/dev/null
  else
    page_id=$($WP post create \
      --post_type=page \
      --post_title="$title" \
      --post_name="$slug" \
      --post_status=publish \
      --post_content="$content" \
      --porcelain)
  fi

  $WP option update "$option_name" "$page_id" >/dev/null
  printf '%s' "$page_id"
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
      # Use a PHP-based (mysqli) WP-CLI command to test DB connectivity, not `wp db check`
      # (which shells out to the mysql/mariadb client binary and fails in this environment
      # with a TLS/self-signed-certificate error unrelated to actual readiness). A clean
      # "not installed" response still proves the DB connection itself succeeded; only a
      # DB-connection error should keep us waiting.
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

# Step 1: install WordPress once.
log "Step 1: Core install"
if ! $WP core is-installed >/dev/null 2>&1; then
  $WP core install \
    --url="$PUBLIC_URL" \
    --title="Tur Second Hand" \
    --admin_user="admin" \
    --admin_password="demo1234" \
    --admin_email="admin@example.test" \
    --skip-email >/dev/null
fi

# Step 1a: switch the site to Swedish.
log "Step 1a: Swedish locale"
if ! $WP language core is-installed sv_SE >/dev/null 2>&1; then
  $WP language core install sv_SE --activate >/dev/null
else
  $WP site switch-language sv_SE >/dev/null
fi

# Step 2: use pretty permalinks for page and WooCommerce routes.
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
# WooCommerce SEK default of a leading symbol glued to two decimals (e.g. "kr650.00").
$WP option update woocommerce_currency_pos "right_space" >/dev/null
$WP option update woocommerce_price_num_decimals "0" >/dev/null
# Newer WooCommerce versions default fresh installs to "Coming Soon" mode, which hides the
# storefront behind a placeholder page. This demo must always be publicly browsable.
$WP option update woocommerce_coming_soon "no" >/dev/null

verify_store_api

if $WP language plugin install woocommerce sv_SE >/dev/null 2>&1; then
  log "Installed WooCommerce sv_SE translations."
else
  log "WooCommerce sv_SE translations unavailable; continuing with Swedish core only."
fi

# Step 4: make Cheque/pay-on-pickup the only enabled payment gateway.
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

# Step 6: import products, reusing media and products on re-run.
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

# Step 7: verify or create WooCommerce utility pages, then normalize the shop slug.
log "Step 7: Shop, cart, and checkout pages"
shop_page_id=$(ensure_wc_page "woocommerce_shop_page_id" "$(json_value "$PAGES_JSON" "butik.title")" "butik" "")
cart_page_id=$(ensure_wc_page "woocommerce_cart_page_id" "$(json_value "$PAGES_JSON" "varukorg.title")" "varukorg" "<!-- wp:woocommerce/cart /-->")
checkout_page_id=$(ensure_wc_page "woocommerce_checkout_page_id" "$(json_value "$PAGES_JSON" "kassa.title")" "kassa" "<!-- wp:woocommerce/checkout /-->")

for required_page_id in "$shop_page_id" "$cart_page_id" "$checkout_page_id"; do
  post_status=$($WP post get "$required_page_id" --field=post_status 2>/dev/null || true)
  [ "$post_status" = "publish" ] || fail "WooCommerce page $required_page_id is not published"
done

# Step 7a: expand the cart/checkout pages' bare `<!-- wp:woocommerce/cart /-->` /
# `<!-- wp:woocommerce/checkout /-->` placeholders (written above) into the full inner-block
# markup WooCommerce actually needs. A self-closing block with no inner blocks isn't just a
# lazy/equivalent shorthand: WooCommerce's block-template back-compat shim in
# Cart.php/Checkout.php pattern-matches specific inner `<div data-block-name="...">` wrapper
# markup to upgrade older page content, and finds nothing to match against a genuinely empty
# block, silently rendering almost nothing (just a stray "</div>") instead of the cart/checkout
# UI. Regenerate both pages' content from WooCommerce's own canonical block markup (the same
# markup `WC_Install::create_pages()` writes for a fresh install) via reflection, since that
# method is intentionally private API but the only source of truth that won't drift from
# whatever WooCommerce version is installed.
log "Step 7a: Expand cart/checkout block placeholders to full markup"
$WP eval '
$cart_ref = new ReflectionMethod("WC_Install", "get_cart_block_content");
$cart_ref->setAccessible(true);
wp_update_post(array("ID" => wc_get_page_id("cart"), "post_content" => $cart_ref->invoke(null)));

$checkout_ref = new ReflectionMethod("WC_Install", "get_checkout_block_content");
$checkout_ref->setAccessible(true);
wp_update_post(array("ID" => wc_get_page_id("checkout"), "post_content" => $checkout_ref->invoke(null)));
' >/dev/null

if [ "$(post_slug "$shop_page_id")" = "shop" ]; then
  $WP post update "$shop_page_id" --post_name=butik >/dev/null
  $WP rewrite flush --hard >/dev/null
fi

# Step 8: build the Swedish content pages from pages.sv.json and gallery media.
log "Step 8: Content pages"
om_oss_title=$(json_value "$PAGES_JSON" "om_oss.title")
om_oss_body=$(json_value "$PAGES_JSON" "om_oss.body")
# Split the approved copy (content/pages.sv.json) into an intro paragraph and a closing
# "belief" statement so it reads as two visual beats instead of one wall of text. No wording
# is changed — only where the paragraph break falls.
om_oss_intro="${om_oss_body%%Vi tror på*}"
om_oss_belief="Vi tror på${om_oss_body#*Vi tror på}"
om_oss_hero_id=$(ensure_attachment "$GALLERY_DIR/trail-2.jpg" "om-oss-hero.jpg")
om_oss_hero_url=$(attachment_url "$om_oss_hero_id")
om_oss_content=$(cat <<EOF
<!-- wp:cover {"url":"$om_oss_hero_url","id":$om_oss_hero_id,"dimRatio":50,"overlayColor":"primary-dark","isUserOverlayColor":true,"minHeight":50,"minHeightUnit":"vh","contentPosition":"center center","align":"full"} -->
<div class="wp-block-cover alignfull"><span aria-hidden="true" class="wp-block-cover__background has-primary-dark-background-color has-background-dim"></span><img class="wp-block-cover__image-background" alt="" src="$om_oss_hero_url" data-object-fit="cover"/><div class="wp-block-cover__inner-container">
<!-- wp:heading {"textAlign":"center","level":1,"textColor":"on-primary","style":{"typography":{"fontSize":"var:preset|font-size|xxx-large"}}} -->
<h1 class="wp-block-heading has-text-align-center has-on-primary-color has-text-color" style="font-size:var(--wp--preset--font-size--xxx-large)">$om_oss_title</h1>
<!-- /wp:heading -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|7","bottom":"var:preset|spacing|7","left":"var:preset|spacing|6","right":"var:preset|spacing|6"},"blockGap":"var:preset|spacing|5"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--7);padding-right:var(--wp--preset--spacing--6);padding-bottom:var(--wp--preset--spacing--7);padding-left:var(--wp--preset--spacing--6)">
<!-- wp:paragraph {"style":{"typography":{"fontSize":"var:preset|font-size|large"}}} -->
<p style="font-size:var(--wp--preset--font-size--large)">$om_oss_intro</p>
<!-- /wp:paragraph -->

<!-- wp:group {"backgroundColor":"surface","style":{"border":{"radius":"var:preset|custom|radius-md"},"spacing":{"padding":{"top":"var:preset|spacing|6","bottom":"var:preset|spacing|6","left":"var:preset|spacing|6","right":"var:preset|spacing|6"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-surface-background-color has-background" style="border-radius:var(--wp--custom--radius-md);padding-top:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6);padding-bottom:var(--wp--preset--spacing--6);padding-left:var(--wp--preset--spacing--6)">
<!-- wp:paragraph {"style":{"typography":{"fontStyle":"italic","fontSize":"var:preset|font-size|large"}}} -->
<p style="font-style:italic;font-size:var(--wp--preset--font-size--large)">$om_oss_belief</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
EOF
)
ensure_page "$om_oss_title" "om-oss" "$om_oss_content" >/dev/null

gallery_title=$(json_value "$PAGES_JSON" "galleri.title")
gallery_content="<!-- wp:heading {\"level\":1} -->
<h1 class=\"wp-block-heading\">$gallery_title</h1>
<!-- /wp:heading -->

<!-- wp:gallery {\"linkTo\":\"media\"} -->
<figure class=\"wp-block-gallery has-nested-images columns-default is-cropped\">"

for gallery_image_name in $(json_value "$PAGES_JSON" "galleri.images"); do
  [ -n "$gallery_image_name" ] || continue
  gallery_attachment_id=$(ensure_attachment "$GALLERY_DIR/$gallery_image_name" "$gallery_image_name")
  gallery_attachment_url=$(attachment_url "$gallery_attachment_id")
  gallery_content="${gallery_content}
<!-- wp:image {\"id\":${gallery_attachment_id},\"sizeSlug\":\"large\",\"linkDestination\":\"media\"} -->
<figure class=\"wp-block-image size-large\"><img src=\"${gallery_attachment_url}\" alt=\"\" class=\"wp-image-${gallery_attachment_id}\"/></figure>
<!-- /wp:image -->"
done

gallery_content="${gallery_content}
</figure>
<!-- /wp:gallery -->"
ensure_page "$gallery_title" "galleri" "$gallery_content" >/dev/null

kontakt_title=$(json_value "$PAGES_JSON" "kontakt.title")
kontakt_address=$(json_value "$PAGES_JSON" "kontakt.address")
kontakt_phone=$(json_value "$PAGES_JSON" "kontakt.phone")
kontakt_hours=$(json_value "$PAGES_JSON" "kontakt.hours")
kontakt_instagram=$(json_value "$PAGES_JSON" "kontakt.instagram_url")

# Turn the "Day time · Day time · ..." string into a real list, one opening-hours line per day,
# instead of one long run-on sentence.
kontakt_hours_items=""
old_ifs="$IFS"
IFS='·'
for hours_line in $kontakt_hours; do
  hours_line=$(printf '%s' "$hours_line" | sed 's/^ *//; s/ *$//')
  [ -n "$hours_line" ] || continue
  kontakt_hours_items="${kontakt_hours_items}<!-- wp:list-item -->
<li>${hours_line}</li>
<!-- /wp:list-item -->
"
done
IFS="$old_ifs"

# Embed a real OpenStreetMap view (no API key required) centered on the store's actual
# coordinates, instead of a static graphic that visibly said "map goes here later".
kontakt_map_bbox_left=$(awk -v lon="$STORE_LON" 'BEGIN{printf "%.7f", lon-0.006}')
kontakt_map_bbox_right=$(awk -v lon="$STORE_LON" 'BEGIN{printf "%.7f", lon+0.006}')
kontakt_map_bbox_bottom=$(awk -v lat="$STORE_LAT" 'BEGIN{printf "%.7f", lat-0.003}')
kontakt_map_bbox_top=$(awk -v lat="$STORE_LAT" 'BEGIN{printf "%.7f", lat+0.003}')
kontakt_map_src="https://www.openstreetmap.org/export/embed.html?bbox=${kontakt_map_bbox_left}%2C${kontakt_map_bbox_bottom}%2C${kontakt_map_bbox_right}%2C${kontakt_map_bbox_top}&layer=mapnik&marker=${STORE_LAT}%2C${STORE_LON}"

kontakt_content=$(cat <<EOF
<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">$kontakt_title</h1>
<!-- /wp:heading -->

<!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|5","left":"var:preset|spacing|6"}}}} -->
<div class="wp-block-columns">
<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%">
<!-- wp:group {"backgroundColor":"surface","style":{"border":{"radius":"var:preset|custom|radius-md"},"spacing":{"padding":{"top":"var:preset|spacing|6","bottom":"var:preset|spacing|6","left":"var:preset|spacing|6","right":"var:preset|spacing|6"},"blockGap":"var:preset|spacing|4"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-surface-background-color has-background" style="border-radius:var(--wp--custom--radius-md);padding-top:var(--wp--preset--spacing--6);padding-right:var(--wp--preset--spacing--6);padding-bottom:var(--wp--preset--spacing--6);padding-left:var(--wp--preset--spacing--6)">
<!-- wp:group -->
<div class="wp-block-group">
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Besök oss</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>$kontakt_address</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->

<!-- wp:group -->
<div class="wp-block-group">
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Öppettider</h3>
<!-- /wp:heading -->
<!-- wp:list -->
<ul class="wp-block-list">
$kontakt_hours_items</ul>
<!-- /wp:list -->
</div>
<!-- /wp:group -->

<!-- wp:group -->
<div class="wp-block-group">
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Kontakta oss</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><a href="tel:$kontakt_phone">$kontakt_phone</a></p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p><a href="$kontakt_instagram">Instagram</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%">
<!-- wp:html -->
<div style="border-radius:var(--wp--custom--radius-md);overflow:hidden;min-height:22rem;height:100%"><iframe src="$kontakt_map_src" style="border:0;width:100%;height:100%;min-height:22rem" loading="lazy" title="Karta: $kontakt_address"></iframe></div>
<!-- /wp:html -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
EOF
)
ensure_page "$kontakt_title" "kontakt" "$kontakt_content" >/dev/null

# Step 9: create the front-page object and point WordPress at it.
log "Step 9: Home page"
hem_page_id=$(ensure_page "Hem" "hem" "")
$WP option update show_on_front page >/dev/null
$WP option update page_on_front "$hem_page_id" >/dev/null

# Step 10: fail fast if the parent theme is missing, then activate the child theme.
log "Step 10: Theme activation"
if ! $WP theme list --field=name | grep -qx twentytwentyfive; then
  fail "Required parent theme twentytwentyfive is missing."
fi
$WP theme activate tur-secondhand >/dev/null

log "Seed script completed."
