import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How OmniRemind collects, uses, stores, and protects information.",
};

const sections = [
  {
    title: "Information we process",
    body: (
      <>
        <p>
          We process information needed to provide OmniRemind to business workspaces:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Workspace operator account email, workspace name, type, timezone, and currency.</li>
          <li>Reminder recipient names and phone numbers, scheduled times, template values, optional estimated values, and CRM reference IDs supplied by the business.</li>
          <li>WhatsApp message IDs, send and delivery statuses, timestamps, and error details returned by Meta.</li>
          <li>Workspace WhatsApp configuration, including phone number ID, access token, and app secret.</li>
          <li>Internal sending-credit balance and transaction records, plus API key hashes and prefixes for CRM integrations.</li>
          <li>Basic technical and security information generated when the service runs, such as request errors and hosting logs.</li>
        </ul>
        <p className="mt-3">
          UPI links are generated in the browser. If a business inserts one into a WhatsApp template value, it is stored with that reminder and sent through Meta. OmniRemind does not process or confirm UPI payments, and does not collect payment-card or bank-login details.
        </p>
      </>
    ),
  },
  {
    title: "How we use information",
    body: (
      <p>
        We use information to create and manage workspaces, queue and send requested reminders, show message statuses, operate internal sending credits, provide CRM integrations, protect accounts, troubleshoot errors, and maintain the service. We do not sell business or recipient data and do not use reminder data for advertising.
      </p>
    ),
  },
  {
    title: "Business and recipient information",
    body: (
      <p>
        A business decides which recipient information and message content to enter and when to send it. The business is responsible for having the rights, notices, and permissions needed to contact its recipients and for complying with applicable messaging rules. Recipients should direct requests about a particular appointment, fee, or order to the business that sent the reminder. Do not enter diagnoses, treatment details, or other clinical records into OmniRemind template values.
      </p>
    ),
  },
  {
    title: "When information is shared",
    body: (
      <>
        <p>We share only what is needed to run the service with these providers:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Meta Platforms, Inc.</strong> receives the sender number ID, recipient phone number, approved template and its values when a business sends through WhatsApp Cloud API. Meta returns delivery events and processes information under its own terms and privacy policy.
          </li>
          <li>
            <strong>Supabase</strong> provides authentication and the database that stores workspace and reminder information.
          </li>
          <li>
            <strong>Vercel</strong> hosts the application and processes requests and operational logs needed to deliver it.
          </li>
        </ul>
        <p className="mt-3">
          We may also disclose information when required by law or to protect the service, its users, or others. We do not sell it or share it with data brokers.
        </p>
      </>
    ),
  },
  {
    title: "Storage, security, and retention",
    body: (
      <>
        <p>
          Workspace records are separated by tenant and protected with database access policies. Meta credentials are stored server-side and are not readable by regular workspace members. Connections to the app and Supabase APIs use HTTPS/TLS. Supabase and Vercel document encryption at rest for their hosted data; their platform controls and terms also apply.
        </p>
        <p className="mt-3">
          We keep workspace and reminder information while the workspace is active and as needed to operate and secure the service. A verified deletion request removes the workspace data from the active application database. Encrypted backups and provider security logs may remain until they expire under the providers’ normal retention cycles or applicable legal requirements.
        </p>
      </>
    ),
  },
  {
    title: "Privacy and deletion requests",
    body: (
      <p>
        Workspace owners can request access, correction, or deletion of workspace data by emailing{" "}
        <a className="underline underline-offset-4" href="mailto:contact@bluveratechnologies.com">
          contact@bluveratechnologies.com
        </a>
        {" "}from their account email and naming the workspace. We may verify the requester before acting. For details, see our{" "}
        <a className="underline underline-offset-4" href="/data-deletion">data deletion instructions</a>.
      </p>
    ),
  },
  {
    title: "Cookies and changes",
    body: (
      <p>
        OmniRemind uses necessary authentication/session cookies to sign users in and protect workspace access. We do not use advertising cookies. We may update this policy as the service changes; the date below shows the latest revision.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-full max-w-4xl px-6 py-12 md:py-20">
      <a href="/" className="font-serif text-2xl tracking-tight">OmniRemind</a>
      <header className="mt-12 border-b border-line pb-8">
        <p className="text-sm text-pine">Privacy</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted">Effective date: November 7, 2026</p>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          This policy explains how OmniRemind processes information when businesses use our appointment and notification scheduling service.
        </p>
      </header>
      <div className="divide-y divide-line">
        {sections.map(({ title, body }) => (
          <section key={title} className="py-7 text-sm leading-7 text-ink">
            <h2 className="mb-3 font-serif text-2xl">{title}</h2>
            {body}
          </section>
        ))}
      </div>
      <footer className="border-t border-line pt-6 text-sm text-muted">
        <a className="underline underline-offset-4" href="/data-deletion">Data deletion instructions</a>
      </footer>
    </main>
  );
}
