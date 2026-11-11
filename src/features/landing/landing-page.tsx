import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  Car,
  Check,
  CircleDollarSign,
  LockKeyhole,
  Mail,
  MessageCircle,
  Percent,
  Printer,
  Smartphone,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";

import { BrandLogo, BrandMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND, whatsappLink } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { FREE_LIMITS, PRO_LIMITS, WORKSPACE_LIMITS } from "@/lib/limits";
import { money } from "@/lib/money";
import { ANNUAL_DISCOUNT, PLAN_MONTHLY } from "@/features/billing/pricing";
import { DashboardMock, TONES } from "./dashboard-mock";

const annualPct = Math.round(ANNUAL_DISCOUNT * 100);
const annualMonthly = (monthly: number) =>
  money(Math.round(monthly * (1 - ANNUAL_DISCOUNT) * 100) / 100);

/* ── Content ─────────────────────────────────────────────────────────────── */

const FACTS = [
  {
    tone: "green",
    icon: Car,
    label: "Free plan",
    value: money(0),
    caption: `Your first ${FREE_LIMITS.vehicles} vehicles, forever`,
  },
  {
    tone: "blue",
    icon: CircleDollarSign,
    label: "Pro",
    value: money(PLAN_MONTHLY.PRO),
    caption: `A month · up to ${PRO_LIMITS.vehicles} vehicles`,
  },
  {
    tone: "violet",
    icon: Building2,
    label: "Workspaces",
    value: `${WORKSPACE_LIMITS.BUSINESS}`,
    caption: "Separate businesses, one login",
  },
  {
    tone: "orange",
    icon: Percent,
    label: "Annual saving",
    value: `${annualPct}%`,
    caption: "Off when you pay for the year",
  },
] as const;

const SMALL_FEATURES = [
  {
    icon: Printer,
    tile: "bg-neutral-900 dark:bg-neutral-700",
    title: "Printable agreements",
    body: "A clean rental agreement for every contract, ready to sign at the counter.",
  },
  {
    icon: UserRound,
    tile: "bg-violet-500",
    title: "Client records",
    body: "Details and rental history together, so repeat customers are served in seconds.",
  },
  {
    icon: TriangleAlert,
    tile: "bg-rose-500",
    title: "Complaints and incidents",
    body: "Log damage and disputes against the rental they belong to.",
  },
  {
    icon: BellRing,
    tile: "bg-blue-500",
    title: "Push alerts",
    body: "Notifications keep you up to date with activity in your workspace.",
  },
  {
    icon: Smartphone,
    tile: "bg-emerald-500",
    title: "Installs like an app",
    body: "Built phone-first. Add it to your home screen — no app store needed.",
  },
  {
    icon: LockKeyhole,
    tile: "bg-orange-500",
    title: "Private by design",
    body: "Each business has its own workspace. Access is enforced in the database.",
  },
];

