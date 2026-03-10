# SKAM — Frontend Design System & UI Style Guide

> **Version**: 2.0 — March 2026
> **Stack**: Next.js (App Router) · Tailwind CSS v4 · shadcn/ui (new-york style) · Radix UI · Lucide Icons
> **Theme**: Dark Cybersecurity / Neon Green / Glassmorphism
> **Target**: Vietnamese users on mobile-first, low-to-mid Android devices

---

## 🛡️ AI AGENT PROTOCOL — READ BEFORE IMPLEMENTING

Every AI agent (Claude, Copilot, Cursor, etc.) working on this codebase **MUST** follow this protocol before writing any code. This is not optional.

### Step 1 — Read What Exists

```
BEFORE touching any file:
1. Read THIS document end-to-end
2. Read the existing codebase structure (apps/web/src/)
3. Read globals.css for current CSS variables and theme tokens
4. Read components.json for shadcn configuration
5. Read tailwind config (or @theme inline block) for theme references
6. Check existing components in components/ui/ to avoid duplication
7. Read any .env.example for environment variable conventions
```

### Step 2 — Research Up-to-Date Knowledge

```
BEFORE implementing with any library or framework:
1. Check the LATEST version of every dependency used:
   - shadcn/ui    → currently CLI v4, uses unified `radix-ui` package
   - Tailwind CSS  → currently v4.x with @theme inline, OKLCH colors
   - Next.js       → currently v16.x with App Router, Cache Components
   - Lucide React  → currently v0.577.x
   - React         → currently v19.2 with View Transitions, useEffectEvent
2. Verify API signatures have not changed since this doc was written
3. Search official docs if unsure — never guess parameter names or types
4. Check for deprecated patterns:
   - ❌ tailwindcss-animate (deprecated) → use native CSS animations
   - ❌ @radix-ui/react-* individual packages → use unified `radix-ui`
   - ❌ forwardRef in React 19+ → use props with data-slot
   - ❌ tailwind.config.ts in Tailwind v4 → use @theme inline in CSS
   - ❌ hsl() raw values without wrapper → Tailwind v4 requires hsl()/oklch()
   - ❌ middleware.ts in Next.js 16+ → renamed to proxy.ts
```

### Step 3 — Produce a Detailed Plan

```
BEFORE writing code, produce a plan that includes:
1. WHAT files will be created or modified (list every path)
2. WHY each change is needed (link to a requirement or design token)
3. HOW the change integrates with existing components and theme
4. DEPENDENCIES — any new packages needed (with exact versions)
5. TESTING — how to verify the change works (visual, unit, a11y)
6. ROLLBACK — what to undo if the change breaks something

Format:
## Plan: [Feature Name]
### Files Changed
- `apps/web/src/app/globals.css` — add new CSS variable for X
- `apps/web/src/components/ui/button.tsx` — add "neon" variant
### Dependencies
- None (uses existing shadcn Button)
### Verification
- Visual: button glows neon green on hover
- A11y: contrast ratio ≥ 4.5:1
```

---

## 1. DESIGN PHILOSOPHY

### 1.1 Core Concept

SKAM is a cybersecurity tool for everyday Vietnamese users. The visual language must communicate **trust**, **technical authority**, and **clarity** — without intimidating non-technical people.

**Aesthetic direction**: Dark glassmorphism with neon green accents. Think "antivirus dashboard meets modern fintech" — the UI should feel like a shield, not a hacker terminal.

### 1.2 Design Principles

| # | Principle | What it means in practice |
|---|-----------|---------------------------|
| 1 | **Dark-first, not dark-only** | Pure dark backgrounds with carefully layered surface elevation. Never use pure white anywhere. |
| 2 | **Neon as signal, not decoration** | Green glow indicates safety, interactivity, or success. Overusing it dilutes its meaning. |
| 3 | **Glass creates depth** | Semi-transparent surfaces over gradient meshes create z-axis hierarchy without heavy shadows. |
| 4 | **Vietnamese typography matters** | Tone marks (dấu) need extra line-height. Vietnamese text is 20–30% longer than English. |
| 5 | **Mobile-first for Vietnam** | 70%+ users are on Android. Touch targets ≥ 44px. Test on 360px viewport. |
| 6 | **60-30-10 color rule** | 60% dark backgrounds, 30% white/light text, 10% neon accents. |
| 7 | **Trust through consistency** | Every component uses the same token system. No one-off colors or magic numbers. |

### 1.3 Design References

| Source | What to take |
|--------|-------------|
| **Truecaller** | Search-first UX, result cards with trust scores |
| **CrowdStrike / Darktrace** | Dark hero sections, neon accent hierarchy |
| **Apple macOS / iOS 26** | Glassmorphism layering, backdrop-blur depth |
| **Cyberpunk 2077 HUD** | Neon borders, scanline effects (use sparingly) |
| **ChongLuaDao.vn** | Dark theme, tech-focused, Vietnamese context |

---

## 2. COLOR SYSTEM

### 2.1 Color Palette — CSS Variables

All colors are defined as CSS custom properties in `globals.css`. Tailwind v4 references them via `@theme inline`. The color space is **HSL** with wrapper functions (compatible with shadcn/ui convention).

