import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { bookings, sessions, users } from "@/lib/db/schema";
import { isUuid } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const esc = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher") || !isUuid(id))
    return new NextResponse("Not found", { status: 404 });

  const [s] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!s || (user.role === "teacher" && s.teacherId !== user.id))
    return new NextResponse("Not found", { status: 404 });

  const person = alias(users, "person");
  const rows = await db
    .select({ b: bookings, name: person.name, email: person.email })
    .from(bookings)
    .leftJoin(person, eq(bookings.userId, person.id))
    .where(eq(bookings.sessionId, id))
    .orderBy(asc(bookings.createdAt));

  const csv = [
    "name,contact,type,status,payment",
    ...rows.map((r) =>
      [
        esc(r.name ?? r.b.guestName),
        esc(r.email ?? r.b.guestContact),
        esc(r.b.userId ? "member" : "drop-in"),
        esc(r.b.status),
        esc(r.b.paymentStatus),
      ].join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="roster-${id.slice(0, 8)}.csv"`,
    },
  });
}
