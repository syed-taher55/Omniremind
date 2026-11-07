import Link from "next/link";
import { ImportForm } from "@/components/import-form";

export const metadata = { title: "Import" };

export default function ImportPage() {
  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">Import</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Upload up to 500 rows. Times without a timezone are read as this workspace clock. In Excel, format the phone column as text.
        </p>
      </header>
      <p className="text-sm">
        <Link href="/sample-reminders.csv" className="underline">
          Download a sample CSV
        </Link>
      </p>
      <ImportForm />
    </div>
  );
}
