import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import {
  bookings,
  classTypes,
  sessions,
  users,
  type ClassType,
  type Level,
  type Session,
} from "./db/schema";

export type SessionRow = {
  s: Session;
  c: ClassType;
  taken: number;
  teacherName: string | null;
};

const teacher = alias(users, "teacher");

const takenSql = sql<number>`(select count(*)::int from ${bookings} where ${bookings.sessionId} = ${sessions.id} and ${bookings.status} in ('booked','attended'))`;

export async function getSessions(opts: {
  from: Date;
  to?: Date;
  audience?: "adult" | "kids";
  level?: Level;
  includeCancelled?: boolean;
  teacherId?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<SessionRow[]> {
  const conds = [gte(sessions.startsAt, opts.from)];
  if (opts.to) conds.push(lt(sessions.startsAt, opts.to));
  if (!opts.includeCancelled) conds.push(eq(sessions.status, "scheduled"));
  if (opts.audience) conds.push(eq(classTypes.audience, opts.audience));
  if (opts.level) conds.push(eq(classTypes.level, opts.level));
  if (opts.teacherId) conds.push(eq(sessions.teacherId, opts.teacherId));

  const q = db
    .select({ s: sessions, c: classTypes, taken: takenSql, teacherName: teacher.name })
    .from(sessions)
    .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
    .leftJoin(teacher, eq(sessions.teacherId, teacher.id))
    .where(and(...conds))
    .orderBy(opts.order === "desc" ? sql`${sessions.startsAt} desc` : asc(sessions.startsAt));
  return opts.limit ? q.limit(opts.limit) : q;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const [row] = await db
    .select({ s: sessions, c: classTypes, taken: takenSql, teacherName: teacher.name })
    .from(sessions)
    .innerJoin(classTypes, eq(sessions.classTypeId, classTypes.id))
    .leftJoin(teacher, eq(sessions.teacherId, teacher.id))
    .where(eq(sessions.id, id))
    .limit(1);
  return row ?? null;
}

export const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
