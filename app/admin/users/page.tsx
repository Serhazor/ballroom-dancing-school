import { desc } from "drizzle-orm";
import { createUser, setPassword, setRole } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ROLE_LABEL } from "@/lib/labels";
import { requireRole } from "@/lib/session";
import { btnSmallOutline, card, input, label } from "@/lib/ui";

const roles = Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[];

export default async function UsersAdmin() {
  const me = await requireRole(["admin"], "/admin/users");
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(500);
  const accounts = rows.filter((u) => u.email);
  const kids = rows.filter((u) => !u.email).length;

  return (
    <div>
      <h1 className="text-4xl">People</h1>
      <p className="mt-2 text-sm text-muted">
        {accounts.length} accounts and {kids} child profiles. Roles: Admin (everything), Teacher
        (sees and marks attendance for their own sessions), Student and Parent.
      </p>

      <div className={`${card} mt-8`}>
        <h2 className="mb-4 text-2xl">Add an admin or teacher</h2>
        <ActionForm action={createUser} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="name">Name</label>
            <input id="name" name="name" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="password">Temporary password</label>
            <input id="password" name="password" type="text" minLength={8} required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="teacher" className={input}>
              {roles.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2"><SubmitButton>Create account</SubmitButton></div>
        </ActionForm>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-champagne/60 text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">New password</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((u) => (
              <tr key={u.id} className="border-t border-ink/5">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  {u.id === me.id ? (
                    <span>{ROLE_LABEL[u.role]} (you)</span>
                  ) : (
                    <ActionForm action={setRole} inline className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} className="rounded-lg border border-ink/20 bg-white px-2 py-1 text-sm">
                        {roles.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                      <SubmitButton className={btnSmallOutline}>Save</SubmitButton>
                    </ActionForm>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ActionForm action={setPassword} inline className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <input name="password" type="text" minLength={8} required placeholder="8+ characters" aria-label={`New password for ${u.name}`} className="w-36 rounded-lg border border-ink/20 bg-white px-2 py-1 text-sm" />
                    <SubmitButton className={btnSmallOutline}>Set</SubmitButton>
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