```css
/* ============================================
   SKAM COLOR SYSTEM — globals.css
   ============================================ */

:root {
  /* ---- Core Brand ---- */
  --neon-green:          #00FF80;               /* hsl(150 100% 50%) — signature */
  --neon-green-light:    #4DFFA6;               /* hsl(150 100% 65%) — hover */
  --neon-green-dark:     #00CC66;               /* hsl(150 100% 40%) — pressed */
  --neon-green-muted:    hsl(150 60% 35%);      /* #2D8F5E — subdued accent */
  --neon-green-ghost:    hsl(150 100% 50% / 0.1); /* Background tint */
  --neon-green-glow:     hsl(150 100% 50% / 0.4); /* Box-shadow glow */

  /* ---- Dark Surfaces (Elevation System) ---- */
  /* Using hex for precision. These are very dark blue-grays. */
  --surface-base:        #07070B;               /* Deepest bg */
  --surface-0:           #0B0B0E;               /* Page bg */
  --surface-1:           #101014;               /* Card bg */
  --surface-2:           #151519;               /* Elevated card */
  --surface-3:           #1C1C22;               /* Modal/dropdown */
  --surface-4:           #22222A;               /* Hover state */

  /* ---- Text ---- */
  --text-primary:        #F2F2F2;               /* Near-white — headings, body */
  --text-secondary:      #C2F0D9;               /* Light green tint — descriptions */
  --text-tertiary:       #9FDFBF;               /* Medium green tint — captions */
  --text-disabled:       #808080;               /* ⚠ Lightened from #666→#808 for 4.5:1 on surface-0 */
  --text-inverse:        #000000;               /* On neon bg */

  /* ---- Borders ---- */
  --border-default:      hsl(0 0% 100% / 0.08); /* Subtle dividers */
  --border-hover:        hsl(0 0% 100% / 0.15); /* Hover state */
  --border-focus:        var(--neon-green);       /* Focus ring */
  --border-neon:         hsl(150 100% 50% / 0.3); /* Neon outline */

  /* ---- Semantic: Status ---- */
  --status-safe:         #00FF80;               /* Neon green — verified safe */
  --status-safe-bg:      hsl(150 100% 50% / 0.08);
  --status-danger:       #EB4747;               /* Red — confirmed scam */
  --status-danger-bg:    hsl(0 80% 60% / 0.08);
  --status-warning:      #FFB300;               /* Amber — suspicious */
  --status-warning-bg:   hsl(42 100% 50% / 0.08);
  --status-info:         #00AAFF;               /* Cyan — informational */
  --status-info-bg:      hsl(200 100% 50% / 0.08);
  --status-pending:      #B07CE8;               /* ⚠ Lightened from #8C53C6 for 4.5:1 contrast */
  --status-pending-bg:   hsl(270 60% 70% / 0.08);

  /* ---- Glassmorphism ---- */
  --glass-bg:            hsl(0 0% 100% / 0.03);
  --glass-bg-hover:      hsl(0 0% 100% / 0.06);
  --glass-border:        hsl(0 0% 100% / 0.08);
  --glass-blur:          12px;
  --glass-blur-heavy:    24px;

  /* ---- Ambient Gradients (behind glass panels) ---- */
  /* NOTE: Use only with background-image, not shorthand background */
  --gradient-neon:       radial-gradient(ellipse at 20% 50%, hsl(150 100% 50% / 0.08), transparent 60%);
  --gradient-danger:     radial-gradient(ellipse at 80% 30%, hsl(0 80% 60% / 0.06), transparent 50%);
  --gradient-ambient:    radial-gradient(ellipse at 50% 0%, hsl(150 100% 50% / 0.04), transparent 70%);

  /* ---- Shadows ---- */
  --shadow-sm:           0 1px 3px hsl(0 0% 0% / 0.3);
  --shadow-md:           0 4px 12px hsl(0 0% 0% / 0.4);
  --shadow-lg:           0 8px 30px hsl(0 0% 0% / 0.5);
  --shadow-neon:         0 0 15px hsl(150 100% 50% / 0.4);
  --shadow-neon-strong:  0 0 30px hsl(150 100% 50% / 0.6);
  --shadow-danger:       0 0 15px hsl(0 80% 60% / 0.3);

  /* ---- Radius ---- */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;
}
```

### 2.2 Mapping to shadcn/ui Theme Variables

shadcn/ui expects a specific set of CSS variables. Map the SKAM palette onto them:

```css
/* ============================================
   SHADCN/UI THEME MAPPING — globals.css
   ============================================ */

:root {
  /* shadcn semantic tokens → SKAM values */
  --background:            var(--surface-0);
  --foreground:            var(--text-primary);

  --card:                  var(--surface-1);
  --card-foreground:       var(--text-primary);

  --popover:               var(--surface-3);
  --popover-foreground:    var(--text-primary);

  --primary:               var(--neon-green);
  --primary-foreground:    var(--text-inverse);

  --secondary:             var(--surface-2);
  --secondary-foreground:  var(--text-primary);

  --muted:                 var(--surface-2);
  --muted-foreground:      var(--text-disabled);

  --accent:                var(--surface-3);
  --accent-foreground:     var(--text-primary);

  --destructive:           #C62828;             /* Darker red for button BG — 4.8:1 with white text */
  --destructive-foreground: #F2F2F2;

  --border:                var(--border-default);
  --input:                 var(--border-default);
  --ring:                  var(--neon-green);

  --chart-1:               var(--neon-green);
  --chart-2:               var(--status-info);
  --chart-3:               var(--status-warning);
  --chart-4:               var(--status-danger);
  --chart-5:               var(--status-pending);

  --radius:                0.5rem;

  --sidebar-background:    var(--surface-1);
  --sidebar-foreground:    var(--text-primary);
  --sidebar-primary:       var(--neon-green);
  --sidebar-primary-foreground: var(--text-inverse);
  --sidebar-accent:        var(--surface-3);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border:        var(--border-default);
  --sidebar-ring:          var(--neon-green);
}

/* No .dark class needed — the app is dark-only */
```

### 2.3 Tailwind v4 Theme Registration

