import { desc } from "drizzle-orm";
import { setMessageHandled } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { btnSmallOutline, card } from "@/lib/ui";

export default async function MessagesAdmin() {
  await requireRole(["admin"], "/admin/messages");
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);

  return (
    <div>
      <h1 className="text-4xl">Messages</h1>
      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="text-muted">No messages yet.</p>}
        {rows.map((m) => (
          <div key={m.id} className={`${card} !p-5 ${m.handled ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <a href={`mailto:${m.email}`} className="text-sm text-burgundy hover:underline">{m.email}</a>
                <p className="text-xs text-muted">{m.createdAt.toLocaleString("en-IE", { timeZone: "Europe/Dublin" })}</p>
              </div>
              <ActionForm action={setMessageHandled} inline>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="handled" value={String(!m.handled)} />
                <SubmitButton className={btnSmallOutline}>{m.handled ? "Mark unhandled" : "Mark handled"}</SubmitButton>
              </ActionForm>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
