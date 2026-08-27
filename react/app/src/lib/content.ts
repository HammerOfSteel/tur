// Loads content/pages.sv.json — the same file the WordPress track's seed.sh reads for its
// content pages (Om oss/Kontakt/Galleri/Home copy). Never duplicate this copy into a second
// hand-written file; this is the single source of truth for static Swedish page copy.
//
// In local dev this resolves relative to the monorepo (react/app -> react -> project root ->
// content/pages.sv.json). In the Docker image (Task 5) the same relative layout is preserved
// by copying content/ into the build context, or it can be overridden via CONTENT_DIR.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../../..");
const contentDir = process.env.CONTENT_DIR || resolve(projectRoot, "content");

export interface HomeContent {
  hero_tagline: string;
  hero_subtext: string;
  circular_economy_blurb: string;
  featured_categories_title: string;
  hours_location_teaser: string;
}

export interface OmOssContent {
  title: string;
  body: string;
}

export interface KontaktContent {
  title: string;
  address: string;
  phone: string;
  hours: string;
  instagram_url: string;
}

export interface GalleriContent {
  title: string;
  images: string[];
}

export interface ButikContent {
  title: string;
  intro: string;
  categories: string[];
}

export interface ProduktContent {
  add_to_cart_label: string;
  condition_label: string;
  price_label: string;
  category_label: string;
}

export interface VarukorgContent {
  title: string;
  empty_state_text: string;
  empty_state_link_text: string;
  quantity_label: string;
  subtotal_label: string;
  remove_label: string;
  checkout_button_label: string;
}

export interface KassaContent {
  title: string;
  name_label: string;
  email_label: string;
  address_label: string;
  validation_required_text: string;
  submit_button_label: string;
  order_summary_title: string;
  confirmation_title: string;
  confirmation_order_number_label: string;
}

export interface PagesContent {
  home: HomeContent;
  om_oss: OmOssContent;
  kontakt: KontaktContent;
  galleri: GalleriContent;
  butik: ButikContent;
  produkt: ProduktContent;
  varukorg: VarukorgContent;
  kassa: KassaContent;
}

let cached: PagesContent | null = null;

export function getPagesContent(): PagesContent {
  if (cached) return cached;
  const raw = readFileSync(resolve(contentDir, "pages.sv.json"), "utf-8");
  cached = JSON.parse(raw) as PagesContent;
  return cached;
}
