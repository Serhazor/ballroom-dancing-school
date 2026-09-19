import { NextResponse } from "next/server";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, classTypes, sessions, users } from "@/lib/db/schema";
import { looksLikeEmail, sendEmail } from "@/lib/email";
import { SITE_NAME } from "@/lib/labels";
import { addDays, fmtDate, fmtTime, todayKey, zonedDate } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Daily job (see vercel.json): emails a reminder to everyone booked for tomorrow. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = addDays(todayKey(), 1);
  const from = zonedDate(tomorrow, "00:00");
  const to = zonedDate(addDays(tomorrow, 1), "00:00");

  const rows = await db
    .select({ s: sessions, c: classTypes, b: bookings })
    .from(bookings)
    .innerJoin(sessions, eq(bookings.sessionId, sessions.id))
    .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
    .where(
      and(
        gte(sessions.startsAt, from),
        lt(sessions.startsAt, to),
        eq(sessions.status, "scheduled"),
        inArray(bookings.status, ["booked"]),
      ),
    );

  let sent = 0;
  for (const { s, c, b } of rows) {
    let email: string | null = looksLikeEmail(b.guestContact) ? b.guestContact : null;
    let name = b.guestName ?? "there";
    if (b.userId) {
      const [u] = await db.select().from(users).where(eq(users.id, b.userId)).limit(1);
      name = u?.name ?? name;
      email = u?.email ?? null;
      if (!email && u?.parentId) {
        const [p] = await db.select().from(users).where(eq(users.id, u.parentId)).limit(1);
        email = p?.email ?? null;
      }
    }
    if (!email) continue;
    const ok = await sendEmail({
      to: email,
      subject: `Reminder: ${c.title} tomorrow at ${fmtTime(s.startsAt)}`,
      text: `Hi ${name}, a reminder that ${c.title} is tomorrow, ${fmtDate(s.startsAt)} at ${fmtTime(s.startsAt)}.\n\n${SITE_NAME}`,
    });
    if (ok) sent++;
  }
  return NextResponse.json({ sessions: rows.length, sent });
}
