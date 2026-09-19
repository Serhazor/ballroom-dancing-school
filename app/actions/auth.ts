"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { safeNext, str, type FormState } from "@/lib/form";

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  accountType: z.enum(["student", "parent"]),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return {}; // honeypot
  const parsed = registerSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    password: String(fd.get("password") ?? ""),
    accountType: str(fd, "accountType") || "student",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, accountType } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists. Try signing in." };

  await db.insert(users).values({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 11),
    role: accountType,
  });

  return signInWith(email, password, safeNext(str(fd, "next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  return signInWith(
    str(fd, "email").toLowerCase(),
    String(fd.get("password") ?? ""),
    safeNext(str(fd, "next")),
  );
}

async function signInWith(email: string, password: string, redirectTo: string): Promise<FormState> {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Incorrect email or password." };
    throw err; // the redirect after a successful sign-in is thrown by Next
  }
  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
