import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { safeNext } from "@/lib/form";
import { getCurrentUser } from "@/lib/session";
import { card, input, label } from "@/lib/ui";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-center text-5xl">Welcome back</h1>
      <div className={`${card} mt-8`}>
        <ActionForm action={login} className="space-y-5">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={input} />
          </div>
          <div>
            <label htmlFor="password" className={label}>Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
          </div>
          <SubmitButton className="inline-flex w-full items-center justify-center rounded-full bg-burgundy px-6 py-3 text-sm font-medium text-ivory hover:bg-burgundy-deep disabled:opacity-60">
            Sign in
          </SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-burgundy underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
