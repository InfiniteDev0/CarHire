@AGENTS.md


CarHire — MVP Roadmap (Multi-Tenant)

Key decision locked in: one admin can own multiple, fully-isolated
organizations (businesses). Everything downstream is scoped by org_id.
Staff belong to exactly one org. supabase/schema.sql implements this with RLS.

Reality reconciliation (read this — it overrides stale details below):
 - Language is TypeScript (.ts/.tsx). components.json tsx:true. (Early notes
   said JS — that was migrated to TS; don't go back.)
 - UI is shadcn "base-nova" on @base-ui/react — components use the `render`
   prop, NOT radix `asChild`. lucide icons. Toasts via sonner. Zod for validation.
 - Next.js 16: middleware is renamed `proxy` → see src/proxy.ts. cookies() is
   async (await it). Consult node_modules/next/dist/docs before route work.
 - Workspace routing is /workspace/[orgId]/... (the roadmap says /dashboard —
   read those as the same shell, mounted under /workspace/[orgId]). Sidebar +
   breadcrumb share src/features/workspace/nav-items.ts.
 - Schema lives at supabase/schema.sql; migrations in supabase/migrations/.
   Setup steps are in SETUP.md. Service-role Admin API used in server actions
   (src/features/*/actions.ts) for privileged writes (staff, org invites).


Phase 0 — Setup ✅ DONE


 [x] Next.js app scaffolded (JS, Tailwind v4, App Router, React Compiler)
 [x] shadcn/ui initialized (base-nova style on @base-ui/react, lucide icons)
 [x] Folder skeleton + lib/supabase/{client,server,admin}.js
 [x] supabase/schema.sql authored (tables, enums, RLS, org-owner trigger)
 [x] src/proxy.js — session refresh + optimistic auth guard
 [x] / entry router (redirects to /auth, /onboarding, /workspace, or /select-org)
 [x] GitHub workflows: ci.yml (lint+build) + deploy.yml (Vercel)
 [ ] Supabase project created + .env.local filled in  ← YOU DO THIS (see SETUP.md)
 [ ] schema.sql run in Supabase SQL editor, RLS verified green


Before Phase 1: create the Supabase project and run supabase/schema.sql in the
SQL editor (or `supabase db push`). Confirm in the Table Editor that RLS is
"Enabled" (green) on every table. Full instructions: SETUP.md.


Phase 1 — Auth + Org Onboarding

Goal: a user can sign up, create an organization (becomes its admin), and
land on a dashboard scoped to that org. If they own multiple orgs, they can
switch between them.

Auth wiring DONE (client-side @supabase/ssr, Zod validation, sonner toasts):
 [x] /auth — animated switch between login / signup / forgot-password
 [x] signup = full name + email + password (strength meter, show/hide)
 [x] login = email + password + forgot link
 [x] forgot password → reset email → /auth/callback → /auth/reset-password
 [x] /auth/callback route (exchangeCodeForSession), Toaster in root layout
 [x] sign-out button + /onboarding stub (real create-org form still TODO)
 [x] Bruno collection at bruno/carhire-auth for manual GoTrue testing
Remaining Phase 1: real /onboarding (create org), /select-org, org context,
/workspace/[orgId] shell + membership guard.


 lib/supabase/client.ts and lib/supabase/server.ts (browser + server clients via @supabase/ssr)
 middleware.ts — refresh session cookie on every request
 /login, /signup pages (email+password to start; magic link optional later)
 /onboarding — "Create your organization" form → inserts into organizations (trigger auto-adds you as admin org_member)
 Org context: a React context or Zustand store holding currentOrgId, populated from org_members for the logged-in user
 /select-org screen if a user belongs to >1 org — simple switcher, stores choice (e.g. in a cookie) so currentOrgId persists across sessions
 /dashboard shell — sidebar nav, topbar showing current org name + switcher, protected route (redirect to /login if no session)
 Route protection: server-side check in each protected layout that is_org_member holds for the org in the URL/context — never trust client state alone


Checkpoint: two test accounts, each creating their own org, cannot see
each other's data anywhere — verify directly in Supabase Table Editor by
querying as each user (or just trust RLS + spot check).


Phase 2 — Staff Management (Admin only)  [2A DONE, 2B = ID photos next]

DONE (2A): staff table fields on org_members (migration 0002), requireAdmin
guard (lib/auth/membership.ts), /workspace/[orgId]/staff list, add-staff dialog
→ createStaff server action (service role: admin.createUser with a TEMP PASSWORD
shown once to the admin, then inserts org_members role='staff'), deactivate/
reactivate via setStaffActive. Admin/self rows can't be deactivated.

 [x] /workspace/[orgId]/staff — list members (admin-only), role + active badges
 [x] Add staff — service-role createUser (temp password) + org_members insert
 [x] Deactivate staff (is_active=false), never hard delete
 [x] Admin-only route guard (requireAdmin)
 [x] 2B: ID photos (front/back) — private staff-docs bucket (migration 0006),
     service-role upload in createStaff, signed-URL "View ID" in the staff table
 [x] 2B: change-password dialog in nav-user (supabase.auth.updateUser) — how
     staff replace their temp password



Phase 3 — Car Inventory (Admin manages, everyone reads)  [DONE]

Built as a CARD GRID (not a table) per design ref. Fields: reg, make, model,
capacity, status, county, color, rate_per_day, notes (migration 0003 added
color/rate_per_day/notes). No car images yet — cards use a placeholder.

 [x] /workspace/[orgId]/vehicles — card grid, search + status/county filters
 [x] Click a card → details dialog (image area, name/rate, tabs Overview/
     Specifications/History, admin Edit + Decommission inside)
 [x] Add/Edit vehicle dialog (admin) — createCar/updateCar server actions
 [x] Decommission (admin) — soft-delete via decommissioned_at + confirm alert
 [x] Read for all members; writes admin-only (assertAdmin + cars_write RLS)
 [x] Expanded (migration 0004): year, body_type, transmission, fuel_type,
     engine, mileage, domicile, image_url, owner_name, num_owners,
     insurance_expiry, inspection_status. Details + add/edit + filters are
     framer SidePanels (src/features/vehicles/components/side-panel.tsx).
     Filter sheet: status/body/transmission/fuel/price. Form uses shadcn
     Select/Input/Label. Filtering logic in features/vehicles/filtering.ts.
 [ ] Later: real car photos (Storage upload), auto status flip on
     checkout/checkin (Phase 5), wire "Rent out now" → contract (Phase 4)

Zustand: src/lib/store/workspace-store.ts holds org context (orgId, role,
isAdmin, user); hydrated by WorkspaceStoreHydrator in the workspace layout.



Phase 4 — Clients & Contracts  [DONE]

 [x] /workspace/[orgId]/clients — search (name/ID/phone), table, staff can manage
 [x] New/edit client — full KYC (incl. kra_pin + secondary_phone, migration 0006),
     ID photos to private client-docs bucket ({org}/{client}/front.jpg), 5-client
     free limit enforced in createClientRecord
 [x] Client details sheet — profile + photos (signed URLs), next of kin, debt,
     block/unblock (staff or admin), rental history tab
 [x] New rental: 5-step wizard in a SidePanel (client → car [AVAILABLE only] →
     driver [DL expiry blocked if past] → terms [rate floor/ceiling enforced] →
     review). Creates a DRAFT contract. Blocked clients refused server-side.
 [x] Curfew guard — enforced at CHECKOUT (isInCurfew handles overnight windows);
     wizard review shows a warning when inside the window
 [x] Contract details sheet — status, financial tiles, checkout/checkin logs
 Nav: "Rentals" added to WORKSPACE_NAV_ITEMS (/workspace/[orgId]/rentals).
 Vehicle details "Rent out now" → rentals?new=<carId> (wizard preselected).


Phase 5 — Checkout / Checkin Operational Flow  [DONE]

 [x] Checkout dialog — mileage, fuel enum (E ¼ ½ ¾ F), typed-name signature
     (must match client name); inserts checkout_logs, car → TRIP, contract →
     ACTIVE, start=now, expiration=now+duration
 [x] Checkin dialog — returned_by, received_by=current staff, mileage, fuel;
     refuel penalty auto-suggested (KES 1500/gauge step short, editable);
     inserts checkin_logs, car → AVAILABLE, contract → COMPLETED; unpaid
     balance rolls into clients.debt_owed
 [x] Overdue — computed on read (displayStatus): ACTIVE past expiration shows
     OVERDUE everywhere (rentals table, home, client history). No cron needed.
 [x] Extension — staff-entered extra days: new expiration + recomputed total
 [x] Record payment — manual amounts; on COMPLETED contracts also pays down
     client debt. Cancel = DRAFT only.


Phase 6 — Complaints / Incident Log  [DONE]

 [x] /workspace/[orgId]/complaints — open/resolved pills, type filter, search
 [x] New complaint SidePanel — link to a rental (auto-derives the car) or a car
 [x] Resolve / reopen (staff or admin). Nav item "Complaints" added.


Phase 7 — Polish, Responsive, Scale-readiness  [DONE for MVP]

 [x] Dashboard home: real fleet counts, real active rentals (DUE_SOON within
     24h, OVERDUE computed), CTAs wired (Rent a car → wizard, Manage → rentals)
 [x] /workspace/[orgId]/financials — collected, revenue this month, outstanding
     balances, client debt + per-contract ledger (server-rendered)
 [x] loading.tsx for the workspace segment; empty states on every list; toasts
     on all mutations; tables hide columns on small screens
 [x] Env separation holds: service-role only in server actions (staff creation,
     storage uploads); everything else user-scoped through RLS
 Settings page (admin): org name/phone/county + curfew window + rate
 floor/ceiling — powers the Phase 4/5 guards.



Phase 8 — Post-MVP fixes + features (July 2026)

 [x] ROOT-CAUSE FIX: 0005_cars_recreate dropped cars and with it every FK
     pointing at it — contracts.car_id / complaints.car_id had no FK, so every
     PostgREST embed of cars(...) errored and Rentals/Complaints/Home/Finance
     rendered empty. Migration 0007_restore_car_fks restores both (APPLIED to
     live DB via pooler aws-1-eu-west-2). Lesson: recreating a table must
     re-add inbound FKs.
 [x] Finance CRUD: expenses table (migration 0008, APPLIED live) — category
     enum, optional car link, staff insert/update + admin-only delete RLS.
     features/financials/{actions.ts,components/expenses-section.tsx}; tiles
     now include Expenses/Net this month; CSV export.
 [x] Home: MoneyStats row (revenue month, outstanding, debt, utilization %) +
     RecentActivity feed (checkout/checkin logs) beside OngoingRentals.
 [x] Calendar: internal month grid from contracts (START/RETURN/OVERDUE chips,
     day detail list) — features/calendar/components/rental-calendar.tsx.
     Google Calendar sync deliberately deferred.
 [x] Settings restructured into nested routes with a secondary sidebar
     (settings/layout.tsx + settings-nav): Workspace (admin-only) general /
     operations / billing (usage vs FREE_LIMITS), My settings profile
     (name/email/password + global sign-out) / appearance. Old combined
     settings-form.tsx deleted; orgSettingsSchema split into
     orgGeneralSchema + orgOperationsSchema. next-themes now drives dark/light
     (defaultTheme dark) — don't hardcode the class on <html>.


Phase 9 — Business rules hardening (July 2026)  [DONE]

 Migrations 0009 + 0010 (both APPLIED live): cars.deposit + cars.owner_phone,
 contracts.deposit_amount, contract_extensions table, trip_reports table
 (car_return_condition enum), clients.dl_number / next_of_kins jsonb / created_by.
 [x] Cars: admin-set pickup deposit, owner name+phone, Kenyan plate validation
     (KLL NNNL / GK / KG-KC-KT / Z trailers / diplomatic) + normalizePlate;
     duplicate plates rejected (unique index + normalized compare).
 [x] Wizard: deposit replaces "paid now" (prefilled from car, staff can't change
     an admin-set deposit), rate prefills from car, routes are From→To leg pairs
     (add up to 5) composed into routing text. One open (DRAFT/ACTIVE) rental
     per client enforced at create AND checkout. Checkout closes the sheet.
 [x] Extensions: gate — client must pay ≥ half the outstanding balance (admin can
     adjust the required amount); logged in contract_extensions; ACTIVE contracts
     with extensions display as EXTENDED (computed, like OVERDUE).
 [x] Trip reports on COMPLETED rentals: return condition, 1–5 client rating,
     performance, damages + damage plan; checkin log shows km distance covered.
 [x] Clients KYC: phones normalized to +254 7/1 ######## (primary ≠ secondary),
     ID accepts old 8-digit / 14-digit Maisha UPI / alien card, Smart DL number
     replaces KRA PIN in UI (kra_pin column kept), multiple next of kin (jsonb),
     returning-client duplicate check (ID or phone), created_by recorded and
     shown, active-rental balance shown on the client sheet.
 [x] Printable agreement at /print/[orgId]/contracts/[contractId] (own light
     layout, window.print → PDF): parties, vehicle, terms, extensions table,
     penalties clauses, ID photos, signature + fingerprint + staff boxes.
     Linked from the contract details sheet ("Contract PDF").
 [x] Home: shadcn charts (ui/chart.tsx) — revenue-vs-expenses bar (6 months) +
     fleet-utilization radial.
 NOTE: Settings UI (layout banner, nav styling, theme-picker with SVG previews)
 was hand-styled by the owner — do not restyle those files.


Notes on things intentionally deferred past MVP1


Biometric/fingerprint signature capture → placeholder signature for now
Client-facing self-service portal (extension requests, own contract view)
Automated SMS/email notifications on expiry/overdue
Payment gateway integration (M-Pesa etc.) — amount_paid is manually entered by staff for MVP1