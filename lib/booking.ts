import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { bookings, classTypes, sessions, users, type User } from "./db/schema";
import { sendEmail } from "./email";
import { CANCEL_NOTICE_HOURS, SITE_NAME } from "./labels";
import { HOUR_MS, fmtDate, fmtTime } from "./time";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Bookings that occupy a place in the class. */
const OCCUPYING = ["booked", "attended"] as const;

export async function countTaken(sessionId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(eq(bookings.sessionId, sessionId), inArray(bookings.status, [...OCCUPYING])));
  return row?.n ?? 0;
}

type CreateOpts = {
  sessionId: string;
  /** Student or child profile being booked. Omit for a drop-in guest. */
  userId?: string;
  guest?: { name: string; contact: string };
  bookedById?: string;
  /** Admins may add people to past or full sessions. */
  force?: boolean;
};

/**
 * Create a booking inside a transaction that locks the session row, so two people
 * can never take the last place at the same time.
 */
export async function createBooking(
  opts: CreateOpts,
): Promise<Result<{ status: "booked" | "waitlisted" }>> {
  return db.transaction(async (tx) => {
    const [s] = await tx
      .select()
      .from(sessions)
      .where(eq(sessions.id, opts.sessionId))
      .for("update");
    if (!s || s.status !== "scheduled") return { ok: false, error: "This class is not available." };
    if (!opts.force && s.endsAt.getTime() < Date.now())
      return { ok: false, error: "This class has already finished." };
    if (opts.guest && s.isPrivate)
      return { ok: false, error: "Private sessions need an account. Please sign in or register." };

    if (opts.userId) {
      const [dup] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.sessionId, s.id),
            eq(bookings.userId, opts.userId),
            inArray(bookings.status, ["booked", "waitlisted", "attended"]),
          ),
        )
        .limit(1);
      if (dup) return { ok: false, error: "Already booked for this class." };
    }

    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.sessionId, s.id), inArray(bookings.status, [...OCCUPYING])));

    const full = n >= s.capacity;
    if (full && opts.guest && !opts.force)
      return { ok: false, error: "This class is full. Please try another day or sign in to join the waitlist." };

    const status = full ? "waitlisted" : "booked";
    await tx.insert(bookings).values({
      sessionId: s.id,
      userId: opts.userId ?? null,
      bookedById: opts.bookedById ?? null,
      guestName: opts.guest?.name ?? null,
      guestContact: opts.guest?.contact ?? null,
      status,
    });
    return { ok: true, status };
  });
}

type Actor = Pick<User, "id" | "role">;

/**
 * Cancel a booking and promote the first person on the waitlist.
 * Group classes can be cancelled at any time; private sessions need
 * CANCEL_NOTICE_HOURS notice (admins are exempt).
 */
export async function cancelBooking(bookingId: string, actor: Actor): Promise<Result> {
  let promotedUserId: string | null = null;
  let sessionId = "";

  const result = await db.transaction(async (tx): Promise<Result> => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!b || b.status === "cancelled") return { ok: false, error: "Booking not found." };

    const [s] = await tx.select().from(sessions).where(eq(sessions.id, b.sessionId)).for("update");
    if (!s) return { ok: false, error: "Class not found." };
    sessionId = s.id;

    const isStaff = actor.role === "admin";
    if (!isStaff) {
      let allowed = b.bookedById === actor.id || b.userId === actor.id;
      if (!allowed && b.userId) {
        const [child] = await tx.select().from(users).where(eq(users.id, b.userId)).limit(1);
        allowed = child?.parentId === actor.id;
      }
      if (!allowed) return { ok: false, error: "Not allowed." };
      if (s.isPrivate && s.startsAt.getTime() - Date.now() < CANCEL_NOTICE_HOURS * HOUR_MS)
        return {
          ok: false,
          error: `Private sessions need at least ${CANCEL_NOTICE_HOURS} hours' notice to cancel. Please contact the studio.`,
        };
    }

    await tx
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(bookings.id, b.id));

    if (b.status === "booked" || b.status === "attended") {
      const [next] = await tx
        .select()
        .from(bookings)
        .where(and(eq(bookings.sessionId, s.id), eq(bookings.status, "waitlisted")))
        .orderBy(asc(bookings.createdAt))
        .limit(1);
      if (next) {
        await tx.update(bookings).set({ status: "booked" }).where(eq(bookings.id, next.id));
        promotedUserId = next.userId;
      }
    }
    return { ok: true };
  });

  if (result.ok && promotedUserId) {
    await notifyPromoted(promotedUserId, sessionId).catch(() => {});
  }
  return result;
}

async function notifyPromoted(userId: string, sessionId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [row] = await db
    .select({ s: sessions, c: classTypes })
    .from(sessions)
    .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!u || !row) return;
  // Child profiles have no email: tell the parent instead.
  let to = u.email;
  if (!to && u.parentId) {
    const [p] = await db.select().from(users).where(eq(users.id, u.parentId)).limit(1);
    to = p?.email ?? null;
  }
  if (!to) return;
  await sendEmail({
    to,
    subject: `A place opened up: ${row.c.title}`,
    text: `Good news, ${u.name} now has a place in ${row.c.title} on ${fmtDate(row.s.startsAt)} at ${fmtTime(row.s.startsAt)}.\n\n${SITE_NAME}`,
  });
}
