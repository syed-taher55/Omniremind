"use client";

import { useActionState, useEffect, useRef } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function SignInForm() {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Email">
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <input className={inputClass} name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormNote state={state} />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUp, {});
  const zoneRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zoneRef.current && detected) zoneRef.current.value = detected;
  }, []);
  return (
    <form action={action} className="space-y-4">
      <Field label="Business name">
        <input className={inputClass} name="business" required minLength={2} maxLength={80} />
      </Field>
      <Field label="Workspace type">
        <select className={inputClass} name="vertical" defaultValue="hospital">
          <option value="hospital">Hospital</option>
          <option value="school">School</option>
          <option value="retail">Retail shop</option>
        </select>
      </Field>
      <input ref={zoneRef} type="hidden" name="timezone" defaultValue="UTC" />
      <Field label="Email">
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormNote state={state} />
      <SubmitButton pendingLabel="Creating…">Create workspace</SubmitButton>
    </form>
  );
}
