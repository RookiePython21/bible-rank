"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  category?: string;
  categoryParam?: string;
  pageParam?: string;
  preserveParams?: Record<string, string>;
};

function pageHref(
  page: number,
  category: string | undefined,
  categoryParam: string,
  pageParam: string,
  preserveParams?: Record<string, string>
) {
  const params = new URLSearchParams(preserveParams);
  if (category) params.set(categoryParam, category);
  if (page > 1) params.set(pageParam, String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

/** Numbered page links with ellipsis compression, e.g. 1 2 3 4 … 24 */
function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  category,
  categoryParam = "category",
  pageParam = "page",
  preserveParams,
}: Props) {
  const router = useRouter();
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalCount, page * pageSize);

  return (
    <div className="mt-6 flex flex-col items-center gap-4 border-t border-slate-100 pt-6">
      <nav className="flex flex-wrap items-center justify-center gap-1">
        {pageNumbers(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-slate-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(p, category, categoryParam, pageParam, preserveParams)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-8 rounded-full px-3 py-1.5 text-center text-sm font-medium transition ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {p}
            </Link>
          )
        )}
      </nav>

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>
          {start} - {end} of {totalCount.toLocaleString()}
        </span>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
