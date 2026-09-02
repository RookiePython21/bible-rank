import Link from "next/link";
import { TOPICS } from "@/lib/topics";

type Props = {
  active?: string;
  topicParam?: string;
  preserveParams?: Record<string, string>;
};

function hrefFor(value: string | null, topicParam: string, preserveParams?: Record<string, string>) {
  const params = new URLSearchParams(preserveParams);
  if (value) params.set(topicParam, value);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function TopicPills({ active, topicParam = "topic", preserveParams }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link
        href={hrefFor(null, topicParam, preserveParams)}
        scroll={false}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
          !active
            ? "bg-indigo-600 text-white"
            : "border border-slate-300 text-slate-600 hover:border-indigo-400"
        }`}
      >
        All
      </Link>
      {Object.entries(TOPICS).map(([slug, topic]) => (
        <Link
          key={slug}
          href={hrefFor(slug, topicParam, preserveParams)}
          scroll={false}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition ${
            active === slug
              ? "bg-indigo-600 text-white"
              : "border border-slate-300 text-slate-600 hover:border-indigo-400"
          }`}
        >
          {topic.emoji} {topic.label}
        </Link>
      ))}
    </div>
  );
}
