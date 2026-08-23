import Link from "next/link";
import { getSiteStats } from "@/lib/verses";
import { OnlineCounter } from "@/components/online-counter";

export async function StatsBar() {
  const stats = await getSiteStats();

  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
      <OnlineCounter />
      <span aria-hidden>·</span>
      <span>{stats.totalVisitors.toLocaleString()} visitors since launch</span>
      <span aria-hidden>·</span>
      <Link href="/about" className="font-semibold text-indigo-600 hover:text-indigo-700">
        see stats→
      </Link>
    </div>
  );
}
