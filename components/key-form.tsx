"use client";

import { useActionState } from "react";
import { createKey } from "@/app/actions/workspace";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function KeyForm() {
  const [state, action] = useActionState(createKey, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Key name">
        <input className={inputClass} name="name" defaultValue="CRM" maxLength={40} />
      </Field>
      <FormNote state={state} />
      {state.token ? (
        <p className="overflow-x-auto rounded-2xl bg-ink px-4 py-3 font-mono text-xs text-paper">
          {state.token}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Creating…">Create API key</SubmitButton>
    </form>
  );
}
