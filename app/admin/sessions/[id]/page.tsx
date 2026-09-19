import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  adminAddBooking,
  adminCancelBooking,
  cancelSession,
  setAttendance,
  setPayment,
} from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { getSession, isUuid } from "@/lib/queries";
import { LEVEL_LABEL } from "@/lib/labels";
import { requireRole } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/time";
import { btnSmall, btnSmallDanger, btnSmallOutline, card, input, label } from "@/lib/ui";

export default async function RosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["admin", "teacher"], `/admin/sessions/${id}`);
  const isAdmin = user.role === "admin";
  if (!isUuid(id)) notFound();
  const row = await getSession(id);
  if (!row) notFound();
  if (!isAdmin && row.s.teacherId !== user.id) notFound();
  const { s, c } = row;

  const person = alias(users, "person");
  const parent = alias(users, "parent");
  const roster = await db
    .select({
      b: bookings,
      name: person.name,
      email: person.email,
      parentName: parent.name,
      parentEmail: parent.email,
    })
    .from(bookings)
    .leftJoin(person, eq(bookings.userId, person.id))
    .leftJoin(parent, eq(person.parentId, parent.id))
    .where(eq(bookings.sessionId, id))
    .orderBy(asc(bookings.createdAt));

  const active = roster.filter((r) => r.b.status === "booked" || r.b.status === "attended");
  const waitlist = roster.filter((r) => r.b.status === "waitlisted");
  const allUsers = isAdmin
    ? await db.select().from(users).orderBy(asc(users.name)).limit(1000)
    : [];

  const line = (r: (typeof roster)[number]) => ({
    name: r.name ?? r.b.guestName ?? "Guest",
    contact:
      r.email ?? (r.parentEmail ? `${r.parentName} (parent) ${r.parentEmail}` : r.b.guestContact ?? ""),
    guest: !r.b.userId,
  });

  return (
    <div>
      <Link href="/admin/sessions" className="text-sm text-burgundy hover:underline">&larr; All sessions</Link>
      <h1 className="mt-3 text-4xl">{c.title}</h1>
      <p className="mt-2 text-muted">
        {fmtDate(s.startsAt)}, {fmtTime(s.startsAt)} to {fmtTime(s.endsAt)} · {LEVEL_LABEL[c.level]} ·{" "}
        {active.length}/{s.capacity} places taken
        {s.status === "cancelled" ? " · CANCELLED" : ""}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={`/admin/sessions/${id}/export`} className={btnSmallOutline}>Export CSV</a>
        {isAdmin && s.status === "scheduled" && (
          <ActionForm action={cancelSession} inline>
            <input type="hidden" name="id" value={id} />
            <SubmitButton className={btnSmallDanger}>Cancel this session</SubmitButton>
          </ActionForm>
        )}
      </div>

      <h2 className="mt-10 text-3xl">Roster</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-champagne/60 text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Attended</th>
              <th className="px-4 py-3">Cash</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {active.map((r) => {
              const l = line(r);
              return (
                <tr key={r.b.id} className="border-t border-ink/5">
                  <td className="px-4 py-3">
                    {l.name}
                    {l.guest && <span className="ml-2 rounded bg-champagne px-1.5 py-0.5 text-xs">Drop-in</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{l.contact}</td>
                  <td className="px-4 py-3">
                    <ActionForm action={setAttendance} inline>
                      <input type="hidden" name="bookingId" value={r.b.id} />
                      <input type="hidden" name="attended" value={String(r.b.status !== "attended")} />
                      <SubmitButton className={r.b.status === "attended" ? btnSmall : btnSmallOutline}>
                        {r.b.status === "attended" ? "Attended" : "Mark"}
                      </SubmitButton>
                    </ActionForm>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <ActionForm action={setPayment} inline>
                        <input type="hidden" name="bookingId" value={r.b.id} />
                        <input type="hidden" name="paid" value={String(r.b.paymentStatus !== "paid")} />
                        <SubmitButton className={r.b.paymentStatus === "paid" ? btnSmall : btnSmallOutline}>
                          {r.b.paymentStatus === "paid" ? "Paid" : "Mark paid"}
                        </SubmitButton>
                      </ActionForm>
                    ) : (
                      <span className="text-muted">{r.b.paymentStatus}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <ActionForm action={adminCancelBooking} inline>
                        <input type="hidden" name="bookingId" value={r.b.id} />
                        <SubmitButton className={btnSmallDanger}>Remove</SubmitButton>
                      </ActionForm>
                    )}
                  </td>
                </tr>
              );
            })}
            {active.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {waitlist.length > 0 && (
        <>
          <h2 className="mt-10 text-3xl">Waitlist</h2>
          <ol className="mt-4 list-decimal space-y-1 pl-6 text-sm">
            {waitlist.map((r) => (
              <li key={r.b.id}>{line(r).name} <span className="text-muted">{line(r).contact}</span></li>
            ))}
          </ol>
        </>
      )}

      {isAdmin && s.status === "scheduled" && (
        <div className={`${card} mt-10`}>
          <h2 className="mb-4 text-2xl">Add someone</h2>
          <ActionForm action={adminAddBooking} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="sessionId" value={id} />
            <div className="sm:col-span-2">
              <label className={label} htmlFor="userId">Existing student</label>
              <select id="userId" name="userId" className={input} defaultValue="">
                <option value="">Choose a person...</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.email ? ` (${u.email})` : u.parentId ? " (child)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="guestName">Or guest name</label>
              <input id="guestName" name="guestName" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="guestContact">Guest email or phone</label>
              <input id="guestContact" name="guestContact" className={input} />
            </div>
            <div className="sm:col-span-2"><SubmitButton>Add to class</SubmitButton></div>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
