"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";

const EXAMPLES = ["verse about courage", "John 3:16", "God has a plan"];

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();

  function submit(query: string) {
    const q = query.trim();
    if (!q) return;
    track("verse_search", { search_query: q });
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="text"
          placeholder="Search by verse, phrase, or idea…"
          className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm shadow-sm focus:border-indigo-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setValue(ex);
              submit(ex);
            }}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
