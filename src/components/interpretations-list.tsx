import type { InterpretationRow } from "@/types/db";

export function InterpretationsList({ interpretations }: { interpretations: InterpretationRow[] }) {
  return (
    <div id="interpretations" className="mt-10">
      <h2 className="text-sm font-semibold text-slate-900">Interpretations</h2>
      <p className="mt-1 text-sm text-slate-500">What this verse means to people who&apos;ve read it.</p>

      {interpretations.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Be the first to share what this verse means to you.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {interpretations.map((it) => (
            <li key={it.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm leading-relaxed text-slate-700">{it.body}</p>
              <p className="mt-2 text-xs text-slate-400">
                — {it.author_name?.trim() || "Anonymous"} · {new Date(it.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
