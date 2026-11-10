import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  Calendar,
  Car,
  Check,
  FileText,
  LockKeyhole,
  Mail,
  MessageCircle,
  Printer,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { BrandLogo, BrandMark } from "@/components/brand/logo";
import { BRAND, whatsappLink } from "@/lib/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { FREE_LIMITS, PRO_LIMITS, WORKSPACE_LIMITS } from "@/lib/limits";
import { money } from "@/lib/money";
import { ANNUAL_DISCOUNT, PLAN_MONTHLY } from "@/features/billing/pricing";
import { DashboardMock } from "./dashboard-mock";

const FEATURES = [
  {
    icon: Car,
    title: "Fleet at a glance",
    body: "Every vehicle with its status — available, on rent or in service — plus photos, details and a full trip history.",
  },
  {
    icon: FileText,
    title: "Rentals & contracts",
    body: "A guided rental wizard creates the contract, records check-out and check-in, and handles extensions without the paperwork.",
  },
  {
    icon: Printer,
    title: "Printable agreements",
    body: "Generate a clean rental agreement for every contract, ready to print and sign at the counter.",
  },
  {
    icon: UserRound,
    title: "Client records",
    body: "Keep each client's details and rental history together, so repeat customers are served in seconds.",
  },
  {
    icon: Wallet,
    title: "Payments & expenses",
    body: "Track deposits, rental payments, extensions and running costs, with revenue charts that show where the money goes.",
  },
  {
    icon: Calendar,
    title: "Availability calendar",
    body: "See which cars are out, which return today and what is free next week before you promise a booking.",
  },
  {
    icon: Users,
    title: "Staff & roles",
    body: "Invite your team as admins or staff, control what each role can see, and review a log of who did what.",
  },
  {
    icon: TriangleAlert,
    title: "Complaints & incidents",
    body: "Log damage, disputes and incidents against the rental they belong to, and follow them through to resolution.",
  },
  {
    icon: BellRing,
    title: "Alerts that find you",
    body: "Push notifications keep you up to date with activity in your workspace, on your phone or desktop.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your workspace",
    body: "Name your business, pick your county and fleet size, and invite your team. It takes about two minutes.",
  },
  {
    n: "02",
    title: "Add vehicles and clients",
    body: "Load your cars with rates and photos, then add clients as they walk in — or all at once.",
  },
  {
    n: "03",
    title: "Rent, track, get paid",
    body: "Start a rental, print the agreement, record payments and check the car back in. Socdal keeps the books straight.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: money(0),
    period: "forever",
    blurb: "Get your fleet online",
    cta: "Start free",
    href: "/auth",
    features: [
      `Up to ${FREE_LIMITS.vehicles} vehicles`,
      `Up to ${FREE_LIMITS.staff} staff members`,
      `Up to ${FREE_LIMITS.clients} clients`,
      `Up to ${FREE_LIMITS.rentals} rentals`,
      `${WORKSPACE_LIMITS.FREE} workspace`,
      "Fleet & rental tracking",
      "Staff management",
    ],
  },
  {
    name: "Pro",
    price: money(PLAN_MONTHLY.PRO),
    period: "/month",
    blurb: "For growing rental businesses",
    cta: "Order Pro on WhatsApp",
    href: whatsappLink(`Hello ${BRAND.company}, I would like to order ${BRAND.name} Pro.`),
    popular: true,
    features: [
      `Up to ${PRO_LIMITS.vehicles} vehicles`,
      "Unlimited staff members",
      "Unlimited clients & rentals",
      `Up to ${WORKSPACE_LIMITS.PRO} workspaces`,
      "Contracts & check-in / check-out",
      "Complaints & incident log",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: money(PLAN_MONTHLY.BUSINESS),
    period: "/month",
    blurb: "For multi-branch operators",
    cta: "Order Business on WhatsApp",
    href: whatsappLink(`Hello ${BRAND.company}, I would like to order ${BRAND.name} Business.`),
    features: [
      "Everything in Pro",
      "Unlimited vehicles",
      `Up to ${WORKSPACE_LIMITS.BUSINESS} workspaces`,
      "Advanced reporting",
      "Data export",
      "Dedicated support",
      "Custom onboarding",
    ],
  },
];

const FAQS = [
  {
    q: "What is Socdal?",
    a: "Socdal is a car-hire management system by Nidaam Solutions. It replaces the notebooks, spreadsheets and WhatsApp threads a rental business runs on with one workspace for vehicles, rentals, clients, staff and money.",
  },
  {
    q: "Is the free plan really free?",
    a: `Yes. You can run up to ${FREE_LIMITS.vehicles} vehicles, ${FREE_LIMITS.clients} clients, ${FREE_LIMITS.rentals} rentals and ${FREE_LIMITS.staff} staff members at no cost. Upgrade only when you outgrow it.`,
  },
  {
    q: "Can I manage more than one business or branch?",
    a: `Yes. Each business gets its own fully separate workspace. Pro includes up to ${WORKSPACE_LIMITS.PRO} workspaces and Business up to ${WORKSPACE_LIMITS.BUSINESS}, and you switch between them from one login.`,
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Socdal is built mobile-first and can be installed on your phone's home screen like an app, with push notifications for the things that need your attention.",
  },
  {
    q: "How do I pay for a plan?",
    a: `Paid plans are priced in US dollars, monthly or annually, and paying annually saves ${Math.round(ANNUAL_DISCOUNT * 100)}%. To order, message us on WhatsApp at ${BRAND.whatsappDisplay} or email ${BRAND.email}. We share payment details and activate your plan once payment is confirmed.`,
  },
  {
    q: "Who can see my data?",
    a: "Only the people you invite. Every record is tied to your workspace and access is enforced in the database itself, so one business can never see another's vehicles, clients or finances.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {body && <p className="mt-4 text-base text-muted-foreground text-pretty">{body}</p>}
    </div>
  );
}

const primaryCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0";
const ghostCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-base font-medium transition-colors hover:bg-muted";

export function LandingPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" aria-label={`${BRAND.name} home`}>
            <BrandLogo byline />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth"
              className="hidden h-9 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative">
          {/* Glow + grid backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
          />

          <div className="mx-auto max-w-6xl px-5 pt-16 pb-10 text-center md:pt-24">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <BrandMark className="size-3.5" />
              Car-hire management software
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-7xl">
              Every car, contract and payment —{" "}
              <span className="text-primary">in one place.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
              {BRAND.name} runs your car-hire business end to end: know which vehicles are out,
              who has them, what they owe and when they are due back — from your phone or your
              desk.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth" className={cn(primaryCta, "w-full sm:w-auto")}>
                Start free
                <ArrowRight className="size-4" />
              </Link>
              <a href="#pricing" className={cn(ghostCta, "w-full sm:w-auto")}>
                See pricing
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free for up to {FREE_LIMITS.vehicles} vehicles · Set up in about two minutes
            </p>
          </div>

          <div className="mx-auto max-w-5xl px-5 pb-16 md:pb-24">
            <DashboardMock />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Product illustration with sample data.
            </p>
          </div>
        </section>

        {/* ── Fact strip ────────────────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-card/50">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-10 md:grid-cols-4">
            {[
              { k: `${FREE_LIMITS.vehicles} vehicles`, v: "free, forever" },
              { k: money(PLAN_MONTHLY.PRO), v: `per month for up to ${PRO_LIMITS.vehicles} vehicles` },
              { k: `Up to ${WORKSPACE_LIMITS.BUSINESS}`, v: "separate businesses, one login" },
              { k: `${Math.round(ANNUAL_DISCOUNT * 100)}% off`, v: "when you pay annually" },
            ].map((f) => (
              <div key={f.k} className="px-3 text-center">
                <p className="text-2xl font-semibold tracking-tight md:text-3xl">{f.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading
              eyebrow="Features"
              title="Everything a rental desk does, minus the paperwork"
              body="Socdal covers the whole job — from the moment a car joins your fleet to the day a client hands back the keys."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-card/50 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading
              eyebrow="How it works"
              title="From sign-up to your first rental in one sitting"
            />
            <ol className="mt-14 grid gap-4 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="relative rounded-2xl border border-border bg-background p-7">
                  <span className="text-5xl font-semibold tracking-tight text-primary/25">{s.n}</span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Mobile + security ─────────────────────────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:p-10">
              <BrandMark className="absolute -right-10 -bottom-10 size-56 text-primary-foreground/10" />
              <Smartphone className="size-8" />
              <h3 className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl">
                Your whole yard, in your pocket
              </h3>
              <p className="mt-3 max-w-md text-base opacity-80">
                Built mobile-first. Install {BRAND.name} on your home screen, hand over a car from
                the parking lot, and stay on top of what your team is doing.
              </p>
              <ul className="mt-6 space-y-2 text-sm font-medium">
                {["Installs like an app — no app store needed", "Push notifications for workspace activity", "Light and dark themes"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="size-4" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
              <ShieldCheck className="size-8 text-primary" />
              <h3 className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl">
                Your business stays your business
              </h3>
              <p className="mt-3 max-w-md text-base text-muted-foreground">
                Each business lives in its own isolated workspace. Nobody outside your team can
                see your vehicles, clients or finances.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Building2, t: "Isolated workspaces", d: "One per business or branch" },
                  { icon: Users, t: "Role-based access", d: "Admins and staff see different things" },
                  { icon: LockKeyhole, t: "Enforced in the database", d: "Row-level security on every record" },
                ].map((i) => (
                  <div key={i.t} className="rounded-xl border border-border bg-background p-4">
                    <i.icon className="size-4 text-primary" />
                    <p className="mt-3 text-sm font-medium">{i.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{i.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 border-y border-border/60 bg-card/50 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading
              eyebrow="Pricing"
              title="Start free. Upgrade when your fleet grows."
              body={`Simple pricing in US dollars. Pay annually and save ${Math.round(ANNUAL_DISCOUNT * 100)}%.`}
            />
            <div className="mt-14 grid items-start gap-4 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "relative flex flex-col rounded-3xl border bg-background p-7",
                    p.popular ? "border-primary shadow-xl shadow-primary/10" : "border-border",
                  )}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </p>
                  <a
                    href={p.href}
                    {...(p.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    className={cn(
                      "mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-opacity hover:opacity-90",
                      p.popular
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted",
                    )}
                  >
                    {p.href.startsWith("http") && <MessageCircle className="size-4" />}
                    {p.cta}
                  </a>
                  <ul className="mt-7 space-y-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Every account starts on Free. To move to Pro or Business, order on WhatsApp at{" "}
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="font-medium text-foreground underline">
                {BRAND.whatsappDisplay}
              </a>{" "}
              and we activate your plan once payment is confirmed.
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-5">
            <SectionHeading eyebrow="FAQ" title="Questions, answered" />
            <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
              {FAQS.map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 md:pb-28">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-[#0b0e11] px-6 py-16 text-center text-white md:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_80%_at_50%_100%,color-mix(in_srgb,var(--brand)_35%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <BrandMark className="mx-auto size-12" />
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-5xl">
                Put your fleet on {BRAND.name} today.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
                Create your workspace, add your first cars and run your next rental without
                opening a notebook.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/auth" className={cn(primaryCta, "w-full sm:w-auto")}>
                  Create your free workspace
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href={whatsappLink(`Hello ${BRAND.company}, I would like to know more about ${BRAND.name}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  <MessageCircle className="size-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <BrandLogo byline />
            <p className="max-w-xs text-sm text-muted-foreground">{BRAND.tagline}</p>
            <div className="flex flex-col gap-1.5 pt-1 text-sm">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="size-4 text-primary" />
                WhatsApp {BRAND.whatsappDisplay}
              </a>
              <a
                href={`mailto:${BRAND.email}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Mail className="size-4 text-primary" />
                {BRAND.email}
              </a>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link href="/auth" className="hover:text-foreground">Log in</Link>
          </nav>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {BRAND.company}. All rights reserved.
            </p>
            <a
              href={BRAND.companyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <BrandMark className="size-3" />
              A product of {BRAND.company} · {BRAND.companyDomain}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
