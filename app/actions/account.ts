"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { str, type FormState } from "@/lib/form";
import { getCurrentUser } from "@/lib/session";

export async function addChild(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "parent") return { error: "Only parent accounts can add children." };
  const name = str(fd, "name");
  if (name.length < 2) return { error: "Please enter your child's name." };
  await db.insert(users).values({ name, role: "student", parentId: user.id });
  revalidatePath("/account");
  return { ok: `${name} added.` };
}

export async function removeChild(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  await db.delete(users).where(and(eq(users.id, str(fd, "childId")), eq(users.parentId, user.id)));
  revalidatePath("/account");
  return { ok: "Removed." };
}
