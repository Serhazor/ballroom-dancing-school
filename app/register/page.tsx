import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { ActionForm, Honeypot, SubmitButton } from "@/components/ActionForm";
import { safeNext } from "@/lib/form";
import { getCurrentUser } from "@/lib/session";
import { card, input, label } from "@/lib/ui";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-center text-5xl">Join the studio</h1>
      <p className="mt-3 text-center text-sm text-muted">
        Just want to try a class? You do not need an account. Use the free drop-in on the schedule.
      </p>
      <div className={`${card} mt-8`}>
        <ActionForm action={register} className="relative space-y-5">
          <Honeypot />
          <input type="hidden" name="next" value={next ?? ""} />
          <fieldset>
            <legend className={label}>I am signing up as</legend>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink/20 p-3 has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/5">
                <input type="radio" name="accountType" value="student" defaultChecked /> A student
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink/20 p-3 has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/5">
                <input type="radio" name="accountType" value="parent" /> A parent
              </label>
            </div>
          </fieldset>
          <div>
            <label htmlFor="name" className={label}>Your name</label>
            <input id="name" name="name" required autoComplete="name" className={input} />
          </div>
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={input} />
          </div>
          <div>
            <label htmlFor="password" className={label}>Password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
            <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
          </div>
          <SubmitButton className="inline-flex w-full items-center justify-center rounded-full bg-burgundy px-6 py-3 text-sm font-medium text-ivory hover:bg-burgundy-deep disabled:opacity-60">
            Create account
          </SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-burgundy underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
