# Forma — Prototype Plan
**Take-home assignment: AI-powered creative tool iteration loop**

---

## 1. Concept

Forma is an AI-powered creative tool built around a core thesis: **visual direction is more precise than verbal description.** Most diffusion model interfaces force users to describe what they want in text. Forma gives users two native visual languages instead:

- **The Composer** — sketch a composition to direct generation (input surface)
- **The Director** — draw marks on a result to direct refinement (output surface)

Both surfaces operate on the same principle: you show the model what you mean, rather than telling it.

### The Iteration Loop
```
Composer → Generate → Director (Evaluate → Mark → Refine) → Director → ...
    ↑                                                              |
    └──────────────────── Restart Composition ────────────────────┘
```

Round 1 always begins in the Composer. Rounds 2+ enter via the Director and cycle. The user can restart composition from any Director state.

---

## 2. Design System

### 2.1 Mode Philosophy

**Light mode is the primary design truth.** All design decisions — shadow depths, surface hierarchy, border intensities, component sizing — are made first for light mode. Dark mode is a derived adaptation, not an inversion. It shares the same spatial logic and component geometry; only the color values change.

The app defaults to light mode. The user can toggle at any time via the nav. Preference is stored in `localStorage` key `forma-theme`. Mode is applied as `data-theme="light"` or `data-theme="dark"` on `<html>`. All CSS variables are scoped to these selectors.

```css
[data-theme="light"] { /* ... light vars ... */ }
[data-theme="dark"]  { /* ... dark vars ... */  }
```

The mode toggle in the nav animates: the icon crossfades (☀ ↔ 🌙) over `200ms` and the entire page background transitions via `transition: background-color 300ms var(--ease-out)`.

---

### 2.2 Palette

Forma is strictly monotone. The only non-neutral colors in the entire UI are the three mark colors — and those exist exclusively on the canvas, never in chrome.

```css
/* ─── Light Mode (Primary) ─────────────────────────── */
[data-theme="light"] {
  --bg-base:          #FFFFFF;   /* page background */
  --bg-surface:       #F7F7F7;   /* cards, panels, canvas bg */
  --bg-elevated:      #F0F0F0;   /* toolbars, popovers, tooltips */
  --bg-hover:         #EBEBEB;   /* interactive element hover */
  --bg-active:        #E4E4E4;   /* interactive element active/pressed */

  --border:           #E2E2E2;   /* standard borders */
  --border-subtle:    #EBEBEB;   /* dividers, strip top */
  --border-strong:    #C8C8C8;   /* active selections, focus rings */

  --text-primary:     #111111;   /* headings, labels, primary content */
  --text-secondary:   #555555;   /* supporting text, descriptions */
  --text-tertiary:    #999999;   /* placeholders, metadata, hints */
  --text-disabled:    #CCCCCC;   /* disabled state text */
  --text-inverse:     #FFFFFF;   /* text on dark/filled backgrounds */

  --shadow-xs:  0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm:  0 1px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  --shadow-xl:  0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);

  --overlay:    rgba(255,255,255,0.80);   /* frosted backdrop */
}

/* ─── Dark Mode (Secondary) ─────────────────────────── */
[data-theme="dark"] {
  --bg-base:          #111111;
  --bg-surface:       #191919;
  --bg-elevated:      #222222;
  --bg-hover:         #2A2A2A;
  --bg-active:        #323232;

  --border:           #2E2E2E;
  --border-subtle:    #242424;
  --border-strong:    #484848;

  --text-primary:     #F2F2F2;
  --text-secondary:   #909090;
  --text-tertiary:    #555555;
  --text-disabled:    #3A3A3A;
  --text-inverse:     #111111;

  --shadow-xs:  0 1px 2px rgba(0,0,0,0.30);
  --shadow-sm:  0 1px 6px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.30);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.50), 0 1px 4px rgba(0,0,0,0.30);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.60), 0 2px 8px rgba(0,0,0,0.40);
  --shadow-xl:  0 16px 48px rgba(0,0,0,0.70), 0 4px 12px rgba(0,0,0,0.50);

  --overlay:    rgba(17,17,17,0.85);
}

/* ─── Mark Colors — canvas only, never in UI chrome ─── */
:root {
  --mark-keep:           rgba(34, 197, 94, 0.65);
  --mark-keep-stroke:    #16A34A;
  --mark-keep-fill:      rgba(34, 197, 94, 0.08);

  --mark-remove:         rgba(239, 68, 68, 0.65);
  --mark-remove-stroke:  #DC2626;
  --mark-remove-fill:    rgba(239, 68, 68, 0.08);

  --mark-redirect:       rgba(59, 130, 246, 0.65);
  --mark-redirect-stroke: #2563EB;
  --mark-redirect-fill:  rgba(59, 130, 246, 0.08);

  /* Persisted keep marks (locked, prior rounds) */
  --mark-keep-persisted: rgba(34, 197, 94, 0.35);
}
```

---

### 2.3 Typography

Type is the primary carrier of hierarchy. Forma uses two weights of DM Sans across a deliberate 5-level scale. No decorative type — every size and weight has a specific role.