In Tailwind CSS v4, theme tokens are registered using `@theme inline` in `globals.css`, not in a config file:

```css
/* ============================================
   TAILWIND V4 THEME REGISTRATION
   ============================================ */

@import "tailwindcss";

@theme inline {
  --color-background:          var(--background);
  --color-foreground:          var(--foreground);
  --color-card:                var(--card);
  --color-card-foreground:     var(--card-foreground);
  --color-popover:             var(--popover);
  --color-popover-foreground:  var(--popover-foreground);
  --color-primary:             var(--primary);
  --color-primary-foreground:  var(--primary-foreground);
  --color-secondary:           var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted:               var(--muted);
  --color-muted-foreground:    var(--muted-foreground);
  --color-accent:              var(--accent);
  --color-accent-foreground:   var(--accent-foreground);
  --color-destructive:         var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border:              var(--border);
  --color-input:               var(--input);
  --color-ring:                var(--ring);
  --color-chart-1:             var(--chart-1);
  --color-chart-2:             var(--chart-2);
  --color-chart-3:             var(--chart-3);
  --color-chart-4:             var(--chart-4);
  --color-chart-5:             var(--chart-5);

  --color-sidebar-background:          var(--sidebar-background);
  --color-sidebar-foreground:          var(--sidebar-foreground);
  --color-sidebar-primary:             var(--sidebar-primary);
  --color-sidebar-primary-foreground:  var(--sidebar-primary-foreground);
  --color-sidebar-accent:              var(--sidebar-accent);
  --color-sidebar-accent-foreground:   var(--sidebar-accent-foreground);
  --color-sidebar-border:              var(--sidebar-border);
  --color-sidebar-ring:                var(--sidebar-ring);

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* SKAM custom colors available as Tailwind utilities */
  --color-neon:         var(--neon-green);
  --color-neon-light:   var(--neon-green-light);
  --color-neon-dark:    var(--neon-green-dark);
  --color-neon-ghost:   var(--neon-green-ghost);
  --color-surface-0:    var(--surface-0);
  --color-surface-1:    var(--surface-1);
  --color-surface-2:    var(--surface-2);
  --color-surface-3:    var(--surface-3);
  --color-surface-4:    var(--surface-4);
  --color-safe:         var(--status-safe);
  --color-danger:       var(--status-danger);
  --color-warning:      var(--status-warning);
  --color-info:         var(--status-info);
  --color-pending:      var(--status-pending);
}
```

### 2.4 Color Usage Rules

**The 60-30-10 distribution:**

| Proportion | Usage | Colors |
|-----------|-------|--------|
| **60%** | Backgrounds, surfaces | `--surface-base`, `--surface-0`, `--surface-1` |
| **30%** | Text, icons | `--text-primary`, `--text-secondary` |
| **10%** | Accents, CTAs, status | `--neon-green`, status colors |

**Contrast requirements (WCAG AA) — all ratios verified by automated audit:**

| Element | Minimum ratio | Example |
|---------|--------------|---------|
| Body text on surface-0 | 4.5:1 | `#F2F2F2` on `#0B0B0E` = 17.6:1 ✅ |
| Caption text on surface-1 | 4.5:1 | `#9FDFBF` on `#101014` = 12.5:1 ✅ |
| Neon green on surface-0 | 4.5:1 | `#00FF80` on `#0B0B0E` = 14.6:1 ✅ |
| Inverse text on neon-green | 4.5:1 | `#000000` on `#00FF80` = 15.6:1 ✅ |
| Disabled text on surface-0 | 3:1 | `#808080` on `#0B0B0E` = 4.9:1 ✅ |
| Pending badge on surface-1 | 4.5:1 | `#B07CE8` on `#101014` = 5.1:1 ✅ |
| Danger badge on surface-1 | 4.5:1 | `#EB4747` on `#101014` = 5.0:1 ✅ |
| Large text (≥18pt) | 3:1 | More lenient threshold for headings |

**Do:**

