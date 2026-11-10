/** Single source of truth for product branding and contact details. */
export const BRAND = {
  name: "Socdal",
  company: "Nidaam Solutions",
  companyUrl: "https://nidaam.co.ke",
  companyDomain: "Nidaam.co.ke",
  tagline: "Fleet, clients and contracts — one workspace per business.",
  /** Nidaam blue — keep in sync with --brand in globals.css. */
  color: "#00AEFF",
  /** Brand ink — the near-black used for dark surfaces and text on blue. */
  ink: "#0B0E11",
  /** Sales / orders WhatsApp line, digits only in international format (for wa.me). */
  whatsapp: "254722261776",
  whatsappDisplay: "+254 722 261 776",
  email: "info@nidaam.co.ke",
} as const;

/** A wa.me link that opens a chat with the sales line, optionally pre-filled. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${BRAND.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
