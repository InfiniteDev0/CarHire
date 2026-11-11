# Socdal

**Socdal by [Nidaam Solutions](https://nidaam.co.ke)** — a multi-tenant car-hire
management workspace: fleet, clients, rental contracts, payments and staff, with
one fully isolated workspace per business

Stack: Next.js 16 (App Router) · Supabase (auth, Postgres, storage, RLS) ·
Tailwind v4 + shadcn/ui · Paystack billing.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase / Paystack keys
npm run dev
```

Open <http://localhost:3000>. Full environment and database setup is in
[SETUP.md](SETUP.md); billing is covered in
[PAYSTACK_INTEGRATION.md](PAYSTACK_INTEGRATION.md).

## Design

The UI is calm and almost monochrome: greys, white cards and black. Colour
appears only where it means something (a status, a money direction, a
category). Primary buttons are near-black (white in dark mode).

| Token | Value | Where |
|-------|-------|-------|
| Background | warm off-white `oklch(96.158% 0.00563 84.446)` | `--background` in `src/app/globals.css` |
| Canvas | `#f4f4f5` (dark: `#0a0a0a`) | `bg-canvas`, the panel behind white cards |
| Primary | near-black `oklch(0.205 0 0)` | `--primary` |
| Nidaam blue | `#00AEFF` | `--brand` — the logo and avatar initials only |

- Fonts: Manrope for everything, Outfit for paragraph text.
- Cards have no border; the canvas-to-card contrast does the separating.
- Navigation is a black card. On desktop the user picks a two-row top
  navigation or a sidebar (Settings → Appearance); phones use the bottom bar.
- `.inverse-panel` shows the opposite theme inside a page.
- Product name, company, contacts and tagline live in `src/lib/brand.ts`; the
  logo components are in `src/components/brand/logo.tsx`.
- Source artwork is in `assets/` and `brand/`; the copies the app serves are in
  `public/brand/`, alongside the generated `public/icon-*.png` app icons.
