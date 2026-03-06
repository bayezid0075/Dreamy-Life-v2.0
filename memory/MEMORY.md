# Dreamy Life V2 — Project Memory

## Stack
- Next.js 15 (App Router), React, TypeScript
- Tailwind CSS v4, shadcn/ui components
- TanStack Query, Zustand (`useAuthStore`)
- Backend: Django REST (referral_system)

## Key Files
- `Frontend/src/tokens.css` — Design system CSS variables (source of truth)
- `Frontend/src/app/globals.css` — Tailwind theme, imports tokens.css
- `Frontend/src/app/(dashboard)/layout.tsx` — Dashboard shell (desktop sidebar + mobile)
- `Frontend/src/components/layout/app-sidebar.tsx` — Desktop sidebar
- `Frontend/src/components/dashboard/mobile-header.tsx` — Mobile hero header
- `Frontend/src/components/dashboard/mobile-nav-grid.tsx` — Mobile nav grid
- `Frontend/src/components/dashboard/mobile-side-drawer.tsx` — Mobile drawer
- `Frontend/src/components/dashboard/mobile-bottom-nav.tsx` — Mobile bottom nav
- `Frontend/src/app/(dashboard)/dashboard/page.tsx` — Main dashboard page

## Design System (tokens.css)
Use `var(--color-*)` CSS variables for all colors — NOT Tailwind violet/fuchsia:
- `--color-primary` — cyan blue (#29abe2 dark / #1a8dc8 light)
- `--color-accent` — hot pink (#e8336e dark / #d41e55 light)
- `--color-success` — green (#2ebf6e)
- `--color-warning` — orange (#f7941d)
- `--color-error` — red (#e83a3a)
- `--color-info` — purple (#9b5fd4)
- `--color-bg`, `--color-surface-1` … `--color-surface-4` — layered surfaces
- `--color-border` — border color
- `--color-text-1`, `--color-text-2`, `--color-text-3` — text hierarchy
- `--shadow-xs` … `--shadow-xl` — shadow tokens
- `--radius-xs` (4px) … `--radius-xl` (24px), `--radius-full` (9999px)
- `--font-display` (Bebas Neue), `--font-body` (Sora), `--font-mono` (DM Mono)

## Coding Patterns
- Use `style={{ color: "var(--color-primary)" }}` for design-system colors
- Use `bg-[var(--color-surface-1)]` or inline style for surfaces
- Hover effects via `onMouseEnter/onMouseLeave` when Tailwind can't express CSS vars
- Font mono labels: `className="font-mono tracking-widest uppercase"` + text-3 color
- Cards: `rounded-2xl`, `border: 1px solid var(--color-border)`, `background: var(--color-surface-1)`, `boxShadow: var(--shadow-sm)`
- Icon containers: 36–44px, `rounded-xl`, faint color bg (`rgba(color, 0.12)`)

## Redesign Progress (User Dashboard)
- [x] layout.tsx — tokens-based colors, primary gradient logo, clean header
- [x] app-sidebar.tsx — primary→accent gradient profile card, mono labels
- [x] mobile-header.tsx — primary→accent gradient hero, mono "Welcome back"
- [x] mobile-nav-grid.tsx — surface-2 icon containers, primary icon color, clean card
- [x] dashboard/page.tsx — semantic stat colors, design system cards throughout

## design-system.html
Located at repo root. The reference HTML design system. Not the final token values — tokens.css is the actual source. The HTML uses `--primary: #5B6AF0` (indigo) but the project uses `#29abe2` (cyan).