```css
/* ─── Font Stack ─────────────────────────────────────── */
:root {
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'DM Mono', 'Fira Code', monospace;
}

/* ─── Type Scale ─────────────────────────────────────── */
:root {
  --text-xs:    11px;  /* line-height: 1.4 */
  --text-sm:    13px;  /* line-height: 1.5 */
  --text-base:  15px;  /* line-height: 1.6 */
  --text-lg:    18px;  /* line-height: 1.4 */
  --text-xl:    24px;  /* line-height: 1.25 */
  --text-2xl:   32px;  /* line-height: 1.15 */
}

/* ─── Weights ─────────────────────────────────────────── */
:root {
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
}
```

**Type Hierarchy — Usage Rules:**

| Role | Size | Weight | Color | Usage |
|---|---|---|---|---|
| **Screen title** | `--text-xl` | semibold | `--text-primary` | Nav center label ("Round 1", "New Creation") |
| **Section label** | `--text-sm` | semibold | `--text-primary` | Toolbar group labels, panel headers |
| **Body / action** | `--text-base` | medium | `--text-primary` | Button labels, primary interactive text |
| **Supporting** | `--text-sm` | regular | `--text-secondary` | Descriptions, sublabels, round subtitles |
| **Metadata / hint** | `--text-xs` | regular | `--text-tertiary` | Timestamps, word counts, iteration numbers |
| **Mono / annotation** | `--text-sm` | regular | `--text-secondary` | Mark annotation text, technical labels |
| **Placeholder** | `--text-base` | regular | `--text-tertiary` | Input placeholders (italic) |

**Rules:**
- Never use more than two type levels in a single component
- Screen title in the nav is the only `--text-xl` instance on the screen at any time — it owns that size
- Labels on the iteration strip thumbnails are `--text-xs` / `--text-tertiary` — they should recede
- Annotation popovers use `--font-mono` to signal they are input/data, not UI copy

---

### 2.4 Spacing & Radius

```css
/* ─── Spacing (4px base unit) ────────────────────────── */
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}

/* ─── Border Radius ───────────────────────────────────── */
:root {
  --radius-sm:   6px;     /* tags, badges, kbd shortcuts, scrollbar thumb */
  --radius-md:   10px;    /* buttons, text inputs, small popovers */
  --radius-lg:   14px;    /* toolbar pill, annotation popover, shape blocks */
  --radius-xl:   20px;    /* large panel containers, canvas frame */
  --radius-full: 9999px;  /* pills, icon buttons, toggle switch */
}
```

**Radius Usage by Component:**

| Component | Radius |
|---|---|
| Nav bar | none (full-width flush) |
| Toolbar pill | `--radius-lg` |
| Toolbar item (icon button) | `--radius-md` |
| Primary button | `--radius-md` |
| Ghost button | `--radius-md` |
| Text input | `--radius-md` |
| Annotation popover | `--radius-lg` |
| Shape label badge | `--radius-sm` |
| Iteration thumbnail | `--radius-md` |
| Canvas container frame | `--radius-xl` |
| Toggle (clean/annotated) | `--radius-full` |
| Tooltip | `--radius-sm` |
| Mode toggle icon button | `--radius-full` |

---

### 2.5 Motion

All motion in Forma is **intentional and earned** — not decorative. Every animation communicates state change or provides spatial continuity. Nothing loops or pulses unless it signals an active process.

```css
/* ─── Easing ─────────────────────────────────────────── */
:root {
  --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);      /* elements entering */
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);          /* elements exiting */
  --ease-in-out:  cubic-bezier(0.45, 0, 0.55, 1);      /* position/size changes */
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);   /* confirmations, pops */
  --ease-linear:  linear;                               /* continuous rotation only */
}

/* ─── Duration ───────────────────────────────────────── */
:root {
  --dur-instant:  80ms;    /* cursor state changes, immediate feedback */
  --dur-fast:     120ms;   /* hover in */
  --dur-base:     200ms;   /* hover out, toggle, icon swap */
  --dur-slow:     350ms;   /* panel enter/exit, screen transition */
  --dur-xslow:    500ms;   /* loading appear, compare crossfade */
  --dur-crawl:    20000ms; /* loading spinner rotation */
}
```

**Animation Catalog — every named animation in the app:**

```css
/* 1. Fade In — panels, popovers, tooltips entering */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn var(--dur-slow) var(--ease-out) forwards;
}

/* 2. Fade Up — popovers, annotation panels entering from below */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
  animation: fadeUp var(--dur-slow) var(--ease-out) forwards;
}

/* 3. Scale In — tooltips, small contextual menus */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scaleIn var(--dur-fast) var(--ease-spring) forwards;
}

/* 4. Slide Up — iteration strip thumbnail entering (new round added) */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-slide-up {
  animation: slideUp var(--dur-slow) var(--ease-spring) forwards;
}

/* 5. Spin Slow — loading state forma mark */
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spinSlow var(--dur-crawl) var(--ease-linear) infinite;
}

/* 6. Pulse Subtle — skeleton loading thumbnails */
@keyframes pulseFade {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}
.animate-pulse-fade {
  animation: pulseFade 1.6s var(--ease-in-out) infinite;
}

/* 7. Mark Appear — a completed mark stroke appearing on canvas */
/* Implemented via canvas globalAlpha ramp in JS, not CSS */

/* 8. Compare Crossfade — clean/annotated toggle */
/* Implemented via React state + CSS opacity transition on overlay layer */
.mark-overlay {
  transition: opacity var(--dur-xslow) var(--ease-in-out);
}

/* 9. Mode Transition — light/dark toggle */
html {
  transition: background-color var(--dur-slow) var(--ease-out);
}
```

