import Link from "next/link";
import { SITE_NAME, STUDIO_LOCATION, TEACHER_NAME } from "@/lib/labels";
import { container } from "@/lib/ui";

export function Footer() {
  return (
    <footer className="mt-24 bg-burgundy-deep text-ivory/85">
      <div className={`${container} grid gap-10 py-14 md:grid-cols-3`}>
        <div>
          <p className="font-serif text-2xl text-ivory">{SITE_NAME}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/70">
            Ballroom dancing for adults and children, taught by {TEACHER_NAME}.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Visit</p>
          <p className="mt-3 text-sm">{STUDIO_LOCATION}</p>
          <p className="mt-1 text-sm text-ivory/70">Classes Monday, Wednesday and Friday at 5 PM</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/classes" className="hover:text-gold-soft">Classes and levels</Link></li>
            <li><Link href="/schedule" className="hover:text-gold-soft">Schedule and drop-in</Link></li>
            <li><Link href="/contact" className="hover:text-gold-soft">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-gold-soft">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        &copy; {new Date().getFullYear()} {SITE_NAME}. Payment is by cash at the studio.
      </div>
    </footer>
  );
}