const STEPS = [
  {
    title: "Create your workspace",
    body: "Name your business, pick your location and fleet size, and invite your team. About two minutes.",
  },
  {
    title: "Add vehicles and clients",
    body: "Load your cars with rates and photos, then add clients as they walk in.",
  },
  {
    title: "Rent, track, get paid",
    body: "Start a rental, print the agreement, record payments and check the car back in.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: money(0),
    period: "forever",
    note: "No card needed",
    blurb: "Get your fleet online",
    cta: "Start free",
    href: "/auth",
    popular: false,
    features: [
      `Up to ${FREE_LIMITS.vehicles} vehicles`,
      `Up to ${FREE_LIMITS.staff} staff members`,
      `Up to ${FREE_LIMITS.clients} clients`,
      `Up to ${FREE_LIMITS.rentals} rentals`,
      `${WORKSPACE_LIMITS.FREE} workspace`,
      "Fleet and rental tracking",
    ],
  },
  {
    name: "Pro",
    price: money(PLAN_MONTHLY.PRO),
    period: "/month",
    note: `or ${annualMonthly(PLAN_MONTHLY.PRO)}/month billed annually`,
    blurb: "For growing rental businesses",
    cta: "Order Pro on WhatsApp",
    href: whatsappLink(`Hello ${BRAND.company}, I would like to order ${BRAND.name} Pro.`),
    popular: true,
    features: [
      `Up to ${PRO_LIMITS.vehicles} vehicles`,
      "Unlimited staff members",
      "Unlimited clients and rentals",
      `Up to ${WORKSPACE_LIMITS.PRO} workspaces`,
      "Contracts and check-in / check-out",
      "Complaints and incident log",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: money(PLAN_MONTHLY.BUSINESS),
    period: "/month",
    note: `or ${annualMonthly(PLAN_MONTHLY.BUSINESS)}/month billed annually`,
    blurb: "For multi-branch operators",
    cta: "Order Business on WhatsApp",
    href: whatsappLink(`Hello ${BRAND.company}, I would like to order ${BRAND.name} Business.`),
    popular: false,
    features: [
      "Everything in Pro",
      "Unlimited vehicles",
      `Up to ${WORKSPACE_LIMITS.BUSINESS} workspaces`,
      "Advanced reporting",
      "Data export",
      "Dedicated support and onboarding",
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
    a: `Yes. Each business gets its own separate workspace. Pro includes up to ${WORKSPACE_LIMITS.PRO} workspaces and Business up to ${WORKSPACE_LIMITS.BUSINESS}, and you switch between them from one login.`,
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Socdal is built phone-first and can be installed on your home screen like an app, with push notifications for activity in your workspace.",
  },
  {
    q: "How do I pay for a plan?",
    a: `Paid plans are priced in US dollars, monthly or annually, and paying annually saves ${annualPct}%. To order, message us on WhatsApp at ${BRAND.whatsappDisplay} or email ${BRAND.email}. We share payment details and activate your plan once payment is confirmed.`,
  },
  {
    q: "Who can see my data?",
    a: "Only the people you invite. Every record is tied to your workspace and access is enforced in the database itself, so one business can never see another's vehicles, clients or finances.",
  },
];

/* ── Building blocks ─────────────────────────────────────────────────────── */

const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent text-[15px] font-medium transition-all active:translate-y-px";
const btnPrimary = cn(btn, "bg-primary text-primary-foreground hover:bg-primary/80");
const btnOutline = cn(btn, "border-border bg-card hover:bg-muted");

function SectionHead({ title, body }: { title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-base text-muted-foreground">{body}</p>}
    </div>
  );
}

/** Status pill as used in tables: small square swatch + name. */
function StatusPill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-lg border border-border/70 px-2.5 text-[13px]">
      <span className="size-2.5 rounded-[3px]" style={{ background: color }} />
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col justify-between gap-6 rounded-xl bg-card p-5", className)}>
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{body}</p>
      </div>
      {children}
    </article>
  );
}

/* ── Feature illustrations (sample data) ─────────────────────────────────── */

function FleetIllustration() {
  const rows = [
    { i: "TP", car: "Toyota Prado", plate: "KDG 214A", status: "On rent", color: "#3b82f6" },
    { i: "MC", car: "Mazda CX-5", plate: "KDK 908C", status: "Available", color: "#10b981" },
    { i: "NX", car: "Nissan X-Trail", plate: "KDM 377F", status: "In service", color: "#f59e0b" },
    { i: "SF", car: "Subaru Forester", plate: "KDN 551B", status: "Available", color: "#10b981" },
  ];
  return (
    <div aria-hidden="true" className="divide-y">
      {rows.map((r) => (
        <div key={r.plate} className="flex items-center gap-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-vivid-cyan/10 text-[11px] font-semibold text-vivid-cyan">
            {r.i}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{r.car}</span>
            <span className="block text-xs text-muted-foreground">{r.plate}</span>
          </span>
          <StatusPill color={r.color}>{r.status}</StatusPill>
        </div>
      ))}
    </div>
  );
}

