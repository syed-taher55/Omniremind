import { ReminderTable, type ReminderRow } from "@/components/reminder-table";
import { ScheduleForm } from "@/components/schedule-form";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const { supabase, tenant } = await requireWorkspace();
  const { data, error } = await supabase
    .from("reminders")
    .select("id, recipient_name, phone_e164, send_at, status, last_error, estimated_value_cents, source")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">Reminders</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Template values fill {"{{1}}"}, {"{{2}}"}, and {"{{3}}"} in that order. The queue holds the row until the send time.
        </p>
      </header>
      <ScheduleForm timeZone={tenant.timezone} />
      <ReminderTable
        rows={(data ?? []) as ReminderRow[]}
        timeZone={tenant.timezone}
        currency={tenant.currency}
      />
    </div>
  );
}
