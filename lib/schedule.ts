import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_TEMPLATE_PARAMS } from "@/lib/constants";
import { moneyToCents } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { parseSendAt } from "@/lib/time";
import type { ScheduleDraft, ValidReminder } from "@/lib/types";

export function cleanParam(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
}

export function parseScheduleDraft(
  draft: ScheduleDraft,
  timeZone: string,
  label: string,
): { ok: true; value: ValidReminder } | { ok: false; error: string } {
  const name = draft.name.trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) {
    return { ok: false, error: `${label}: name must be 1 to 120 characters.` };
  }
  const phone = normalizePhone(draft.phone);
  if (!phone) {
    const scientific = /e\+/i.test(draft.phone);
    return {
      ok: false,
      error: scientific
        ? `${label}: format the phone column as text so spreadsheet apps keep every digit.`
        : `${label}: phone needs a country code and 8 to 15 digits.`,
    };
  }
  const when = parseSendAt(draft.sendAt, timeZone);
  if (!when) {
    return {
      ok: false,
      error: `${label}: use a send time like 2026-12-01 09:00 in the workspace timezone.`,
    };
  }
  const horizon = Date.now() + 366 * 24 * 60 * 60 * 1000;
  if (when.getTime() > horizon) {
    return { ok: false, error: `${label}: send time is more than a year away.` };
  }
  const params = draft.params.map(cleanParam);
  while (params.length > 0 && params[params.length - 1] === "") params.pop();
  if (params.length > MAX_TEMPLATE_PARAMS) {
    return { ok: false, error: `${label}: use at most ${MAX_TEMPLATE_PARAMS} template values.` };
  }
  if (params.some((param) => param.length === 0 || param.length > 200)) {
    return {
      ok: false,
      error: `${label}: fill template values in order, each under 200 characters.`,
    };
  }
  const valueInput =
    draft.estimatedValue === null || draft.estimatedValue === undefined
      ? ""
      : String(draft.estimatedValue).trim();
  const cents = moneyToCents(valueInput);
  if (cents === null) {
    return { ok: false, error: `${label}: estimated value must be a positive amount.` };
  }
  const external = (draft.externalId ?? "").trim();
  if (external.length > 80) {
    return { ok: false, error: `${label}: external id must be 80 characters or fewer.` };
  }
  return {
    ok: true,
    value: {
      name,
      phone,
      sendAtIso: when.toISOString(),
      params,
      estimatedValueCents: cents,
      externalId: external || null,
    },
  };
}

export async function insertReminders(
  client: SupabaseClient,
  tenantId: string,
  source: "manual" | "csv" | "api",
  rows: ValidReminder[],
) {
  const payload = rows.map((row) => ({
    tenant_id: tenantId,
    recipient_name: row.name,
    phone_e164: row.phone,
    send_at: row.sendAtIso,
    template_params: row.params,
    estimated_value_cents: row.estimatedValueCents,
    external_id: row.externalId,
    source,
    status: "pending",
  }));
  for (let index = 0; index < payload.length; index += 200) {
    const chunk = payload.slice(index, index + 200);
    const { error } = await client.from("reminders").insert(chunk);
    if (error) {
      console.error("reminder insert failed", error.code);
      if (error.code === "23505") {
        return {
          scheduled: index,
          error: "An external id in this batch is already used. Later rows were not saved.",
        };
      }
      return {
        scheduled: index,
        error:
          index > 0
            ? `Saved ${index} reminders, then the next batch failed.`
            : "Could not store reminders.",
      };
    }
  }
  return { scheduled: payload.length, error: null as string | null };
}
