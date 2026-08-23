import Link from "next/link";
import { BOOK_SECTIONS } from "@/lib/bible-books";

type Props = {
  active?: string;
  categoryParam?: string;
  preserveParams?: Record<string, string>;
};

function hrefFor(value: string | null, categoryParam: string, preserveParams?: Record<string, string>) {
  const params = new URLSearchParams(preserveParams);
  if (value) params.set(categoryParam, value);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function CategoryPills({ active, categoryParam = "category", preserveParams }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link
        href={hrefFor(null, categoryParam, preserveParams)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
          !active
            ? "bg-indigo-600 text-white"
            : "border border-slate-300 text-slate-600 hover:border-indigo-400"
        }`}
      >
        All
      </Link>
      {BOOK_SECTIONS.map((section) => (
        <Link
          key={section.slug}
          href={hrefFor(section.slug, categoryParam, preserveParams)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition ${
            active === section.slug
              ? "bg-indigo-600 text-white"
              : "border border-slate-300 text-slate-600 hover:border-indigo-400"
          }`}
        >
          {section.icon} {section.label}
        </Link>
      ))}
    </div>
  );
}
