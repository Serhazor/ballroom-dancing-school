/**
 * Creates the first admin, the ten class types (5 levels x adults/kids) and, for
 * the launch, Adult Beginners on Monday, Wednesday and Friday at 5 PM for 8 weeks.
 * Safe to run more than once. Usage: npm run db:seed
 */
import "./env"; // must be first so DATABASE_URL is set before the db module loads
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { classTypes, sessions, users } from "../lib/db/schema";
import { LEVELS, LEVEL_BLURB, LEVEL_LABEL } from "../lib/labels";
import { addDays, todayKey, weekdayOf, zonedDate } from "../lib/time";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 8) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env.local first.");
  }

  const [admin] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!admin) {
    await db.insert(users).values({
      name: process.env.ADMIN_NAME ?? "Admin",
      email,
      passwordHash: await bcrypt.hash(password, 11),
      role: "admin",
    });
    console.log(`Created admin ${email}`);
  } else {
    console.log(`Admin ${email} already exists`);
  }

  const existing = await db.select().from(classTypes);
  if (existing.length === 0) {
    await db.insert(classTypes).values(
      LEVELS.flatMap((level) =>
        (["adult", "kids"] as const).map((audience) => ({
          title: `${audience === "kids" ? "Kids " : ""}${LEVEL_LABEL[level]}`,
          style: "Ballroom",
          level,
          audience,
          description: LEVEL_BLURB[level],
          capacity: 12,
        })),
      ),
    );
    console.log("Created 10 class types");
  }

  const [beginners] = await db
    .select()
    .from(classTypes)
    .where(eq(classTypes.title, "Beginners"))
    .limit(1);
  const existingSessions = await db.select({ id: sessions.id }).from(sessions).limit(1);
  if (beginners && existingSessions.length === 0) {
    const recurrenceId = randomUUID();
    const rows = [];
    for (let i = 0; i < 8 * 7; i++) {
      const d = addDays(todayKey(), i);
      if ([1, 3, 5].includes(weekdayOf(d))) {
        const startsAt = zonedDate(d, "17:00");
        rows.push({
          classTypeId: beginners.id,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 60 * 60_000),
          capacity: beginners.capacity,
          recurrenceId,
        });
      }
    }
    await db.insert(sessions).values(rows);
    console.log(`Created ${rows.length} Beginners sessions (Mon/Wed/Fri 5 PM)`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
