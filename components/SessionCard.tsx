import Link from "next/link";
import type { SessionRow } from "@/lib/queries";
import { LEVEL_LABEL } from "@/lib/labels";
import { dateParts, fmtTime } from "@/lib/time";

export function SpotsBadge({ row }: { row: SessionRow }) {
  if (row.s.status === "cancelled")
    return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-800">Cancelled</span>;
  const left = row.s.capacity - row.taken;
  if (left <= 0)
    return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-900">Full, waitlist open</span>;
  return (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-900">
      {left} {left === 1 ? "place" : "places"} left
    </span>
  );
}

export function SessionCard({ row }: { row: SessionRow }) {
  const { s, c } = row;
  const dp = dateParts(s.startsAt);
  return (
    <Link
      href={`/schedule/${s.id}`}
      className="group flex items-center gap-5 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition hover:border-gold hover:shadow-md"
    >
      <div className="w-20 shrink-0 text-center">
        <p className="text-xs uppercase tracking-widest text-gold">{dp.weekday}</p>
        <p className="font-serif text-3xl leading-none text-burgundy">
          {dp.day}
        </p>
        <p className="mt-1 text-xs text-muted">{dp.month}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-xl text-ink group-hover:text-burgundy">{c.title}</p>
        <p className="mt-0.5 text-sm text-muted">
          {fmtTime(s.startsAt)} to {fmtTime(s.endsAt)}
          {s.isPrivate ? " · Private" : ""} · {LEVEL_LABEL[c.level]}
          {c.audience === "kids" ? " · Kids" : ""}
        </p>
      </div>
      <SpotsBadge row={row} />
    </Link>
  );
}
