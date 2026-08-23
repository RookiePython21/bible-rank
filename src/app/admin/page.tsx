import { revalidatePath } from "next/cache";
import {
  getAdminContributions,
  getWebhookFailures,
  getRecentSearchEvents,
  getReconciliationDrift,
  setContributionHidden,
  getVerseTotalsSummary,
} from "@/lib/admin";
import { formatUSD } from "@/lib/money";
import { reference } from "@/types/db";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

async function hideAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await setContributionHidden(id, true);
  revalidatePath("/admin");
}

async function unhideAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await setContributionHidden(id, false);
  revalidatePath("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const [contributions, failures, searches, drift, summary] = await Promise.all([
    getAdminContributions(q),
    getWebhookFailures(),
    getRecentSearchEvents(),
    getReconciliationDrift(),
    getVerseTotalsSummary(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Admin</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Funded verses" value={summary.fundedCount} />
        <Stat label="Total verses imported" value={summary.totalVerses} />
        <Stat label="Reconciliation drift" value={drift.length} warn={drift.length > 0} />
        <Stat label="Webhook failures" value={failures.length} warn={failures.length > 0} />
      </div>

      {drift.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Reconciliation drift</h2>
          <p className="text-sm text-slate-500">
            verses.total_contributed_cents vs. SUM(completed contributions). Should be empty.
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2">Verse</th>
                <th>Stored</th>
                <th>Computed</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              {drift.map((d) => (
                <tr key={d.verse_id} className="border-t border-slate-100">
                  <td className="py-2">{d.canonical_key}</td>
                  <td>{formatUSD(d.stored_total_cents)}</td>
                  <td>{formatUSD(d.computed_total_cents)}</td>
                  <td className="font-semibold text-red-600">{formatUSD(d.diff_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Contributions</h2>
        <form className="mt-2 flex gap-2" action="/admin" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by Stripe session / payment intent / event ID"
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </form>

        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2">Verse</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Stripe session</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 align-top">
                <td className="py-2">{c.verse ? reference(c.verse) : "—"}</td>
                <td>{formatUSD(c.amount_cents)}</td>
                <td>{c.status}</td>
                <td className="max-w-[160px] truncate font-mono text-xs">
                  {c.stripe_checkout_session_id}
                </td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
                <td>
                  {c.hidden_from_activity ? (
                    <form action={unhideAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs font-semibold text-indigo-600">Unhide</button>
                    </form>
                  ) : (
                    <form action={hideAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs font-semibold text-slate-500">Hide</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Failed webhook events</h2>
        {failures.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None recorded.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {failures.map((f) => (
              <li key={f.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="font-mono text-xs text-slate-500">{f.stripe_event_id}</p>
                <p className="font-medium text-red-700">{f.event_type}</p>
                <p className="text-red-600">{f.error_message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Recent search events</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {searches.map((s) => (
            <li key={s.id}>&ldquo;{s.query}&rdquo;</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className={`text-2xl font-extrabold ${warn ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
