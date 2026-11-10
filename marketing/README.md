# Socdal promotional kit

Ready-to-post images for **Socdal by Nidaam Solutions**, plus the template they
are rendered from. Everything uses the brand palette: Nidaam blue `#00AEFF` on
brand ink `#0B0E11`, set in Outfit.

## Images (`marketing/promo/`)

| File | Size | Use it for |
|------|------|------------|
| `status-launch-1080x1920.png` | 1080×1920 | WhatsApp status, Instagram / Facebook story, TikTok — product intro |
| `status-features-1080x1920.png` | 1080×1920 | Status / story — what Socdal does |
| `status-pricing-1080x1920.png` | 1080×1920 | Status / story — plans and prices |
| `square-launch-1080x1080.png` | 1080×1080 | Instagram, Facebook, LinkedIn and X feed post — intro |
| `square-features-1080x1080.png` | 1080×1080 | Feed post — feature checklist |
| `square-free-1080x1080.png` | 1080×1080 | Feed post — free plan offer |
| `og-1200x630.png` | 1200×630 | Website link preview (also served as `public/og.png`), X / LinkedIn link cards |
| `cover-wide-1640x624.png` | 1640×624 | Facebook page cover, website banner, company profile header |
| `cover-linkedin-1128x191.png` | 1128×191 | LinkedIn company page cover |
| `profile-800x800.png` | 800×800 | Profile picture on any platform |

## Captions you can paste

**Launch**
> Still tracking rentals in a notebook? Meet Socdal — one workspace for your
> fleet, contracts, clients, staff and payments. Free for up to 5 vehicles.
> WhatsApp +254 722 261 776 · info@nidaam.co.ke

**Features**
> Which cars are out? Who has them? What do they owe? Socdal answers all three
> in seconds — from your phone. Try it free, or WhatsApp +254 722 261 776.

**Pricing**
> Start on Socdal for $0. Run up to 20 vehicles for $35 a month when your fleet
> grows — and save 20% when you pay annually. Order on WhatsApp: +254 722 261 776.

## Editing and re-rendering

1. Edit the copy or styling in `templates/promo.html`. Each `<section data-d="…">`
   is one design; preview it in a browser at `promo.html?d=<name>`.
2. Run `node marketing/render.mjs` from the project root. It screenshots every
   design with Edge or Chrome in headless mode and refreshes `public/og.png`.

The prices and limits shown must match `src/features/billing/pricing.ts` and
`src/lib/limits.ts` — update the template if those change. The dashboard figures
in the artwork are sample data for illustration.
