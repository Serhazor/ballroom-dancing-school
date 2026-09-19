import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { createSessions } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { SpotsBadge } from "@/components/SessionCard";
import { db } from "@/lib/db";
import { classTypes, users } from "@/lib/db/schema";
import { getSessions } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { fmtDate, fmtTime, todayKey } from "@/lib/time";
import { card, input, label } from "@/lib/ui";

const WEEKDAYS = [
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
  { v: 0, l: "Sun" },
];

export default async function SessionsAdmin() {
  const user = await requireRole(["admin", "teacher"], "/admin/sessions");
  const isAdmin = user.role === "admin";
  const rows = await getSessions({
    from: new Date(Date.now() - 24 * 3_600_000),
    includeCancelled: true,
    teacherId: isAdmin ? undefined : user.id,
    limit: 150,
  });
  const types = isAdmin
    ? await db.select().from(classTypes).where(eq(classTypes.active, true)).orderBy(asc(classTypes.audience), asc(classTypes.level))
    : [];
  const teachers = isAdmin
    ? await db.select().from(users).where(inArray(users.role, ["teacher", "admin"]))
    : [];

  return (
    <div>
      <h1 className="text-4xl">{isAdmin ? "Sessions" : "My sessions"}</h1>

      {isAdmin && (
        <div className={`${card} mt-8`}>
          <h2 className="mb-1 text-2xl">Schedule sessions</h2>
          <p className="mb-5 text-sm text-muted">
            Tick weekdays to repeat weekly for the number of weeks chosen. Untick all to add a
            single session on the start date. Times are Irish local time.
          </p>
          <ActionForm action={createSessions} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <label className={label} htmlFor="classTypeId">Class type</label>
              <select id="classTypeId" name="classTypeId" required className={input}>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.audience === "kids" ? "Kids" : "Adults"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="startDate">Start date</label>
              <input id="startDate" name="startDate" type="date" required defaultValue={todayKey()} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="time">Start time</label>
              <input id="time" name="time" type="time" required defaultValue="17:00" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="duration">Length (minutes)</label>
              <input id="duration" name="duration" type="number" min={15} max={300} defaultValue={60} className={input} />
            </div>
            <fieldset className="sm:col-span-2 lg:col-span-2">
              <legend className={label}>Repeat on</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label key={d.v} className="cursor-pointer rounded-full border border-ink/20 px-3.5 py-1.5 text-sm has-[:checked]:border-burgundy has-[:checked]:bg-burgundy has-[:checked]:text-ivory">
                    <input type="checkbox" name="weekday" value={d.v} defaultChecked={[1, 3, 5].includes(d.v)} className="sr-only" />
                    {d.l}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label className={label} htmlFor="weeks">For how many weeks</label>
              <input id="weeks" name="weeks" type="number" min={1} max={52} defaultValue={8} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="capacity">Capacity (blank = class default)</label>
              <input id="capacity" name="capacity" type="number" min={1} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="teacherId">Teacher</label>
              <select id="teacherId" name="teacherId" className={input}>
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="location">Location</label>
              <input id="location" name="location" placeholder="Mullingar, Co. Westmeath" className={input} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={label} htmlFor="notes">Note shown to students (optional)</label>
              <input id="notes" name="notes" className={input} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
              <input type="checkbox" name="isPrivate" /> Private session (capacity 1, 4 hours&rsquo; cancellation notice)
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <SubmitButton>Add to schedule</SubmitButton>
            </div>
          </ActionForm>
        </div>
      )}

      <div className="mt-10 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-champagne/60 text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Booked</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.s.id} className={`border-t border-ink/5 ${r.s.status === "cancelled" ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {fmtDate(r.s.startsAt)}
                  <br />
                  <span className="text-muted">{fmtTime(r.s.startsAt)}</span>
                </td>
                <td className="px-4 py-3">
                  {r.c.title}
                  {r.s.isPrivate && <span className="ml-2 rounded bg-champagne px-1.5 py-0.5 text-xs">Private</span>}
                </td>
                <td className="px-4 py-3 text-muted">{r.teacherName ?? "-"}</td>
                <td className="px-4 py-3"><SpotsBadge row={r} /> <span className="text-muted">{r.taken}/{r.s.capacity}</span></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/sessions/${r.s.id}`} className="text-burgundy hover:underline">Roster</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No sessions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