---

### 2.6 Hover & Interactive States

Every interactive element has three states beyond default: **hover**, **active (pressed)**, and **disabled**. State changes use `transition` shorthand so multiple properties animate simultaneously.

**Global interactive base:**
```css
.interactive {
  transition:
    background-color var(--dur-fast) var(--ease-out),
    box-shadow       var(--dur-fast) var(--ease-out),
    transform        var(--dur-fast) var(--ease-out),
    opacity          var(--dur-fast) var(--ease-out),
    border-color     var(--dur-fast) var(--ease-out);
  cursor: pointer;
  user-select: none;
}
```

**Button — Primary (filled):**
```css
.btn-primary {
  background: var(--text-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  height: var(--btn-height-md);
  padding: 0 var(--space-5);
  border: none;
}
.btn-primary:hover  { background: #2A2A2A; box-shadow: var(--shadow-md); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0) scale(0.98); box-shadow: var(--shadow-xs); }
.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

/* Dark mode: light button on dark bg */
[data-theme="dark"] .btn-primary { background: var(--text-primary); color: var(--text-inverse); }
[data-theme="dark"] .btn-primary:hover { background: #E0E0E0; }
```

**Button — Ghost (outline):**
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  height: var(--btn-height-md);
  padding: 0 var(--space-4);
}
.btn-ghost:hover  { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-strong); }
.btn-ghost:active { background: var(--bg-active); transform: scale(0.98); }
.btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
```

**Toolbar Icon Button:**
```css
.toolbar-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  display: flex; align-items: center; justify-content: center;
}
.toolbar-btn:hover  { background: var(--bg-hover); color: var(--text-primary); }
.toolbar-btn:active { background: var(--bg-active); transform: scale(0.94); }
.toolbar-btn.active {
  background: var(--bg-active);
  color: var(--text-primary);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);
}

/* Mark tool active states — tinted background matching mark color */
.toolbar-btn.active-keep     { background: rgba(34, 197, 94, 0.12); color: var(--mark-keep-stroke); }
.toolbar-btn.active-remove   { background: rgba(239, 68, 68, 0.12); color: var(--mark-remove-stroke); }
.toolbar-btn.active-redirect { background: rgba(59, 130, 246, 0.12); color: var(--mark-redirect-stroke); }
```

**Iteration Thumbnail:**
```css
.round-thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
  overflow: hidden;
  background: var(--bg-elevated);
  flex-shrink: 0;
}
.round-thumb:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
.round-thumb:active { transform: translateY(0) scale(0.97); }
.round-thumb.active { border: 2px solid var(--text-primary); box-shadow: var(--shadow-sm); }
```

**Text Input:**
```css
.text-input {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-4);
  width: 100%;
}
.text-input:hover       { border-color: var(--border-strong); }
.text-input:focus       { border-color: var(--text-primary); outline: none; box-shadow: 0 0 0 3px rgba(17,17,17,0.06); }
.text-input::placeholder { color: var(--text-tertiary); font-style: italic; }
[data-theme="dark"] .text-input:focus { box-shadow: 0 0 0 3px rgba(242,242,242,0.06); }
```

---

### 2.7 Floating UI Elements

Floating elements — toolbars, popovers, tooltips — are the primary visual character of Forma. They should feel like they're hovering with purpose, not pasted on top.

**The Toolbar Pill:**
```css
.toolbar-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(12px);         /* frosted glass on light mode */
  -webkit-backdrop-filter: blur(12px);
}

