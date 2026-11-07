"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions/workspace";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import type { Tenant } from "@/lib/types";

const zones = [
  "UTC",
  "Africa/Lagos",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
];

export function SettingsForm({
  tenant,
  phoneNumberId,
  templateName,
  templateLanguage,
  hasToken,
  hasSecret,
}: {
  tenant: Tenant;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
  hasToken: boolean;
  hasSecret: boolean;
}) {
  const [state, action] = useActionState(saveSettings, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field label="Business name">
        <input className={inputClass} name="name" defaultValue={tenant.name} required />
      </Field>
      <Field label="Type">
        <select className={inputClass} name="vertical" defaultValue={tenant.vertical}>
          <option value="hospital">Hospital</option>
          <option value="school">School</option>
          <option value="retail">Retail shop</option>
        </select>
      </Field>
      <Field label="Timezone">
        <input className={inputClass} name="timezone" list="zones" defaultValue={tenant.timezone} required />
        <datalist id="zones">
          {zones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </Field>
      <Field label="Currency">
        <input className={inputClass} name="currency" defaultValue={tenant.currency} maxLength={3} required />
      </Field>
      <Field label="Meta phone number ID">
        <input className={inputClass} name="phone_number_id" defaultValue={phoneNumberId} inputMode="numeric" />
      </Field>
      <Field label="Template name" hint="Approved utility template, for example reminder_notice.">
        <input className={inputClass} name="template_name" defaultValue={templateName} required />
      </Field>
      <Field label="Template language">
        <input className={inputClass} name="template_language" defaultValue={templateLanguage} required />
      </Field>
      <Field label="Access token" hint={hasToken ? "A token is saved. Leave blank to keep it." : "Paste the token from this business Meta app."}>
        <input className={inputClass} name="access_token" type="password" autoComplete="off" />
      </Field>
      <Field label="App secret" hint={hasSecret ? "A secret is saved. Leave blank to keep it." : "Used to verify WhatsApp status webhooks."}>
        <input className={inputClass} name="app_secret" type="password" autoComplete="off" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input name="clear_token" type="checkbox" />
        Remove the saved token
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="clear_secret" type="checkbox" />
        Remove the saved app secret
      </label>
      <div className="md:col-span-2 space-y-3">
        <FormNote state={state} />
        <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
