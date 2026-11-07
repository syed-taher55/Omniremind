import Link from "next/link";
import { buttonClass, quietClass } from "@/lib/ui-classes";

const steps = [
  ["Schedule", "Clinic visits, via form, CSV, Excel, or CRM"],
  ["Hold", "One indexed queue until the send time"],
  ["Route", "The business Meta key sends the template"],
  ["Track", "Sent, delivered, and read receipts"],
];

export default function Home() {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="font-serif text-2xl tracking-tight">OmniRemind</p>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={quietClass}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonClass}>
            Create workspace
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="grid items-end gap-10 border-b border-line py-12 md:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="text-sm text-pine">WhatsApp reminders for independent clinics</p>
            <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
              Help patients remember their appointments.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Schedule appointment reminders from a form, spreadsheet, or
              clinic system. Connect your own WhatsApp Business account and
              pay Meta directly for message delivery.
            </p>
          </div>
          <ol className="rounded-3xl border border-line bg-card p-5">
            {steps.map(([title, detail], index) => (
              <li
                key={title}
                className="flex gap-4 border-b border-line py-3 last:border-b-0"
              >
                <span className="font-serif text-2xl text-pine">0{index + 1}</span>
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-sm text-muted">{detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 py-12 md:grid-cols-3">
          <article>
            <h2 className="font-serif text-2xl">Start with a lean setup</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              The starter is designed to run on free hosting tiers at low
              volume. Free plans have resource and usage limits, and may
              change as the product grows.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl">Meta bills the business</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Onboarding is a phone number ID and a token from that
              business Meta app. OmniRemind never puts your card on their
              WhatsApp traffic.
            </p>
          </article>
          <article>
            <h2 className="font-serif text-2xl">Sending credits control the queue</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              OmniRemind credits are an internal send allowance, separate from
              Meta billing. At zero, due reminders pause until credits are
              added.
            </p>
          </article>
        </section>

        <section className="grid gap-4 border-t border-line py-12 md:grid-cols-3">
          <article className="rounded-3xl bg-sand p-5">
            <p className="text-xs tracking-wide text-muted">Workspace</p>
            <h2 className="mt-2 font-serif text-3xl">Separate desks</h2>
            <p className="mt-3 text-sm leading-6">
              A hospital cannot read a school phone list, logs, or tokens.
              Postgres row policies keep every query inside one membership.
            </p>
          </article>
          <article className="rounded-3xl bg-sand p-5">
            <p className="text-xs tracking-wide text-muted">Queue</p>
            <h2 className="mt-2 font-serif text-3xl">Send at the minute</h2>
            <p className="mt-3 text-sm leading-6">
              Times are stored in UTC from the business timezone. The
              dispatcher claims due rows with a skip lock, up to eight per
              pass, so two ticks cannot send the same reminder.
            </p>
          </article>
          <article className="rounded-3xl bg-sand p-5">
            <p className="text-xs tracking-wide text-muted">Estimated impact</p>
            <h2 className="mt-2 font-serif text-3xl">See read receipts</h2>
            <p className="mt-3 text-sm leading-6">
              Webhooks move each row from sent to delivered to read. The
              dashboard can total the estimated value attached to read
              reminders. A read receipt does not confirm an attended visit or
              a paid bill.
            </p>
          </article>
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap gap-5 border-t border-line px-6 py-6 text-sm text-muted">
        <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>
        <Link className="underline underline-offset-4" href="/data-deletion">Data deletion</Link>
        <a className="underline underline-offset-4" href="mailto:contact@bluveratechnologies.com">Contact</a>
      </footer>
    </div>
  );
}