/* Dividers between toolbar groups */
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 var(--space-2);
  flex-shrink: 0;
}
```

**The Annotation Popover:**
```css
.annotation-popover {
  position: absolute;
  min-width: 220px;
  max-width: 300px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  z-index: 100;

  /* Entry animation */
  animation: fadeUp var(--dur-slow) var(--ease-out) forwards;
}
.annotation-popover textarea {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  resize: none;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  line-height: 1.5;
}
.annotation-popover textarea::placeholder { color: var(--text-tertiary); font-style: italic; }
```

**Tooltip:**
```css
.tooltip {
  position: absolute;
  background: var(--text-primary);
  color: var(--text-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
  animation: scaleIn var(--dur-fast) var(--ease-spring) forwards;
}
/* Tiny caret */
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--text-primary);
}
```

**History Banner:**
```css
.history-banner {
  position: absolute;
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  background: var(--overlay);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: fadeUp var(--dur-slow) var(--ease-out) forwards;
  z-index: 50;
}
```

---

### 2.8 Component Tokens (Reference)

```css
:root {
  /* Nav */
  --nav-height:       52px;
  --nav-bg:           var(--bg-base);
  --nav-border:       var(--border-subtle);

  /* Toolbar */
  --toolbar-item-size: 36px;
  --toolbar-gap:       var(--space-1);

  /* Buttons */
  --btn-height-sm:    30px;
  --btn-height-md:    36px;
  --btn-height-lg:    44px;

  /* Iteration Strip */
  --strip-total-height: 112px;    /* 72px thumb + 16px label + 24px padding */
  --strip-thumb-size:   72px;
  --strip-gap:          var(--space-2);
  --strip-px:           var(--space-6);
  --strip-bg:           var(--bg-surface);
  --strip-border:       var(--border-subtle);

  /* Canvas */
  --canvas-bg:          var(--bg-surface);
  --canvas-border:      var(--border);
  --canvas-radius:      var(--radius-xl);
}
```

---

### 2.9 Logo Assets

Logo SVG files live in `/public/assets/`:
- `forma-lockup-black.svg` / `forma-lockup-white.svg`
- `forma-mark-black.svg` / `forma-mark-white.svg`
- `forma-wordmark-black.svg` / `forma-wordmark-white.svg`

**Usage rules:**
- Nav: `forma-wordmark-black.svg` in light mode, `forma-wordmark-white.svg` in dark mode. Height: `20px`. Swap via `data-theme` CSS:
  ```css
  .nav-wordmark-light { display: block; }
  .nav-wordmark-dark  { display: none; }
  [data-theme="dark"] .nav-wordmark-light { display: none; }
  [data-theme="dark"] .nav-wordmark-dark  { display: block; }
  ```
- Loading screen: `forma-mark-black.svg` / `forma-mark-white.svg` at `32px`, centered, with `animate-spin-slow`
- Favicon: `forma-mark-black.svg`
- Never stretch or recolor the mark — only use black or white versions as provided

---

### 2.10 Icon Library

**Library: Phosphor Icons — `@phosphor-icons/react`**

Phosphor is the correct choice for Forma for one specific reason: **weight flexibility**. It ships six weights (Thin, Light, Regular, Bold, Fill, Duotone) as a single package with a consistent geometric character that matches the Forma mark's stroke quality. Alternatives were considered and ruled out:

- **Lucide** — good but locked to one stroke weight, no fill states
- **Heroicons** — reads too "SaaS app", wrong character
- **Radix Icons** — too limited a set for this surface count
- **Tabler** — slightly mechanical, doesn't match brand refinement

**Weight rules:**
- `regular` everywhere by default
- `fill` only for the annotated mark indicator (ChatCircleDots) — signals data present, not just UI
- Active states on mark tools use tinted background instead of weight change — the color signal is clearer

```bash
npm install @phosphor-icons/react
```

```tsx
// Always import icons individually — never wildcard.
// Phosphor's package is large; tree-shaking only works with named imports.
import { CircleDashed, ArrowRight, X, Sun, Moon } from '@phosphor-icons/react'

// Standard toolbar icon size
<CircleDashed size={18} weight="regular" />

// Fill weight — annotated mark indicator only
<ChatCircleDots size={14} weight="fill" />
```

**Icon Map — every icon in the UI:**

| Location | Purpose | Phosphor Name | Weight | Size |
|---|---|---|---|---|
| **Nav** | Mode toggle — light | `Sun` | regular | 18 |
| **Nav** | Mode toggle — dark | `Moon` | regular | 18 |
| **Toolbar** | Keep mark tool | `CircleDashed` | regular | 18 |
| **Toolbar** | Remove mark tool | `X` | regular | 18 |
| **Toolbar** | Redirect mark tool | `ArrowRight` | regular | 18 |
| **Toolbar** | Undo | `ArrowCounterClockwise` | regular | 18 |
| **Toolbar** | Clean view (toggle) | `Eye` | regular | 18 |
| **Toolbar** | Annotated view (toggle) | `EyeSlash` | regular | 18 |
| **Shape tray** | Rectangle block | `Rectangle` | regular | 18 |
| **Shape tray** | Ellipse block | `Circle` | regular | 18 |
| **Shape tray** | Figure block | `Person` | regular | 18 |
| **Shape tray** | Freeform block | `Path` | regular | 18 |
| **Shape tray** | Draw mode | `Pencil` | regular | 18 |
| **Mark** | Add annotation (no note yet) | `ChatCircle` | regular | 14 |
| **Mark** | Annotation exists indicator | `ChatCircleDots` | fill | 14 |
| **Iteration strip** | New round tile | `Plus` | regular | 20 |
| **Refine bar** | Restart composition | `ArrowCounterClockwise` | regular | 16 |
| **History banner** | Back to current round | `ArrowLeft` | regular | 16 |
| **History banner** | Jump to this round | `ArrowElbowDownRight` | regular | 16 |
| **Popovers** | Close / dismiss | `X` | regular | 14 |
| **Shape block** | Delete shape (hover) | `X` | regular | 12 |
| **Loading** | *(forma mark SVG — not Phosphor)* | — | — | 32 |

**Active state behavior per tool:**

The three mark tools (Keep, Remove, Redirect) signal their active state via **tinted background**, not icon weight change. The tint color matches the mark's functional color at low opacity:

```tsx
// Toolbar button active class applied when tool is selected
className={`toolbar-btn ${activeTool === 'keep' ? 'active-keep' : ''}`}

