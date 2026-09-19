import Image from "next/image";
import Link from "next/link";
import { SessionCard } from "@/components/SessionCard";
import { getSessions, type SessionRow } from "@/lib/queries";
import { LEVEL_LABEL, STUDIO_LOCATION, TEACHER_NAME } from "@/lib/labels";
import { btn, btnGold, btnOutline, card, container, eyebrow } from "@/lib/ui";

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
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-burgundy-deep/90 via-burgundy-deep/60 to-transparent md:via-burgundy-deep/30" />
        <div className={`${container} flex min-h-[72vh] items-center py-20`}>
          <div className="max-w-xl text-ivory">
            <p className={`${eyebrow} !text-gold-soft`}>Ballroom dancing in {STUDIO_LOCATION}</p>
            <h1 className="mt-5 text-5xl leading-[1.02] sm:text-7xl">Never danced before? Perfect.</h1>
            <p className="mt-6 text-lg leading-relaxed text-ivory/90">
              Friendly small classes for adults and children, taught by ballet-trained{" "}
              {TEACHER_NAME}. No partner, no experience and no pressure. Everyone here started as a
              beginner.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/schedule" className={btnGold}>
                Try a free class
              </Link>
              <a
                href="#first-class"
                className="inline-flex items-center justify-center rounded-full border border-ivory/60 px-6 py-3 text-sm font-medium text-ivory transition hover:bg-ivory hover:text-burgundy-deep"
              >
                How your first class works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance strip */}
      <section className="border-b border-ink/10 bg-white">
        <ul className={`${container} grid grid-cols-2 gap-x-6 gap-y-4 py-6 text-sm md:grid-cols-4`}>
          {[
            "No partner needed",
            "First class is free",
            "Small groups, up to 12",
            "Adults and Kids classes",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-ink/85">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gold" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Your first class */}
      <section id="first-class" className={`${container} scroll-mt-20 py-20`}>
        <p className={eyebrow}>Your first class</p>
        <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">Coming for the first time? It&rsquo;s simple.</h2>
        <p className="mt-4 max-w-2xl text-muted">
          Most people feel a little nervous before their first dance class. That&rsquo;s completely
          normal, and the whole group has been in your shoes.
        </p>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { t: "Pick a class", d: "Choose a Beginners class from the schedule. Adults and Kids have their own groups." },
            { t: "Leave your name", d: "Use the free drop-in form. No account, no payment, no forms to fill in." },
            { t: "Turn up", d: "Wear comfortable clothes and shoes you can move in. Arrive a few minutes early to say hello." },
            { t: "Just dance", d: "We start with the basics, step by step. Nobody is expected to know anything yet." },
          ].map((st, i) => (
            <li key={st.t} className={`${card} relative`}>
              <span className="font-serif text-5xl leading-none text-gold-soft">{i + 1}</span>
              <h3 className="mt-3 text-2xl">{st.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{st.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link href="/schedule" className={btn}>
            Choose your free class
          </Link>
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
      <section className="bg-champagne/60 py-20">
        <div className={`${container} grid items-center gap-12 md:grid-cols-[1fr_1.2fr]`}>
          <Image
            src="/images/teacher.webp"
            alt="Portrait placeholder of the teacher in a ballet studio"
            width={1200}
            height={1500}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="mx-auto w-full max-w-md rounded-2xl object-cover shadow-lg"
          />
          <div>
            <p className={eyebrow}>Meet your teacher</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">{TEACHER_NAME}</h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/85">
              Anastasiia holds a Bachelor&rsquo;s degree as a ballet master from Ukraine. She brings
              the care and precision of classical ballet to ballroom, but her classes are for
              everyone, from complete beginners to competitors. You will be shown, not judged.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className={btn}>
                About the school
              </Link>
              <Link href="/contact" className={btnOutline}>
                Ask a question
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`${container} max-w-3xl py-20`}>
        <p className={eyebrow}>Good to know</p>
        <h2 className="mt-3 text-4xl sm:text-5xl">Questions beginners ask</h2>
        <div className="mt-8 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
          {[
            { q: "Do I need a partner?", a: "No. Come on your own. In class we change partners, so you will meet people quickly." },
            { q: "What if I have never danced before?", a: "That is who Beginners classes are for. We start with posture, rhythm and the basic steps, and go slowly." },
            { q: "Is the first class really free?", a: "Yes. Choose a class on the schedule and leave your name and contact. You do not need an account." },
            { q: "What should I wear?", a: "Comfortable clothes you can move in and shoes with a smooth, flat sole. Trainers with a lot of grip are not ideal." },
            { q: "Can my child join?", a: "Yes. Every level has a Kids group, and parents can manage bookings for their children from one account." },
            { q: "How do I pay?", a: "By cash at the studio. Online payment is planned for later." },
          ].map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-2xl text-gold transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-burgundy-deep py-20 text-center text-ivory">
        <div className={container}>
          <h2 className="mx-auto max-w-2xl text-4xl sm:text-5xl">Your first class is on us</h2>
          <p className="mx-auto mt-4 max-w-xl text-ivory/80">
            Leave your name, wear comfortable clothes and come along. We will take care of the rest.
          </p>
          <Link href="/schedule" className={`${btnGold} mt-8`}>
            Choose a class
          </Link>
        </div>
      </section>
    </>
  );
}
