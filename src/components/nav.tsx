import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Bible<span className="text-indigo-600">Rank</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 sm:gap-6">
          <Link href="/" className="hover:text-slate-900">Leaderboard</Link>
          <Link href="/categories" className="hover:text-slate-900">Categories</Link>
          <Link href="/about" className="hover:text-slate-900">About</Link>
          <Link href="/rules" className="hover:text-slate-900">Rules</Link>
        </nav>
      </div>
    </header>
  );
}
