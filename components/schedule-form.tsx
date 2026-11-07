"use client";

import { useActionState, useMemo, useState } from "react";
import { scheduleReminder } from "@/app/actions/workspace";
import { FormNote } from "@/components/auth-screen";
import { Field, inputClass } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function ScheduleForm({ timeZone }: { timeZone: string }) {
  const [state, action] = useActionState(scheduleReminder, {});
  const [params, setParams] = useState(["", "", ""]);
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const upiLink = useMemo(() => {
    const id = upiId.trim();
    if (!/^[^@\s]{2,256}@[^@\s]{2,64}$/.test(id)) return "";
    const amount = upiAmount.trim();
    if (
      amount &&
      (!/^\d{1,9}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0)
    ) {
      return "";
    }

    const query = new URLSearchParams({ pa: id, cu: "INR" });
    if (payeeName.trim()) query.set("pn", payeeName.trim());
    if (amount) query.set("am", amount);
    if (upiNote.trim()) query.set("tn", upiNote.trim());
    const link = `upi://pay?${query.toString()}`;
    return link.length <= 200 ? link : "";
  }, [upiId, payeeName, upiAmount, upiNote]);

  async function copyUpiLink() {
    if (!upiLink) return;
    try {
      await navigator.clipboard.writeText(upiLink);
      setCopyNotice("UPI link copied.");
    } catch {
      setCopyNotice("Copy was blocked by your browser. Select and copy the link above.");
    }
  }

  function useAsTemplateValue(index: number) {
    if (!upiLink) return;
    setParams((current) =>
      current.map((value, slot) => (slot === index ? upiLink : value)),
    );
    setCopyNotice(`UPI link added to template value ${index + 1}.`);
  }

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
      {params.map((value, index) => (
        <Field key={index} label={`Template value ${index + 1}`}>
          <input
            className={inputClass}
            name={`param_${index + 1}`}
            value={value}
            onChange={(event) =>
              setParams((current) =>
                current.map((item, slot) =>
                  slot === index ? event.target.value : item,
                ),
              )
            }
          />
        </Field>
      ))}
      <section className="md:col-span-2 rounded-2xl border border-line bg-sand/50 p-4">
        <h2 className="font-medium">
          UPI payment link <span className="text-muted">(optional)</span>
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Generate a UPI payment URI. Copy it, or put it in a template value that
          matches a variable in your approved WhatsApp template.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Payee UPI ID">
            <input
              className={inputClass}
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="business@bank"
              autoComplete="off"
            />
          </Field>
          <Field label="Payee name">
            <input
              className={inputClass}
              value={payeeName}
              onChange={(event) => setPayeeName(event.target.value)}
              maxLength={50}
            />
          </Field>
          <Field
            label="Amount in INR"
            hint="Optional. Leave blank if the customer should enter the amount."
          >
            <input
              className={inputClass}
              value={upiAmount}
              onChange={(event) => setUpiAmount(event.target.value)}
              inputMode="decimal"
              placeholder="500.00"
            />
          </Field>
          <Field label="Payment note">
            <input
              className={inputClass}
              value={upiNote}
              onChange={(event) => setUpiNote(event.target.value)}
              maxLength={80}
              placeholder="Appointment fee"
            />
          </Field>
        </div>
        {upiId.trim() ? (
          upiLink ? (
            <div className="mt-4 space-y-3">
              <p
                className="break-all rounded-xl border border-line bg-card p-3 font-mono text-xs"
                aria-label="Generated UPI payment link"
              >
                {upiLink}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyUpiLink}
                  className="rounded-full border border-line bg-card px-3 py-2 text-xs hover:border-ink"
                >
                  Copy link
                </button>
                {params.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => useAsTemplateValue(index)}
                    className="rounded-full border border-line bg-card px-3 py-2 text-xs hover:border-ink"
                  >
                    Use as template value {index + 1}
                  </button>
                ))}
              </div>
              {copyNotice ? (
                <p className="text-xs text-pine" aria-live="polite">
                  {copyNotice}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs text-clay">
              Check the UPI ID and amount. The generated link must fit in one
              WhatsApp template value (200 characters max).
            </p>
          )
        ) : null}
        <p className="mt-3 text-xs text-muted">
          OmniRemind only creates the link. It doesn’t collect or verify payments.
        </p>
      </section>
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
