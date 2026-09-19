import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LEVELS, LEVEL_BLURB, LEVEL_LABEL } from "@/lib/labels";
import { btn, card, container, eyebrow } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Classes and levels",
  description: "Five levels from Beginners to Competition, for adults and kids, with a capacity of 12 per class.",
};

export default function ClassesPage() {
  return (
    <div className={`${container} py-16`}>
      <p className={eyebrow}>Classes</p>
      <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">Find your level</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Every level is offered for adults and, separately, for children as a Kids group. Classes are
        kept small, at a maximum of 12 dancers, so everyone gets attention. Everyone starts at
        Beginners, and your teacher will move you up when you are ready.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {LEVELS.map((lvl, i) => (
          <article key={lvl} className={`${card} flex flex-col gap-3`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl">{LEVEL_LABEL[lvl]}</h2>
              <span className="font-serif text-2xl text-gold">0{i + 1}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{LEVEL_BLURB[lvl]}</p>
            <p className="text-xs uppercase tracking-widest text-gold">
              Adults · Kids {LEVEL_LABEL[lvl]}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid items-center gap-8 md:grid-cols-2">
        <Image
          src="/images/kids.webp"
          alt="Children practising ballroom in pairs"
          width={1200}
          height={800}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="rounded-2xl"
        />
        <div>
          <h2 className="text-4xl">Kids classes</h2>
          <p className="mt-4 text-muted">
            Children learn posture, rhythm, coordination and teamwork in classes made for their age.
            Parents create one account and manage bookings for each child.
          </p>
          <Link href="/schedule" className={`${btn} mt-6`}>
            See the schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
