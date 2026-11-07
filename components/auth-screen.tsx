import Link from "next/link";

export function AuthScreen({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-serif text-3xl tracking-tight">
        OmniRemind
      </Link>
      <h1 className="mt-8 font-serif text-4xl tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{lede}</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function SetupHelp() {
  return (
    <div className="rounded-3xl border border-line bg-card p-5 text-sm leading-6">
      <p>Add a free Supabase project, then copy `.env.example` to `.env.local`.</p>
      <p className="mt-3">Run `supabase/001_init.sql` in the SQL editor before the first signup. The signup trigger creates the workspace, wallet, and empty WhatsApp settings.</p>
    </div>
  );
}

export function FormNote({ state }: { state: { error?: string; notice?: string } }) {
  if (state.error) return <p className="text-sm text-clay">{state.error}</p>;
  if (state.notice) return <p className="text-sm text-pine">{state.notice}</p>;
  return null;
}
