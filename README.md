# Grande Ballroom Studio

Website and booking app for a ballroom dancing school in Mullingar, Co. Westmeath.

Stack: Next.js 15 (App Router, TypeScript), Tailwind CSS 4, Drizzle ORM, Neon Postgres, Auth.js (credentials), hosted on Vercel.

## What it does

- Public site: home, classes and levels, about, contact form, privacy.
- Schedule: month calendar (list on mobile) with filters for adults/kids and level.
- Free drop-in: anyone can join a group class with a name and email or phone. No account.
- Accounts: students and parents. Parents add child profiles and book for them.
- Booking: capacity per class (default 12), automatic waitlist, cancellation.
  Group classes can be cancelled any time. Private sessions need 4 hours' notice.
- Roles: Admin, Teacher, Student, Parent. Admins manage everything, teachers see only their own sessions.
- Admin: class types, scheduling (one-off or weekly repeats), rosters, mark attended and paid (cash), add or remove people, cancel a session (students are emailed), users and roles, contact messages, CSV export.
- Emails (optional, via Resend): confirmations, waitlist promotion, cancellations, daily reminder.
- Payment is cash only. Prices are stored in cents on each class type so Stripe can be added later.

## Run it locally

```bash
npm install
cp .env.example .env.local        # then fill it in (see below)
npm run db:push                   # creates the tables in your database
npm run db:seed                   # creates the admin, 10 class types and Mon/Wed/Fri 5 PM Beginners
npm run dev                       # http://localhost:3000
```

Sign in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then open `/admin`.

## 1. Create the Neon database

1. Create a project at [neon.tech](https://neon.tech). Pick the region closest to Ireland (for example AWS eu-west-2 London).
2. In the dashboard, click Connect and copy the **pooled** connection string. Put it in `.env.local` as `DATABASE_URL`.
3. Run `npm run db:push`, then `npm run db:seed`.

For local development you can also use any Postgres on `localhost`; the app switches to the standard driver automatically.

## 2. Deploy on Vercel

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your repo url>
   git push -u origin main
   ```
2. In Vercel, choose Add New, Project, import the repo (framework is detected as Next.js).
3. Add these environment variables (Settings, Environment Variables):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `AUTH_SECRET` | random string: `npx auth secret` or `openssl rand -base64 32` |
   | `NEXT_PUBLIC_SITE_URL` | your site URL, for example `https://grandeballroomstudio.com` |
   | `CRON_SECRET` | any long random string (protects the reminder job) |
   | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL` | optional, to enable email |

4. Deploy. Run `db:push` and `db:seed` once from your computer against the Neon database (step 1). The seed is only needed the first time.
5. Add the domain under Settings, Domains once you buy grandeballroomstudio.com. For email from that domain, verify it in Resend and set `EMAIL_FROM` to something like `Grande Ballroom Studio <hello@grandeballroomstudio.com>`.

`vercel.json` runs `/api/cron/reminders` daily at 09:00 UTC to email tomorrow's students.

## Roles

| Role | Can do |
| --- | --- |
| Admin | Everything in `/admin`, including users and roles. Create more admins under People. |
| Teacher | `/admin/sessions`: only their own sessions, roster and attendance. |
| Student | Book, waitlist and cancel their own classes. |
| Parent | Same, plus add child profiles and book for them. |

New sign-ups become Student or Parent. Only an admin can make someone a Teacher or Admin.
Access is enforced on the server in every page and action, not only in the menu.

## Project layout

```
app/                public pages, /schedule, /account, /admin, API routes
app/actions/        server actions (auth, booking, contact, account, admin)
components/         shared UI (Header, Footer, ActionForm, SessionCard, admin forms)
lib/db/schema.ts    database tables
lib/booking.ts      booking, waitlist and cancellation rules (transactional)
lib/time.ts         Irish time helpers (Europe/Dublin)
scripts/seed.ts     first admin, class types, launch sessions
public/images/      site photos (AI-generated placeholders)
```

## Before launch

- Replace the AI-generated images in `public/images/` with real photos (keep the file names and sizes, see below).
- Review the wording on the home, about and privacy pages; the privacy page is a starter text.
- Add the exact studio address to the contact page and footer (`lib/labels.ts` and `app/contact/page.tsx`).
- Kids Beginners are created as a class type but not scheduled. Add their sessions under Admin, Sessions.
- Change the admin password after first sign-in, and remove `ADMIN_PASSWORD` from the environment if you like.

Image sizes: hero 1920x1080, teacher 1200x1500, class cards 1200x800, studio 1600x600 (WebP), og.jpg 1200x630.

## Not included yet

Self-service password reset by email (admins can set a new password under People), email verification, online payments (Stripe), class packs and memberships. The data model leaves room for all of them.
