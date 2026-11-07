"use client";

import { useActionState } from "react";
import { scheduleReminder } from "@/app/actions/workspace";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function ScheduleForm({ timeZone }: { timeZone: string }) {
  const [state, action] = useActionState(scheduleReminder, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field label="Name">
        <input className={inputClass} name="name" required />
      </Field>
      <Field label="Phone" hint="Country code, digits only or with a plus.">
        <input className={inputClass} name="phone" required inputMode="tel" />
      </Field>
      <Field label="Send at" hint={`Wall time in ${timeZone}. A past time goes on the next pass.`}>
        <input className={inputClass} name="send_at" type="datetime-local" required />
      </Field>
      <Field label="Estimated value" hint="Visit, fee, or order amount. Used only after a read receipt.">
        <input className={inputClass} name="value" inputMode="decimal" placeholder="0.00" />
      </Field>
      <Field label="Template value 1">
        <input className={inputClass} name="param_1" />
      </Field>
      <Field label="Template value 2">
        <input className={inputClass} name="param_2" />
      </Field>
      <Field label="Template value 3">
        <input className={inputClass} name="param_3" />
      </Field>
      <Field label="External id" hint="Optional. Your CRM id, kept unique inside this workspace.">
        <input className={inputClass} name="external_id" />
      </Field>
      <div className="md:col-span-2 space-y-3">
        <FormNote state={state} />
        <SubmitButton pendingLabel="Queuing…">Queue reminder</SubmitButton>
      </div>
    </form>
  );
}
