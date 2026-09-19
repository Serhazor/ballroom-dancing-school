import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/labels";
import { container } from "@/lib/ui";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className={`${container} max-w-3xl py-16`}>
      <h1 className="text-5xl">Privacy</h1>
      <div className="mt-8 space-y-5 leading-relaxed text-ink/85">
        <p>
          {SITE_NAME} collects only what it needs to run classes: your name, an email address or
          phone number, your bookings and, for parents, the first names of your children. This is
          used to manage bookings, send confirmations and reminders, and reply to your messages.
        </p>
        <p>
          We do not sell your data or use it for advertising. Drop-in details are used only for that
          class. You can ask us at any time to see, correct or delete your data through the contact
          page.
        </p>
        <p>
          This is a starter policy. Have it reviewed and completed with the studio&rsquo;s legal
          details before launch.
        </p>
      </div>
    </div>
  );
}
