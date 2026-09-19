import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "teacher", "student", "parent"]);
export const levelEnum = pgEnum("level", [
  "beginners",
  "improvers",
  "intermediate",
  "advanced",
  "competition",
]);
export const audienceEnum = pgEnum("audience", ["adult", "kids"]);
export const sessionStatusEnum = pgEnum("session_status", ["scheduled", "cancelled"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "booked",
  "waitlisted",
  "cancelled",
  "attended",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid"]);

/**
 * Accounts and child profiles.
 * A child profile is a user row with no email/password whose parentId points at the parent.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull().default("student"),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classTypes = pgTable("class_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  style: text("style").notNull().default("Ballroom"),
  level: levelEnum("level").notNull().default("beginners"),
  audience: audienceEnum("audience").notNull().default("adult"),
  description: text("description").notNull().default(""),
  capacity: integer("capacity").notNull().default(12),
  priceCents: integer("price_cents").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classTypeId: uuid("class_type_id")
      .notNull()
      .references(() => classTypes.id),
    teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull().default(12),
    isPrivate: boolean("is_private").notNull().default(false),
    status: sessionStatusEnum("status").notNull().default("scheduled"),
    location: text("location").notNull().default("Mullingar, Co. Westmeath"),
    notes: text("notes").notNull().default(""),
    recurrenceId: uuid("recurrence_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_starts_at_idx").on(t.startsAt)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    /** Null for drop-in guests. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** Who made the booking (a parent for a child, an admin for a student). */
    bookedById: uuid("booked_by_id").references(() => users.id, { onDelete: "set null" }),
    guestName: text("guest_name"),
    guestContact: text("guest_contact"),
    status: bookingStatusEnum("status").notNull().default("booked"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("bookings_session_idx").on(t.sessionId),
    uniqueIndex("bookings_one_active_per_user")
      .on(t.sessionId, t.userId)
      .where(sql`${t.status} <> 'cancelled' and ${t.userId} is not null`),
  ],
);

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type ClassType = typeof classTypes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Role = User["role"];
export type Level = ClassType["level"];