- Use `--neon-green` for primary CTAs, links, focus rings, and success states
- Use `--status-danger` (#EB4747) exclusively for scam/danger indicators
- Layer surfaces for depth: `surface-0` → `surface-1` → `surface-2`
- Use `--glass-bg` with `backdrop-blur` for overlays

**Don't:**

- Mix `--status-danger` and `--neon-green` on the same element
- Use `--neon-green` for decorative-only elements (dilutes its meaning)
- Use pure white `#FFFFFF` for body text (too harsh — use `--text-primary` = `#F2F2F2`)
- Stack more than 3 surface levels in a single view
- Use `--text-disabled` on `surface-3` or `surface-4` — fails 3:1 contrast. Restrict to `surface-0`/`surface-1` only.
- Use `--status-danger` (#EB4747) as a *button background* — it fails white text contrast. Use `--destructive` (#C62828) for button/filled backgrounds. `--status-danger` is for badge *text* and *borders* on dark surfaces only.
- Use white text on `--status-warning` or `--status-info` backgrounds — both fail. Use black text instead.

---

## 3. TYPOGRAPHY

### 3.1 Font Stack

```css
/* ============================================
   FONT LOADING — layout.tsx (Next.js)
   ============================================ */

/* 
 * PRIMARY — Inter (not Space Grotesk)
 * Reason: Best Vietnamese diacritic support across all weights.
 * The previous design doc used Space Grotesk, but Inter has superior
 * tone mark rendering on Android devices and broader weight range.
 * 
 * DISPLAY — Inter Bold
 * For display headings. Same font as body but at heavier weight
 * and with tighter tracking. Keeps bundle size down (one font family).
 *
 * MONO — JetBrains Mono
 * For bank account numbers, data, code blocks.
 */
```

```typescript
// apps/web/src/app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono",
  display: "swap",
});

// Apply in <html> or <body>:
// className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
```

```css
/* Register in @theme inline */
@theme inline {
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono), ui-monospace, "Courier New", monospace;
}
```

### 3.2 Type Scale

All sizes use `rem` for accessibility (respects user's browser font size).

| Token | Font | Weight | Size | Line Height | Letter Spacing | Use |
|-------|------|--------|------|-------------|---------------|-----|
| `display-1` | Inter | 700 | 3rem (48px) | 1.15 | -0.02em | Hero headline |
| `display-2` | Inter | 700 | 2.25rem (36px) | 1.2 | -0.015em | Section headline |
| `h1` | Inter | 700 | 2rem (32px) | 1.25 | -0.01em | Page title |
| `h2` | Inter | 600 | 1.5rem (24px) | 1.3 | -0.005em | Section title |
| `h3` | Inter | 600 | 1.25rem (20px) | 1.4 | normal | Card title |
| `h4` | Inter | 600 | 1.125rem (18px) | 1.4 | normal | Subsection |
| `body-lg` | Inter | 400 | 1.125rem (18px) | 1.6 | normal | Lead paragraph |
| `body` | Inter | 400 | 1rem (16px) | 1.6 | normal | Default body |
| `body-sm` | Inter | 400 | 0.875rem (14px) | 1.5 | normal | Secondary info |
| `caption` | Inter | 400 | 0.75rem (12px) | 1.5 | 0.02em | Labels, metadata |
| `mono` | JetBrains Mono | 400 | 0.875rem (14px) | 1.5 | normal | Account numbers |
| `mono-lg` | JetBrains Mono | 500 | 1.25rem (20px) | 1.4 | 0.05em | Risk scores |

### 3.3 Vietnamese Typography Rules

Vietnamese text uses tone marks (dấu) that extend above and below the baseline. These rules prevent clipping:

```css
/* CRITICAL for Vietnamese */
body {
  line-height: 1.6;            /* Minimum 1.5, prefer 1.6 */
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Headings can be tighter but never below 1.15 */
h1, h2, h3 {
  line-height: 1.25;
}

/* Input fields need vertical padding for diacritics */
input, textarea {
  padding-top: 0.625rem;       /* 10px */
  padding-bottom: 0.625rem;
  line-height: 1.5;
}
```

**Text length planning:** Vietnamese strings are typically 20–30% longer than English equivalents. Budget layout space accordingly:

| English | Vietnamese | Growth |
|---------|-----------|--------|
| "Search" | "Tìm kiếm" | +30% |
| "Submit Report" | "Gửi báo cáo" | +25% |
| "Verified Safe" | "Đã xác minh an toàn" | +60% |

### 3.4 Text Glow Effects

Use sparingly — only for hero headlines or key stat numbers.

```css
/* Neon text glow — for hero headings only */
.text-glow {
  text-shadow:
    0 0 10px hsl(150 100% 50% / 0.5),
    0 0 30px hsl(150 100% 50% / 0.2);
}

/* Subtle glow — for stat numbers */
.text-glow-subtle {
  text-shadow: 0 0 8px hsl(150 100% 50% / 0.3);
}

/* Danger glow — for scam warning text */
.text-glow-danger {
  text-shadow:
    0 0 10px hsl(0 80% 60% / 0.5),
    0 0 30px hsl(0 80% 60% / 0.2);
}
```

---

## 4. SPACING & LAYOUT

### 4.1 Spacing Scale

Uses Tailwind's default 4px base unit. Custom additions for SKAM:

| Token | Value | Tailwind Class | Use |
|-------|-------|----------------|-----|
| `space-1` | 4px | `p-1` | Icon padding |
| `space-2` | 8px | `p-2` | Tight gaps |
| `space-3` | 12px | `p-3` | Input internal |
| `space-4` | 16px | `p-4` | Card padding |
| `space-5` | 20px | `p-5` | Card gap |
| `space-6` | 24px | `p-6` | Section padding (mobile) |
| `space-8` | 32px | `p-8` | Section padding (desktop) |
| `space-10` | 40px | `p-10` | Large section gap |
| `space-12` | 48px | `p-12` | Page top/bottom |
| `space-16` | 64px | `p-16` | Hero padding |
| `space-20` | 80px | `p-20` | Major section break |

### 4.2 Layout Grid

```css
/* Container — max-width with auto margins */
.skam-container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 1rem;      /* 16px on mobile */
}

@media (min-width: 640px) {
  .skam-container {
    padding-inline: 1.5rem;  /* 24px on tablet */
  }
}

@media (min-width: 1024px) {
  .skam-container {
    padding-inline: 2rem;    /* 32px on desktop */
  }
}
```

**Breakpoints** (Tailwind defaults):

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Large phone / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

### 4.3 Z-Index Scale

```css
@theme inline {
  --z-base:      0;
  --z-dropdown:  10;
  --z-sticky:    20;
  --z-overlay:   30;
  --z-modal:     40;
  --z-toast:     50;
  --z-tooltip:   60;
}
```

---

## 5. COMPONENT PATTERNS

### 5.1 Glassmorphism Card

The signature SKAM component. Used for search cards, result cards, and form containers.

```tsx
// components/ui/glass-card.tsx
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "neon";
}

export function GlassCard({
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  return (
    <div
      data-slot="glass-card"
      className={cn(
        // Base glass effect
        "rounded-xl border backdrop-blur-[var(--glass-blur)]",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        "transition-all duration-300",
        // Variants
        variant === "default" && "shadow-[var(--shadow-sm)]",
        variant === "elevated" && [
          "bg-[var(--glass-bg-hover)]",
          "shadow-[var(--shadow-md)]",
        ],
        variant === "neon" && [
          "border-[var(--border-neon)]",
          "shadow-[var(--shadow-neon)]",
        ],
        className
      )}
      {...props}
    />
  );
}
```

**Usage:**

```tsx
<GlassCard variant="neon" className="p-6">
  <h2 className="text-xl font-semibold">Tra cứu tài khoản</h2>
  <p className="text-[var(--text-secondary)]">
    Kiểm tra số tài khoản ngân hàng trước khi chuyển tiền
  </p>
</GlassCard>
```

### 5.2 Button Variants

Extend shadcn's Button with SKAM-specific variants:

```tsx
// Extend buttonVariants in components/ui/button.tsx

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        // Default shadcn variants...
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // SKAM custom variants
        neon: [
          "bg-[var(--neon-green)] text-black font-semibold",
          "shadow-[var(--shadow-neon)]",
          "hover:bg-[var(--neon-green-light)]",
          "hover:shadow-[var(--shadow-neon-strong)]",
          "active:bg-[var(--neon-green-dark)]",
          "transition-all duration-200",
        ].join(" "),

        "neon-outline": [
          "border border-[var(--neon-green)] text-[var(--neon-green)]",
          "bg-transparent",
          "hover:bg-[var(--neon-green-ghost)]",
          "hover:shadow-[var(--shadow-neon)]",
          "active:bg-[var(--neon-green-ghost)]",
        ].join(" "),

        danger: [
          "bg-destructive text-destructive-foreground font-semibold",
          "shadow-[var(--shadow-danger)]",
          "hover:bg-destructive/90",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### 5.3 Status Badge

Used on search result cards to indicate account safety level:

```tsx
// components/ui/status-badge.tsx
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Clock, Info } from "lucide-react";

type Status = "safe" | "danger" | "warning" | "pending" | "info";

const statusConfig: Record<Status, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  safe: {
    label: "An toàn",
    icon: ShieldCheck,
    className: "bg-[var(--status-safe-bg)] text-[var(--status-safe)] border-[var(--status-safe)]/20",
  },
  danger: {
    label: "Nguy hiểm",
    icon: ShieldAlert,
    className: "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger)]/20",
  },
  warning: {
    label: "Đáng ngờ",
    icon: ShieldQuestion,
    className: "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/20",
  },
  pending: {
    label: "Đang xem xét",
    icon: Clock,
    className: "bg-[var(--status-pending-bg)] text-[var(--status-pending)] border-[var(--status-pending)]/20",
  },
  info: {
    label: "Thông tin",
    icon: Info,
    className: "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
        "text-xs font-medium border",
        config.className
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}
```

### 5.4 Search Input (Hero Component)

The primary interaction point — used on the lookup page:

```tsx
// components/search-input.tsx
"use client";

import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  isLoading?: boolean;
  onSearch: (accountNumber: string) => void;
}

export function SearchInput({ isLoading, onSearch }: SearchInputProps) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--text-disabled)]" />
        <Input
          type="text"
          placeholder="Nhập số tài khoản ngân hàng..."
          className={cn(
            "h-14 pl-12 pr-4 text-lg font-mono",
            "bg-[var(--surface-1)] border-[var(--border-default)]",
            "placeholder:text-[var(--text-disabled)]",
            "focus:border-[var(--neon-green)] focus:ring-2 focus:ring-[var(--neon-green)]/20",
            "focus:shadow-[var(--shadow-neon)]",
            "rounded-xl transition-all duration-200"
          )}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>
      <Button variant="neon" size="xl" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          "Tra cứu"
        )}
      </Button>
    </div>
  );
}
```

### 5.5 Result Card

Displays the outcome of a bank account lookup:

```tsx
// components/result-card.tsx
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Shield, AlertTriangle, Users, Calendar } from "lucide-react";

