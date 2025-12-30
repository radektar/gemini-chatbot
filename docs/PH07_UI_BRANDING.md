# Phase 07 - UI Branding

**Status**: ✅ Completed  
**Branch**: `phase/07-ui-branding`  
**Date**: 2024-12-30

## Overview

Phase 07 implements the TTTR design system by extracting design tokens from Figma via Figma MCP and applying them to the application UI. This phase establishes a consistent visual identity with proper color palette, typography, spacing, and radius scales.

## Figma Source

- **File ID**: `2Voao3uykigSi6csJLZnww`
- **File Name**: TTTR – Website
- **Node ID**: `3-13`
- **Extraction Method**: Figma Desktop MCP (Dev Mode)

## Design Tokens Extracted

### Color Palette

#### Brand Primary
- **Deep Dark**: `#050024` (`--tttr-deep-dark`)
- **Purple Primary**: `#6c00f0` (`--tttr-purple-primary`) - Main brand color
- **Purple Hover**: `#4900a8` (`--tttr-purple-hover`)
- **Purple Dark**: `#3e008f` (`--tttr-purple-dark`)
- **Purple Light**: `#aa80ff` (`--tttr-purple-light`)
- **Purple Accent**: `#822fff` (`--tttr-purple-accent`)
- **Purple Darkest**: `#13002b` (`--tttr-purple-darkest`)

#### Brand Neutral
- **Beige**: `#e0d9ce` (`--tttr-beige`)
- **Beige Light**: `#f6f3ee` (`--tttr-beige-light`)
- **Beige Mid**: `#eeece5` (`--tttr-beige-mid`)
- **White**: `#ffffff` (`--tttr-white`)
- **Cloud White**: `#f5f4f7` (`--tttr-cloud-white`)
- **Lilac**: `#ebe8f0` (`--tttr-lilac`)
- **Blue Gray**: `#3d376c` (`--tttr-blue-gray`)

#### Brand Extended
- **Blue Primary**: `#003eee` (`--tttr-blue-primary`) - Digital Cobalt
- **Blue Dark**: `#00299b` (`--tttr-blue-dark`) - Dark Blue
- **Blue Light**: `#85a5ff` (`--tttr-blue-light`) - Periwinkle Pop
- **Green Dark**: `#055740` (`--tttr-green-dark`) - Evergreen Forest
- **Green Light**: `#56b760` (`--tttr-green-light`) - Fresh Mint
- **Coral**: `#fa4e4b` (`--tttr-coral`) - Bold Coral
- **Rose**: `#f97999` (`--tttr-rose`) - Rose Sorbet
- **Mango**: `#ffbf1a` (`--tttr-mango`) - Golden Mango

#### Semantic Colors
- **Error**: `#df4848` (`--tttr-error`)

#### Text Colors
- **Heading**: `#13002b` (`--tttr-text-heading`)
- **Paragraph**: `#050024` (`--tttr-text-paragraph`)
- **Caption**: `#0500248c` (`--tttr-text-caption`) - 55% opacity
- **Link**: `#3e008f` (`--tttr-text-link`)
- **Inactive**: `#3d376c` (`--tttr-text-inactive`)

#### Interface Colors
- **Icon**: `#2c0066` (`--tttr-interface-icon`)
- **Divider**: `#c5b2ff99` (`--tttr-interface-divider`)
- **Progress Idle**: `#e0d9ce` (`--tttr-progress-idle`)
- **Progress Active**: `#822fff` (`--tttr-progress-active`)

#### Button Colors
- **Purple Idle**: `#6c00f0` (`--tttr-btn-purple-idle`)
- **Purple Hover**: `#4900a8` (`--tttr-btn-purple-hover`)
- **Beige Idle**: `#eeece5` (`--tttr-btn-beige-idle`)
- **Beige Hover**: `#e0d9ce` (`--tttr-btn-beige-hover`)
- **Blue Idle**: `#003eee` (`--tttr-btn-blue-idle`)
- **Blue Hover**: `#00299b` (`--tttr-btn-blue-hover`)
- **White Idle**: `#ffffff` (`--tttr-btn-white-idle`)
- **White Hover**: `#f6f3ee` (`--tttr-btn-white-hover`)

#### Surface/Elevation Colors
- **Surface Light**: `#fffefa` (`--tttr-surface-light`)
- **Surface Dark**: `#f6f3ee` (`--tttr-surface-dark`)
- **Surface Dark Hover**: `#e9e4dd` (`--tttr-surface-dark-hover`)
- **Surface CTA**: `#ebe8f0` (`--tttr-surface-cta`)
- **Surface Testimonial Purple**: `#3e008f` (`--tttr-surface-testimonial-purple`)
- **Surface Testimonial Blue**: `#ebe8f0` (`--tttr-surface-testimonial-blue`)

### Typography

#### Font Families
- **Primary**: Space Grotesk (`--tttr-font-primary`)
  - Used for: Headings, buttons, interface elements
  - Weights: 400, 500, 700
  - Source: Google Fonts via `next/font/google`