// CSS handles the tint (already defined in 2.6)
// .toolbar-btn.active-keep { background: rgba(34, 197, 94, 0.12); color: var(--mark-keep-stroke); }
```

The `Eye` / `EyeSlash` toggle swaps between the two icons based on state — no separate active class needed, the icon itself communicates state.

---

## 3. Application Layout

### 3.1 Global Shell

```
┌─────────────────────────────────────────────────────┐
│  Nav: forma wordmark (left) · Round indicator (center) · [Dark mode toggle] (right)  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                  Main Canvas Area                   │
│                  (flex-1, scrollable)               │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Iteration Strip (fixed bottom, always visible)     │
│  [scrollable, permanent scrollbar]                  │
└─────────────────────────────────────────────────────┘
```

- **Nav**: 52px fixed height. `forma-wordmark` left-aligned with 24px padding. Round counter (e.g., "Round 3") centered. Mode toggle right.
- **Main area**: `calc(100vh - 52px - 112px)` — fills space between nav and strip.
- **Iteration Strip**: 112px fixed height. Always visible. Houses round thumbnails.

### 3.2 Iteration Strip

The strip is a **permanent, always-visible** horizontal scroll container at the bottom of the screen. It is the user's primary orientation anchor — they always know where they are in the creative process.

```
┌──────────────────────────────────────────────────── →
│ [Sketch] [Round 1] [Round 2] [Round 3*] [+ New]    
│  thumb     thumb    thumb     thumb(active)
└────────────────────────────────────────────────────
```

- Each entry is a **72×72px thumbnail** with a label below ("Sketch", "Round 1", etc.)
- The active round has a solid border using `--text-primary`
- Prior rounds have a subtle border using `--border`
- The strip always shows a **permanent scrollbar** (styled: thin, monochrome, rounded)
- Clicking a prior round navigates to a read-only "replay" view of that state
- The **"+ New"** tile (dashed border, `+` icon) always appears as the last item
- Strip scrolls to the active item automatically on each new round
- The initial sketch round uses a canvas preview thumbnail at the same size

**Scrollbar styling:**
```css
.iteration-strip::-webkit-scrollbar        { height: 4px; }
.iteration-strip::-webkit-scrollbar-track  { background: var(--bg-elevated); border-radius: 2px; }
.iteration-strip::-webkit-scrollbar-thumb  { background: var(--border); border-radius: 2px; }
.iteration-strip::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
```

---

## 4. Screens

### Screen 1 — Composer

**Purpose:** The user creates a compositional sketch and optional text prompt before the first generation. This is the starting point for every new creation.

**Layout:**
```
┌─ Nav ──────────────────────────────────────────────┐
│ forma            New Creation              [☀/🌙]  │
├──────────────────────────────────────────────────── ┤
│                                                     │
│  ┌─ Aspect selector ───────────────────────────┐   │
│  │  [1:1]  [3:2]  [16:9]  [9:16]               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Canvas ────────────────────────────────────┐   │
│  │                                             │   │
│  │   (drop zone for shape blocks)              │   │
│  │   semi-transparent placeholder text:        │   │
│  │   "Sketch your composition"                 │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Shape Tray (below canvas) ─────────────────┐   │
│  │  [▭ Rect]  [◯ Ellipse]  [⬡ Freeform]        │   │
│  │  [👤 Figure]  [✏ Draw]                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Text Prompt ───────────────────────────────┐   │
│  │  "Describe mood, style, or anything else..." │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                    [Generate →]                     │
│                                                     │
├─ Iteration Strip ──────────────────────────────────┤
│  [Sketch*]  [+ New]                                 │
└─────────────────────────────────────────────────────┘
```

**Composer Canvas Behavior:**
- Canvas has a neutral `--bg-surface` fill with a subtle dashed border (`--border`)
- Aspect ratio selector at top changes canvas proportions; selection persists per session
- **Shape blocks** are dragged from the tray onto the canvas:
  - Each shape is a semi-transparent `rgba(0,0,0,0.12)` fill with a `1.5px solid rgba(0,0,0,0.2)` border
  - Shapes are resizable by dragging corners
  - Clicking a placed shape shows a small label popover with a text input ("What is this?") — e.g., "sky", "subject", "background element"
  - Labels appear as small `--text-sm` badges on the shape
  - Shapes can be deleted via a small × that appears on hover
- **Draw mode** (✏): freehand pencil tool, 2px stroke, `rgba(0,0,0,0.4)` color
- Canvas is a `<canvas>` element with shapes rendered on top as absolute-positioned divs (shapes) + canvas layer (freehand)
- The canvas state is captured as a PNG for the iteration strip thumbnail

**Text Prompt:**
- Single-line text input, `--bg-surface` fill, `--border` border, `--radius-md`
- Placeholder text is italic, `--text-tertiary`
- Optional — generate works without it

**Generate Button:**
- Full-width below the prompt
- `--btn-primary-bg` background, `--btn-primary-text` text
- Height: `--btn-height-lg`
- Activates even if canvas is empty (pure text prompt allowed)
- Disabled state if both canvas and text are empty

---

### Screen 2 — Generation Loading

**Purpose:** Transitional state between Composer submission and result delivery. Communicates that work is happening.

**Layout:**
- The canvas area shows the sketch composition fading to a neutral `--bg-surface` fill
- Centered in the canvas: the `forma-mark` SVG in `--text-tertiary`, 32px, with a slow looping rotation animation (20s, linear)
- Below the mark: a single line of text — `"Generating..."` — in `--text-secondary`, `--text-sm`
- No progress bar — the ambiguity is intentional
- Nav round counter reads "Round 1"
- Iteration strip: the Sketch thumbnail is visible; the "Round 1" slot shows a loading skeleton

**Animation:**
```css
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.loading-mark { animation: spin-slow 20s linear infinite; opacity: 0.4; }
```

---

### Screen 3 — Director: Evaluate

**Purpose:** The generated image has arrived. The user is in evaluation mode — looking at what was produced before deciding how to direct it. No tools are active yet.

**Layout:**
```
┌─ Nav ──────────────────────────────────────────────┐
│ forma              Round 1                [☀/🌙]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Directive Toolbar (top, above image) ───────┐  │
│  │ [↺ Undo] │ [⊙ Keep] [✕ Remove] [→ Redirect]  │  │
│  │          │                                    │  │
│  │          │     [Clean / Annotated toggle]     │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Generated Image ───────────────────────────┐   │
│  │                                             │   │
│  │         (full image, no overlays)           │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Refine Bar (bottom of image area) ─────────┐   │
│  │  [Restart Composition]        [Refine →]    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─ Iteration Strip ──────────────────────────────────┤
│  [Sketch]  [Round 1*]  [+ New]     ←scrollable→    │
└─────────────────────────────────────────────────────┘
```

**Directive Toolbar:**
- Floating panel, `--toolbar-bg`, `--toolbar-shadow`, `--toolbar-radius`
- Left group: Undo (only active when marks exist on canvas)
- Right group: three mark type buttons — Keep (⊙, green tint on hover/active), Remove (✕, red tint), Redirect (→, blue tint)
- `Clean / Annotated` toggle is disabled on Round 1 (no prior marks to show) — appears grayed out
- When no mark tool is selected, cursor is default (evaluation mode)
- Active mark tool button has a subtle background fill matching its mark color at low opacity

**Generated Image:**
- Fills the available canvas area with `object-fit: contain`
- No overlays in evaluate mode
- Cursor: default

**Refine Bar:**
- `[Restart Composition]` — ghost button, left-aligned — returns to Composer (preserves session history)
- `[Refine →]` — primary button, right-aligned — disabled until at least one mark is placed

---

### Screen 4 — Director: Mark

**Purpose:** The user is actively drawing directive marks on the image. This is the hero interaction.

**Changes from Screen 3:**
- Active mark tool selected (one of: Keep / Remove / Redirect)
- Canvas cursor changes to crosshair
- Marks render as semi-transparent colored strokes on the image

**Mark Rendering:**
- Marks are drawn on a `<canvas>` overlay sitting above the image at the same dimensions
- Canvas overlay uses `pointer-events: all` when a tool is active
- Each mark type renders in its respective color:
  - **Keep (loop):** freehand closed-form stroke in `--mark-keep` — 3px stroke, `--mark-keep-stroke`
  - **Remove (strikethrough):** any stroke in `--mark-remove` — 3px stroke, `--mark-remove-stroke`
  - **Redirect (arrow):** line with an arrowhead in `--mark-redirect` — 3px stroke, `--mark-redirect-stroke`
- All strokes have a semi-transparent fill on the drawn path area to improve visibility

**Mark Interaction:**
- Drawing: `mousedown` → `mousemove` → `mouseup` creates one mark
- For **Redirect**: draws a line from mousedown point to mouseup point, with an arrowhead rendered at the endpoint
- Each completed mark becomes a distinct object with a unique ID
- Hovering a completed mark shows a small tooltip: **"Add note"** (if no annotation) or the existing annotation text
- Clicking a completed mark opens an **annotation popover**:
  ```
  ┌─────────────────────────────┐
  │ ✏  "What should change?"    │
  │ ________________________    │
  │ [Cancel]          [Save]    │
  └─────────────────────────────┘
  ```
  - Small, `--radius-md`, `--shadow-md`
  - Popover anchors to the centroid of the mark
  - Text is saved as the mark's annotation
  - Annotated marks display a small speech bubble icon at their centroid

**Mark Persistence Rules:**
- **Keep marks:** persist across rounds until explicitly removed by the user (via Undo or clicking the mark and selecting "Remove mark")
- **Remove marks:** cleared automatically after each Refine submission
- **Redirect marks:** cleared automatically after each Refine submission

**The Preservation Layer:**
- After Round 2+, persisted Keep marks are shown on the canvas at a slightly reduced opacity (`0.5`) in a "locked" state
- The user cannot draw over them but can click them to remove them
- This creates a growing visual "contract" with the model — an accumulating set of preserved elements

**Refine Bar:**
- `[Refine →]` becomes active once at least one mark is placed
- On submit: marks + annotations + image context are bundled

---

### Screen 5 — Director: Compare

**Purpose:** The new refined image has arrived. The user can compare it against what they asked for.

**Changes from Screen 3:**
- Result image is the new round's output
- `Clean / Annotated` toggle is now **active** (not grayed out)
- Round counter increments

**Clean / Annotated Toggle:**
- **Clean** (default): shows the new image with no overlays — evaluate the result on its own terms
- **Annotated**: overlays the marks from the **previous round** on the new image at reduced opacity (`0.4`)
  - This shows: "here's what you asked for, here's where it was asked"
  - Keep marks that were honored will appear where the model preserved those elements
  - Remove marks will appear over areas that should now be absent
  - This is the **feedback loop** — the user can see the delta between intent and output
- Toggle animates between states with a `200ms` crossfade

**Iteration Strip Update:**
- New round thumbnail added and scrolled into view automatically
- Previous round thumbnail is now non-active (muted border)
- `[+ New]` tile remains at the end

**Refine Bar:**
- Same as Screen 3/4 — user can continue marking or restart

---

### Screen 6 — Iteration Strip: Expanded / History View

**Purpose:** The user clicks a past round thumbnail to review a prior state in full.

**Trigger:** Clicking any non-active thumbnail in the iteration strip.

**Behavior:**
- The main canvas area transitions to show the selected round's image
- A **history banner** appears above the image:
  ```
  ┌─────────────────────────────────────────────────┐
  │  ← Back to Round 4    Viewing: Round 2          │
  │  [Jump to this round]                           │
  └─────────────────────────────────────────────────┘
  ```
  - "Back to Round N" returns to the current active round
  - "Jump to this round" sets this as the active round (branching — future rounds start from here)
  - The image is shown in read-only mode — no marking tools active
- The `Clean / Annotated` toggle still works: shows the marks that were applied in that round
- Directive toolbar is disabled (all buttons grayed out) in history view
- Nav round counter shows "Round 2 (history)"

---

## 5. Interaction Model Reference

### 5.1 Mark Lifecycle

```
Tool selected
     ↓
