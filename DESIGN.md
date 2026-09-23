---
name: firedev
description: Nikolay Ostrovsky's portfolio. Drop the weight, keep the force.
colors:
  fire: "#ff6633"
  ink: "#12100f"
  muted: "#68615c"
  canvas: "#f6f4f1"
  paper: "#ffffff"
  line: "#ddd7d1"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(3.6rem, 10vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
  nav:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 900
    letterSpacing: "-0.03em"
  role:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
  lede:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 900
    letterSpacing: "0.05em"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "1rem"
    lineHeight: 1.625
rounded:
  none: "0"
spacing:
  gutter: "1rem"
  container: "min(1180px, calc(100% - 2rem))"
  section: "6rem"
  section-mobile: "4rem"
components:
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  button-outline-hover:
    backgroundColor: "{colors.fire}"
    textColor: "{colors.paper}"
  button-copy:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "44px"
  code-box:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  cta-block:
    backgroundColor: "{colors.fire}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "48px"
---

# Design System: firedev

## Overview

**Creative North Star: "Drop the Weight"**

From Nick's line "Remove weight. Keep the force." and "The best change removes more than it adds." The site works the way he works on a product: find what the page carries by habit and cut it, until only the work and the words are left. Every rule below is a subtraction. When a new element is proposed, the first question is what it replaces.

The force stays in three places: heavy black display type, one orange, and the work itself shown whole. Everything else is quiet: warm paper background, grey body text, space between sections instead of lines. The copy is Nick's own words, verbatim. A sentence he has to ask about does not ship.

**Key Characteristics:**
- One sans family, two weights that matter: 900 for display, 400 for reading.
- One accent, `#ff6633`, never darkened.
- No divider lines, no rounded corners, no shadows.
- Media at its own ratio, never CSS-cropped.
- Every page header in one position.

## Colors

Warm paper and near-black ink, with one hot orange that marks what matters.

### Primary
- **Fire** (#ff6633): the last words of every page headline ("months.", "the work.", "shipped.", "Ostrovsky"), the role line under it, stats, the active nav item and its underline, link underlines, button hover fill, the About CTA block. Nick chose this exact value over a darker accessible orange ("use my orange"). It stays `#ff6633` everywhere, including text.

### Neutral
- **Ink** (#12100f): headlines, nav hover, button text and outlines, code.
- **Muted** (#68615c): body copy, subtitles, inactive nav, labels. 5.5:1 on canvas.
- **Canvas** (#f6f4f1): the page. Warm paper, never pure white.
- **Paper** (#ffffff): media frames, code boxes, prev/next tiles. The only raised surface is a white one.
- **Line** (#ddd7d1): data-table rows only. Nowhere else.

### Named Rules
**The One Orange Rule.** One accent, one value. No tints, no darker "ink" variant, no second color. Orange lands on the last word of a headline, a role line, a number or an action. A few marks per screen.

## Typography

**Display, body, label:** the system sans (`ui-sans-serif, system-ui, -apple-system`), so the site renders as native type on every device.
**Code:** the system mono.

**Character:** black-weight display with tight tracking against light, roomy reading text. The contrast in weight does the work that decoration would do elsewhere.

### Hierarchy
- **Display** (900, `clamp(3.6rem, 10vw, 6rem)`, 0.88, −0.04em): page headlines only. Two lines, last words in Fire.
- **Headline** (900, 2.25rem → 3.75rem, −0.03em): section titles ("Recent & defining work", "Install").
- **Nav** (900, 1.8rem desktop / 1.25rem mobile, −0.03em).
- **Role** (900, 1.125rem, Fire): the line directly under a page headline.
- **Lede** (400, 1.25rem → 1.5rem, 1.625, max 48ch, Muted): the subtitle under the role line.
- **Body** (400, 1.125rem, 1.625, max 65ch, Muted).
- **Label** (900, 0.875rem, uppercase, 0.05em): Details keys, code-box titles, prev/next captions.

### Named Rules
**The Last Word Burns Rule.** Page headlines are ink with the closing words in `<strong class="text-fire-ink">`. Every page, same move.
**The 14px Floor.** No text below 14px. Labels are the smallest thing on the page.

## Layout

A single container, `min(1180px, 100% − 2rem)`, holds every page. Sections are separated by space alone: `py-16` on mobile, `py-24` on desktop. Two-column layouts are 12-column grids that collapse to one column under 768px.

### Named Rules
**The One Position Rule.** Every page opens the same way: headline, then the orange role line, then the subtitle, stacked, never in a side column. The headline's top edge sits 215px from the top of the viewport on desktop on home, posts, projects, about and project pages.
**The Work Above the Fold Rule.** No hero taller than its content. The first row of work shows on a 1440×900 screen.

## Elevation & Depth

Flat. No shadows anywhere. Depth comes from two surfaces: canvas and white paper. A white frame around media or code is the only lift.

## Shapes

Square. Radius 0 on buttons, frames, tiles, code boxes and the CTA block. The only borders are 1px outlines on buttons and code boxes, and 1px rows in data tables.

### Named Rules
**The No Lines Rule.** No dividers between sections, list items, cards or header and page. If two things need separating, add space. Lines stay only where they carry meaning: button outlines and table rows.
**The Own Ratio Rule.** Screenshots, video and photos render at their native aspect ratio (`h-auto w-full`). The only fixed frame (16:10, `object-contain`) is for projects that have a logo and no screenshot.

## Components

### Buttons
- **Shape:** square, 1px Ink outline, padding 12px 16px, 900 weight.
- **Hover / Focus:** fill Fire, text white, outline Fire. Focus ring: 2px Fire, 4px offset.
- **Copy button:** white, Ink outline, 44px tall, pinned top-right of its code box. Text changes to "Copied" for 1.5s.

### Project cards
- **Media:** white frame, native ratio, slight 1.025 scale on hover (off under reduced motion).
- **Caption:** name (1.5rem, 900), one-line summary (Muted), a Fire ↗.
- **Columns:** cards run vertically in CSS columns (`md:columns-2`, `lg:columns-3` on /projects/, two on home), `break-inside-avoid`, so mixed ratios stack without row gaps.

### Code boxes
- White, 1px Line outline, 16px 20px padding, uppercase label on top, commands wrap (`pre-wrap`, `overflow-wrap:anywhere`) so nothing scrolls sideways.

### Navigation
- Logo left, Posts / Projects / About, Email button pushed right. Items vertically centred on the logo.
- Active item: Fire text with a 2px Fire underline below the descenders.

### Signature: project screenshots
- Shot from the live site at `1024×640 @2x` (2048×1280, WebP q82), light mode. Go to 1280×800 when the site's nav wraps or its headline is cut at 1024. Pages that hang headless (WebGL) get the existing image trimmed to 1.6.

## Do's and Don'ts

### Do:
- **Do** use Nick's words verbatim, from the project's own site, README or vault note. Search for the exact line before writing any copy.
- **Do** end every headline on a Fire word.
- **Do** separate sections with space (`py-16 md:py-24`).
- **Do** show every image whole.
- **Do** link work to its project page wherever it is named.

### Don't:
- **Don't** add divider lines, rounded corners or shadows.
- **Don't** darken, tint or replace `#ff6633`.
- **Don't** crop images with `object-cover` + fixed aspect.
- **Don't** put a subtitle beside a headline.
- **Don't** set text below 14px.
- **Don't** write copy for Nick. A line he has to ask about ("finding the waste nobody meant to build") is removed.