interface ResultCardProps {
  status: "safe" | "danger" | "warning";
  bankName: string;
  accountNumber: string;
  reportCount: number;
  lastReported?: string;
}

export function ResultCard({
  status,
  bankName,
  accountNumber,
  reportCount,
  lastReported,
}: ResultCardProps) {
  const borderColor =
    status === "danger"
      ? "border-[var(--status-danger)]/40"
      : status === "warning"
        ? "border-[var(--status-warning)]/40"
        : "border-[var(--status-safe)]/40";

  return (
    <GlassCard className={cn("p-6", borderColor)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-[var(--text-tertiary)]">{bankName}</p>
          <p className="text-xl font-mono font-semibold tracking-wider">
            {accountNumber}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Stats row */}
      <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4" />
          {reportCount} báo cáo
        </span>
        {lastReported && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" />
            {lastReported}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
```

---

## 6. MOTION & ANIMATION

### 6.1 Timing Tokens

```css
/* ============================================
   ANIMATION TOKENS
   ============================================ */
:root {
  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --duration-slower:  600ms;

  --ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:          cubic-bezier(0.4, 0, 1, 1);
  --ease-out:         cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 6.2 Signature Animations

```css
/* Scanning line — used on GlassCard hover */
@keyframes scan-line {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.6; }
  100% { transform: translateY(100%); opacity: 0; }
}

.animate-scan {
  position: relative;
  overflow: hidden;
}
.animate-scan::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--neon-green),
    transparent
  );
  animation: scan-line 3s ease-in-out infinite;
}

/* Neon pulse — used on primary CTA */
@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 15px hsl(150 100% 50% / 0.4); }
  50%      { box-shadow: 0 0 25px hsl(150 100% 50% / 0.6); }
}

.animate-neon-pulse {
  animation: neon-pulse 2s ease-in-out infinite;
}

/* Fade in up — page entry */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up var(--duration-slow) var(--ease-out) both;
}

/* Stagger children — for lists of cards */
.stagger-children > * {
  animation: fade-in-up var(--duration-slow) var(--ease-out) both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 80ms; }
.stagger-children > *:nth-child(3) { animation-delay: 160ms; }
.stagger-children > *:nth-child(4) { animation-delay: 240ms; }
.stagger-children > *:nth-child(5) { animation-delay: 320ms; }
```

### 6.3 Hover & Interaction States

```css
/* Card hover — lift effect */
.hover-lift {
  transition: transform var(--duration-normal) var(--ease-default),
              box-shadow var(--duration-normal) var(--ease-default);
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Neon border reveal — on focus or hover */
.hover-neon-border {
  transition: border-color var(--duration-normal) var(--ease-default),
              box-shadow var(--duration-normal) var(--ease-default);
}
.hover-neon-border:hover,
.hover-neon-border:focus-within {
  border-color: hsl(150 100% 50% / 0.3);
  box-shadow: var(--shadow-neon);
}
```

### 6.4 Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. ICONOGRAPHY

### 7.1 Icon System

SKAM uses **Lucide React** (v0.577+) as the icon library, consistent with shadcn/ui defaults.

```tsx
// Import individually for tree-shaking
import { Shield, ShieldCheck, ShieldAlert, Search, Upload } from "lucide-react";

// Standard sizing
<Shield className="size-4" />   // 16px — inline with text
<Shield className="size-5" />   // 20px — in buttons
<Shield className="size-6" />   // 24px — standalone
<Shield className="size-8" />   // 32px — feature icons
<Shield className="size-12" />  // 48px — hero/empty state
```

### 7.2 SKAM Icon Mapping

| Concept | Lucide Icon | Usage |
|---------|-------------|-------|
| Platform brand | `Shield` | Logo mark, favicon |
| Safe account | `ShieldCheck` | Result card, badge |
| Danger account | `ShieldAlert` | Result card, badge |
| Suspicious | `ShieldQuestion` | Result card, badge |
| Search | `Search` | Search input, nav |
| Submit report | `FileWarning` | Report form CTA |
| Evidence upload | `Upload` | File upload area |
| Bank | `Building2` | Bank selector |
| Report count | `Users` | Stats display |
| Time/date | `Calendar` | Report metadata |
| Pending review | `Clock` | Admin status |
| Approve | `CheckCircle2` | Admin action |
| Reject | `XCircle` | Admin action |
| External link | `ExternalLink` | Evidence links |
| Copy | `Copy` | Account number copy |
| Loading | `Loader2` | With `animate-spin` |

### 7.3 Icon Color Rules

```
- Default icon color: currentColor (inherits from parent text)
- Interactive icons: --neon-green on hover
- Status icons: match their status color (safe/danger/warning)
- Disabled icons: --text-disabled
- Never colorize decorative icons — let them be text-secondary
```

---

## 8. BACKGROUND & AMBIENT EFFECTS

### 8.1 Page Background

The page uses a subtle radial gradient with neon green tint to create depth behind glassmorphic elements:

```css
/* Apply to <body> or main layout wrapper */
.skam-page-bg {
  background-color: var(--surface-base);
  background-image:
    radial-gradient(ellipse at 20% 0%, hsl(150 100% 50% / 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, hsl(200 100% 50% / 0.02) 0%, transparent 40%);
  min-height: 100dvh;
}
```

### 8.2 Grid Pattern Overlay (Optional)

For pages that need extra tech atmosphere (home, admin dashboard):

```css
.skam-grid-overlay {
  background-image:
    linear-gradient(hsl(0 0% 100% / 0.02) 1px, transparent 1px),
    linear-gradient(90deg, hsl(0 0% 100% / 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### 8.3 Ambient Glow Orbs

Floating gradient orbs behind glass panels (used on hero sections):

```tsx
// components/ambient-glow.tsx
export function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Neon green orb — top left */}
      <div
        className="absolute -top-1/4 -left-1/4 size-[600px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, var(--neon-green), transparent 70%)",
        }}
      />
      {/* Cyan orb — bottom right */}
      <div
        className="absolute -bottom-1/4 -right-1/4 size-[500px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, var(--status-info), transparent 70%)",
        }}
      />
    </div>
  );
}
```

---

## 9. SHADCN/UI CONFIGURATION

### 9.1 components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 9.2 Utility Function

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 9.3 Recommended shadcn Components

Install these components as the base set for SKAM:

```bash
# Core UI
npx shadcn@latest add button input label badge card dialog
npx shadcn@latest add dropdown-menu select tabs toast sonner
npx shadcn@latest add table skeleton separator scroll-area

