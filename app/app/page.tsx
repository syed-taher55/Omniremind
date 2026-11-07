import { ReminderTable, type ReminderRow } from "@/components/reminder-table";
import { formatMoney } from "@/lib/money";
import { verticalCopy } from "@/lib/types";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Reminder impact" };

const pipeline = ["pending", "paused", "sending", "sent", "delivered", "read", "failed"];

export default async function OverviewPage() {
  const { supabase, tenant } = await requireWorkspace();
  const [{ data: stats, error }, { data: recent }] = await Promise.all([
    supabase.rpc("reminder_stats"),
    supabase
      .from("reminders")
      .select("id, recipient_name, phone_e164, send_at, status, last_error, estimated_value_cents, source")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  let readValue = 0;
  for (const row of stats ?? []) {
    counts[row.status] = Number(row.n);
    if (row.status === "read") readValue = Number(row.value_cents);
  }
  const read = counts.read ?? 0;
  const attempted =
    (counts.sent ?? 0) + (counts.delivered ?? 0) + read + (counts.failed ?? 0);
  const rate = attempted === 0 ? null : Math.round((read / attempted) * 100);
  const copy = verticalCopy[tenant.vertical];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">Reminder impact</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          {copy.recovery}. Estimated from reminder values and read receipts; this does not confirm an appointment took place or a payment was made.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-line bg-card p-5">
          <p className="text-xs text-muted">Read</p>
          <p className="mt-2 font-serif text-5xl tabular-nums">{read}</p>
        </article>
        <article className="rounded-3xl border border-line bg-card p-5">
          <p className="text-xs text-muted">Read rate</p>
          <p className="mt-2 font-serif text-5xl tabular-nums">{rate === null ? "n/a" : `${rate}%`}</p>
          <p className="mt-2 text-xs text-muted">Read receipts divided by messages Meta accepted or rejected.</p>
        </article>
        <article className="rounded-3xl bg-pine p-5 text-paper">
          <p className="text-xs text-paper/80">Estimated value of read reminders</p>
          <p className="mt-2 font-serif text-5xl tabular-nums">{formatMoney(readValue, tenant.currency)}</p>
        </article>
      </section>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-7">
        {pipeline.map((status) => (
          <article key={status} className="rounded-2xl bg-sand px-3 py-3">
            <p className="text-xs capitalize text-muted">{status}</p>
            <p className="mt-1 font-serif text-2xl tabular-nums">{counts[status] ?? 0}</p>
          </article>
        ))}
      </section>
      <section>
        <h2 className="mb-3 font-serif text-2xl">Latest reminders</h2>
        <ReminderTable
          rows={(recent ?? []) as ReminderRow[]}
          timeZone={tenant.timezone}
          currency={tenant.currency}
        />
      </section>
    </div>
  );
}
