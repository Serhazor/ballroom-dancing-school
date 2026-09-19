import type { Metadata } from "next";
import Image from "next/image";
import { sendContact } from "@/app/actions/contact";
import { ActionForm, Honeypot, SubmitButton } from "@/components/ActionForm";
import { STUDIO_LOCATION } from "@/lib/labels";
import { card, container, eyebrow, input, label } from "@/lib/ui";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <div className="relative h-56 sm:h-72">
        <Image
          src="/images/studio.webp"
          alt="The dance studio"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-burgundy-deep/40" />
      </div>
      <div className={`${container} grid gap-12 py-16 md:grid-cols-[1fr_1.2fr]`}>
        <div>
          <p className={eyebrow}>Contact</p>
          <h1 className="mt-3 text-5xl">Say hello</h1>
          <p className="mt-5 text-muted">
            Questions about levels, kids classes or private lessons? Send us a message and we will
            reply as soon as we can.
          </p>
          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-gold">Studio</dt>
              <dd className="mt-1">{STUDIO_LOCATION}</dd>
              <dd className="text-muted">Exact address to be confirmed</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-gold">Group classes</dt>
              <dd className="mt-1">Monday, Wednesday and Friday at 5 PM</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-gold">Payment</dt>
              <dd className="mt-1">Cash at the studio</dd>
            </div>
          </dl>
        </div>

        <div className={card}>
          <ActionForm action={sendContact} className="relative space-y-5">
            <Honeypot />
            <div>
              <label htmlFor="name" className={label}>Your name</label>
              <input id="name" name="name" required autoComplete="name" className={input} />
            </div>
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={input} />
            </div>
            <div>
              <label htmlFor="message" className={label}>Message</label>
              <textarea id="message" name="message" rows={6} required className={input} />
            </div>
            <SubmitButton pendingText="Sending...">Send message</SubmitButton>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
