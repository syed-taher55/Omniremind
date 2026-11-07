import {
  DISPATCH_BATCH,
  DISPATCH_BUDGET_MS,
  DISPATCH_MAX_LOOPS,
} from "@/lib/constants";
import { createAdmin } from "@/lib/supabase/admin";
import { clipError } from "@/lib/status";
import { sendTemplateMessage } from "@/lib/whatsapp";

type Claimed = {
  id: string;
  tenant_id: string;
  phone_e164: string;
  template_params: unknown;
};

type Context = {
  balance: number;
  cost: number;
  phone_number_id: string;
  access_token: string;
  template_name: string;
  template_language: string;
};

function asParams(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function firstContext(value: Context | Context[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function dispatchDue() {
  const admin = createAdmin();
  const started = Date.now();
  const totals = { sent: 0, paused: 0, failed: 0, claimed: 0 };

  for (let loop = 0; loop < DISPATCH_MAX_LOOPS; loop += 1) {
    if (Date.now() - started > DISPATCH_BUDGET_MS) break;
    await admin.rpc("release_stale_claims");
    const { data, error } = await admin.rpc("claim_due_reminders", {
      p_batch: DISPATCH_BATCH,
    });
    if (error) {
      console.error("claim failed", error.code);
      throw new Error("Could not claim due reminders.");
    }
    const claimed = (data ?? []) as Claimed[];
    if (claimed.length === 0) break;
    totals.claimed += claimed.length;

    const byTenant = new Map<string, Claimed[]>();
    for (const row of claimed) {
      const list = byTenant.get(row.tenant_id) ?? [];
      list.push(row);
      byTenant.set(row.tenant_id, list);
    }

    for (const [tenantId, rows] of byTenant) {
      const result = await dispatchTenant(admin, tenantId, rows);
      totals.sent += result.sent;
      totals.paused += result.paused;
      totals.failed += result.failed;
    }
  }
  return totals;
}

async function dispatchTenant(
  admin: ReturnType<typeof createAdmin>,
  tenantId: string,
  rows: Claimed[],
) {
  const counts = { sent: 0, paused: 0, failed: 0 };
  const { data, error } = await admin.rpc("tenant_dispatch_context", {
    p_tenant: tenantId,
  });
  const context = firstContext(data as Context | Context[] | null);
  if (error || !context) {
    await failRows(admin, rows.map((row) => row.id), "WhatsApp settings are missing.");
    counts.failed += rows.length;
    return counts;
  }
  if (!context.phone_number_id || !context.access_token || !context.template_name) {
    await failRows(
      admin,
      rows.map((row) => row.id),
      "Add a phone ID, access token, and template name before reminders can send.",
    );
    counts.failed += rows.length;
    return counts;
  }

  const affordable = Math.floor(context.balance / context.cost);
  const sending = rows.slice(0, affordable);
  const holding = rows.slice(affordable);
  if (holding.length > 0) {
    await pauseRows(admin, holding.map((row) => row.id));
    counts.paused += holding.length;
  }
  if (sending.length === 0) return counts;

  const reserved = await admin.rpc("spend_credits", {
    p_tenant: tenantId,
    p_amount: sending.length * context.cost,
    p_reason: "reminder_send",
  });
  if (reserved.error || typeof reserved.data !== "number" || reserved.data < 0) {
    await pauseRows(admin, sending.map((row) => row.id));
    counts.paused += sending.length;
    return counts;
  }

  for (const row of sending) {
    const result = await sendTemplateMessage({
      phoneNumberId: context.phone_number_id,
      accessToken: context.access_token,
      to: row.phone_e164,
      templateName: context.template_name,
      language: context.template_language || "en",
      params: asParams(row.template_params),
    });
    if ("error" in result) {
      await admin
        .from("reminders")
        .update({
          status: "failed",
          claimed_at: null,
          last_error: clipError(result.error),
        })
        .eq("id", row.id);
      await admin.rpc("add_credits", {
        p_tenant: tenantId,
        p_amount: context.cost,
        p_reason: "refund_failed_send",
        p_release: false,
      });
      counts.failed += 1;
      continue;
    }
    await admin
      .from("reminders")
      .update({
        status: "sent",
        wa_message_id: result.id,
        sent_at: new Date().toISOString(),
        claimed_at: null,
        last_error: null,
      })
      .eq("id", row.id);
    counts.sent += 1;
  }
  return counts;
}

async function failRows(
  admin: ReturnType<typeof createAdmin>,
  ids: string[],
  message: string,
) {
  await admin
    .from("reminders")
    .update({ status: "failed", claimed_at: null, last_error: message })
    .in("id", ids);
}

async function pauseRows(admin: ReturnType<typeof createAdmin>, ids: string[]) {
  await admin
    .from("reminders")
    .update({
      status: "paused",
      claimed_at: null,
      last_error: "Prepaid balance is empty, so this reminder is paused.",
    })
    .in("id", ids);
}