User draws on canvas
     ↓
Mark rendered as stroke object (id, type, path, annotation: null)
     ↓
User optionally clicks mark → adds annotation
     ↓
User clicks [Refine →]
     ↓
Marks bundled with request
     ↓
New image arrives (Screen 5)
     ↓
Keep marks → persist to next round (reduced opacity, locked)
Remove marks → cleared
Redirect marks → cleared
     ↓
User continues marking on new result
```

### 5.2 State Shape

```typescript
interface Session {
  id: string;
  rounds: Round[];
  activeRoundIndex: number;
}

interface Round {
  id: string;
  index: number;                  // 0 = Composer sketch
  type: 'sketch' | 'generation';
  imageUrl: string | null;        // null for sketch round
  sketchData: SketchData | null;  // only for sketch round
  marks: Mark[];                  // marks applied TO produce this round
  thumbnailUrl: string;
  prompt: string | null;
}

interface Mark {
  id: string;
  type: 'keep' | 'remove' | 'redirect';
  path: Point[];                  // normalized 0–1 coordinates
  annotation: string | null;
  persists: boolean;              // true for keep marks
}

interface SketchData {
  aspectRatio: '1:1' | '3:2' | '16:9' | '9:16';
  shapes: SketchShape[];
  freehandPaths: Point[][];
  textPrompt: string;
}

