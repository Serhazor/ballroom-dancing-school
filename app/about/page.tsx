import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { STUDIO_LOCATION, TEACHER_NAME } from "@/lib/labels";
import { btn, container, eyebrow } from "@/lib/ui";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className={`${container} py-16`}>
      <div className="grid items-start gap-12 md:grid-cols-[1fr_1.3fr]">
        <Image
          src="/images/teacher.webp"
          alt="Portrait placeholder of the teacher"
          width={1200}
          height={1500}
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="w-full rounded-2xl"
        />
        <div>
          <p className={eyebrow}>About the school</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">{TEACHER_NAME}</h1>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink/85">
            <p>
              Grande Ballroom Studio is a small, high-level ballroom school in {STUDIO_LOCATION}.
              It is led by {TEACHER_NAME}, who holds a Bachelor&rsquo;s degree as a ballet master
              from Ukraine.
            </p>
            <p>
              Ballet gives dancers the foundations that ballroom depends on: posture, line, balance
              and musicality. Every class, from a first-time beginner to a competitor, is taught
              with that attention to detail.
            </p>
            <p>
              Groups are limited to twelve dancers, and everyone is welcome to try a class for
              free. You do not need a partner or any experience.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/schedule" className={btn}>
              Try a free drop-in
            </Link>
            <Link href="/contact" className="inline-flex items-center rounded-full border border-burgundy px-6 py-3 text-sm font-medium text-burgundy hover:bg-burgundy hover:text-ivory">
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
