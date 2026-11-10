import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/features/landing/landing-page";
import { BRAND } from "@/lib/brand";

const title = `${BRAND.name} — Car-hire management software by ${BRAND.company}`;
const description =
  "Run your car-hire business from one workspace: fleet, rental contracts, clients, staff, payments and an availability calendar. Free for up to 5 vehicles.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: BRAND.name,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

/**
 * Entry route. Visitors see the marketing landing page; signed-in users are
 * routed straight into the app:
 *   - not signed in        → landing page
 *   - signed in, 0 orgs    → /onboarding
 *   - signed in, 1 org     → /workspace/[orgId]
 *   - signed in, >1 orgs   → /select-org
 */
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <LandingPage />;

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!memberships || memberships.length === 0) redirect("/onboarding");
  if (memberships.length === 1) redirect(`/workspace/${memberships[0].org_id}`);
  redirect("/select-org");
}