interface SketchShape {
  id: string;
  type: 'rect' | 'ellipse' | 'figure' | 'freeform';
  x: number; y: number;           // normalized 0–1
  width: number; height: number;  // normalized 0–1
  label: string;
}
```

### 5.3 Mock AI Behavior

The prototype uses **static mock images** — no real AI generation required. The implementation should:

1. Maintain an array of 6–8 pre-selected sample images (diverse: photography, illustration, abstract)
2. On "Generate" or "Refine": show a 2.5s loading state, then resolve to the next image in the mock set
3. This makes the prototype fully demonstrable without API keys or latency concerns
4. In the video, narrate: "In production this would connect to a diffusion model endpoint"

Optional enhancement (if time allows): connect to Replicate's SDXL API or Fal.ai with a real API key — the state shape above supports it without modification.

---

## 6. Implementation

### 6.1 Stack

```
Next.js 14 (App Router)
TypeScript
Tailwind CSS
React hooks (useState, useReducer, useRef, useCallback)
HTML5 Canvas API (mark drawing + composer sketch)
No backend required (mock images, client state only)
```

### 6.2 Project Structure

```
/app
  layout.tsx          — global font imports, CSS vars, dark mode provider
  page.tsx            — root: renders <FormaApp />

/components
  /shell
    Nav.tsx           — top bar, wordmark, round counter, theme toggle
    IterationStrip.tsx — fixed bottom strip, thumbnail scroll, active state
    RoundThumbnail.tsx — individual thumbnail tile

  /composer
    Composer.tsx      — main composer screen
    ComposerCanvas.tsx — HTML canvas + shape overlay
    ShapeTray.tsx     — draggable shape buttons
    ShapeBlock.tsx    — placed shape with resize handles + label popover
    TextPrompt.tsx    — optional text input

  /director
    Director.tsx      — main director screen (evaluate/mark/compare states)
    DirectorCanvas.tsx — image + mark overlay canvas
    DirectiveToolbar.tsx — toolbar with mark tools + undo + toggle
    Mark.tsx          — individual mark object (rendered on canvas)
    AnnotationPopover.tsx — small popover for mark text
    CompareToggle.tsx — clean/annotated toggle
    RefineBar.tsx     — bottom bar with restart + refine buttons

  /loading
    GenerationLoader.tsx — loading screen with spinning mark

  /history
    HistoryBanner.tsx — history mode banner overlay

