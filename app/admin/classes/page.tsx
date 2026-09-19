import { desc } from "drizzle-orm";
import { toggleClassActive } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ClassForm } from "@/components/admin/ClassForm";
import { db } from "@/lib/db";
import { classTypes } from "@/lib/db/schema";
import { LEVEL_LABEL } from "@/lib/labels";
import { requireRole } from "@/lib/session";
import { btnSmallDanger, btnSmallOutline, card } from "@/lib/ui";

export default async function ClassesAdmin() {
  await requireRole(["admin"], "/admin/classes");
  const rows = await db
    .select()
    .from(classTypes)
    .orderBy(desc(classTypes.active), classTypes.audience, classTypes.level);

  return (
    <div>
      <h1 className="text-4xl">Class types</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        A class type is a template (for example Kids Beginners). Schedule dates for it under
        Sessions. Archiving hides a type from new scheduling; existing sessions are kept.
      </p>

      <div className={`${card} mt-8`}>
        <h2 className="mb-4 text-2xl">Add a class type</h2>
        <ClassForm />
      </div>

      <div className="mt-10 space-y-3">
        {rows.map((c) => (
          <details key={c.id} className={`${card} !p-0 ${c.active ? "" : "opacity-60"}`}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
              <div>
                <span className="font-serif text-xl">{c.title}</span>
                <span className="ml-3 text-sm text-muted">
                  {LEVEL_LABEL[c.level]} · {c.audience === "kids" ? "Kids" : "Adults"} · capacity {c.capacity}
                  {c.active ? "" : " · archived"}
                </span>
              </div>
              <span className="text-xs text-burgundy">Edit</span>
            </summary>
            <div className="border-t border-ink/10 p-5">
              <ClassForm c={c} />
              <ActionForm action={toggleClassActive} inline className="mt-4">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="active" value={String(!c.active)} />
                <SubmitButton className={c.active ? btnSmallDanger : btnSmallOutline}>
                  {c.active ? "Archive" : "Restore"}
                </SubmitButton>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
