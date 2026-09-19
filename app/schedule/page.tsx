import type { Metadata } from "next";
import Link from "next/link";
import { SessionCard } from "@/components/SessionCard";
import { getSessions, type SessionRow } from "@/lib/queries";
import { LEVELS, LEVEL_LABEL } from "@/lib/labels";
import type { Level } from "@/lib/db/schema";
import {
  dayKey,
  fmtDate,
  fmtTime,
  isYearMonth,
  monthGrid,
  monthLabel,
  shiftMonth,
  todayKey,
  zonedDate,
} from "@/lib/time";
import { card, container, eyebrow } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Schedule",
  description: "Class calendar. Book a class or drop in for free.",
};

type Search = { m?: string; a?: string; l?: string };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const ym = isYearMonth(sp.m) ? sp.m : todayKey().slice(0, 7);
  const audience = sp.a === "kids" || sp.a === "adult" ? sp.a : undefined;
  const level = (LEVELS as string[]).includes(sp.l ?? "") ? (sp.l as Level) : undefined;

  const monthStart = zonedDate(`${ym}-01`);
  const monthEnd = zonedDate(`${shiftMonth(ym, 1)}-01`);
  const now = new Date();
  // Never show the past: start of the month or right now, whichever is later.
  const from = monthStart > now ? monthStart : new Date(now.getTime() - 60 * 60 * 1000);

  let rows: SessionRow[] = [];
  let dbError = false;
  try {
    rows = await getSessions({ from, to: monthEnd, audience, level });
  } catch {
    dbError = true;
  }

  const byDay = new Map<string, SessionRow[]>();
  for (const r of rows) {
    const k = dayKey(r.s.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }

  const href = (over: Partial<Search>) => {
    const q = new URLSearchParams();
    const next = { m: ym, a: audience, l: level, ...over } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    return `/schedule?${q.toString()}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition ${
      active ? "border-burgundy bg-burgundy text-ivory" : "border-ink/20 bg-white hover:border-burgundy"
    }`;
  const today = todayKey();

  return (
    <div className={`${container} py-14`}>
      <p className={eyebrow}>Schedule</p>
      <h1 className="mt-3 text-5xl sm:text-6xl">Class calendar</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Choose a class to book it or drop in for free. Group classes can be cancelled at any time.
        Private sessions need at least 4 hours&rsquo; notice.
      </p>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-2" aria-label="Filters">
        <Link href={href({ a: undefined })} className={chip(!audience)}>All ages</Link>
        <Link href={href({ a: "adult" })} className={chip(audience === "adult")}>Adults</Link>
        <Link href={href({ a: "kids" })} className={chip(audience === "kids")}>Kids</Link>
        <span className="mx-2 hidden h-8 w-px bg-ink/15 sm:block" />
        <Link href={href({ l: undefined })} className={chip(!level)}>All levels</Link>
        {LEVELS.map((l) => (
          <Link key={l} href={href({ l })} className={chip(level === l)}>
            {LEVEL_LABEL[l]}
          </Link>
        ))}
      </div>

      {/* Month navigation */}
      <div className="mt-10 flex items-center justify-between">
        <Link href={href({ m: shiftMonth(ym, -1) })} className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-burgundy" aria-label="Previous month">
          &larr; Prev
        </Link>
        <h2 className="text-3xl">{monthLabel(ym)}</h2>
        <Link href={href({ m: shiftMonth(ym, 1) })} className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-burgundy" aria-label="Next month">
          Next &rarr;
        </Link>
      </div>

      {dbError && (
        <p className={`${card} mt-8 text-sm text-red-800`}>
          The schedule is not available right now. Please try again shortly.
        </p>
      )}

      {/* Month grid (desktop) */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-ink/10 bg-white md:block">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-champagne/60 text-center text-xs uppercase tracking-widest text-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-2.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthGrid(ym).map((d, i) => {
            const items = d ? byDay.get(d) ?? [] : [];
            return (
              <div
                key={i}
                className={`min-h-28 border-b border-r border-ink/5 p-2 ${d ? "" : "bg-ivory/60"} ${d === today ? "bg-gold-soft/20" : ""}`}
              >
                {d && (
                  <>
                    <p className={`text-xs ${d === today ? "font-semibold text-burgundy" : "text-muted"}`}>
                      {Number(d.slice(8))}
                    </p>
                    <div className="mt-1 space-y-1">
                      {items.map((r) => (
                        <Link
                          key={r.s.id}
                          href={`/schedule/${r.s.id}`}
                          className={`block rounded-md px-2 py-1 text-xs leading-tight transition ${
                            r.c.audience === "kids"
                              ? "bg-gold-soft/50 text-burgundy-deep hover:bg-gold-soft"
                              : "bg-burgundy/10 text-burgundy hover:bg-burgundy hover:text-ivory"
                          }`}
                        >
                          <span className="font-medium">{fmtTime(r.s.startsAt)}</span> {r.c.title}
                          {r.s.isPrivate ? " (private)" : ""}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda (mobile) */}
      <div className="mt-6 space-y-3 md:hidden">
        {rows.map((r) => (
          <div key={r.s.id}>
            <SessionCard row={r} />
          </div>
        ))}
      </div>

      {!rows.length && !dbError && (
        <p className="mt-8 text-center text-muted">
          No classes found for {monthLabel(ym)}. Try another month or clear the filters.
        </p>
      )}

      {rows.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          Next class: {fmtDate(rows[0].s.startsAt)} at {fmtTime(rows[0].s.startsAt)}.
        </p>
      )}
    </div>
  );
}
