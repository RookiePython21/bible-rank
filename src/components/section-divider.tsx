export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <hr className="flex-1 border-slate-200" />
      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700">
        {label}
      </span>
      <hr className="flex-1 border-slate-200" />
    </div>
  );
}