/hooks
  useMarkCanvas.ts    — canvas drawing logic, mark state
  useComposerCanvas.ts — shape placement, freehand draw logic
  useSession.ts       — session/round state management
  useTheme.ts         — light/dark mode

/lib
  mockImages.ts       — array of sample image URLs + mock delay fn
  types.ts            — all TypeScript interfaces (as above)
  constants.ts        — design tokens as JS constants (mirrors CSS vars)

/public
  /assets
    forma-lockup-black.svg
    forma-lockup-white.svg
    forma-mark-black.svg
    forma-mark-white.svg
    forma-wordmark-black.svg
    forma-wordmark-white.svg
```

### 6.3 Key Implementation Notes

**Canvas mark drawing (`useMarkCanvas`):**
- Use `useRef` for the canvas element and for an array of mark objects
- On `mousedown`: begin a new mark, push to in-progress path
- On `mousemove`: if drawing, add point to path and redraw
- On `mouseup`: finalize mark, assign ID, push to marks array, trigger re-render
- Re-render means: clear canvas, draw all persisted marks (Keep, full opacity), draw all current-round marks (full opacity), draw in-progress path (full opacity)
- Normalize all coordinates to 0–1 relative to canvas dimensions (for resize resilience)
- For Redirect marks: capture start point on mousedown, end point on mouseup, draw a line + arrowhead

**Arrow rendering (Redirect marks):**
```typescript
function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const headLen = 14;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}
```

**Iteration strip scroll behavior:**
- On new round: `stripRef.current.scrollTo({ left: newThumbPosition, behavior: 'smooth' })`
- Strip container: `overflow-x: auto; scroll-behavior: smooth;`
- Always show scrollbar (override OS default hiding):
  ```css
  .iteration-strip { overflow-x: scroll; }  /* not auto — forces scrollbar */
  ```

**Theme toggle:**
- Stored in `localStorage` key `forma-theme`
- Applied as `data-theme="light"` or `data-theme="dark"` on `<html>`
- All CSS vars scoped to `[data-theme="light"]` and `[data-theme="dark"]`

**Mock image cycling:**
```typescript
const MOCK_IMAGES = [
  '/mocks/img-01.jpg',
  '/mocks/img-02.jpg',
  // ... 6-8 images
];

export async function mockGenerate(roundIndex: number): Promise<string> {
  await new Promise(r => setTimeout(r, 2500));
  return MOCK_IMAGES[roundIndex % MOCK_IMAGES.length];
}
```

Use a variety of high-quality images from Unsplash (download locally to `/public/mocks/` — no API key needed, no hotlinking).

### 6.4 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 4px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
```

---

## 7. Screen-by-Screen Build Order

Build in this order — each step is demonstrable before the next begins:

1. **Shell** — Nav + Iteration Strip + layout skeleton (no content yet)
2. **Composer** — canvas, shape blocks, text prompt, generate button (static, no generation)
3. **Generation Loading** — loader screen, mock delay
4. **Director: Evaluate** — image display, toolbar (tools dormant)
5. **Director: Mark** — canvas drawing, mark rendering, annotation popover ← *core interaction*
6. **Director: Compare** — clean/annotated toggle, mark overlay at reduced opacity
7. **History View** — clicking strip thumbnails, read-only mode, history banner
8. **Polish** — hover states, transitions, dark mode, scrollbar styling, thumbnail generation

---

## 8. Prototype Scope Notes

**In scope:**
- All 6 screens as designed
- Full mark drawing interaction (all 3 types)
- Annotation popover on marks
- Keep mark persistence across rounds
- Iteration strip with permanent scrollbar + scroll-to-active
- Clean / Annotated toggle with mark overlay
- History view on strip click
- Light + dark mode
- Mock image cycling (no real AI)

**Out of scope (mention in video as V2):**
- Real diffusion model integration
- Mobile / touch support
- Branching history (jump to past round and continue from there)
- AI explanation layer (model annotates what it changed and why)
- Color stroke tool (push an area toward a color/tone)
- Sketch shape freeform tool (rough shape → AI interprets as compositional block)
- Goal anchoring (set a reference image or mood as a "north star" before round 1)


