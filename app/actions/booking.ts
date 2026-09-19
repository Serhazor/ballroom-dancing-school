"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classTypes, sessions, users } from "@/lib/db/schema";
import { cancelBooking, createBooking } from "@/lib/booking";
import { looksLikeEmail, sendEmail } from "@/lib/email";
import { str, type FormState } from "@/lib/form";
import { SITE_NAME, STUDIO_LOCATION } from "@/lib/labels";
import { getCurrentUser } from "@/lib/session";
import { fmtDate, fmtTime } from "@/lib/time";

/** Signed-in students and parents booking themselves or one of their children. */
export async function bookSession(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to book." };
  const sessionId = str(fd, "sessionId");
  const personId = str(fd, "personId") || user.id;

  let person = user;
  if (personId !== user.id) {
    const [child] = await db.select().from(users).where(eq(users.id, personId)).limit(1);
    if (!child || child.parentId !== user.id) return { error: "Not allowed." };
    person = child;
  }

  const res = await createBooking({ sessionId, userId: person.id, bookedById: user.id });
  if (!res.ok) return { error: res.error };

  const [row] = await db
    .select({ s: sessions, c: classTypes })
    .from(sessions)
    .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (row && user.email) {
    await sendEmail({
      to: user.email,
      subject: `${res.status === "booked" ? "Booking confirmed" : "You're on the waitlist"}: ${row.c.title}`,
      text: `${person.name} is ${res.status === "booked" ? "booked into" : "on the waitlist for"} ${row.c.title}\n${fmtDate(row.s.startsAt)}, ${fmtTime(row.s.startsAt)}\n${row.s.location || STUDIO_LOCATION}\n\n${SITE_NAME}`,
    });
  }
  revalidatePath(`/schedule/${sessionId}`);
  revalidatePath("/schedule");
  revalidatePath("/account");
  return {
    ok:
      res.status === "booked"
        ? `${person.name} is booked in. See you there!`
        : "The class is full, so you have been added to the waitlist. We will email you if a place opens.",
  };
}

/** Free drop-in for anyone: name and a way to reach them, no account. */
export async function dropIn(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return {}; // honeypot
  const sessionId = str(fd, "sessionId");
  const name = str(fd, "name");
  const contact = str(fd, "contact");
  if (name.length < 2) return { error: "Please enter your name." };
  if (contact.length < 5) return { error: "Please enter an email address or phone number." };

  const res = await createBooking({ sessionId, guest: { name, contact } });
  if (!res.ok) return { error: res.error };

  if (looksLikeEmail(contact)) {
    const [row] = await db
      .select({ s: sessions, c: classTypes })
      .from(sessions)
      .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);
    if (row)
      await sendEmail({
        to: contact,
        subject: `Your free drop-in: ${row.c.title}`,
        text: `Hi ${name}, you are booked for a free drop-in.\n${row.c.title}\n${fmtDate(row.s.startsAt)}, ${fmtTime(row.s.startsAt)}\n${row.s.location || STUDIO_LOCATION}\n\nWear comfortable clothes and shoes you can move in. No partner needed.\n\n${SITE_NAME}`,
      });
  }
  revalidatePath(`/schedule/${sessionId}`);
  revalidatePath("/schedule");
  return { ok: `Thank you ${name}, you are on the list. Just turn up and dance!` };
}

export async function cancelMyBooking(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  const res = await cancelBooking(str(fd, "bookingId"), user);
  if (!res.ok) return { error: res.error };
  revalidatePath("/account");
  revalidatePath("/schedule");
  return { ok: "Booking cancelled." };
}
