import type { Metadata } from "next";
import Link from "next/link";
import { BOOK_SECTIONS } from "@/lib/bible-books";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse the BibleRank leaderboard by section of Scripture.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Categories</h1>
      <p className="mt-2 text-slate-500">
        Every section has its own ranking. Pick one to see who leads it.
      </p>

      <div className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {BOOK_SECTIONS.map((section) => (
          <Link
            key={section.slug}
            href={`/?category=${section.slug}`}
            className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
          >
            <span className="text-xl" aria-hidden>{section.icon}</span>
            <span className="font-semibold text-slate-900">{section.label}</span>
            <span className="ml-auto text-sm text-slate-400">
              {section.bookSlugs.length} {section.bookSlugs.length === 1 ? "book" : "books"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
