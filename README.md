# 📅 Wall Calendar — Frontend Engineering Assessment

> A polished, interactive wall calendar built with Next.js 16 and React 19. No UI libraries. No component kits. Everything hand-rolled.

**Live Demo → [take-u-forward-sigma.vercel.app](https://take-u-forward-sigma.vercel.app)**

---

## What Is This

This project is a response to a frontend engineering challenge. The brief asked for a wall calendar component that goes well beyond basic date display — it should feel tactile, be genuinely usable on any device, and demonstrate depth across CSS architecture, state management, responsive design, and interaction craft.

The result is a wall calendar that renders a different curated photo and accent colour for each month, supports selecting up to four simultaneous colour-coded date ranges, lets you attach notes to those ranges, and handles everything from keyboard-only navigation to touch swipe gestures — all without a single external UI or animation library.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Wall Calendar Aesthetic](#wall-calendar-aesthetic)
  - [Multi-Range Date Selection](#multi-range-date-selection)
  - [Notes Panel](#notes-panel)
  - [Responsive Design](#responsive-design)
  - [3D Page-Flip Animation](#3d-page-flip-animation)
  - [Touch Gesture Swiping](#touch-gesture-swiping)
  - [Staggered Day-Cell Entrance](#staggered-day-cell-entrance)
  - [Undo / Redo](#undo--redo)
  - [Custom Photo Upload](#custom-photo-upload)
  - [Dark / Light Mode](#dark--light-mode)
  - [Animated Accent Colour](#animated-accent-colour)
  - [Mini Year View](#mini-year-view)
  - [Keyboard Navigation](#keyboard-navigation)
  - [Print Support](#print-support)
  - [Accessibility](#accessibility)
- [Architecture](#architecture)
  - [Component Tree](#component-tree)
  - [State Management](#state-management)
  - [Custom Hooks](#custom-hooks)
  - [CSS Strategy](#css-strategy)
- [Design System](#design-system)
  - [Colour Tokens](#colour-tokens)
  - [Monthly Accent Colours](#monthly-accent-colours)
  - [Typography](#typography)
  - [Spacing](#spacing)
  - [Motion](#motion)
- [Keyboard Reference](#keyboard-reference)
- [Responsive Breakpoints](#responsive-breakpoints)
- [localStorage Keys](#localstorage-keys)
- [Browser Compatibility](#browser-compatibility)
- [Known Limitations](#known-limitations)
- [Assessment Criteria Map](#assessment-criteria-map)

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, image optimisation, zero-config Vercel deploy |
| UI | React 19 | Concurrent features, stable hooks model |
| Styling | Plain CSS Modules | Full control, no abstraction overhead, demonstrates raw CSS skill directly |
| Language | JavaScript (`.jsx`) with TypeScript config | Practical for the scope; `tsconfig` enforces module strictness |
| Fonts | Google Fonts — Lora + IBM Plex Sans | Warm serif for display, clean grotesque for UI numbers |
| Images | Unsplash CDN | Free, high-quality, one curated photo per month |
| Persistence | `localStorage` | Strictly frontend — no backend, no database, no API |
| Deployment | Vercel | Zero-config Next.js hosting |

**Zero runtime UI library dependencies.** No Radix, no MUI, no Framer Motion, no date-fns. Every interaction, animation, and layout is hand-built.

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Install

```bash
git clone https://github.com/magic-peach/calendar-assignment.git
cd calendar-assignment
npm install
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page hot-reloads on save.

### Build for Production

```bash
npm run build
npm run start
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 with hot reload |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build locally |

---

## Project Structure

```
calendar-assignment/
│
├── public/                        # Static assets (favicon, og image)
│
├── src/
│   └── app/
│       │
│       ├── layout.tsx             # Root layout — font imports, html metadata
│       ├── page.tsx               # Entry point — renders <WallCalendar />
│       ├── globals.css            # CSS resets + all design tokens (:root vars)
│       │
│       ├── WallCalendar.jsx       # Root orchestrator — owns all shared state
│       ├── CalendarHero.jsx       # Hero image, month name, nav arrows, upload zone
│       ├── CalendarGrid.jsx       # Day grid, range rendering, dot indicators
│       ├── NotesPanel.jsx         # Note input, colour picker, list, drag-reorder
│       ├── YearView.jsx           # 12-month overview overlay
│       │
│       ├── useCalendarState.js    # Central hook — all state + history stack
│       ├── useGesture.js          # Touch swipe detection with velocity + spring-back
│       ├── useKeyboard.js         # Grid keyboard navigation (arrows, space, escape)
│       │
│       └── calendar.module.css    # All component styles — CSS Modules
│
├── next.config.ts                 # Image remote patterns for Unsplash CDN
├── tsconfig.json                  # TypeScript compiler options + path aliases
├── package.json                   # Dependencies and npm scripts
└── .gitignore
```

---

## Features

### Wall Calendar Aesthetic

The UI is designed to feel like a physical wall calendar. Three things sell this illusion:

**Spiral binding** — a row of ~16 coil shapes rendered in pure CSS above the card. Each coil uses a conic gradient to simulate the metallic sheen of a wire ring, `inset box-shadow` for depth, and deliberate `nth-child` transforms (small rotations and height variations) so they look slightly hand-made rather than machine-uniform.

**Hero image panel** — a full-bleed Unsplash photo fills the left panel on desktop (or the top on mobile). A layered gradient overlay sits above it: the first layer darkens the bottom of the image so the month name is always readable; the second layer adds a tint using the current month's accent colour at low opacity. This means the overlay colour shifts every month and feels tied to the image without obscuring it.

**Month name typography** — rendered in Lora (a warm optical serif) at a large display size. On desktop, the month name is positioned so it bleeds slightly from the hero panel into the grid panel — one of those intentional grid-breaking moments that make a layout feel designed rather than assembled.

---

### Multi-Range Date Selection

Up to **four simultaneous date ranges** can exist on the same month, each with its own colour and label. This goes well beyond standard single start/end selection.

**How selection works:**
1. Click an empty range slot in the legend strip below the grid to make it the active input slot (a pulsing accent border indicates which slot is being filled)
2. Click or drag across the grid to set the start date
3. Click or drag to the end date — or release on the same cell for a single-day range
4. The legend pill updates with the date range text and a clear button appears

**Visual states on grid cells:**

| State | Appearance |
|---|---|
| Range start | Filled pill — left half rounded, right flat |
| Range end | Filled pill — left flat, right half rounded |
| Single-day | Full pill rounded on both sides |
| In-between | Accent-tinted background, accent-coloured text |
| Overlapping ranges | Second range blended via `mix-blend-mode` — both colours visible |

**Drag-to-select** is supported: `mousedown` anchors the start, moving over cells updates a live hover preview, `mouseup` commits the selection.

---

### Notes Panel

Notes attach to the currently active date range — or to the whole month if no range is selected.

- **Colour picker** — 6 swatches; the active swatch shows a ring indicator via double `box-shadow` (card colour gap + swatch colour ring)
- **Text input** — full width, accent-coloured focus ring, `Enter` key to submit
- **Note items** — each renders with a coloured left border, a date range label in the note's colour above the text, and a delete button visible on hover
- **Dot indicators** — grid cells covered by a note's date range show small coloured dots at the bottom. Up to 3 dots per cell. On range-cap cells (filled with accent), dots render white to stay visible
- **Drag-to-reorder** — notes can be reordered via native HTML5 `draggable` (no library). While dragging, a 2px accent-coloured line appears above the target position. On drop, the notes array is spliced and the new order saved to `localStorage`
- **Focus trap** — while keyboard focus is inside the notes panel, `Tab` cycles only within it (input → swatches → Add button → back to input)

---

### Responsive Design

Layout breakpoints are handled with **CSS Container Queries** (`@container`) on the card wrapper — not `@media` — so the component responds to its own rendered width, not the viewport. This means it could be embedded at any size and still reflow correctly.

| Container width | Layout |
|---|---|
| `< 520px` | Stacked — hero on top (180px tall), grid and notes scroll below |
| `520px – 749px` | Side-by-side — hero is a 200px left column, grid fills the rest |
| `≥ 750px` | Full desktop — hero takes 38%, grid and notes take 62% |

---

### 3D Page-Flip Animation

Navigating between months triggers a CSS 3D card flip:

1. Card rotates to 90° with `ease-in` over 300ms — exits
2. At the midpoint when the card is edge-on and invisible, the month state updates
3. Card rotates from 90° back to 0° with `ease-out` over 300ms — enters with new content
4. Total: ~600ms — fast enough to feel snappy, slow enough to follow

Direction-aware: clicking next flips one way, clicking prev flips the other.

Implemented with `perspective` on a wrapper div, `transform-style: preserve-3d` and `backface-visibility: hidden` on the card, and class-toggled CSS transitions. No JavaScript animation library. Disabled automatically when `prefers-reduced-motion` is set — replaced with a simple opacity fade.

---

### Touch Gesture Swiping

On touch devices, swiping left or right navigates months with a physics feel:

- `touchstart` records start position and timestamp
- `touchmove` applies `transform: translateX()` to the card in real time so it follows the finger
- `touchend` calculates release velocity from the last few pixels of movement:
  - **Navigate** if velocity exceeds threshold OR drag distance exceeds 30% of card width
  - **Spring back** to centre with a CSS transition if neither threshold is met

Implemented entirely in `useGesture.js`. The hook returns `{ onTouchStart, onTouchMove, onTouchEnd, dragStyle }` — a clean interface that `WallCalendar` spreads onto the card element without needing to know the implementation.

---

### Staggered Day-Cell Entrance

Every time a new month renders, all 42 day cells animate in:

- Each cell starts at `scale(0.72)` and `opacity: 0`
- Animates to `scale(1)` and `opacity: 1` using a spring easing curve with slight overshoot
- `animation-delay` is set via a CSS custom property (`--cell-index`) on each cell's inline style: `animation-delay: calc(var(--cell-index) * 15ms)`
- A `key` prop on the grid container changes when the month changes, causing React to remount the grid and re-trigger the entrance animation

Disabled under `prefers-reduced-motion`.

---

### Undo / Redo

Every state-changing action is tracked in an immutable history stack inside `useCalendarState.js`.

**Actions tracked:** add note, delete note, reorder notes, add range, clear range, upload custom hero image, change theme

**Controls:**
- `Ctrl+Z` — undo
- `Ctrl+Y` or `Ctrl+Shift+Z` — redo
- Max history depth: 50 entries

**How it works:** each action creates a new state object (never mutates existing state). The previous state is pushed onto `past[]`. Undo: pop from `past[]`, push current to `future[]`, apply the popped snapshot. Redo: reverse.

A toast notification appears after each undo or redo and auto-dismisses after 1.5 seconds. Entry animation uses spring easing; exit uses a soft opacity fade.

---

### Custom Photo Upload

The hero panel doubles as a drag-and-drop image upload zone:

- Drag an image file over the hero → a dashed "Drop to set as cover" overlay appears
- **On drop:** `FileReader` reads the file as base64 and saves it to `localStorage` keyed by `month-year`
- A "Reset" button appears in the hero when a custom image is active; clicking it restores the default Unsplash photo and removes the `localStorage` entry
- Also accessible via a camera icon button that triggers a hidden `<input type="file" accept="image/*">`
- Falls back silently to the default photo if `localStorage` is cleared — no broken image state

---

### Dark / Light Mode

The calendar defaults to a dark theme. A sun/moon toggle in the toolbar switches between modes.

- Toggling sets `data-theme="light"` on the `<html>` element; all colours are CSS custom properties overridden in `[data-theme="light"]`
- No JavaScript colour calculations — the entire theme switch is a single attribute change
- Preference persists to `localStorage` and is applied on mount with no flash
- Dark mode card surfaces include a subtle SVG noise texture (inline `feTurbulence` — no external image file) to add tactile depth

---

### Animated Accent Colour

Each month has a hand-chosen HSL accent. When the month changes, three CSS custom properties update on `:root`:

```js
document.documentElement.style.setProperty('--accent-h', accent.h)
document.documentElement.style.setProperty('--accent-s', accent.s)
document.documentElement.style.setProperty('--accent-l', accent.l)
```

Because these are registered via CSS Houdini `@property` with numeric syntax types, the browser interpolates them as numbers rather than opaque strings. The accent colour **smoothly tweens** between months — one CSS transition handles the shift across every element referencing `--accent`. For browsers without `@property` support, the colour switches instantly (detected via `CSS.registerProperty` availability).

---

### Mini Year View

The "Year" button opens a full-card overlay showing all 12 months in a 4×3 grid (3×3 on mobile).

Each mini-month shows:
- Month name with a dot indicator if it has any notes
- A compact 7-column day grid with accurate day-of-week positioning
- Coloured fills for any date ranges in that month
- Note dot indicators on specific days

Clicking any month navigates to it and closes the overlay. The current month is highlighted with an accent border. The overlay animates in with `scale + backdrop-filter` entrance.

---

### Keyboard Navigation

The calendar is fully operable without a mouse. See the complete [Keyboard Reference](#keyboard-reference) table below.

Keyboard state is managed in `useKeyboard.js`, which maintains a `focusedCell` state separate from range selection — so moving around the grid with arrow keys doesn't accidentally change a selection.

---

### Print Support

A print button calls `window.print()`. A `@media print` stylesheet transforms the calendar into a clean A4 single-page layout.

**Hidden in print:** spiral, nav arrows, toolbar controls, notes input, colour picker, drag handles, delete buttons, year overlay, toast

**Preserved in print:** hero photo (full-width banner ~60mm tall), month name, complete date grid with range fills and note dots (`print-color-adjust: exact`), notes list with coloured borders

The grid and each note use `break-inside: avoid` to prevent awkward page splits.

---

### Accessibility

Accessibility is treated as a first-class feature.

**Semantic grid markup:**

```html
<div role="grid" aria-label="April 2026 calendar">
  <div role="row">
    <div role="columnheader" aria-label="Monday">Mo</div>
  </div>
  <div role="row">
    <div
      role="gridcell"
      tabIndex="0"
      aria-label="April 7, in range: Sprint Week April 5 to April 11"
      aria-selected="true"
      aria-current="date"
    >7</div>
  </div>
</div>
```

**Live regions** — a visually hidden `aria-live="polite"` element announces range selections and note additions/deletions to screen readers without moving focus.

**Focus indicators** — `outline` is never removed without replacement. All interactive elements have a `2px solid var(--accent)` ring with `outline-offset: 2px` on `:focus-visible`. Inside the dark hero panel, the ring shifts to white.

**Colour is never the only indicator** — range states use fill colour and pill shape. Notes use a left border colour and a background tint. Today uses a bottom bar and a heavier font weight.

**Minimum touch target sizes** — all interactive elements are at least 40×40px on mobile.

**`prefers-reduced-motion`** — page-flip, cell stagger, gesture transitions, toast animations, and accent colour tween are all disabled when the system preference is set. Content appears and disappears with a short opacity fade only.

---

## Architecture

### Component Tree

```
WallCalendar                 ← root orchestrator, owns all state via useCalendarState
├── CalendarHero             ← photo, month name, nav arrows, drag-drop upload
├── CalendarGrid             ← day cells, range fills, dot indicators, keyboard handler
├── NotesPanel               ← input, swatches, notes list, drag-to-reorder, focus trap
└── YearView                 ← 12-month overlay (conditional render)
```

State flows down as props. Events flow up as callbacks. No prop drilling beyond one level — `WallCalendar` passes only what each child specifically needs, never the full state object.

### State Management

All calendar state lives in `useCalendarState.js`. Moving logic to a custom hook keeps `WallCalendar` readable and makes the state independently testable without rendering a component.

**State shape (simplified):**

```js
{
  year: 2026,
  month: 3,                        // 0-indexed — April = 3

  ranges: [                        // up to 4 slots, null = empty
    { id: 1, color: '#FF6B6B', start: Date, end: Date },
    null,
    null,
    null,
  ],
  activeRangeSlot: 0,              // which slot the next click fills

  notes: [
    {
      id: 1712345678,
      text: 'Sprint planning',
      color: '#FFB347',
      start: '2026-04-05T00:00:00.000Z',
      end:   '2026-04-11T00:00:00.000Z',
      month: 3,
      year:  2026,
    }
  ],

  theme: 'dark',                   // 'dark' | 'light'
  customImages: {},                // keyed by 'month-year', base64 values

  history: {
    past:   [],                    // previous state snapshots
    future: [],                    // undone state snapshots
  }
}
```

**History** — each action creates a new state object (immutable update) and pushes the old state onto `past[]`. Undo: pop `past[]`, push current to `future[]`, apply snapshot. Redo: reverse. Max depth: 50 entries.

### Custom Hooks

**`useCalendarState.js`**
The central state hook. Manages month/year navigation, range slot selection, drag-selection, note CRUD, custom image storage, theme toggling, and the full undo/redo history stack. Exposes a clean, flat API to `WallCalendar` — consumers don't need to know how history works internally.

**`useGesture.js`**
Handles touch interaction for swipe-to-navigate. Tracks touch position over time, calculates release velocity on `touchend`, decides whether to navigate or spring back, and returns event handler props + a `dragStyle` object. `WallCalendar` spreads these onto the card without knowing the implementation details.

**`useKeyboard.js`**
Manages keyboard navigation across the grid. Maintains a `focusedCell` (row, col) state independent of range selection. Handles arrow keys with boundary detection (skips other-month padding cells), `Space`/`Enter` for selection, and `Escape` to clear. Returns `focusedCell` and event handler props to attach to the grid container.

### CSS Strategy

All styles live in `calendar.module.css`. Design tokens are defined in `globals.css` under `:root` (dark defaults) and `[data-theme="light"]` (overrides). Components reference tokens, never hardcoded values.

**Advanced CSS techniques used:**

| Technique | Where applied |
|---|---|
| `@property` (CSS Houdini) | Accent colour tween between months |
| `@container` | All responsive layout breakpoints |
| `backdrop-filter` | Glass surfaces: overlays, nav arrows, year view |
| `mix-blend-mode` | Overlapping range colour blending on grid cells |
| CSS 3D transforms | Page-flip animation (`perspective`, `rotateY`) |
| `--cell-index` custom property | Staggered day-cell entrance delays |
| `@media print` | Clean A4 printable output |
| `@media (prefers-reduced-motion)` | Motion accessibility override |
| Conic gradients | Spiral coil metallic sheen |
| SVG `feTurbulence` (inline) | Paper noise texture in dark mode |

---

## Design System

### Colour Tokens

All defined in `globals.css`. Never used as raw hex in component styles.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--layer-void` | `#08070A` | `#EAE8F5` | Page background |
| `--layer-base` | `#0F0E13` | `#F0EFF8` | Deepest surface |
| `--layer-1` | `#1E1B16` | `#FFFFFF` | Card |
| `--layer-2` | `#252219` | `#F5F4FC` | Raised elements |
| `--layer-3` | `#272638` | `#ECEAF7` | Floating elements, popovers |
| `--text-primary` | `#F2F0FF` | `#1A1828` | Body text |
| `--text-secondary` | `#8B89A8` | `#5C5A78` | Muted labels |
| `--text-tertiary` | `#55536E` | `#9896B4` | Disabled, placeholders |
| `--border-glow` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.10)` | Card borders |
| `--glass-bg` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.65)` | Glass panel fill |
| `--accent` | Computed from H/S/L vars | Same | Interactions, range fills, focus rings |
| `--accent-subtle` | Accent at 10% opacity | Same | In-range cell background |
| `--accent-glow` | Accent at 25% opacity | Same | Focus rings, glow halos |

**Semantic colours (both themes):**

| Token | Value | Usage |
|---|---|---|
| `--color-success` | `#34D399` | Confirmations |
| `--color-warning` | `#FBBF24` | Cautions |
| `--color-error` | `#F87171` | Errors |
| `--color-info` | `#60A5FA` | Informational |

**Range slot colours:** `#FF6B6B` · `#FFB347` · `#4FC3F7` · `#CE93D8`

**Note colours:** Red · Amber · Green · Teal · Purple · Blue

### Monthly Accent Colours

Each month has a hand-chosen HSL accent. Updates when the month changes and tweens via `@property`.

| Month | H | S | L | Character |
|---|---|---|---|---|
| January | 210 | 85% | 62% | Icy blue |
| February | 340 | 80% | 65% | Rose pink |
| March | 145 | 55% | 52% | Spring green |
| April | 85 | 60% | 55% | Lime |
| May | 35 | 90% | 60% | Golden |
| June | 190 | 75% | 50% | Aqua |
| July | 20 | 95% | 62% | Coral |
| August | 45 | 95% | 58% | Amber |
| September | 25 | 80% | 52% | Burnt orange |
| October | 15 | 85% | 55% | Pumpkin |
| November | 200 | 30% | 55% | Steel blue |
| December | 235 | 75% | 65% | Periwinkle |

### Typography

Two fonts loaded via Google Fonts, defined as CSS custom properties.

| Token | Font | Role | Weights |
|---|---|---|---|
| `--font-display` | Lora (serif) | Month name, hero display text | 400, 600, 700 |
| `--font-ui` | IBM Plex Sans | Day numbers, notes, labels, toolbar | 300, 400, 500, 600 |

**Type scale:**

| Token | Size | Usage |
|---|---|---|
| `--text-2xs` | 10px | Decorative labels |
| `--text-xs` | 12px | Day-of-week headers, note date labels |
| `--text-sm` | 13px | Note body text, input text |
| `--text-base` | 15px | Day numbers, general UI |
| `--text-lg` | 18px | Year label on hero |
| `--text-xl` | 22px | Sub-display headings |
| `--text-2xl` | 28px | Year view title |
| `--text-3xl` | 40px | Smaller display contexts |
| `--text-4xl` | 64px | Month name on hero (desktop) |
| `--text-5xl` | 96px | Month name on hero (large viewport) |

### Spacing

4px base grid. All spacing via tokens — no magic numbers in component styles.

```
--sp-1:   4px     --sp-2:   8px     --sp-3:  12px
--sp-4:  16px     --sp-5:  20px     --sp-6:  24px
--sp-8:  32px     --sp-10: 40px     --sp-12: 48px
--sp-16: 64px     --sp-20: 80px
```

### Motion

**Easing functions:**

| Token | Curve | Personality |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Snappy decelerate — elements entering |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot — buttons, day cells |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Natural — page flip, general transitions |

**Durations:**

| Token | Value | Usage |
|---|---|---|
| `--dur-instant` | 80ms | Immediate feedback |
| `--dur-fast` | 150ms | Hover states, colour changes |
| `--dur-base` | 250ms | Default transitions |
| `--dur-slow` | 400ms | Overlay entrances |
| `--dur-slower` | 600ms | Page flip total |

---

## Keyboard Reference

| Key | Context | Action |
|---|---|---|
| `Tab` | Anywhere | Move focus forward between major sections |
| `Shift+Tab` | Anywhere | Move focus backward between sections |
| `↑ ↓ ← →` | Grid focused | Move focused cell — skips other-month padding cells |
| `Space` | Grid focused | Anchor range start on focused cell |
| `Enter` or `Shift+Space` | Grid focused | Set range end on focused cell |
| `Escape` | Grid focused | Clear active range selection |
| `Tab` | Notes panel | Cycle: input → colour swatches → Add button → input |
| `Shift+Tab` | Notes panel | Reverse cycle (focus trap active within panel) |
| `Enter` | Note input focused | Submit note |
| `Ctrl+Z` | Anywhere | Undo last action |
| `Ctrl+Y` | Anywhere | Redo |
| `Ctrl+Shift+Z` | Anywhere | Redo (alternative) |

---

## Responsive Breakpoints

Driven entirely by container queries — not viewport media queries.

```css
.calendar-container {
  container-type: inline-size;
  container-name: cal;
}

/* Mobile — stacked */
@container cal (max-width: 520px) {
  /* Hero: full width, 180px tall */
  /* Grid + Notes: below hero */
  /* Day cells: 36px min-height */
  /* Year view: 3-column mini grid */
}

/* Tablet — side-by-side */
@container cal (min-width: 521px) and (max-width: 749px) {
  /* Hero: 200px wide left column */
  /* Grid + Notes: fill right */
  /* Day cells: 40px min-height */
}

/* Desktop — full layout */
@container cal (min-width: 750px) {
  /* Hero: 38% width */
  /* Grid + Notes: 62% width */
  /* Day cells: 48px min-height */
  /* Year view: 4-column mini grid */
}
```

---

## localStorage Keys

No backend. All persistence is client-side only.

| Key | Type | Contents |
|---|---|---|
| `wc_notes` | JSON array | All notes across all months: `[{ id, text, color, start, end, month, year }]` |
| `wc_theme` | String | `"dark"` or `"light"` |
| `wc_ranges` | JSON array | Saved range slots serialised per month |
| `wc_img_{month}_{year}` | String | Base64 data URL of the custom uploaded hero image |

Notes persist indefinitely until explicitly deleted. Custom images are keyed per `month-year` so uploading a photo for April 2026 doesn't affect April 2027.

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Notes |
|---|---|---|---|---|
| Core calendar | ✅ | ✅ | ✅ | Universally supported |
| Container Queries | ✅ 105+ | ✅ 110+ | ✅ 16+ | All modern browsers |
| `@property` accent tween | ✅ 85+ | ⚠️ Fallback | ✅ 16.4+ | Firefox: instant colour switch |
| `backdrop-filter` glass | ✅ | ✅ | ✅ | May jank on low-end mobile |
| CSS 3D page flip | ✅ | ✅ | ✅ | All modern browsers |
| Touch swipe gestures | ✅ | ✅ | ✅ | Tested on iOS + Android Chrome |
| Print stylesheet | ✅ | ✅ | ✅ | Tested across all major browsers |

---

## Known Limitations

**`@property` / accent tween** — Firefox does not support `@property` currently. The accent colour switches instantly rather than tweening. Detected via `CSS.registerProperty` availability — no errors, just a degraded animation.

**`backdrop-filter` on low-powered devices** — glass surface blur requires GPU compositing. On older Android devices this may cause jank during overlay entrance. Surfaces remain visible and usable without blur — it's a visual degradation, not a functional one.

**Custom image upload size** — images larger than roughly 4MB may hit the `localStorage` 5MB quota limit. The app catches `QuotaExceededError` and falls back to the default Unsplash photo silently. A user-facing warning is not currently shown.

**iOS Safari drag-to-reorder** — native HTML5 `draggable` is inconsistent on iOS Safari. Initiating a drag may require a long-press on some iOS versions rather than a standard swipe gesture.

**Year view on very small screens** — below ~360px viewport width, the mini month grids become compressed to the point where individual day numbers are difficult to read. The overlay remains functional but uncomfortable at this size.

---

## Assessment Criteria Map

The assessment specifically called out these evaluation criteria. Here is where each is demonstrated:

| Criterion | Implementation |
|---|---|
| **Code quality** | Hooks separate concerns from rendering; consistent naming; no logic in JSX; practical comments written as a person thinking out loud |
| **Component architecture** | Single-responsibility components; one-level prop passing (no drilling); custom hooks for complex logic; `WallCalendar` as a thin orchestrator |
| **CSS / styling implementation** | CSS Modules; design tokens via custom properties; `@container` queries; `@property` animation; `@media print`; `mix-blend-mode`; conic gradients; inline SVG noise — zero external style libraries |
| **State management** | Custom hook with immutable updates; undo/redo history stack; `localStorage` serialisation; clean separation of UI state and data state |
| **Attention to UX/UI detail** | Staggered cell entrance; spring easing with overshoot; range colour blending on overlap; dot indicators on grid; direction-aware page flip; toast feedback; hand-chosen accent per month |
| **Responsive design** | Container Queries not `@media` so the component responds to its own width; tested at 375px, 520px, 768px, and 1280px; touch-friendly tap targets throughout |
| **Accessibility** | ARIA grid roles; live regions; full keyboard operation; focus trap in notes panel; visible focus rings; reduced-motion support; colour never the sole differentiator |
