import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SessionCard } from "@/components/SessionCard";
import { db } from "@/lib/db";
import { contactMessages, users } from "@/lib/db/schema";
import { getSessions } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { addDays, todayKey, zonedDate } from "@/lib/time";
import { card } from "@/lib/ui";

export default async function AdminHome() {
  const user = await requireRole(["admin", "teacher"], "/admin");
  if (user.role === "teacher") redirect("/admin/sessions");

  const [{ n: unread }] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(eq(contactMessages.handled, false));
  const [{ n: people }] = await db.select({ n: count() }).from(users);
  const upcoming = await getSessions({
    from: new Date(),
    to: zonedDate(addDays(todayKey(), 8)),
  });

  return (
    <div>
      <h1 className="text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/messages" className={card}>
          <p className="text-sm text-muted">New messages</p>
          <p className="font-serif text-5xl text-burgundy">{unread}</p>
        </Link>
        <Link href="/admin/users" className={card}>
          <p className="text-sm text-muted">People</p>
          <p className="font-serif text-5xl text-burgundy">{people}</p>
        </Link>
        <Link href="/admin/sessions" className={card}>
          <p className="text-sm text-muted">Sessions in the next 7 days</p>
          <p className="font-serif text-5xl text-burgundy">{upcoming.length}</p>
        </Link>
      </div>

      <h2 className="mt-12 text-3xl">Next 7 days</h2>
      <p className="mt-1 text-sm text-muted">Select a session to see its roster.</p>
      <div className="mt-5 space-y-3">
        {upcoming.length === 0 && <p className="text-muted">No sessions. Add some under Sessions.</p>}
        {upcoming.map((r) => (
          <Link key={r.s.id} href={`/admin/sessions/${r.s.id}`} className="block">
            <div className="pointer-events-none">
              <SessionCard row={r} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