# Forms
npx shadcn@latest add field textarea checkbox radio-group

# Navigation
npx shadcn@latest add sidebar navigation-menu breadcrumb

# Data display
npx shadcn@latest add avatar tooltip popover
```

---

## 10. PAGE COMPOSITIONS

### 10.1 Lookup Page (Trang Tra Cứu)

```
┌──────────────────────────────────────────────────┐
│  [Logo]  Tra cứu   Báo cáo   [Admin]            │  ← Nav bar (surface-1, glass)
├──────────────────────────────────────────────────┤
│                                                  │
│             🛡️ (shield icon, 64px)              │
│                                                  │
│    Kiểm tra tài khoản ngân hàng                 │  ← display-1, text-glow
│    trước khi chuyển tiền                         │  ← body-lg, text-secondary
│                                                  │
│  ┌─ GlassCard (neon variant) ──────────────┐    │
│  │  [Bank Selector ▾]                       │    │
│  │  [🔍 Nhập số tài khoản...  ] [Tra cứu] │    │  ← search input + neon button
│  └──────────────────────────────────────────┘    │
│                                                  │
│    15,420          45,230          98.5%          │  ← stat numbers (mono-lg)
│    Scammer         Lượt kiểm tra   Chính xác     │  ← captions
│                                                  │
│  ── Cách hoạt động ──                            │
│                                                  │
│  [1]──────────[2]──────────[3]                   │  ← 3-step guide
│  Nhập STK     Kiểm tra      Xem kết quả         │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 10.2 Result Page (Trang Kết Quả)

