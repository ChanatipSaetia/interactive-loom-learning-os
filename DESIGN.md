---
version: 1.0
name: Interactive Loom Learning OS — Design System
description: Dark theme learning platform using Catppuccin Frappé palette with Cohere structural design principles.
---

## Overview

The Interactive Loom Learning OS uses a dark theme built on the **Catppuccin Frappé** palette, applying Cohere's structural design philosophy: flat surfaces, thin borders, restrained typography, pill CTAs, and generous whitespace as a trust signal. The color palette replaces Cohere's white canvas with a dark base, while preserving the design intent of restrained chrome, large empty intervals, and type-driven hierarchy.

**Key Characteristics:**
- Dark canvas using Catppuccin Frappé base/mantle/crust tones
- Flat UI with no heavy drop shadows; depth through surface alternation
- Thin hairline borders (`--hairline`, `--border-light`) for containment
- Pill-shaped primary buttons and pill outline secondary controls
- Monospace-feeling display headlines and precise body text
- Warm accent colors (peach/coral, pink/mauve, teal/sky) for highlights
- `color-scheme: dark` for native dark browser chrome
- Custom-styled scrollbars matching the palette

## Colors

### Catppuccin Frappé Palette

| Token | Hex | Role |
|---|---|---|
| `--ctp-rosewater` | `#f2d5cf` | Soft highlight |
| `--ctp-flamingo` | `#eebebe` | Soft warm accent |
| `--ctp-pink` | `#f4b8e4` | Accent highlight |
| `--ctp-mauve` | `#ca9ee6` | Accent highlight |
| `--ctp-red` | `#e78284` | Error and destructive actions |
| `--ctp-maroon` | `#ea999c` | Warm secondary accent |
| `--ctp-peach` | `#ef9f76` | Coral equivalent, warm markers |
| `--ctp-yellow` | `#e5c890` | Warning and highlights |
| `--ctp-green` | `#a6d189` | Success and positive states |
| `--ctp-teal` | `#81c8be` | Deep green equivalent |
| `--ctp-sky` | `#99d1db` | Cool accent |
| `--ctp-sapphire` | `#85c1dc` | Cool secondary accent |
| `--ctp-blue` | `#8caaee` | Action links and primary interactions |
| `--ctp-lavender` | `#babbf1` | Focus ring and interactive highlight |
| `--ctp-text` | `#c6d0f5` | Primary text (`--ink`) |
| `--ctp-subtext1` | `#b5bfe2` | Secondary text |
| `--ctp-subtext0` | `#a5adce` | Muted body text |
| `--ctp-overlay2` | `#949cbb` | Muted labels and metadata |
| `--ctp-overlay1` | `#838ba7` | Slate separators and tertiary text |
| `--ctp-overlay0` | `#737994` | Hover scrollbar thumb |
| `--ctp-surface2` | `#626880` | Strong borders and dividers |
| `--ctp-surface1` | `#51576d` | Subtle borders |
| `--ctp-surface0` | `#414559` | Row separators and card borders |
| `--ctp-base` | `#303446` | Page and SVG canvas background |
| `--ctp-mantle` | `#292c3c` | Scrollbar track |
| `--ctp-crust` | `#232634` | Sidebar, darkest surfaces |

### Semantic Color Tokens

| Token | Maps To | Role |
|---|---|---|
| `--cohere-black` | `--ctp-crust` | Highest-contrast dark surface |
| `--primary` | `--ctp-blue` | Primary brand accent color, active states, primary buttons |
| `--primary-foreground` | `--ctp-crust` | Text on primary backgrounds |
| `--ink` | `--ctp-text` | Primary text color |
| `--deep-green` | `--ctp-teal` | Accent band color |
| `--dark-navy` | `--ctp-crust` | Dark feature sections |
| `--canvas` | `--ctp-base` | Page and SVG canvas background |
| `--soft-stone` | `--ctp-surface0` | Elevated surfaces (cards, table header) |
| `--hairline` | `--ctp-surface2` | Strong border and dividers |
| `--border-light` | `--ctp-surface1` | Subtle border |
| `--card-border` | `--ctp-surface0` | Row separator |
| `--muted` | `--ctp-overlay2` | Muted labels and metadata |
| `--slate` | `--ctp-overlay1` | Tertiary text and separators |
| `--body-muted` | `--ctp-subtext0` | De-emphasized body text |
| `--action-blue` | `--ctp-blue` | Links and primary actions |
| `--focus-blue` | `--ctp-lavender` | Keyboard focus ring |
| `--coral` | `--ctp-peach` | Warm accent, taxonomy chips |
| `--coral-soft` | `--ctp-rosewater` | Pale chip borders |
| `--error` | `--ctp-red` | Validation errors |
| `--on-primary` | `--ctp-text` | Text on primary/dark surfaces |
| `--on-dark` | `--ctp-text` | Text on dark surfaces |

### Washes

