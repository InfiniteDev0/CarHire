import type { ReactNode } from "react";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
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
} from "lucide-react";

import { BrandLogo, BrandMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND, whatsappLink } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { FREE_LIMITS, PRO_LIMITS, WORKSPACE_LIMITS } from "@/lib/limits";
import { money } from "@/lib/money";
import { ANNUAL_DISCOUNT, PLAN_MONTHLY } from "@/features/billing/pricing";
import { DashboardMock } from "./dashboard-mock";

// Editorial serif used only for the accented phrase in headlines.
const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const annualPct = Math.round(ANNUAL_DISCOUNT * 100);
const annualMonthly = (monthly: number) =>
  money(Math.round(monthly * (1 - ANNUAL_DISCOUNT) * 100) / 100);

/* ── Content ─────────────────────────────────────────────────────────────── */

const SMALL_FEATURES = [
  {
    icon: Printer,
    title: "Printable agreements",
    body: "A clean rental agreement for every contract, ready to sign at the counter.",
  },
  {
    icon: UserRound,
    title: "Client records",
    body: "Details and rental history together, so repeat customers are served in seconds.",
  },
  {
    icon: TriangleAlert,
    title: "Complaints & incidents",
    body: "Log damage and disputes against the rental they belong to, through to resolution.",
  },
  {
    icon: BellRing,
    title: "Push alerts",
    body: "Notifications keep you up to date with activity in your workspace.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your workspace",
    body: "Name your business, pick your location and fleet size, and invite your team. About two minutes.",
  },
  {
    n: "02",
    title: "Add vehicles and clients",
    body: "Load your cars with rates and photos, then add clients as they walk in — or all at once.",
  },
  {
    n: "03",
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
      "Fleet & rental tracking",
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
      "Dedicated support & onboarding",
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
    a: "Yes. Socdal is built mobile-first and can be installed on your phone's home screen like an app, with push notifications for activity in your workspace.",
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

/* ── Small building blocks ───────────────────────────────────────────────── */

function Accent({ children }: { children: ReactNode }) {
  return (
    <em
      className={cn(
        serif.className,
        "text-[1.06em] font-normal italic tracking-[-0.01em] text-primary",
      )}
    >
      {children}
    </em>
  );
}

function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
      <span className="tabular-nums text-primary">{n}</span>
      <span className="h-px w-8 bg-border" />
      {children}
    </p>
  );
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mt-5 text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-balance md:text-[3.4rem]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

const primaryCta =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary pl-6 pr-5 text-[15px] font-medium text-primary-foreground shadow-[0_10px_34px_-10px_rgba(0,174,255,0.75),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-0.5 active:translate-y-0";

/** Small glass card that floats over the hero product shot. */
function FloatCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "absolute z-10 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#11161b]/90 p-3.5 pr-5 text-left shadow-2xl shadow-black/60 backdrop-blur-xl lg:flex",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Feature illustrations (sample data) ─────────────────────────────────── */

const GOOD = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";

function FleetIllustration() {
  const rows = [
    { car: "Toyota Prado", plate: "KDG 214A", status: "On rent", tone: "bg-primary/15 text-primary" },
    { car: "Mazda CX-5", plate: "KDK 908C", status: "Available", tone: GOOD },
    {
      car: "Nissan X-Trail",
      plate: "KDM 377F",
      status: "In service",
      tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    { car: "Subaru Forester", plate: "KDN 551B", status: "Available", tone: GOOD },
  ];
  return (
    <div aria-hidden="true" className="divide-y divide-border rounded-xl border border-border bg-background">
      {rows.map((r) => (
        <div key={r.plate} className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{r.car}</span>
            <span className="block text-xs text-muted-foreground">{r.plate}</span>
          </span>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", r.tone)}>
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function ContractIllustration() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-primary" />
          Rental agreement
        </span>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", GOOD)}>Active</span>
      </div>
      <dl className="mt-4 space-y-2.5 text-xs">
        {[
          ["Vehicle", "Toyota Prado · KDG 214A"],
          ["Duration", "5 days"],
          ["Rate per day", "$84"],
          ["Balance due", "$120"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PaymentsIllustration() {
  const bars = [42, 58, 50, 72, 64, 88, 100];
  return (
    <div aria-hidden="true" className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">Collected this month</p>
      <p className="mt-1 text-2xl font-medium tracking-tight tabular-nums">$18,240</p>
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={cn("flex-1 rounded-sm", i === bars.length - 1 ? "bg-primary" : "bg-primary/25")}
          />
        ))}
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
    <div aria-hidden="true" className="rounded-xl border border-border bg-background p-4">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
        {grid.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1.5">
            {row.map((v, c) => (
              <span key={c} className={cn("h-5 rounded", v ? "bg-primary/70" : "bg-muted")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffIllustration() {
  const people = [
    { i: "YM", name: "Yusuf M.", role: "Admin" },
    { i: "AW", name: "Aisha W.", role: "Staff" },
    { i: "BO", name: "Brian O.", role: "Staff" },
  ];
  return (
    <div aria-hidden="true" className="divide-y divide-border rounded-xl border border-border bg-background">
      {people.map((p) => (
        <div key={p.i} className="flex items-center gap-3 px-4 py-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
            {p.i}
          </span>
          <span className="flex-1 text-sm font-medium">{p.name}</span>
          <span className="text-xs text-muted-foreground">{p.role}</span>
        </div>
      ))}
    </div>
  );
}

function Bento({
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
    <article
      className={cn(
        "flex flex-col justify-between gap-8 rounded-3xl border border-border bg-card p-7 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div>
        <h3 className="text-xl font-medium tracking-[-0.02em]">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {children}
    </article>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  const waGeneral = whatsappLink(
    `Hello ${BRAND.company}, I would like to know more about ${BRAND.name}.`,
  );

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-white text-foreground dark:bg-background">
      {/* ── Nav (always dark, sits on the dark hero) ────────────────────── */}
      <header className="dark sticky top-0 z-40 border-b border-white/[0.08] bg-[#07090c] text-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/" aria-label={`${BRAND.name} home`}>
            <BrandLogo byline />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="text-white/60 hover:bg-white/10 hover:text-white" />
            <Link
              href="/auth"
              className="hidden h-9 items-center rounded-full px-4 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-[#07090c] transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero (always dark) ────────────────────────────────────────── */}
        <section className="dark relative isolate overflow-hidden bg-[#07090c] text-foreground">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(55%_45%_at_78%_8%,rgba(0,174,255,0.22),transparent_70%),radial-gradient(40%_35%_at_8%_60%,rgba(0,174,255,0.10),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.055] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
          />

          <div className="mx-auto max-w-7xl px-5 pt-16 lg:px-8 lg:pt-24">
            <p className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-white/55">
              <BrandMark className="size-3.5" />
              Car-hire management
              <span className="hidden h-px w-8 bg-white/20 sm:block" />
              <span className="hidden sm:inline">by {BRAND.company}</span>
            </p>

            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
              <h1 className="text-[2.75rem] font-medium leading-[1] tracking-[-0.045em] text-white sm:text-6xl lg:col-span-8 lg:text-[4.6rem] xl:text-[5rem]">
                <span className="block text-balance">Every car accounted for.</span>
                <span className="block">
                  <Accent>Every payment, too.</Accent>
                </span>
              </h1>

              <div className="lg:col-span-4 lg:pb-3">
                <p className="text-lg leading-relaxed text-white/65">
                  {BRAND.name} runs your car-hire business end to end — which vehicles are out,
                  who has them, what they owe and when they are due back.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Link href="/auth" className={primaryCta}>
                    Start free
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href={waGeneral}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[15px] font-medium text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    <MessageCircle className="size-4 text-primary" />
                    Talk to us on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-3 lg:mt-16">
              {[
                [`Free for up to ${FREE_LIMITS.vehicles} vehicles`, "No card needed to start"],
                ["Set up in about two minutes", "Bring your team along from day one"],
                ["Works on phone and desktop", "Installs like an app"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-medium text-white">{k}</dt>
                  <dd className="mt-0.5 text-white/50">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product shot */}
          <div className="relative mx-auto mt-14 max-w-6xl px-5 lg:mt-20 lg:px-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-10 top-10 -z-10 h-72 rounded-full bg-primary/25 blur-[110px]"
            />
            <FloatCard className="-top-7 right-2 xl:-right-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Check className="size-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium text-white">Payment recorded · $420</span>
                <span className="block text-xs text-white/50">Amina W. · Toyota Prado</span>
              </span>
            </FloatCard>
            <FloatCard className="bottom-24 left-2 xl:-left-8">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Printer className="size-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium text-white">Agreement ready to print</span>
                <span className="block text-xs text-white/50">Mazda CX-5 · KDK 908C · 5 days</span>
              </span>
            </FloatCard>

            <div className="[mask-image:linear-gradient(to_bottom,black_62%,transparent)]">
              <DashboardMock className="rounded-b-none border-white/[0.12] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_-20px_rgba(0,174,255,0.35)]" />
            </div>
            <p className="pb-5 text-center text-[11px] text-white/35">
              Product illustration with sample data.
            </p>
          </div>
        </section>

        {/* ── Facts ─────────────────────────────────────────────────────── */}
        <section className="border-b border-border">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 px-5 lg:grid-cols-4 lg:gap-x-0 lg:px-8">
            {[
              { k: money(0), v: `to run your first ${FREE_LIMITS.vehicles} vehicles` },
              { k: money(PLAN_MONTHLY.PRO), v: `a month for up to ${PRO_LIMITS.vehicles} vehicles` },
              { k: `${WORKSPACE_LIMITS.BUSINESS}`, v: "separate businesses under one login" },
              { k: `${annualPct}%`, v: "off when you pay annually" },
            ].map((f, i) => (
              <div
                key={f.v}
                className={cn("py-10 lg:py-14", i > 0 && "lg:border-l lg:border-border lg:pl-8")}
              >
                <dt className="text-5xl font-light tracking-[-0.04em] tabular-nums md:text-6xl">
                  {f.k}
                </dt>
                <dd className="mt-3 max-w-[14rem] text-sm text-muted-foreground">{f.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <Eyebrow n="01">Features</Eyebrow>
                <SectionTitle>
                  Everything a rental desk does, <Accent>minus the paperwork.</Accent>
                </SectionTitle>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground lg:col-span-4 lg:pb-2">
                From the moment a car joins your fleet to the day a client hands back the keys,
                it is all in one workspace.
              </p>
            </div>

            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              <Bento
                className="lg:col-span-2"
                title="Your fleet at a glance"
                body="Every vehicle with its live status — available, on rent or in service — plus photos, details and a full trip history."
              >
                <FleetIllustration />
              </Bento>
              <Bento
                title="Rentals & contracts"
                body="A guided wizard creates the contract, records check-out and check-in, and handles extensions."
              >
                <ContractIllustration />
              </Bento>
              <Bento
                title="Payments & expenses"
                body="Deposits, rental payments, extensions and running costs, with charts that show where the money goes."
              >
                <PaymentsIllustration />
              </Bento>
              <Bento
                title="Availability calendar"
                body="See which cars are out and what is free next week before you promise a booking."
              >
                <CalendarIllustration />
              </Bento>
              <Bento
                title="Staff & roles"
                body="Invite admins and staff, control what each role sees, and review who did what."
              >
                <StaffIllustration />
              </Bento>
            </div>

            <div className="mt-4 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {SMALL_FEATURES.map((f) => (
                <div key={f.title} className="bg-card p-7">
                  <f.icon className="size-5 text-primary" />
                  <h3 className="mt-5 text-base font-medium tracking-[-0.01em]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-y border-border bg-[#f5f8fa] py-24 dark:bg-card/40 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Eyebrow n="02">How it works</Eyebrow>
            <SectionTitle className="max-w-3xl">
              From sign-up to your first rental <Accent>in one sitting.</Accent>
            </SectionTitle>

            <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-0">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className={cn("relative md:pr-10", i > 0 && "md:border-l md:border-border md:pl-10")}
                >
                  <span className={cn(serif.className, "text-6xl italic leading-none text-primary")}>
                    {s.n}
                  </span>
                  <h3 className="mt-6 text-xl font-medium tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Mobile + security ─────────────────────────────────────────── */}
        <section className="py-24 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 lg:grid-cols-2 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary p-9 text-primary-foreground md:p-12">
              <BrandMark className="absolute -bottom-14 -right-12 size-72 text-primary-foreground/[0.08]" />
              <Smartphone className="size-7" />
              <h3 className="mt-10 text-3xl font-medium leading-[1.05] tracking-[-0.035em] md:text-[2.6rem]">
                Your whole yard, <em className={cn(serif.className, "italic")}>in your pocket.</em>
              </h3>
              <p className="mt-4 max-w-md text-base leading-relaxed opacity-75">
                Built mobile-first. Install {BRAND.name} on your home screen, hand over a car from
                the parking lot, and stay on top of what your team is doing.
              </p>
              <ul className="mt-8 space-y-2.5 text-sm font-medium">
                {[
                  "Installs like an app — no app store needed",
                  "Push notifications for workspace activity",
                  "Light and dark themes",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Check className="size-4" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="dark relative overflow-hidden rounded-3xl bg-[#07090c] p-9 text-foreground md:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_100%_0%,rgba(0,174,255,0.18),transparent_70%)]"
              />
              <div className="relative">
                <ShieldCheck className="size-7 text-primary" />
                <h3 className="mt-10 text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-white md:text-[2.6rem]">
                  Your business <Accent>stays your business.</Accent>
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
                  Each business lives in its own isolated workspace. Nobody outside your team can
                  see your vehicles, clients or finances.
                </p>
                <div className="mt-8 divide-y divide-white/10 border-t border-white/10">
                  {[
                    { icon: Building2, t: "Isolated workspaces", d: "One per business or branch" },
                    { icon: Users, t: "Role-based access", d: "Admins and staff see different things" },
                    { icon: LockKeyhole, t: "Enforced in the database", d: "Row-level security on every record" },
                  ].map((i) => (
                    <div key={i.t} className="flex items-center gap-4 py-3.5">
                      <i.icon className="size-4 shrink-0 text-primary" />
                      <span className="flex-1 text-sm font-medium text-white">{i.t}</span>
                      <span className="hidden text-xs text-white/45 sm:block">{i.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="scroll-mt-20 border-y border-border bg-[#f5f8fa] py-24 dark:bg-card/40 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <Eyebrow n="03">Pricing</Eyebrow>
                <SectionTitle>
                  Start free. <Accent>Upgrade when your fleet grows.</Accent>
                </SectionTitle>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground lg:col-span-4 lg:pb-2">
                Simple pricing in US dollars. Pay annually and save {annualPct}%.
              </p>
            </div>

            <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:items-stretch">
              {PLANS.map((p) => {
                const external = p.href.startsWith("http");
                return (
                  <div
                    key={p.name}
                    className={cn(
                      "relative flex flex-col rounded-3xl border p-8",
                      p.popular
                        ? "dark border-primary/40 bg-[#07090c] text-foreground shadow-[0_30px_80px_-30px_rgba(0,174,255,0.55)]"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">{p.name}</h3>
                      {p.popular && (
                        <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
                          Most popular
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>

                    <p className="mt-8 flex items-baseline gap-2">
                      <span className="text-6xl font-light tracking-[-0.05em] tabular-nums">
                        {p.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{p.period}</span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>

                    <a
                      href={p.href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className={cn(
                        "mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium transition-all",
                        p.popular
                          ? "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:opacity-90"
                          : "border border-border bg-background hover:border-foreground/30",
                      )}
                    >
                      {external && <MessageCircle className="size-4" />}
                      {p.cta}
                    </a>

                    <ul className="mt-8 space-y-3 border-t border-border pt-8 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
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
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 py-24 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-5">
              <Eyebrow n="04">FAQ</Eyebrow>
              <SectionTitle>
                Questions, <Accent>answered.</Accent>
              </SectionTitle>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
                Something else on your mind? We answer on WhatsApp and email.
              </p>
              <div className="mt-6 flex flex-col gap-3 text-sm font-medium">
                <a
                  href={waGeneral}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-primary"
                >
                  <MessageCircle className="size-4 text-primary" />
                  {BRAND.whatsappDisplay}
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </a>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="inline-flex items-center gap-2.5 hover:text-primary"
                >
                  <Mail className="size-4 text-primary" />
                  {BRAND.email}
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>

            <div className="divide-y divide-border border-y border-border lg:col-span-7">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                      <span className="absolute h-px w-3 bg-current" />
                      <span className="absolute h-3 w-px bg-current transition-transform group-open:rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Closing CTA + footer (always dark) ──────────────────────────── */}
      <footer className="dark relative isolate overflow-hidden bg-[#07090c] text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(50%_55%_at_50%_0%,rgba(0,174,255,0.20),transparent_70%)]"
        />
        <BrandMark className="pointer-events-none absolute -right-24 -top-10 -z-10 size-[30rem] text-white/[0.025]" />

        <div className="mx-auto max-w-7xl px-5 py-24 md:py-32 lg:px-8">
          <h2 className="max-w-4xl text-5xl font-medium leading-[1] tracking-[-0.045em] text-white md:text-7xl">
            Put your fleet on {BRAND.name} <Accent>today.</Accent>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            Create your workspace, add your first cars and run your next rental without opening a
            notebook.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-4">
            <Link href="/auth" className={primaryCta}>
              Create your free workspace
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={waGeneral}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              <MessageCircle className="size-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-12 lg:px-8">
            <div className="space-y-4 md:col-span-5">
              <BrandLogo byline />
              <p className="max-w-xs text-sm leading-relaxed text-white/50">{BRAND.tagline}</p>
            </div>
            <nav className="flex flex-col gap-2.5 text-sm text-white/60 md:col-span-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                Product
              </p>
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#how-it-works" className="hover:text-white">How it works</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
              <a href="#faq" className="hover:text-white">FAQ</a>
              <Link href="/auth" className="hover:text-white">Log in</Link>
            </nav>
            <div className="flex flex-col gap-2.5 text-sm text-white/60 md:col-span-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                Contact
              </p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 hover:text-white"
              >
                <MessageCircle className="size-4 text-primary" />
                WhatsApp {BRAND.whatsappDisplay}
              </a>
              <a
                href={`mailto:${BRAND.email}`}
                className="inline-flex items-center gap-2.5 hover:text-white"
              >
                <Mail className="size-4 text-primary" />
                {BRAND.email}
              </a>
              <a
                href={BRAND.companyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 hover:text-white"
              >
                <BrandMark className="size-4" />
                {BRAND.companyDomain}
              </a>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-white/40 lg:px-8">
              © {new Date().getFullYear()} {BRAND.company}. All rights reserved. {BRAND.name} is a
              product of {BRAND.company}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