```
── DANGER Result ──
┌──────────────────────────────────────────────────┐
│  GlassCard (border: status-danger/40)            │
│                                                  │
│  ⚠️ CẢNH BÁO: TÀI KHOẢN NÀY ĐÃ BỊ BÁO CÁO   │  ← danger glow text
│                                                  │
│  Vietcombank                                     │
│  1234 5678 9012     [Copy]                       │  ← mono font
│                                                  │
│  ┌─ Risk Score ──────────────────────────────┐  │
│  │  ████████████████░░░░  85/100  NGUY HIỂM  │  │  ← progress bar
│  └───────────────────────────────────────────┘  │
│                                                  │
│  📊 12 báo cáo  ·  📅 Gần nhất: 2 ngày trước   │
│                                                  │
│  ── Lịch sử báo cáo ──                          │
│  ┌─ Report 1 ─────────────────────────────┐     │
│  │  "Mua hàng Shopee, đã chuyển tiền..."  │     │
│  │  📎 2 bằng chứng  ·  15/01/2026        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  [🛡️ Báo cáo thêm]  [← Tra cứu mới]           │
│                                                  │
└──────────────────────────────────────────────────┘

── SAFE Result ──
┌──────────────────────────────────────────────────┐
│  GlassCard (border: status-safe/40)              │
│                                                  │
│  ✅ KHÔNG TÌM THẤY BÁO CÁO                     │  ← safe glow text
│                                                  │
│  Vietcombank                                     │
│  1234 5678 9012                                  │
│                                                  │
│  Tài khoản này chưa có báo cáo lừa đảo.         │
│  Tuy nhiên, hãy luôn cảnh giác khi chuyển tiền. │
│                                                  │
│  [🛡️ Báo cáo tài khoản này]  [← Tra cứu mới]  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 10.3 Report Page (Trang Báo Cáo)

```
┌──────────────────────────────────────────────────┐
│  GlassCard                                       │
│                                                  │
│  📝 Báo cáo tài khoản lừa đảo                   │
│  Thông tin sẽ được kiểm duyệt trước khi công bố │
│                                                  │
│  ── Thông tin tài khoản ──                       │
│  [Bank Selector ▾]                               │
│  [Số tài khoản *]                                │
│                                                  │
│  ── Chi tiết lừa đảo ──                          │
│  [Loại lừa đảo ▾]                                │
│  [Mô tả chi tiết... (textarea)]                  │
│  [Số tiền bị lừa (VNĐ)]                          │
│                                                  │
│  ── Bằng chứng ──                                │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐         │
│  │  📎 Kéo thả file hoặc bấm để chọn  │         │  ← dashed border upload
│  │     PNG, JPG · Tối đa 5 file · 5MB  │         │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘         │
│                                                  │
│  [🤖 Turnstile CAPTCHA]                          │
│                                                  │
│  [Gửi báo cáo]  (neon button, full width)        │
│                                                  │
│  ℹ️ Bạn có thể gửi tối đa 5 báo cáo/ngày       │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 10.4 Admin Dashboard

```
┌────────────┬────────────────────────────────────┐
│  Sidebar   │  Content Area                       │
│  (surface-1│                                     │
│  260px)    │  ── Báo cáo chờ duyệt (24) ──      │
│            │                                     │
│  🏠 Tổng   │  [Filters: Status ▾] [Bank ▾]      │
│    quan    │                                     │
│  📋 Báo   │  ┌─ Report Card ──────────────┐     │
│    cáo     │  │  VCB · 1234567890          │     │
│  📊 Thống │  │  "Lừa đảo mua hàng..."     │     │
│    kê      │  │  📎 3 files · 2h trước     │     │
│  ⚙️ Cài   │  │                             │     │
│    đặt     │  │  [✅ Duyệt] [❌ Từ chối]   │     │
│            │  └────────────────────────────┘     │
│            │                                     │
│            │  ┌─ Report Card ──────────────┐     │
│            │  │  ...                        │     │
│            │  └────────────────────────────┘     │
│            │                                     │
└────────────┴────────────────────────────────────┘
```

---

## 11. ACCESSIBILITY

### 11.1 Core Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color contrast | WCAG AA (4.5:1 text, 3:1 UI) | All token combos pre-verified |
| Keyboard navigation | Full tab/enter/escape support | shadcn/Radix provides this |
| Screen readers | ARIA labels, live regions | Add `aria-label` to icon-only buttons |
| Focus indicators | Visible focus ring | `ring-2 ring-[var(--neon-green)]/50` |
| Touch targets | ≥ 44×44px | `min-h-11 min-w-11` on interactive elements |
| Reduced motion | Respect `prefers-reduced-motion` | Global CSS rule above |
| Color blindness | Never rely on color alone | Always pair color with icon + text |
| Vietnamese diacritics | No clipping of tone marks | line-height ≥ 1.5, padding in inputs |

### 11.2 Focus Style

```css
/* Global focus style for SKAM */
:focus-visible {
  outline: 2px solid var(--neon-green);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 11.3 ARIA Patterns for SKAM

```tsx
// Search results — announce to screen readers
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading ? "Đang kiểm tra..." : `Tìm thấy ${count} kết quả`}
</div>