| Token | Value | Role |
|---|---|---|
| `--pale-green` | `rgba(166, 209, 137, 0.13)` | Subtle green surface tint |
| `--pale-blue` | `rgba(140, 170, 238, 0.16)` | Selection highlight |
| `--pale-pink` | `rgba(244, 184, 228, 0.13)` | Subtle pink surface tint |

## Typography

### Font Family

| Role | CSS Variable | Stack |
|---|---|---|
| Display | `--font-display` | `CohereText` → `Space Grotesk` → `Inter` → `ui-sans-serif` → `system-ui` |
| Body/UI | `--font-body` | `Unica77 Cohere Web` → `Inter` → `Arial` → `ui-sans-serif` → `system-ui` |
| Monospace | `--font-mono` | `CohereMono` → `JetBrains Mono` → `Fira Code` → `ui-monospace` → `monospace` |

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Font |
|---|---:|---:|---:|---|---|
| Hero Display | 96px | 400 | 1.00 | -1.92px | Display |
| Product Display | 72px | 400 | 1.00 | -1.44px | Display |
| Section Display | 60px | 400 | 1.00 | -1.2px | Body |
| Section Heading | 48px | 400 | 1.20 | -0.48px | Body |
| Card Heading | 32px | 400 | 1.20 | -0.32px | Body |
| Feature Heading | 24px | 400 | 1.30 | 0 | Body |
| Body Large | 18px | 400 | 1.40 | 0 | Body |
| Body | 16px | 400 | 1.50 | 0 | Body |
| Button | 14px | 500 | 1.71 | 0 | Body |
| Caption | 14px | 400 | 1.40 | 0 | Body |
| Mono Label | 14px | 400 | 1.40 | 0.28px | Mono |
| Micro | 12px | 400 | 1.40 | 0 | Body |

### Principles

- Use massive type sparingly; one oversized headline per page then restrained 16px-24px UI copy
- Keep display type tight with negative tracking; hero copy should feel compact and carved
- Avoid heavy bold weights; size, spacing, and surface contrast drive hierarchy
- Monospace labels for technical markers and category tags
- Base `letter-spacing: 0.01em` on body for dark-theme readability

## Layout

### Spacing System

8px base grid with one-off alignment values:

| Token | Value |
|---|---|
| `--spacing-xxs` | 2px |
| `--spacing-xs` | 6px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 12px |
| `--spacing-lg` | 16px |
| `--spacing-xl` | 24px |
| `--spacing-xxl` | 32px |
| `--spacing-section` | 80px |

Large sections rely on dramatic vertical breathing room. Dense content appears only where it serves the information architecture.

### Elevation & Depth

Mostly flat. Depth comes from surface alternation and thin borders rather than drop shadows.

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, dark canvas | Hero copy, content surfaces |
| Bordered | 1px `--hairline` or `--border-light` | Cards, forms, dividers |
| Elevated | `--soft-stone` (`--ctp-surface0`) | Table headers, elevated cards |

### Radius Scale

| Token | Value | Role |
|---|---|---|
| `--radius-xs` | 4px | Small images, search fields |
| `--radius-sm` | 8px | Cards, small media, dialogs |
| `--radius-md` | 16px | Medium product cards |
| `--radius-lg` | 22px | Signature media cards |
| `--radius-xl` | 30px | Filter pills |
| `--radius-pill` | 32px | Primary CTA buttons |
| `--radius-full` | 9999px | Round elements, scrollbar thumb |

## Components

### Button Styles

- **Primary**: Pill-shaped, `--primary` background, `--on-primary` text, `--radius-pill`, 12px 24px padding
- **Secondary**: Text-only, no background, `--ink` text, `--radius-xs`
- **Pill Outline**: Transparent fill, 1px dark border, `--radius-xl`, 6px 12px padding

### Interactive Elements

- **Focus**: `--focus-blue` ring on keyboard focus
- **Selection**: `rgba(140, 170, 238, 0.30)` background highlight
- **Links**: `--action-blue` color with underline
- **Scrollbar**: 6px width, `--ctp-mantle` track, `--ctp-surface2` thumb, pill-rounded

## Global Styles

- `box-sizing: border-box` reset
- No default margins or padding
- `color-scheme: dark` for native browser chrome
- `-webkit-font-smoothing: antialiased`
- Base font size: 16px
- Body background: `--canvas` (`--ctp-base`)
- Body text: `--ink` (`--ctp-text`)

## Do's and Don'ts

### Do

- Use dark canvas as the default surface
- Keep primary CTAs pill-shaped and dark on lighter surfaces
- Use 22px radius on major media cards
- Use coral/peach for editorial taxonomy and small warm accents
- Let type hierarchy drive visual structure
- Use thin borders for containment

### Don't

- Don't add heavy drop shadows to cards
- Don't turn warm accents into broad decorative surfaces
- Don't use rounded corners below 8px for major media
- Don't replace the display/body type split with one generic font
- Don't use saturated gradients as normal UI backgrounds
