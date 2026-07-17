import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPath } from "@/lib/storage";
import { PrintButton } from "@/features/rentals/components/print-button";
import type { NextOfKin } from "@/lib/validation/client";

export const metadata = { title: "Rental agreement · CarHire" };

const kes = (n: number | null | undefined) => `KES ${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "________________";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-neutral-300 py-1">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function SignatureBox({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-16 rounded border border-neutral-400" />
      <p className="text-xs font-medium">{label}</p>
      {sub && <p className="text-[10px] text-neutral-500">{sub}</p>}
    </div>
  );
}

/**
 * Print-friendly rental agreement — outside the workspace shell so the
 * browser's Print → Save as PDF produces a clean document.
 */
export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ orgId: string; contractId: string }>;
}) {
  const { orgId, contractId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // RLS returns rows only to org members — a missing contract means no access.
  const [{ data: contract }, { data: org }] = await Promise.all([
    supabase
      .from("contracts")
      .select(
        `id, status, is_self_drive, driver_name, driver_dl_number, driver_dl_expiry,
         rate_per_day, duration_days, routing, domicile, total_amount, amount_paid,
         deposit_amount, refuel_penalty, contract_start, contract_expiration,
         created_at, created_by,
         clients(id, full_name, national_id, dl_number, phone, secondary_phone, email,
                 address, next_of_kins, next_of_kin_name, next_of_kin_phone,
                 id_front_url, id_back_url, debt_owed),
         cars(reg_number, make, model, color, deposit)`
      )
      .eq("id", contractId)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("name, phone, county, curfew_start, curfew_end")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  if (!contract || !org) notFound();

  type ClientJoin = {
    id: string;
    full_name: string;
    national_id: string | null;
    dl_number: string | null;
    phone: string | null;
    secondary_phone: string | null;
    email: string | null;
    address: string | null;
    next_of_kins: NextOfKin[] | null;
    next_of_kin_name: string | null;
    next_of_kin_phone: string | null;
    id_front_url: string | null;
    id_back_url: string | null;
    debt_owed: number;
  };
  const client = contract.clients as unknown as ClientJoin | null;
  const car = contract.cars as unknown as {
    reg_number: string;
    make: string | null;
    model: string | null;
    color: string | null;
    deposit: number | null;
  } | null;

  const [{ data: extensions }, { data: creator }, idFront, idBack] = await Promise.all([
    supabase
      .from("contract_extensions")
      .select("extra_days, required_payment, amount_paid, created_at")
      .eq("org_id", orgId)
      .eq("contract_id", contractId)
      .order("created_at"),
    contract.created_by
      ? supabase
          .from("org_members")
          .select("full_name")
          .eq("org_id", orgId)
          .eq("user_id", contract.created_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    signPath(supabase, "client-docs", client?.id_front_url),
    signPath(supabase, "client-docs", client?.id_back_url),
  ]);

  const kins: NextOfKin[] = client?.next_of_kins?.length
    ? client.next_of_kins
    : client?.next_of_kin_name
      ? [{ name: client.next_of_kin_name, phone: client.next_of_kin_phone ?? "", relationship: "" }]
      : [];

  const balance = Math.max(
    0,
    Number(contract.total_amount ?? 0) +
      Number(contract.refuel_penalty ?? 0) -
      Number(contract.amount_paid ?? 0)
  );
  const curfew =
    org.curfew_start && org.curfew_end
      ? `${String(org.curfew_start).slice(0, 5)} – ${String(org.curfew_end).slice(0, 5)}`
      : null;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-neutral-900 print:p-0">
      {/* Screen-only toolbar */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-xs text-neutral-500">
          Use Print → “Save as PDF” to download this agreement.
        </p>
        <PrintButton />
      </div>

      {/* Header */}
      <header className="border-b-2 border-neutral-900 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-xs text-neutral-500">
              {[org.county, org.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold uppercase tracking-wide">Vehicle rental agreement</p>
            <p className="text-neutral-500">No. {contract.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-neutral-500">Issued {fmtDate(contract.created_at)}</p>
          </div>
        </div>
      </header>

      {/* Parties */}
      <section className="mt-5 grid grid-cols-2 gap-8">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
            The hirer
          </h2>
          <Field label="Full name" value={client?.full_name} />
          <Field label="ID number" value={client?.national_id} />
          <Field label="Driving licence" value={client?.dl_number} />
          <Field label="Phone" value={client?.phone} />
          <Field label="Alt. phone" value={client?.secondary_phone} />
          <Field label="Address" value={client?.address} />
          {kins.map((k, i) => (
            <Field
              key={i}
              label={`Next of kin${k.relationship ? ` (${k.relationship})` : ""}`}
              value={[k.name, k.phone].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
            The vehicle
          </h2>
          <Field label="Registration" value={car?.reg_number} />
          <Field label="Make / model" value={[car?.make, car?.model].filter(Boolean).join(" ")} />
          <Field label="Colour" value={car?.color} />
          <h2 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Driver
          </h2>
          {contract.is_self_drive ? (
            <Field label="Driver" value="Self-drive (the hirer)" />
          ) : (
            <>
              <Field label="Driver" value={contract.driver_name} />
              <Field label="DL number" value={contract.driver_dl_number} />
              <Field label="DL expiry" value={contract.driver_dl_expiry} />
            </>
          )}
        </div>
      </section>

      {/* Terms */}
      <section className="mt-6">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Rental terms
        </h2>
        <div className="grid grid-cols-2 gap-x-8">
          <Field label="Duration" value={`${contract.duration_days} days`} />
          <Field label="Rate per day" value={kes(contract.rate_per_day)} />
          <Field label="Total amount" value={kes(contract.total_amount)} />
          <Field label="Pickup deposit (paid)" value={kes(contract.deposit_amount)} />
          <Field label="Paid to date" value={kes(contract.amount_paid)} />
          <Field label="Balance due" value={kes(balance)} />
          <Field label="Trip starts" value={fmtDate(contract.contract_start)} />
          <Field label="Contract expires" value={fmtDate(contract.contract_expiration)} />
          <Field label="Authorized routes" value={contract.routing} />
          <Field label="Domicile / base" value={contract.domicile} />
        </div>
      </section>

      {/* Extensions */}
      <section className="mt-6">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Extensions
        </h2>
        {extensions && extensions.length > 0 ? (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-400 text-left text-neutral-500">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium">Extra days</th>
                <th className="py-1 font-medium">Required payment</th>
                <th className="py-1 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {extensions.map((e, i) => (
                <tr key={i} className="border-b border-dotted border-neutral-300">
                  <td className="py-1">{fmtDate(e.created_at)}</td>
                  <td className="py-1">{e.extra_days}</td>
                  <td className="py-1">{kes(e.required_payment)}</td>
                  <td className="py-1">{kes(e.amount_paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            <p className="text-xs text-neutral-500">
              None authorized yet. An extension requires payment of at least half the
              outstanding balance before it takes effect. Record below:
            </p>
            <table className="mt-2 w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-400 text-left text-neutral-500">
                  <th className="py-1 font-medium">Date</th>
                  <th className="py-1 font-medium">Extra days</th>
                  <th className="py-1 font-medium">Amount paid</th>
                  <th className="py-1 font-medium">Authorized by</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1].map((i) => (
                  <tr key={i} className="border-b border-dotted border-neutral-300">
                    <td className="h-7" />
                    <td />
                    <td />
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* Penalties */}
      <section className="mt-6">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Penalties & conditions
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed">
          <li>
            The vehicle must be returned with the same fuel level it left with. A refuel
            penalty of KES 1,500 per missing gauge step applies at check-in.
          </li>
          <li>
            Keeping the vehicle past the contract expiry without an authorized extension
            marks the rental OVERDUE; unpaid amounts at check-in are recorded as debt
            against the hirer and block future rentals until cleared.
          </li>
          <li>
            An extension is only authorized after payment of at least half of the
            outstanding balance (or an amount set by management).
          </li>
          <li>
            The hirer is liable for damage beyond normal wear as assessed at return; the
            deposit may be applied against repairs, with any shortfall payable by the hirer.
          </li>
          <li>The vehicle may only be driven on the authorized routes stated above.</li>
          {curfew && (
            <li>No checkouts are made during the curfew window ({curfew}).</li>
          )}
          <li>Only the named driver may operate the vehicle.</li>
        </ol>
      </section>

      {/* ID images */}
      {(idFront || idBack) && (
        <section className="mt-6">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Hirer identification
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {idFront && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={idFront} alt="ID front" className="aspect-[3/2] w-full rounded border border-neutral-300 object-cover" />
            )}
            {idBack && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={idBack} alt="ID back" className="aspect-[3/2] w-full rounded border border-neutral-300 object-cover" />
            )}
          </div>
        </section>
      )}

      {/* Signatures */}
      <section className="mt-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
          Execution
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <SignatureBox
            label={`Hirer: ${client?.full_name ?? ""}`}
            sub="Signature & date"
          />
          <SignatureBox label="Hirer fingerprint" sub="Left thumb" />
          <SignatureBox
            label={`Staff: ${(creator as { full_name?: string } | null)?.full_name ?? "____________"}`}
            sub={`For ${org.name} — signature & date`}
          />
        </div>
        <p className="mt-4 text-[10px] text-neutral-500">
          By signing, the hirer confirms the details above are correct and accepts the
          penalties and conditions of this agreement. Prepared by{" "}
          {(creator as { full_name?: string } | null)?.full_name ?? "staff"} ·{" "}
          {org.name} · {fmtDate(contract.created_at)}.
        </p>
      </section>
    </div>
  );
}
