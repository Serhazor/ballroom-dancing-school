import { saveClassType } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import type { ClassType } from "@/lib/db/schema";
import { LEVELS, LEVEL_LABEL } from "@/lib/labels";
import { input, label } from "@/lib/ui";

export function ClassForm({ c }: { c?: ClassType }) {
  return (
    <ActionForm action={saveClassType} className="grid gap-4 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div>
        <label className={label} htmlFor={`title-${c?.id ?? "new"}`}>Title</label>
        <input id={`title-${c?.id ?? "new"}`} name="title" required defaultValue={c?.title} placeholder="Kids Beginners" className={input} />
      </div>
      <div>
        <label className={label} htmlFor={`style-${c?.id ?? "new"}`}>Style</label>
        <input id={`style-${c?.id ?? "new"}`} name="style" required defaultValue={c?.style ?? "Ballroom"} className={input} />
      </div>
      <div>
        <label className={label} htmlFor={`level-${c?.id ?? "new"}`}>Level</label>
        <select id={`level-${c?.id ?? "new"}`} name="level" defaultValue={c?.level ?? "beginners"} className={input}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor={`aud-${c?.id ?? "new"}`}>Audience</label>
        <select id={`aud-${c?.id ?? "new"}`} name="audience" defaultValue={c?.audience ?? "adult"} className={input}>
          <option value="adult">Adults</option>
          <option value="kids">Kids</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor={`cap-${c?.id ?? "new"}`}>Capacity</label>
        <input id={`cap-${c?.id ?? "new"}`} name="capacity" type="number" min={1} max={200} defaultValue={c?.capacity ?? 12} className={input} />
      </div>
      <div>
        <label className={label} htmlFor={`price-${c?.id ?? "new"}`}>Price per class (EUR, optional)</label>
        <input id={`price-${c?.id ?? "new"}`} name="price" type="number" min={0} step="0.01" defaultValue={c ? (c.priceCents / 100).toFixed(2) : "0"} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor={`desc-${c?.id ?? "new"}`}>Description (shown on the class page)</label>
        <textarea id={`desc-${c?.id ?? "new"}`} name="description" rows={3} defaultValue={c?.description} className={input} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{c ? "Save changes" : "Create class type"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
