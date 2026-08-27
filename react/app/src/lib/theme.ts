// Reads the active design variant. Colors/fonts/spacing are already wired into Tailwind via
// scripts/generate-theme.mjs -> theme-tokens.generated.css (see globals.css); this helper is
// only for the rare cases where a component needs the variant name itself in JS/TSX logic
// (e.g. picking a different hero image crop, or conditional copy), not for styling.
export type ThemeVariant = "a" | "b";

export function getThemeVariant(): ThemeVariant {
  const raw = process.env.NEXT_PUBLIC_THEME_VARIANT?.toLowerCase();
  return raw === "b" ? "b" : "a";
}

export const THEME_VARIANT_NAMES: Record<ThemeVariant, string> = {
  a: "Skogsstig Classic",
  b: "Skogsstig Varm",
};
