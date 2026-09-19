import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { bookSession, dropIn } from "@/app/actions/booking";
import { ActionForm, Honeypot, SubmitButton } from "@/components/ActionForm";
import { SpotsBadge } from "@/components/SessionCard";
import { db } from "@/lib/db";
import { bookings, users } from "@/lib/db/schema";
import { getSession, isUuid } from "@/lib/queries";
import { CANCEL_NOTICE_HOURS, LEVEL_BLURB, LEVEL_LABEL } from "@/lib/labels";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/time";
import { btnOutline, card, container, eyebrow, input, label } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Class details" };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const row = await getSession(id);
  if (!row) notFound();
  const { s, c } = row;

  const user = await getCurrentUser();
  const children = user
    ? await db.select().from(users).where(eq(users.parentId, user.id))
    : [];
  const people = user ? [user, ...children] : [];
  const existing = user
    ? await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.sessionId, s.id),
            inArray(bookings.userId, people.map((p) => p.id)),
            inArray(bookings.status, ["booked", "waitlisted", "attended"]),
          ),
        )
    : [];
  const bookedIds = new Set(existing.map((b) => b.userId));
  const bookable = people.filter((p) => !bookedIds.has(p.id));

  const finished = s.endsAt.getTime() < Date.now();
  const closed = s.status === "cancelled" || finished;
  const full = s.capacity - row.taken <= 0;
  const next = `/schedule/${s.id}`;

  return (
    <div className={`${container} max-w-4xl py-14`}>
      <Link href="/schedule" className="text-sm text-burgundy hover:underline">
        &larr; Back to calendar
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className={eyebrow}>
            {LEVEL_LABEL[c.level]} · {c.audience === "kids" ? "Kids" : "Adults"}
            {s.isPrivate ? " · Private session" : ""}
          </p>
          <h1 className="mt-3 text-5xl">{c.title}</h1>
          <p className="mt-5 text-xl">
            {fmtDate(s.startsAt)}
            <br />
            <span className="text-muted">
              {fmtTime(s.startsAt)} to {fmtTime(s.endsAt)}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            <SpotsBadge row={row} />
            <span>{s.location}</span>
            {row.teacherName && <span>with {row.teacherName}</span>}
          </div>
          <p className="mt-6 leading-relaxed text-ink/85">{c.description || LEVEL_BLURB[c.level]}</p>
          {s.notes && <p className="mt-4 rounded-lg bg-champagne/60 p-4 text-sm">{s.notes}</p>}
          {s.isPrivate && (
            <p className="mt-4 text-sm text-muted">
              Private sessions need at least {CANCEL_NOTICE_HOURS} hours&rsquo; notice to cancel.
            </p>
          )}
        </div>

        <aside className={`${card} h-fit`}>
          {closed ? (
            <p className="text-sm text-muted">
              {s.status === "cancelled"
                ? "This class has been cancelled."
                : "This class has finished."}{" "}
              <Link href="/schedule" className="text-burgundy underline">See upcoming classes</Link>.
            </p>
          ) : user ? (
            <>
              <h2 className="text-2xl">{full ? "Join the waitlist" : "Book your place"}</h2>
              {existing.length > 0 && (
                <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-900">
                  {existing
                    .map((b) => `${people.find((p) => p.id === b.userId)?.name} (${b.status})`)
                    .join(", ")}{" "}
                  {existing.length === 1 ? "is" : "are"} already on this class.{" "}
                  <Link href="/account" className="underline">Manage bookings</Link>
                </p>
              )}
              {bookable.length > 0 ? (
                <ActionForm action={bookSession} className="mt-4 space-y-4">
                  <input type="hidden" name="sessionId" value={s.id} />
                  {bookable.length > 1 ? (
                    <div>
                      <label htmlFor="personId" className={label}>Who is dancing?</label>
                      <select id="personId" name="personId" className={input}>
                        {bookable.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.id === user.id ? " (me)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input type="hidden" name="personId" value={bookable[0].id} />
                  )}
                  <SubmitButton className={`${btnOutline} w-full !bg-burgundy !text-ivory`}>
                    {full ? "Join waitlist" : `Book${bookable.length === 1 ? ` for ${bookable[0].name.split(" ")[0]}` : ""}`}
                  </SubmitButton>
                  <p className="text-xs text-muted">Payment is by cash at the studio.</p>
                </ActionForm>
              ) : (
                <p className="mt-3 text-sm text-muted">Everyone on your account is booked in.</p>
              )}
              {user.role === "parent" && children.length === 0 && (
                <p className="mt-4 text-sm text-muted">
                  Booking for a child?{" "}
                  <Link href="/account" className="text-burgundy underline">Add them to your account first</Link>.
                </p>
              )}
            </>
          ) : (
            <>
              {!s.isPrivate && (
                <>
                  <h2 className="text-2xl">Free drop-in</h2>
                  <p className="mt-2 text-sm text-muted">
                    No account needed. Leave your name and a way to reach you, then just turn up.
                  </p>
                  <ActionForm action={dropIn} className="relative mt-4 space-y-4">
                    <Honeypot />
                    <input type="hidden" name="sessionId" value={s.id} />
                    <div>
                      <label htmlFor="name" className={label}>Name</label>
                      <input id="name" name="name" required autoComplete="name" className={input} />
                    </div>
                    <div>
                      <label htmlFor="contact" className={label}>Email or phone</label>
                      <input id="contact" name="contact" required className={input} />
                    </div>
                    <SubmitButton className={`${btnOutline} w-full !bg-burgundy !text-ivory`}>
                      {full ? "Class is full" : "Drop in for free"}
                    </SubmitButton>
                  </ActionForm>
                  <hr className="my-6 border-ink/10" />
                </>
              )}
              <p className="text-sm text-muted">
                {s.isPrivate ? "Private sessions need an account." : "Regular student or parent?"}
              </p>
              <div className="mt-3 flex gap-3">
                <Link href={`/login?next=${encodeURIComponent(next)}`} className={btnOutline}>Sign in</Link>
                <Link href={`/register?next=${encodeURIComponent(next)}`} className={btnOutline}>Register</Link>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
