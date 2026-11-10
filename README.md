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

## Brand

| Token | Value | Where |
|-------|-------|-------|
| Nidaam blue | `#00AEFF` | `--brand` / `--primary` in `src/app/globals.css` |
| Brand ink | `#0B0E11` | `--brand-ink`, dark background, PWA theme colour |
| Text ink | `#111111` | light-theme foreground |

- Product name, company and tagline live in `src/lib/brand.ts`.
- Logo components (`BrandMark`, `BrandLogo`, `BrandAttribution`) are in
  `src/components/brand/logo.tsx`.
- Source artwork is in `assets/` and `brand/`; the copies the app serves are in
  `public/brand/`, alongside the generated `public/icon-*.png` app icons.
- Tailwind's `blue-*` and `sky-*` scales are remapped to the Nidaam blue ramp, so
  existing utilities stay on-brand.
