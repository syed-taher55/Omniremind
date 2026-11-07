import { retryReminder } from "@/app/actions/workspace";
import { StatusPill } from "@/components/status-pill";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney } from "@/lib/money";
import { formatInZone } from "@/lib/time";

export type ReminderRow = {
  id: string;
  recipient_name: string;
  phone_e164: string;
  send_at: string;
  status: string;
  last_error: string | null;
  estimated_value_cents: number;
  source: string;
};

export function ReminderTable({
  rows,
  timeZone,
  currency,
}: {
  rows: ReminderRow[];
  timeZone: string;
  currency: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No reminders yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th className="py-2 font-medium">Recipient</th>
            <th className="py-2 font-medium">When</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Value</th>
            <th className="py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line align-top">
              <td className="py-3 pr-4">
                <span className="block">{row.recipient_name}</span>
                <span className="text-xs text-muted">+{row.phone_e164}</span>
              </td>
              <td className="py-3 pr-4 tabular-nums">{formatInZone(row.send_at, timeZone)}</td>
              <td className="py-3 pr-4">
                <StatusPill status={row.status} />
                {row.last_error ? (
                  <span className="mt-1 block max-w-xs text-xs text-clay">{row.last_error}</span>
                ) : null}
                {row.status === "failed" ? (
                  <form action={retryReminder} className="mt-2">
                    <input type="hidden" name="id" value={row.id} />
                    <SubmitButton pendingLabel="Queuing…">Retry</SubmitButton>
                  </form>
                ) : null}
              </td>
              <td className="py-3 pr-4 tabular-nums">
                {formatMoney(row.estimated_value_cents, currency)}
              </td>
              <td className="py-3 capitalize text-muted">{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
