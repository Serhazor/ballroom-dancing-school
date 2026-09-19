import Image from "next/image";
import Link from "next/link";
import { SessionCard } from "@/components/SessionCard";
import { getSessions, type SessionRow } from "@/lib/queries";
import { LEVEL_LABEL, STUDIO_LOCATION, TEACHER_NAME } from "@/lib/labels";
import { btn, btnGold, card, container, eyebrow } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let upcoming: SessionRow[] = [];
  try {
    upcoming = await getSessions({ from: new Date(), limit: 4 });
  } catch {
    // Database not connected yet: the rest of the page still works.
  }

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-burgundy-deep">
        <Image
          src="/images/hero.webp"
          alt="A couple dancing a waltz in a sunlit ballroom"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-right"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-burgundy-deep/95 via-burgundy-deep/75 to-transparent md:via-burgundy-deep/45" />
        <div className={`${container} flex min-h-[78vh] items-center py-24`}>
          <div className="max-w-xl text-ivory">
            <p className={`${eyebrow} !text-gold-soft`}>Ballroom dancing in {STUDIO_LOCATION}</p>
            <h1 className="mt-5 text-5xl leading-[1.02] sm:text-7xl">
              Grace, technique and joy on the dance floor
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ivory/85">
              Classes for adults and children, from first steps to competition, taught with the
              discipline of ballet by {TEACHER_NAME}.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/schedule" className={btnGold}>
                Try a free drop-in class
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center rounded-full border border-ivory/60 px-6 py-3 text-sm font-medium text-ivory transition hover:bg-ivory hover:text-burgundy-deep"
              >
                Explore levels
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className={`${container} py-20`}>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Ballet-trained teaching",
              d: "Posture, line and musicality are built on the foundations of classical ballet, so every student moves with more control and ease.",
            },
            {
              t: "Every level, every age",
              d: "Beginners to Competition for adults, with a Kids group at each level. No experience or partner needed to start.",
            },
            {
              t: "Free drop-in, no sign-up",
              d: "Curious? Choose a class, leave your name and turn up. Your first taste of ballroom costs nothing.",
            },
          ].map((f) => (
            <div key={f.t} className={card}>
              <div className="mb-4 h-px w-10 bg-gold" />
              <h2 className="text-2xl">{f.t}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming */}
      <section className="bg-champagne/60 py-20">
        <div className={container}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={eyebrow}>Schedule</p>
              <h2 className="mt-3 text-4xl sm:text-5xl">Coming up</h2>
            </div>
            <Link href="/schedule" className="text-sm font-medium text-burgundy underline-offset-4 hover:underline">
              See the full calendar
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {upcoming.length ? (
              upcoming.map((row) => <SessionCard key={row.s.id} row={row} />)
            ) : (
              <p className="text-muted">
                New classes are being scheduled. Check back soon or{" "}
                <Link href="/contact" className="text-burgundy underline">
                  get in touch
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className={`${container} py-20`}>
        <p className={eyebrow}>Classes</p>
        <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">A path from first steps to the competition floor</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { img: "beginners", t: "Beginners", d: "Start here. Learn the frame, rhythm and basic patterns in a friendly small group of up to 12." },
            { img: "kids", t: "Kids classes", d: "Playful but disciplined classes for children at every level, building posture, coordination and confidence." },
            { img: "advanced", t: "Advanced and Competition", d: "Refined technique, partnering and performance for dancers who want to compete." },
          ].map((c) => (
            <Link key={c.t} href="/classes" className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
              <Image
                src={`/images/${c.img}.webp`}
                alt=""
                width={1200}
                height={800}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="aspect-[3/2] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-6">
                <h3 className="text-2xl">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Levels: {Object.values(LEVEL_LABEL).join(", ")}. Each is also offered as a Kids group.
        </p>
      </section>

      {/* Teacher */}
      <section className="bg-burgundy-deep py-20 text-ivory">
        <div className={`${container} grid items-center gap-12 md:grid-cols-[1fr_1.2fr]`}>
          <Image
            src="/images/teacher.webp"
            alt="Portrait placeholder of the teacher in a ballet studio"
            width={1200}
            height={1500}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="mx-auto w-full max-w-md rounded-2xl object-cover"
          />
          <div>
            <p className={`${eyebrow} !text-gold-soft`}>Your teacher</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">{TEACHER_NAME}</h2>
            <p className="mt-6 text-lg leading-relaxed text-ivory/85">
              Anastasiia holds a Bachelor&rsquo;s degree as a ballet master from Ukraine. She brings
              the precision and artistry of classical ballet to ballroom, so students learn not
              only the steps but how to move.
            </p>
            <Link href="/about" className={`${btnGold} mt-8`}>
              About the school
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${container} py-20 text-center`}>
        <h2 className="mx-auto max-w-2xl text-4xl sm:text-5xl">Your first class is on us</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Drop in to any group class for free. Just leave your name, wear comfortable clothes and
          come along. No partner needed.
        </p>
        <Link href="/schedule" className={`${btn} mt-8`}>
          Choose a class
        </Link>
      </section>
    </>
  );
}