- **Secondary**: DM Sans (`--tttr-font-secondary`)
  - Used for: Paragraphs, body text
  - Weights: 400, 500, 700
  - Source: Google Fonts via `next/font/google`

### Spacing Scale

| Value | CSS Variable | Tailwind Class |
|-------|--------------|----------------|
| 4px | `--tttr-spacing-4` | `tttr-4` |
| 8px | `--tttr-spacing-8` | `tttr-8` |
| 12px | `--tttr-spacing-12` | `tttr-12` |
| 16px | `--tttr-spacing-16` | `tttr-16` |
| 20px | `--tttr-spacing-20` | `tttr-20` |
| 24px | `--tttr-spacing-24` | `tttr-24` |
| 32px | `--tttr-spacing-32` | `tttr-32` |
| 40px | `--tttr-spacing-40` | `tttr-40` |
| 48px | `--tttr-spacing-48` | `tttr-48` |
| 64px | `--tttr-spacing-64` | `tttr-64` |
| 80px | `--tttr-spacing-80` | `tttr-80` |
| 96px | `--tttr-spacing-96` | `tttr-96` |

### Radius Scale

| Value | CSS Variable | Tailwind Class |
|-------|--------------|----------------|
| 4px | `--tttr-radius-4` | `rounded-tttr-4` |
| 8px | `--tttr-radius-8` | `rounded-tttr-8` |
| 12px | `--tttr-radius-12` | `rounded-tttr-12` |
| 16px | `--tttr-radius-16` | `rounded-tttr-16` |
| 20px | `--tttr-radius-20` | `rounded-tttr-20` |
| 24px | `--tttr-radius-24` | `rounded-tttr-24` |

## Implementation

### Files Modified

1. **`app/globals.css`**
   - Added 50+ CSS variables for TTTR design tokens
   - Organized by category: Brand Primary, Brand Neutral, Brand Extended, Semantic, Text, Interface, Button, Surface, Spacing, Radius, Fonts

2. **`tailwind.config.ts`**
   - Extended Tailwind theme with TTTR color palette
   - Added TTTR spacing scale
   - Added TTTR radius scale
   - Configured font families (primary, secondary)

3. **`app/layout.tsx`**
   - Imported Space Grotesk and DM Sans from `next/font/google`
   - Configured font variables (`--tttr-font-primary`, `--tttr-font-secondary`)
   - Applied font classes to HTML element

### Files Created

1. **`tests/design-tokens.test.ts`**
   - Automated tests for CSS variables
   - Tailwind configuration verification
   - Font configuration checks

2. **`scripts/test-ui-branding.ts`**
   - Visual verification script
   - Checks font loading, color application, spacing/radius scales

3. **`docs/PH07_UI_BRANDING.md`** (this file)
   - Complete documentation of design tokens
   - Usage examples and reference

## Usage Examples

### Colors

```tsx
// Using Tailwind classes
<div className="bg-tttr-purple-primary text-tttr-white">
  Primary Button
</div>

<div className="bg-tttr-surface-light text-tttr-text-heading">
  Card Content
</div>

// Using CSS variables directly
<div style={{ backgroundColor: 'var(--tttr-purple-primary)' }}>
  Custom Element
</div>
```

### Typography

```tsx
// Primary font (Space Grotesk)
<h1 className="font-primary">Heading</h1>

// Secondary font (DM Sans)
<p className="font-secondary">Body text</p>
```

### Spacing

```tsx
// Using TTTR spacing scale
<div className="p-tttr-16 m-tttr-24">
  Content with TTTR spacing
</div>
```

### Radius

```tsx
// Using TTTR radius scale
<button className="rounded-tttr-12">
  Rounded Button
</button>
```

## Testing

### Automated Tests

Run design token tests:
```bash
tsx tests/design-tokens.test.ts
```

### Visual Verification

Run UI branding test script:
```bash
tsx scripts/test-ui-branding.ts
```

### Manual Testing Checklist

- [ ] Fonts load correctly (check browser DevTools)
- [ ] Colors display correctly in light mode
- [ ] Colors display correctly in dark mode (if applicable)
- [ ] Spacing values are consistent
- [ ] Radius values are applied correctly
- [ ] Components use TTTR design tokens

## Git Workflow

**Branch**: `phase/07-ui-branding`

**Commit Message**:
```
feat(phase-07): UI branding with Figma design tokens

- Extract design tokens via Figma MCP
- Implement TTTR color palette (50+ CSS variables)
- Configure Space Grotesk + DM Sans fonts
- Update Tailwind config with TTTR design system
- Add design token tests and documentation
```

## Notes

- Design tokens were extracted directly from Figma file using Figma Desktop MCP
- All tokens are defined as CSS variables for consistency
- Tailwind integration allows easy usage via utility classes
- Fonts are loaded via `next/font/google` for optimal performance
- Dark mode support can be added in future phases if needed

## References

- Figma File: https://www.figma.com/design/2Voao3uykigSi6csJLZnww/TTTR-%E2%80%93-Website?node-id=3-13&m=dev
- Project Spec: `docs/PROJECT_SPEC.md`
- Backlog: `docs/BACKLOG.md`

