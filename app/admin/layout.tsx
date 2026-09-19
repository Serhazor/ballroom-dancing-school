import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { container } from "@/lib/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin", "teacher"], "/admin");
  const nav =
    user.role === "admin"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/sessions", label: "Sessions" },
          { href: "/admin/classes", label: "Class types" },
          { href: "/admin/users", label: "People" },
          { href: "/admin/messages", label: "Messages" },
        ]
      : [{ href: "/admin/sessions", label: "My sessions" }];

  return (
    <div className={`${container} py-10`}>
      <nav aria-label="Admin" className="mb-8 flex flex-wrap gap-2 border-b border-ink/10 pb-4">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-sm hover:border-burgundy hover:text-burgundy">
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
