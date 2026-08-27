# Design tokens

This document is the single source of truth for the Tur Second Hand color, typography, and spacing system. Phase 2 (`theme.json`) and Phase 4 (React Tailwind config) must read from `design-system/tokens/*.json`, not redefine these values independently.

## Shared foundations

| Token | Label | Value |
| --- | --- | --- |
| `fontBody` | Body font | `"Inter", "Helvetica Neue", Arial, sans-serif` |
| `space1` | Spacing step 1 | `4px` |
| `space2` | Spacing step 2 | `8px` |
| `space3` | Spacing step 3 | `12px` |
| `space4` | Spacing step 4 | `16px` |
| `space5` | Spacing step 5 | `24px` |
| `space6` | Spacing step 6 | `32px` |
| `space7` | Spacing step 7 | `48px` |
| `space8` | Spacing step 8 | `64px` |
| `space9` | Spacing step 9 | `96px` |
| `radiusSm` | Small radius | `4px` |
| `radiusMd` | Medium radius | `10px` |
| `radiusLg` | Large radius | `20px` |
| `shadowSm` | Small shadow | `0 1px 2px rgba(20, 20, 10, 0.08)` |
| `shadowMd` | Medium shadow | `0 4px 16px rgba(20, 20, 10, 0.12)` |
| `textSm` | Small text size | `0.875rem` |
| `textBase` | Base text size | `1rem` |
| `textLg` | Large text size | `1.25rem` |
| `textXl` | Extra-large text size | `1.75rem` |
| `text2xl` | 2XL text size | `2.5rem` |
| `text3xl` | 3XL text size | `3.5rem` |
| `containerMax` | Maximum container width | `1200px` |
| `colorSuccess` | Success color | `#3f7d4e` |
| `colorError` | Error color | `#a4442b` |
| `colorBase` | Shared base color | `#f5f0e6` |

## Variant A — Skogsstig Classic

Forest green + cream, serif display headings, calm editorial magazine feel.

| Token | Label | Value |
| --- | --- | --- |
| `fontHeading` | Heading font | `"Fraunces", Georgia, serif` |
| `colorPrimary` | Primary color | `#2b3a2a` |
| `colorPrimaryDark` | Primary dark color | `#1c271b` |
| `colorOnPrimary` | On-primary text color | `#f5f0e6` |
| `colorSurface` | Surface color | `#ffffff` |
| `colorText` | Body text color | `#232922` |
| `colorTextMuted` | Muted text color | `#5c6b58` |
| `colorBorder` | Border color | `#ddd4c2` |
| `colorAccent` | Accent color | `#8a6d3b` |

## Variant B — Skogsstig Varm

Same layout DNA, warm terracotta/rust accent, humanist sans-serif headings.

| Token | Label | Value |
| --- | --- | --- |
| `fontHeading` | Heading font | `"Work Sans", "Helvetica Neue", Arial, sans-serif` |
| `colorPrimary` | Primary color | `#c9603a` |
| `colorPrimaryDark` | Primary dark color | `#9c4527` |
| `colorOnPrimary` | On-primary text color | `#f5f0e6` |
| `colorSurface` | Surface color | `#fbf5ee` |
| `colorText` | Body text color | `#2c2420` |
| `colorTextMuted` | Muted text color | `#6b5d54` |
| `colorBorder` | Border color | `#e3d6c8` |
| `colorAccent` | Accent color | `#4b6b4f` |

## Usage

Both variants share one layout and component implementation; only the token values swap. WordPress reads them via `theme.json` per variant, and React reads them via Tailwind theme config / CSS variables per variant. Non-token layout and spacing decisions (breakpoints beyond `--container-max`, grid columns, and similar details) are defined per phase as needed and are out of scope here.
