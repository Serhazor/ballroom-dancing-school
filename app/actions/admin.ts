"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  bookings,
  classTypes,
  contactMessages,
  sessions,
  users,
  levelEnum,
  roleEnum,
} from "@/lib/db/schema";
import { cancelBooking, createBooking } from "@/lib/booking";
import { looksLikeEmail, sendEmail } from "@/lib/email";
import { str, type FormState } from "@/lib/form";
import { SITE_NAME, STUDIO_LOCATION } from "@/lib/labels";
import { assertRole, getCurrentUser } from "@/lib/session";
import { addDays, fmtDate, fmtTime, weekdayOf, zonedDate } from "@/lib/time";

const int = (fd: FormData, key: string, fallback = 0) => {
  const n = parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};

/* ------------------------------ Class types ------------------------------ */

const classSchema = z.object({
  title: z.string().min(2, "Please enter a title."),
  style: z.string().min(2, "Please enter a style."),
  level: z.enum(levelEnum.enumValues),
  audience: z.enum(["adult", "kids"]),
  description: z.string().max(2000),
  capacity: z.number().int().min(1).max(200),
  priceCents: z.number().int().min(0),
});

export async function saveClassType(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const parsed = classSchema.safeParse({
    title: str(fd, "title"),
    style: str(fd, "style"),
    level: str(fd, "level"),
    audience: str(fd, "audience"),
    description: str(fd, "description"),
    capacity: int(fd, "capacity", 12),
    priceCents: Math.round(parseFloat(str(fd, "price") || "0") * 100) || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = str(fd, "id");
  if (id) {
    await db.update(classTypes).set(parsed.data).where(eq(classTypes.id, id));
  } else {
    await db.insert(classTypes).values(parsed.data);
  }
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  return { ok: id ? "Class saved." : "Class created." };
}

export async function toggleClassActive(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const id = str(fd, "id");
  const active = str(fd, "active") === "true";
  await db.update(classTypes).set({ active }).where(eq(classTypes.id, id));
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  return { ok: active ? "Class restored." : "Class archived." };
}

/* -------------------------------- Sessions ------------------------------- */

export async function createSessions(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const classTypeId = str(fd, "classTypeId");
  const [ct] = await db.select().from(classTypes).where(eq(classTypes.id, classTypeId)).limit(1);
  if (!ct) return { error: "Please choose a class." };

  const startDate = str(fd, "startDate");
  const time = str(fd, "time");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: "Please choose a start date." };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Please choose a start time." };
  const duration = Math.min(Math.max(int(fd, "duration", 60), 15), 300);
  const isPrivate = str(fd, "isPrivate") === "on";
  const capacity = int(fd, "capacity", isPrivate ? 1 : ct.capacity);
  const weekdays = fd.getAll("weekday").map((v) => parseInt(String(v), 10));
  const weeks = Math.min(Math.max(int(fd, "weeks", 1), 1), 52);
  const teacherId = str(fd, "teacherId") || null;
  const notes = str(fd, "notes");
  const location = str(fd, "location") || STUDIO_LOCATION;

  const dates: string[] = [];
  if (weekdays.length === 0) {
    dates.push(startDate);
  } else {
    for (let i = 0; i < weeks * 7; i++) {
      const d = addDays(startDate, i);
      if (weekdays.includes(weekdayOf(d))) dates.push(d);
    }
  }
  if (dates.length === 0) return { error: "No dates match. Check the weekdays and start date." };

  const recurrenceId = dates.length > 1 ? randomUUID() : null;
  await db.insert(sessions).values(
    dates.map((d) => {
      const startsAt = zonedDate(d, time);
      return {
        classTypeId,
        teacherId,
        startsAt,
        endsAt: new Date(startsAt.getTime() + duration * 60_000),
        capacity,
        isPrivate,
        notes,
        location,
        recurrenceId,
      };
    }),
  );
  revalidatePath("/admin/sessions");
  revalidatePath("/schedule");
  return { ok: `${dates.length} session${dates.length === 1 ? "" : "s"} added.` };
}

export async function cancelSession(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const id = str(fd, "id");
  const [s] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!s) return { error: "Session not found." };
  await db.update(sessions).set({ status: "cancelled" }).where(eq(sessions.id, id));

  // Tell everyone who was booked.
  const people = await db
    .select({ email: users.email, parentId: users.parentId, name: users.name, contact: bookings.guestContact, guest: bookings.guestName })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.sessionId, id), inArray(bookings.status, ["booked", "waitlisted"])));
  const [ct] = await db.select().from(classTypes).where(eq(classTypes.id, s.classTypeId)).limit(1);
  const when = `${fmtDate(s.startsAt)}, ${fmtTime(s.startsAt)}`;
  for (const p of people) {
    let to = p.email ?? (looksLikeEmail(p.contact) ? p.contact : null);
    if (!to && p.parentId) {
      const [parent] = await db.select().from(users).where(eq(users.id, p.parentId)).limit(1);
      to = parent?.email ?? null;
    }
    if (to)
      await sendEmail({
        to,
        subject: `Class cancelled: ${ct?.title ?? "class"}`,
        text: `Sorry, ${ct?.title ?? "the class"} on ${when} has been cancelled.\n\n${SITE_NAME}`,
      });
  }
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${id}`);
  revalidatePath("/schedule");
  return { ok: "Session cancelled and booked students notified." };
}

/* -------------------------------- Bookings ------------------------------- */

export async function adminAddBooking(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const sessionId = str(fd, "sessionId");
  const userId = str(fd, "userId");
  const guestName = str(fd, "guestName");
  const guestContact = str(fd, "guestContact");
  const admin = await getCurrentUser();

  if (!userId && !guestName) return { error: "Choose a student or enter a guest name." };
  const res = await createBooking({
    sessionId,
    userId: userId || undefined,
    guest: userId ? undefined : { name: guestName, contact: guestContact },
    bookedById: admin?.id,
    force: true,
  });
  if (!res.ok) return { error: res.error };
  revalidatePath(`/admin/sessions/${sessionId}`);
  return { ok: res.status === "booked" ? "Added to the class." : "Class is full, added to the waitlist." };
}

export async function setPayment(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const id = str(fd, "bookingId");
  const paid = str(fd, "paid") === "true";
  const [b] = await db
    .update(bookings)
    .set({ paymentStatus: paid ? "paid" : "unpaid" })
    .where(eq(bookings.id, id))
    .returning();
  if (b) revalidatePath(`/admin/sessions/${b.sessionId}`);
  return { ok: paid ? "Marked as paid (cash)." : "Marked as unpaid." };
}

/** Admins and the session's own teacher can record attendance. */
export async function setAttendance(_: FormState, fd: FormData): Promise<FormState> {
  const user = await assertRole(["admin", "teacher"]);
  const id = str(fd, "bookingId");
  const attended = str(fd, "attended") === "true";
  const [row] = await db
    .select({ b: bookings, s: sessions })
    .from(bookings)
    .innerJoin(sessions, eq(bookings.sessionId, sessions.id))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return { error: "Booking not found." };
  if (user.role === "teacher" && row.s.teacherId !== user.id) return { error: "Not your class." };
  if (row.b.status === "cancelled" || row.b.status === "waitlisted")
    return { error: "Only booked people can be marked as attended." };
  await db
    .update(bookings)
    .set({ status: attended ? "attended" : "booked" })
    .where(eq(bookings.id, id));
  revalidatePath(`/admin/sessions/${row.s.id}`);
  return {};
}

export async function adminCancelBooking(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertRole(["admin"]);
  const bookingId = str(fd, "bookingId");
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const res = await cancelBooking(bookingId, admin);
  if (!res.ok) return { error: res.error };
  if (b) revalidatePath(`/admin/sessions/${b.sessionId}`);
  return { ok: "Removed." };
}

/* --------------------------------- People -------------------------------- */

const newUserSchema = z.object({
  name: z.string().min(2, "Please enter a name."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(roleEnum.enumValues),
});

export async function createUser(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const parsed = newUserSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    password: String(fd.get("password") ?? ""),
    role: str(fd, "role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) return { error: "That email already has an account." };
  const { password, ...rest } = parsed.data;
  await db.insert(users).values({ ...rest, passwordHash: await bcrypt.hash(password, 11) });
  revalidatePath("/admin/users");
  return { ok: `${rest.name} added as ${rest.role}. Share the password with them securely.` };
}

export async function setRole(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await assertRole(["admin"]);
  const id = str(fd, "userId");
  const role = str(fd, "role");
  if (!(roleEnum.enumValues as readonly string[]).includes(role)) return { error: "Invalid role." };
  if (id === admin.id) return { error: "You cannot change your own role." };
  await db
    .update(users)
    .set({ role: role as (typeof roleEnum.enumValues)[number] })
    .where(eq(users.id, id));
  revalidatePath("/admin/users");
  return { ok: "Role updated." };
}

/* -------------------------------- Messages ------------------------------- */

export async function setMessageHandled(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  await db
    .update(contactMessages)
    .set({ handled: str(fd, "handled") === "true" })
    .where(eq(contactMessages.id, str(fd, "id")));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return {};
}

export async function setPassword(_: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 11) })
    .where(eq(users.id, str(fd, "userId")));
  return { ok: "Password updated. Share it with the person securely." };
}
