import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { addChild, removeChild } from "@/app/actions/account";
import { cancelMyBooking } from "@/app/actions/booking";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { bookings, classTypes, sessions, users } from "@/lib/db/schema";
import { CANCEL_NOTICE_HOURS, ROLE_LABEL } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/time";
import { btn, btnSmallDanger, btnSmallOutline, card, container, eyebrow, input, label } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const children = await db.select().from(users).where(eq(users.parentId, user.id));
  const ids = [user.id, ...children.map((c) => c.id)];
  const person = alias(users, "person");

  const upcoming = await db
    .select({ b: bookings, s: sessions, c: classTypes, who: person.name })
    .from(bookings)
    .innerJoin(sessions, eq(bookings.sessionId, sessions.id))
    .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
    .innerJoin(person, eq(bookings.userId, person.id))
    .where(
      and(
        inArray(bookings.userId, ids),
        inArray(bookings.status, ["booked", "waitlisted"]),
        gte(sessions.endsAt, new Date()),
      ),
    )
    .orderBy(asc(sessions.startsAt));

  return (
    <div className={`${container} max-w-4xl py-14`}>
      <p className={eyebrow}>{ROLE_LABEL[user.role]}</p>
      <h1 className="mt-3 text-5xl">Hello, {user.name.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-muted">{user.email}</p>

      {(user.role === "admin" || user.role === "teacher") && (
        <Link href="/admin" className={`${btn} mt-6`}>
          {user.role === "admin" ? "Go to admin" : "Go to my classes"}
        </Link>
      )}

      <section className="mt-12">
        <h2 className="text-3xl">Upcoming bookings</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-muted">
            Nothing booked yet.{" "}
            <Link href="/schedule" className="text-burgundy underline">Browse the schedule</Link>.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {upcoming.map(({ b, s, c, who }) => (
              <li key={b.id} className={`${card} flex flex-wrap items-center justify-between gap-4 !p-5`}>
                <div>
                  <Link href={`/schedule/${s.id}`} className="font-serif text-xl hover:text-burgundy">
                    {c.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {fmtDate(s.startsAt)}, {fmtTime(s.startsAt)} · {who}
                    {b.status === "waitlisted" ? " · Waitlist" : ""}
                    {s.status === "cancelled" ? " · Class cancelled" : ""}
                  </p>
                  {s.isPrivate && (
                    <p className="mt-1 text-xs text-muted">
                      Private session: {CANCEL_NOTICE_HOURS} hours&rsquo; notice to cancel.
                    </p>
                  )}
                </div>
                <ActionForm action={cancelMyBooking} inline>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <SubmitButton className={btnSmallOutline}>Cancel</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {user.role === "parent" && (
        <section className="mt-14">
          <h2 className="text-3xl">My children</h2>
          <p className="mt-2 text-sm text-muted">
            Add each child once, then book classes for them from the schedule.
          </p>
          {children.length > 0 && (
            <ul className="mt-5 space-y-2">
              {children.map((ch) => (
                <li key={ch.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3">
                  <span>{ch.name}</span>
                  <ActionForm action={removeChild} inline>
                    <input type="hidden" name="childId" value={ch.id} />
                    <SubmitButton className={btnSmallDanger}>Remove</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
          <ActionForm action={addChild} className={`${card} mt-5 flex flex-wrap items-end gap-3`}>
            <div className="min-w-56 flex-1">
              <label htmlFor="childName" className={label}>Child&rsquo;s name</label>
              <input id="childName" name="name" required className={input} />
            </div>
            <SubmitButton>Add child</SubmitButton>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
