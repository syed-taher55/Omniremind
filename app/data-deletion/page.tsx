import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions",
  description: "How to request deletion of OmniRemind workspace data.",
};

export default function DataDeletionPage() {
  return (
    <main className="mx-auto min-h-full max-w-3xl px-6 py-12 md:py-20">
      <a href="/" className="font-serif text-2xl tracking-tight">OmniRemind</a>
      <header className="mt-12 border-b border-line pb-8">
        <p className="text-sm text-pine">Privacy requests</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">Data deletion</h1>
        <p className="mt-5 text-base leading-7 text-muted">
          OmniRemind does not currently provide a self-service workspace deletion button. Workspace owners can request deletion by following these steps.
        </p>
      </header>
      <ol className="my-8 list-decimal space-y-4 pl-6 text-sm leading-7">
        <li>
          Email <a className="underline underline-offset-4" href="mailto:contact@bluveratechnologies.com">contact@bluveratechnologies.com</a> from the email address associated with the workspace owner account.
        </li>
        <li>Use the subject “OmniRemind data deletion request” and include the workspace name and account email.</li>
        <li>We will verify the request and confirm when the workspace’s active application records have been deleted.</li>
      </ol>
      <section className="rounded-2xl border border-line bg-card p-5 text-sm leading-7">
        <h2 className="font-serif text-2xl">What deletion covers</h2>
        <p className="mt-3">
          Deletion covers the workspace’s account membership, reminder records and message statuses, WhatsApp credentials, API key records, and internal credit ledger in the active application database. Encrypted backups and limited provider security logs may persist until removed through the providers’ normal retention cycles or where retention is required by law.
        </p>
        <p className="mt-3">
          If you received a reminder from a business, contact that business directly to request deletion of the recipient information it provided to OmniRemind. Meta may separately retain information it processed through WhatsApp under Meta’s own policies.
        </p>
      </section>
      <footer className="mt-8 border-t border-line pt-6 text-sm text-muted">
        <a className="underline underline-offset-4" href="/privacy">Privacy Policy</a>
      </footer>
    </main>
  );
}
