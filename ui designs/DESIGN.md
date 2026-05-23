---
name: Midnight Zen
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#bdc2ff'
  on-secondary: '#131e8c'
  secondary-container: '#2f3aa3'
  on-secondary-container: '#a8afff'
  tertiary: '#d5dcf6'
  on-tertiary: '#283044'
  tertiary-container: '#b9c0da'
  on-tertiary-container: '#474e64'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#2f3aa3'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for high-stakes financial analysis, prioritizing cognitive ease and professional trust. It adopts a **Modern Corporate** aesthetic with **Glassmorphic** nuances to signal advanced AI capabilities.

The UI targets finance professionals and business owners who require clarity amidst complex data. By utilizing a "Deep & Soothing" palette, the interface reduces eye strain during long working sessions. The emotional response is one of calm precision—transforming the stressful task of invoice auditing into a streamlined, high-tech experience.

## Colors
The color strategy employs a deep-layer approach to hierarchy. 

- **Primary (#22D3EE)**: Reserved for AI-driven insights, success states, and primary actions. It acts as the "glow" within the dark environment.
- **Secondary (#818CF8)**: Used for secondary interactive elements and data categorization.
- **Background Tiers**: The base is `Midnight Navy (#0F172A)`, while `Charcoal Grey (#1E293B)` and `Slate (#334155)` define cards and elevated surfaces.
- **Typography**: Primary content uses `Off-white (#F8FAFC)` for maximum legibility against dark backgrounds, while `Soft Grey (#94A3B8)` is used for metadata and labels.

## Typography
Typography is optimized for data density and technical precision. 

- **Headlines**: Geist provides a clean, geometric structure that feels modern and architectural.
- **Body**: Inter is used for its exceptional readability in long-form data tables and invoice descriptions.
- **Labels/Data**: JetBrains Mono is introduced for monospaced values (invoice numbers, currency, dates) to ensure vertical alignment and a technical "audited" feel.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure for desktop. 

- **Desktop**: 12 columns, 24px gutters, 40px side margins.
- **Tablet**: 8 columns, 16px gutters, 24px side margins.
- **Mobile**: 4 columns, 12px gutters, 16px side margins.

A consistent 4px baseline grid ensures vertical rhythm. Data-heavy tables should use "sm" padding (12px) to maximize information density, while dashboard containers use "lg" (24px) padding to provide visual breathing room.

## Elevation & Depth
This design system uses **Glassmorphism** and **Tonal Layers** rather than traditional heavy shadows.

1.  **Level 0 (Base)**: `#0F172A` (Midnight Navy).
2.  **Level 1 (Cards)**: `#1E293B` (Charcoal) with a 1px border of `#334155`.
3.  **Level 2 (Modals/Popovers)**: Backdrop blur (12px-20px) with 60% opacity of Slate and a subtle inner glow on the top edge.
4.  **Interactive States**: Elements should use a soft outer glow (0px 0px 15px) using the Primary Cyan color at 15% opacity when focused or active.

## Shapes
Shapes are defined by "Rounded" parameters to soften the professional environment and make the AI feel approachable. 

Standard components (buttons, inputs) utilize a `0.5rem` (8px) radius. Larger containers like invoice previews and data cards use `rounded-lg` (16px) to create a clear containerized feel. Status chips and badges should use a full pill-shape for distinct visual separation from interactive buttons.

## Components
- **Buttons**: Primary buttons are solid Cyan with dark navy text. Secondary buttons use a ghost style with a Slate border and Cyan text.
- **Input Fields**: Backgrounds use Charcoal Grey with a 1px Slate border. On focus, the border transitions to Cyan with a subtle 2px glow.
- **Cards**: Feature a 1px border of `#334155`. For AI-detected anomalies, the card border should pulse subtly with the Indigo secondary color.
- **Chips**: Use the pill-shape. "Approved" states use a low-opacity Green tint; "Flagged" states use a low-opacity Amber tint.
- **Data Tables**: Remove vertical grid lines. Use horizontal Slate dividers at 0.5px thickness. Row hover states should brighten the background to `#334155`.
- **AI Indicator**: A bespoke component—a small, glowing Indigo dot—should appear next to any data point processed or verified by the AI.