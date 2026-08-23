import Link from "next/link";
import { getRecentContributions } from "@/lib/verses";
import { formatUSD } from "@/lib/money";
import { formatRelativeTime } from "@/lib/time";
import { reference } from "@/types/db";

export async function LatestActivityInline({ limit = 5 }: { limit?: number }) {
  const contributions = await getRecentContributions(limit);
  if (contributions.length === 0) return null;

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Latest activity
      </p>
      <div className="flex gap-3 overflow-x-auto">
        {contributions.map((c) => {
          if (!c.verse) return null;
          const href = `/verse/${c.verse.book_slug}/${c.verse.chapter_number}/${c.verse.verse_number}`;
          return (
            <Link
              key={c.id}
              href={href}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-indigo-300"
            >
              <p className="font-semibold text-slate-900">{reference(c.verse)}</p>
              <p className="text-xs text-slate-500">
                {c.rank_after ? `at #${c.rank_after}` : "unranked"} · {formatUSD(c.amount_cents)}
              </p>
              <p className="text-xs text-slate-400">{formatRelativeTime(c.created_at)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
