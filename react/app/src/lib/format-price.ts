// Formats a WooCommerce Store API price object into a human-readable string (e.g. "650 kr"),
// matching the wordpress track's woocommerce_currency_pos=right_space +
// woocommerce_price_num_decimals=0 seed config. Store API prices are integers scaled by
// currency_minor_unit (0 here, so no division needed), never raw floats.
import type { StoreApiPrices } from "@/lib/store-api";

export function formatStorePrice(prices: StoreApiPrices, field: "price" | "regular_price" = "price"): string {
  return formatMinorUnitAmount(prices[field], prices.currency_minor_unit, prices.currency_prefix, prices.currency_suffix);
}

/** Formats any Store API minor-unit-scaled amount string (e.g. cart/item totals), which use
 * the same scaling convention as product prices but aren't always wrapped in a `prices` object. */
export function formatMinorUnitAmount(
  amount: string,
  minorUnit: number,
  prefix = "",
  suffix = " kr",
): string {
  const value = Number(amount) / 10 ** (minorUnit ?? 0);
  const formatted = minorUnit > 0 ? value.toFixed(minorUnit) : value.toString();
  return `${prefix}${formatted}${suffix}`.trim();
}
