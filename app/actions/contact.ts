"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { str, type FormState } from "@/lib/form";

const schema = z.object({
  name: z.string().min(2, "Please enter your name.").max(100),
  email: z.string().email("Please enter a valid email."),
  message: z.string().min(10, "Please write a few words so we can help.").max(4000),
});

export async function sendContact(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { ok: "Thank you, we will be in touch soon." }; // honeypot
  const parsed = schema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email"),
    message: str(fd, "message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(contactMessages).values(parsed.data);
  const to = process.env.CONTACT_EMAIL;
  if (to)
    await sendEmail({
      to,
      subject: `New website message from ${parsed.data.name}`,
      text: `${parsed.data.message}\n\nFrom: ${parsed.data.name} <${parsed.data.email}>`,
    });
  return { ok: "Thank you, we have your message and will reply soon." };
}
