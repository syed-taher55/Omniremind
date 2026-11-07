"use client";

import { useActionState } from "react";
import { grantCredits, topUpOwn } from "@/app/actions/workspace";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function TopUpForm() {
  const [state, action] = useActionState(topUpOwn, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="OmniRemind sending credits to add">
        <input className={inputClass} name="amount" type="number" min={1} max={100000} step={1} required />
      </Field>
      <FormNote state={state} />
      <SubmitButton pendingLabel="Adding…">Add credits</SubmitButton>
    </form>
  );
}

export function GrantForm({
  tenants,
}: {
  tenants: Array<{ id: string; name: string; balance: number }>;
}) {
  const [state, action] = useActionState(grantCredits, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Workspace">
        <select className={inputClass} name="tenant_id" required defaultValue={tenants[0]?.id ?? ""}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} · {tenant.balance} credits
            </option>
          ))}
        </select>
      </Field>
      <Field label="Credits">
        <input className={inputClass} name="amount" type="number" min={1} max={100000} step={1} required />
      </Field>
      <FormNote state={state} />
      <SubmitButton pendingLabel="Granting…">Grant sending credits</SubmitButton>
    </form>
  );
}
