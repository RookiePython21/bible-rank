import { revalidatePath } from "next/cache";
import {
  getAdminContributions,
  getAdminInterpretations,
  getWebhookFailures,
  getRecentSearchEvents,
  getReconciliationDrift,
  setContributionHidden,
  setInterpretationHidden,
  getVerseTotalsSummary,
  getAdminDuels,
  getAdminDuelBackings,
  setDuelBackingHidden,
} from "@/lib/admin";
import { resolveDueDuels } from "@/lib/duel-resolution";
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

async function hideInterpretationAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await setInterpretationHidden(id, true);
  revalidatePath("/admin");
}

async function unhideInterpretationAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await setInterpretationHidden(id, false);
  revalidatePath("/admin");
}

async function hideDuelBackingAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await setDuelBackingHidden(id, true);
  revalidatePath("/admin");
}

async function unhideDuelBackingAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await setDuelBackingHidden(id, false);
  revalidatePath("/admin");
}

async function resolveDuelsNowAction() {
  "use server";
  await resolveDueDuels();
  revalidatePath("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const [contributions, interpretations, failures, searches, drift, summary, duels, duelBackings] =
    await Promise.all([
      getAdminContributions(q),
      getAdminInterpretations(),
      getWebhookFailures(),
      getRecentSearchEvents(),
      getReconciliationDrift(),
      getVerseTotalsSummary(),
      getAdminDuels(),
      getAdminDuelBackings(),
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
        <h2 className="text-lg font-bold text-slate-900">Interpretations</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2">Verse</th>
              <th>Interpretation</th>
              <th>Author</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {interpretations.map((it) => (
              <tr key={it.id} className="border-t border-slate-100 align-top">
                <td className="py-2">{it.verse ? reference(it.verse) : "—"}</td>
                <td className="max-w-[320px] truncate">{it.body}</td>
                <td>{it.author_name?.trim() || "Anonymous"}</td>
                <td>{new Date(it.created_at).toLocaleString()}</td>
                <td>
                  {it.hidden ? (
                    <form action={unhideInterpretationAction}>
                      <input type="hidden" name="id" value={it.id} />
                      <button className="text-xs font-semibold text-indigo-600">Unhide</button>
                    </form>
                  ) : (
                    <form action={hideInterpretationAction}>
                      <input type="hidden" name="id" value={it.id} />
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Weekly Verse Duel</h2>
          <form action={resolveDuelsNowAction}>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
              Resolve now
            </button>
          </form>
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2">Verse A</th>
              <th>Verse B</th>
              <th>Side A total</th>
              <th>Side B total</th>
              <th>More resonant side</th>
              <th>Status</th>
              <th>Window closes</th>
            </tr>
          </thead>
          <tbody>
            {duels.map((d) => {
              const sideATotal = duelBackings
                .filter((b) => b.duel_id === d.id && b.side === "a" && b.status === "completed")
                .reduce((sum, b) => sum + b.amount_cents, 0);
              const sideBTotal = duelBackings
                .filter((b) => b.duel_id === d.id && b.side === "b" && b.status === "completed")
                .reduce((sum, b) => sum + b.amount_cents, 0);
              return (
                <tr key={d.id} className="border-t border-slate-100 align-top">
                  <td className="py-2">{d.verse_a ? reference(d.verse_a) : "—"}</td>
                  <td>{d.verse_b ? reference(d.verse_b) : "—"}</td>
                  <td>{formatUSD(sideATotal)}</td>
                  <td>{formatUSD(sideBTotal)}</td>
                  <td>
                    {d.status !== "resolved"
                      ? "—"
                      : d.resolved_side === "a"
                        ? "Side A"
                        : d.resolved_side === "b"
                          ? "Side B"
                          : "Tie"}
                  </td>
                  <td>{d.status}</td>
                  <td>{new Date(d.window_end).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3 className="mt-6 text-sm font-bold text-slate-900">Backings</h3>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2">Side</th>
              <th>Amount</th>
              <th>Why this speaks to me</th>
              <th>Author</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {duelBackings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 align-top">
                <td className="py-2">Side {b.side.toUpperCase()}</td>
                <td>{formatUSD(b.amount_cents)}</td>
                <td className="max-w-[320px] truncate">{b.why_note || "—"}</td>
                <td>{b.author_name?.trim() || "Anonymous"}</td>
                <td>{new Date(b.created_at).toLocaleString()}</td>
                <td>
                  {b.hidden ? (
                    <form action={unhideDuelBackingAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-xs font-semibold text-indigo-600">Unhide</button>
                    </form>
                  ) : (
                    <form action={hideDuelBackingAction}>
                      <input type="hidden" name="id" value={b.id} />
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