// Status badge — not just color
<span role="img" aria-label="Tài khoản nguy hiểm - 12 báo cáo lừa đảo">
  <ShieldAlert /> Nguy hiểm
</span>

// Copy button — feedback
<button
  aria-label="Sao chép số tài khoản"
  onClick={handleCopy}
>
  <Copy className="size-4" />
</button>
```

---

## 12. PERFORMANCE GUIDELINES

### 12.1 Mobile Performance Budget

| Metric | Target | Why |
|--------|--------|-----|
| LCP | < 2.5s | First meaningful paint on 4G |
| FID | < 100ms | Responsive to first interaction |
| CLS | < 0.1 | No layout shifts |
| Bundle (JS) | < 150KB gzipped | Low-end Android constraint |
| Fonts | < 100KB total | Subset to Vietnamese + Latin |

### 12.2 Image & Asset Rules

```
- All evidence images: lazy-loaded with next/image
- Bank logos: SVG (inline or sprite), never PNG
- Icons: tree-shaken from lucide-react (never import all)
- Background effects: CSS-only (no images for gradients/glow)
- Backdrop blur: use sparingly — GPU-intensive on low-end devices
  → Limit to max 2 blurred layers visible at once
  → Fallback: solid surface color if (prefers-reduced-motion: reduce)
```

### 12.3 Font Optimization

```typescript
// next/font handles subsetting and optimization automatically
// The "vietnamese" subset includes all diacritics
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",           // Show fallback font immediately
  variable: "--font-sans",
  // Preload only weights used above the fold
  preload: true,
});
```

---

## 13. FILE STRUCTURE REFERENCE

```
apps/web/src/
├── app/
│   ├── globals.css          ← All CSS variables, @theme inline, animations
│   ├── layout.tsx           ← Fonts, metadata, providers
│   ├── page.tsx             ← Lookup page (home)
│   ├── report/
│   │   └── page.tsx         ← Submit report page
│   ├── result/
│   │   └── [id]/page.tsx    ← Result page
│   └── admin/
│       ├── layout.tsx       ← Admin sidebar layout
│       └── page.tsx         ← Admin dashboard
├── components/
│   ├── ui/                  ← shadcn/ui components (auto-installed)
│   │   ├── button.tsx       ← Extended with neon/danger variants
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── glass-card.tsx   ← SKAM custom
│   │   ├── status-badge.tsx ← SKAM custom
│   │   └── ...
│   ├── search-input.tsx     ← Hero search component
│   ├── result-card.tsx      ← Lookup result display
│   ├── report-form.tsx      ← Report submission form
│   ├── ambient-glow.tsx     ← Background gradient orbs
│   └── nav-bar.tsx          ← Top navigation
├── lib/
│   └── utils.ts             ← cn() utility
└── hooks/
    └── use-debounce.ts      ← Search input debouncing
```

---

## 14. QUICK REFERENCE — TOKEN CHEAT SHEET

### Colors (Tailwind classes)

```
Background:    bg-background  bg-card  bg-surface-1  bg-surface-2
Text:          text-foreground  text-muted-foreground  text-neon
Border:        border-border  border-neon  border-[var(--border-neon)]
Status:        text-safe  bg-safe  text-danger  bg-danger  text-warning  bg-warning
Glow:          shadow-[var(--shadow-neon)]  shadow-[var(--shadow-neon-strong)]
Glass:         bg-[var(--glass-bg)] backdrop-blur-[12px] border-[var(--glass-border)]
```

### Typography (class combinations)

```
Hero heading:  text-5xl font-bold tracking-tight text-glow
Page title:    text-3xl font-bold tracking-tight
Section title: text-xl font-semibold
Body:          text-base text-foreground leading-relaxed
Secondary:     text-sm text-[var(--text-secondary)]
Caption:       text-xs text-[var(--text-tertiary)]
Account #:     font-mono text-lg tracking-wider
```

### Component shortcuts

```tsx
// Neon CTA button
<Button variant="neon" size="xl">Tra cứu</Button>

// Glass card with neon border
<GlassCard variant="neon" className="p-6">...</GlassCard>

// Status badge
<StatusBadge status="danger" />

// Loading state
<Loader2 className="size-5 animate-spin text-neon" />
```

---

## 15. VERSIONING & DEPENDENCIES

### Current Stack (as of March 2026)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.x | App Router, Cache Components, proxy.ts |
| React | 19.2 | View Transitions, useEffectEvent |
| Tailwind CSS | 4.x | @theme inline, OKLCH support, no config file |
| shadcn/ui | CLI v4 | new-york style, unified `radix-ui` package |
| radix-ui | unified | Single package replaces individual @radix-ui/react-* |
| lucide-react | 0.577+ | 1000+ icons, tree-shakable |
| tailwind-merge | 3.x | For cn() utility |
| clsx | 2.x | Class concatenation |

### Deprecated — Do NOT use

| Package | Why | Replacement |
|---------|-----|-------------|
| `tailwindcss-animate` | Deprecated in Tailwind v4 | Native CSS `@keyframes` |
| `@radix-ui/react-*` | Individual packages deprecated | `radix-ui` unified package |
| `tailwind.config.ts` | Replaced in Tailwind v4 | `@theme inline` in CSS |
| `React.forwardRef` | Removed in React 19 | Direct props with `data-slot` |
| `next/router` (Pages) | Legacy | `next/navigation` (App Router) |
| `middleware.ts` | Deprecated in Next.js 16 | `proxy.ts` |

---

*This document is the single source of truth for SKAM's frontend design system. Every component, page, and interaction should reference this guide. When in doubt, check the tokens.*
