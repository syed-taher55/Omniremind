"use client";

import { useActionState } from "react";
import { importReminders } from "@/app/actions/workspace";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function ImportForm() {
  const [state, action] = useActionState(importReminders, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="CSV or Excel" hint="Columns: name, phone, send_at, value, param_1, param_2, param_3, external_id.">
        <input className={inputClass} name="file" type="file" accept=".csv,.xlsx,.xls,text/csv" required />
      </Field>
      <FormNote state={state} />
      <SubmitButton pendingLabel="Importing…">Import rows</SubmitButton>
    </form>
  );
}
