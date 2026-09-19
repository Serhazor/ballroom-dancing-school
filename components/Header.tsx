import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/session";
import { SITE_NAME } from "@/lib/labels";
import { btn, container } from "@/lib/ui";

const links = [
  { href: "/classes", label: "Classes" },
  { href: "/schedule", label: "Schedule" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function Header() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Database not configured yet: still render the public site.
  }
  const staff = user && (user.role === "admin" || user.role === "teacher");

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-burgundy">
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-ink/80 hover:text-burgundy">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              {staff && (
                <Link href="/admin" className="text-sm text-ink/80 hover:text-burgundy">
                  {user.role === "admin" ? "Admin" : "My classes"}
                </Link>
              )}
              <Link href="/account" className="text-sm text-ink/80 hover:text-burgundy">
                Account
              </Link>
              <form action={logout}>
                <button className="text-sm text-muted hover:text-burgundy">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-ink/80 hover:text-burgundy">
                Sign in
              </Link>
              <Link href="/schedule" className={`${btn} !px-5 !py-2`}>
                Free drop-in
              </Link>
            </>
          )}
        </div>

        <details className="group relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-ink/15 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Menu</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-ink/10 bg-white p-4 shadow-xl">
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm hover:bg-champagne">
                  {l.label}
                </Link>
              ))}
              <hr className="my-2 border-ink/10" />
              {user ? (
                <>
                  {staff && (
                    <Link href="/admin" className="rounded-lg px-3 py-2 text-sm hover:bg-champagne">
                      {user.role === "admin" ? "Admin" : "My classes"}
                    </Link>
                  )}
                  <Link href="/account" className="rounded-lg px-3 py-2 text-sm hover:bg-champagne">
                    Account
                  </Link>
                  <form action={logout}>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-champagne">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-lg px-3 py-2 text-sm hover:bg-champagne">
                    Sign in
                  </Link>
                  <Link href="/schedule" className={`${btn} mt-2`}>
                    Free drop-in
                  </Link>
                </>
              )}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
