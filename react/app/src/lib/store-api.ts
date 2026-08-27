// Thin typed wrapper over the WooCommerce Store API (`/wp-json/wc/store/v1/...`) exposed by
// the headless backend in react/<design>/docker-compose.yml. Read-only catalog calls
// (getProducts/getProduct/getCategories) are safe to call directly from Server Components —
// they carry no session state. Cart/checkout calls MUST go through our own
// `/api/store/[...path]` route handler (see route.ts next to this file's sibling in
// app/api/store/), which proxies to WORDPRESS_STORE_API_URL and translates WooCommerce's
// Cart-Token/Nonce response headers into same-origin cookies — the Store API does not
// support being called with cart state directly from a browser on a different origin/port.
const STORE_API_URL = process.env.WORDPRESS_STORE_API_URL || "http://localhost:8093";
const STORE_API_BASE = `${STORE_API_URL.replace(/\/$/, "")}/wp-json/wc/store/v1`;

export interface StoreApiImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface StoreApiPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: unknown;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface StoreApiCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface StoreApiProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  sku: string;
  prices: StoreApiPrices;
  images: StoreApiImage[];
  categories: StoreApiCategory[];
  is_in_stock: boolean;
  is_purchasable: boolean;
}

export interface StoreApiCartItem {
  key: string;
  id: number;
  quantity: number;
  name: string;
  images: StoreApiImage[];
  prices: StoreApiPrices;
  totals: { line_subtotal: string; line_total: string };
}

export interface StoreApiCart {
  items: StoreApiCartItem[];
  items_count: number;
  totals: {
    total_items: string;
    total_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
}

async function storeApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${STORE_API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Store API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// The Store API returns `name` fields (product + category titles) HTML-entity-encoded, e.g.
// "Skidor &amp; Pj\u00e4xor" — WordPress core's title sanitizer runs post titles through
// `wptexturize`/`esc_html` before they reach REST responses. Rendering that string as plain
// JSX text (not via dangerouslySetInnerHTML) double-encodes it into "Skidor &amp;amp; Pjäxor"
// on the page. Decode once here, at the single place these fields enter the app, rather than
// remembering to decode in every component that displays a name.
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

// WooCommerce builds product image URLs from the site's own `home_url` — which for these demo
// backends is always the *public* browser-facing address (e.g. "http://localhost:8093" locally,
// or "https://tur3.dancingsalamanders.com" in production), because that's what wp-admin/checkout
// emails need to point at. But Next.js's built-in image optimizer runs server-side, inside the
// nextjs container, where that public hostname either resolves back to itself (local) or simply
// isn't allow-listed in next.config.ts's images.remotePatterns (production) — and Next.js 15+
// also actively refuses to fetch any hostname that resolves to a private/loopback IP as an SSRF
// guard. Rewrite the origin (whatever it is) to the internal Docker Compose service hostname
// (WORDPRESS_STORE_API_URL, e.g. "http://wordpress") before handing image URLs to next/image —
// that hostname is the only one allow-listed in next.config.ts's images.remotePatterns. The
// browser itself never fetches this URL directly; it only ever requests our own `/_next/image`
// route, which resolves it server-side, so the rewritten internal hostname works transparently
// regardless of what public domain WooCommerce originally generated the URL against.
function rewriteImageOrigin(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, STORE_API_URL.replace(/\/$/, ""));
}

function normalizeImages<T extends { images: StoreApiImage[] }>(item: T): T {
  return { ...item, images: item.images.map((image) => ({ ...image, src: rewriteImageOrigin(image.src) })) };
}

/** Read-only catalog calls — safe to call directly from Server Components. */
export async function getProducts(params?: { category?: string }): Promise<StoreApiProduct[]> {
  const qs = params?.category ? `?category=${encodeURIComponent(params.category)}&per_page=50` : "?per_page=50";
  const products = await storeApiFetch<StoreApiProduct[]>(`/products${qs}`);
  return products.map((product) =>
    normalizeImages({
      ...product,
      name: decodeHtmlEntities(product.name),
      categories: product.categories.map((c) => ({ ...c, name: decodeHtmlEntities(c.name) })),
    }),
  );
}

export async function getProduct(slug: string): Promise<StoreApiProduct | null> {
  const products = await storeApiFetch<StoreApiProduct[]>(`/products?slug=${encodeURIComponent(slug)}`);
  const product = products[0];
  if (!product) return null;
  return normalizeImages({
    ...product,
    name: decodeHtmlEntities(product.name),
    categories: product.categories.map((c) => ({ ...c, name: decodeHtmlEntities(c.name) })),
  });
}

export async function getCategories(): Promise<StoreApiCategory[]> {
  const categories = await storeApiFetch<StoreApiCategory[]>(`/products/categories?per_page=50`);
  return categories.map((c) => ({ ...c, name: decodeHtmlEntities(c.name) }));
}

export { STORE_API_BASE, rewriteImageOrigin };
