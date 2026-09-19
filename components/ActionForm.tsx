"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";
import { btn } from "@/lib/ui";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/** A form bound to a server action that shows the action's error or success message. */
export function ActionForm({
  action,
  children,
  className,
  inline = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  /** Compact layout for buttons inside table rows. */
  inline?: boolean;
}) {
  const [state, formAction] = useActionState(action, {} as FormState);
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className={`${inline ? "mt-1 text-xs" : "mt-3 text-sm"} text-red-700`}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className={`${inline ? "mt-1 text-xs" : "mt-3 text-sm"} text-green-800`}>
          {state.ok}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  className = btn,
  pendingText = "Please wait...",
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Hidden spam trap: real people never see or fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