/** The phone record card: overline, name, dashed tear, details + amount. */
function RentalIllustration() {
  return (
    <div aria-hidden="true">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-vivid-cyan/10 text-xs font-semibold text-vivid-cyan">
          AW
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">Toyota Prado · KDG 214A</span>
          <span className="block text-[15px] font-semibold">Amina Wanjiru</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
          <span className="size-2 rounded-[2px] bg-blue-500" />
          Active
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-dashed border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">5 days · returns Friday</span>
        <span className="text-lg font-semibold tabular-nums">$420</span>
      </div>
    </div>
  );
}

/** Torn-ticket totals strip: Billed | Collected · Owed. */
function TotalsIllustration() {
  return (
    <div
      aria-hidden="true"
      className="ticket-notch flex rounded-xl bg-canvas [--tear:36%]"
    >
      <div className="w-[36%] p-4">
        <span className="block text-xs text-muted-foreground">Total billed</span>
        <span className="block text-lg font-semibold tabular-nums">$24,600</span>
      </div>
      <div className="flex flex-1 gap-6 border-l border-dashed border-border p-4">
        <span>
          <span className="block text-xs text-muted-foreground">Collected</span>
          <span className="block text-lg font-semibold tabular-nums text-ocean-green">$18,240</span>
        </span>
        <span>
          <span className="block text-xs text-muted-foreground">Owed</span>
          <span className="block text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
            $6,360
          </span>
        </span>
      </div>
    </div>
  );
}

