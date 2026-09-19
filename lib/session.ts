import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { users, type Role, type User } from "./db/schema";

/**
 * The signed-in user, read fresh from the database on every request so a role
 * change or deleted account takes effect immediately (the JWT only stores the id).
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
});

/** For pages: redirect to login if signed out, or home if the role is not allowed. */
export async function requireRole(roles: Role[], next = "/"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireUser(next = "/account"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** For server actions: throw instead of redirecting. */
export async function assertRole(roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) throw new Error("Not allowed");
  return user;
}