function CalendarIllustration() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  // 1 = booked, 0 = free — one row per vehicle.
  const grid = [
    [1, 1, 1, 0, 0, 1, 1],
    [0, 0, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 1, 1],
  ];
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
        {grid.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1.5">
            {row.map((v, c) => (
              <span key={c} className={cn("h-6 rounded-md", v ? "bg-blue-500/70" : "bg-muted")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffIllustration() {
  const people = [
    { i: "YM", name: "Yusuf Mohamed", line: "Recorded $420 · cash", role: "Admin" },
    { i: "AW", name: "Aisha Wairimu", line: "Checked in KDK 908C", role: "Staff" },
    { i: "BO", name: "Brian Otieno", line: "Started a 5-day rental", role: "Staff" },
  ];
  return (
    <div aria-hidden="true" className="divide-y">
      {people.map((p) => (
        <div key={p.i} className="flex items-center gap-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-vivid-cyan/10 text-[11px] font-semibold text-vivid-cyan">
            {p.i}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{p.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{p.line}</span>
          </span>
          <span className="text-xs text-muted-foreground">{p.role}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const waGeneral = whatsappLink(
    `Hello ${BRAND.company}, I would like to know more about ${BRAND.name}.`,
  );

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[96rem] items-center justify-between gap-4 px-4 lg:px-10">
          <Link href="/" aria-label={`${BRAND.name} home`}>
            <BrandLogo byline />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ["Features", "#features"],
              ["How it works", "#how-it-works"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="flex h-9 items-center rounded-lg px-3 text-[15px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              href="/auth"
              className="hidden h-9 items-center rounded-lg px-3 text-[15px] font-medium transition-colors hover:bg-muted sm:flex"
            >
              Log in
            </Link>
            <Link href="/auth" className={cn(btnPrimary, "h-9 px-4")}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero: copy on the left, the product on the right running off the edge ── */}
        <section className="mx-auto grid max-w-[96rem] items-center gap-10 px-4 pt-10 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:pt-14">
          <div className="lg:col-span-6">
            <span className="inline-flex h-7 items-center gap-2 rounded-full bg-card px-3 text-[13px] font-medium">
              <BrandMark className="size-3.5" />
              Car-hire management by {BRAND.company}
            </span>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[2.6rem] xl:text-[3.25rem] 2xl:text-6xl">
              <span className="block lg:whitespace-nowrap">Every car accounted for.</span>
              <span className="block text-muted-foreground lg:whitespace-nowrap">Every payment, too.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              {BRAND.name} runs your car-hire business end to end: which vehicles are out, who has
              them, what they owe and when they are due back.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className={cn(btnPrimary, "h-11 px-6")}>
                Start free
                <ArrowRight className="size-4" />
              </Link>
              <a href={waGeneral} target="_blank" rel="noreferrer" className={cn(btnOutline, "h-11 px-6")}>
                <MessageCircle className="size-4" />
                Talk to us on WhatsApp
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t pt-5 text-sm">
              {[
                [`${FREE_LIMITS.vehicles} vehicles`, "free, forever"],
                ["No card", "needed to start"],
                ["2 minutes", "to set up"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-semibold">{k}</dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-6">
            <DashboardMock className="lg:-mr-40 xl:-mr-56 2xl:-mr-72" />
            <p className="mt-3 text-xs text-muted-foreground">Product preview with sample data.</p>
          </div>
        </section>

        {/* ── Facts as stat cards ───────────────────────────────────────── */}
        <section className="mx-auto max-w-[96rem] px-4 pt-16 lg:px-10 md:pt-24">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.label} className="flex h-28 flex-col justify-between rounded-xl bg-card p-3">
                <span
                  className={cn(
                    "inline-flex h-7 w-fit items-center gap-2 rounded-full px-2.5 text-[14px] font-medium",
                    TONES[f.tone].badge,
                  )}
                >
                  <f.icon className="size-3.5" />
                  {f.label}
                </span>
                <div>
                  <p className={cn("text-3xl font-semibold leading-none tabular-nums", TONES[f.tone].value)}>
                    {f.value}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{f.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-[96rem] scroll-mt-16 px-4 pt-20 lg:px-10 md:pt-28">
          <SectionHead
            title="Everything a rental desk does, minus the paperwork"
            body="From the moment a car joins your fleet to the day a client hands back the keys, it is all in one workspace."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <FeatureCard
              className="lg:col-span-2"
              title="Your fleet at a glance"
              body="Every vehicle with its live status, plus photos, details and a full trip history."
            >
              <FleetIllustration />
            </FeatureCard>
            <FeatureCard
              title="Rentals and contracts"
              body="A guided wizard creates the contract, records check-out and check-in, and handles extensions."
            >
              <RentalIllustration />
            </FeatureCard>
            <FeatureCard
              title="Availability calendar"
              body="See which cars are out and what is free next week before you promise a booking."
            >
              <CalendarIllustration />
            </FeatureCard>
            <FeatureCard
              title="Payments and expenses"
              body="Deposits, rental payments, extensions and running costs — billed, collected and owed."
            >
              <TotalsIllustration />
            </FeatureCard>
            <FeatureCard
              title="Staff and roles"
              body="Invite admins and staff, control what each role sees, and review who did what."
            >
              <StaffIllustration />
            </FeatureCard>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SMALL_FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4 rounded-xl bg-card p-4">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl text-white",
                    f.tile,
                  )}
                >
                  <f.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section id="how-it-works" className="mx-auto max-w-[96rem] scroll-mt-16 px-4 pt-20 lg:px-10 md:pt-28">
          <SectionHead title="From sign-up to your first rental in one sitting" />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl bg-card p-5">
                <span className="inline-flex h-7 items-center gap-2 rounded-full border border-border px-2.5 text-[13px] font-medium tabular-nums">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  Step {i + 1}
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" className="mx-auto max-w-[96rem] scroll-mt-16 px-4 pt-20 lg:px-10 md:pt-28">
          <SectionHead
            title="Start free. Upgrade when your fleet grows."
            body={`Simple pricing in US dollars. Pay annually and save ${annualPct}%.`}
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => {
              const external = p.href.startsWith("http");
              return (
                <div
                  key={p.name}
                  className={cn(
                    "flex flex-col rounded-xl p-5",
                    // The popular plan is shown as an inverse panel (opposite theme).
                    p.popular ? "inverse-panel bg-background text-foreground" : "bg-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
                    {p.popular && (
                      <span className="inline-flex h-6 items-center gap-1.5 text-xs italic text-muted-foreground">
                        <span className="size-2 rounded-[2px] bg-emerald-500" />
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{p.blurb}</p>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">
                      {p.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>

                  <ul className="mt-5 flex-1 space-y-2.5 border-t border-dashed border-border pt-5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-ocean-green" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={p.href}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className={cn(
                      "mt-6 h-11 w-full px-4",
                      p.popular ? btnPrimary : cn(btn, "border-border bg-background hover:bg-muted"),
                    )}
                  >
                    {external && <MessageCircle className="size-4" />}
                    {p.cta}
                  </a>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Every account starts on Free. To move to Pro or Business, order on WhatsApp at{" "}
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {BRAND.whatsappDisplay}
            </a>{" "}
            and we activate your plan once payment is confirmed.
          </p>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section id="faq" className="mx-auto max-w-[96rem] scroll-mt-16 px-4 pt-20 lg:px-10 md:pt-28">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHead
                title="Questions, answered"
                body="Something else on your mind? We answer on WhatsApp and email."
              />
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={waGeneral}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-fit items-center gap-2 rounded-lg bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <MessageCircle className="size-4 text-ocean-green" />
                  {BRAND.whatsappDisplay}
                </a>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex h-9 w-fit items-center gap-2 rounded-lg bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Mail className="size-4 text-blue-500" />
                  {BRAND.email}
                </a>
              </div>
            </div>

            <div className="divide-y rounded-xl bg-card lg:col-span-8">
              {FAQS.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="relative flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:bg-muted">
                      <span className="absolute h-px w-3 bg-current" />
                      <span className="absolute h-3 w-px bg-current transition-transform group-open:rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing call to action: a black card, like the app's nav ──── */}
        <section className="mx-auto max-w-[96rem] px-4 py-20 lg:px-10 md:py-28">
          <div className="flex flex-col gap-8 rounded-xl bg-black p-8 text-white md:flex-row md:items-end md:justify-between md:p-12">
            <div>
              <BrandMark className="size-8" />
              <h2 className="mt-6 max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
                Put your fleet on {BRAND.name} today.
              </h2>
              <p className="mt-3 max-w-md text-base text-white/60">
                Create your workspace, add your first cars and run your next rental without
                opening a notebook.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className={cn(btn, "h-11 bg-white px-6 text-black hover:bg-white/85")}
              >
                Create your free workspace
                <ArrowRight className="size-4" />
              </Link>
              <a
                href={waGeneral}
                target="_blank"
                rel="noreferrer"
                className={cn(btn, "h-11 bg-white/15 px-6 text-white hover:bg-white/25")}
              >
                <MessageCircle className="size-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mx-auto w-full max-w-[96rem] px-4 pb-10 lg:px-10">
        <div className="grid gap-8 border-t pt-8 md:grid-cols-12">
          <div className="space-y-3 md:col-span-5">
            <BrandLogo byline />
            <p className="max-w-xs text-sm text-muted-foreground">{BRAND.tagline}</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground md:col-span-3">
            <span className="text-xs font-medium text-foreground">Product</span>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link href="/auth" className="hover:text-foreground">Log in</Link>
          </nav>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:col-span-4">
            <span className="text-xs font-medium text-foreground">Contact</span>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-foreground">
              WhatsApp {BRAND.whatsappDisplay}
            </a>
            <a href={`mailto:${BRAND.email}`} className="hover:text-foreground">
              {BRAND.email}
            </a>
            <a href={BRAND.companyUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
              {BRAND.companyDomain}
            </a>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.company}. All rights reserved. {BRAND.name} is a
          product of {BRAND.company}.
        </p>
      </footer>
    </div>
  );
}
