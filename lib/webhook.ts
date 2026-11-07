import { createHmac, timingSafeEqual } from "crypto";
import { createAdmin } from "@/lib/supabase/admin";
import { clipError, nextStatus } from "@/lib/status";

type StatusEvent = {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{ title?: string; message?: string }>;
};

type Payload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        statuses?: StatusEvent[];
      };
    }>;
  }>;
};

function signaturesMatch(secret: string, rawBody: string, header: string | null) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = header.slice("sha256=".length);
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function applyWebhook(rawBody: string, signature: string | null) {
  let payload: Payload;
  try {
    payload = JSON.parse(rawBody) as Payload;
  } catch {
    return { ok: false as const, status: 400 };
  }
  const phoneId = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  if (!phoneId) return { ok: true as const, status: 200 };

  const admin = createAdmin();
  const { data: settings } = await admin
    .from("meta_settings")
    .select("tenant_id")
    .eq("phone_number_id", phoneId)
    .maybeSingle();
  if (!settings) return { ok: true as const, status: 200 };

  const { data: secrets } = await admin
    .from("meta_secrets")
    .select("app_secret")
    .eq("tenant_id", settings.tenant_id)
    .maybeSingle();
  const secret = secrets?.app_secret ?? "";
  if (!secret || !signaturesMatch(secret, rawBody, signature)) {
    return { ok: false as const, status: 401 };
  }

  const statuses =
    payload.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.statuses ?? []) ?? [],
    ) ?? [];

  for (const event of statuses) {
    if (!event.id || !event.status) continue;
    const { data: row } = await admin
      .from("reminders")
      .select("id, status")
      .eq("tenant_id", settings.tenant_id)
      .eq("wa_message_id", event.id)
      .maybeSingle();
    if (!row) continue;
    const next = nextStatus(row.status, event.status);
    if (!next) continue;
    const at = event.timestamp
      ? new Date(Number(event.timestamp) * 1000).toISOString()
      : new Date().toISOString();
    const patch: Record<string, string | null> = {
      status: next,
      last_error: null,
    };
    if (next === "sent") patch.sent_at = at;
    if (next === "delivered") patch.delivered_at = at;
    if (next === "read") patch.read_at = at;
    if (next === "failed") {
      const reason = event.errors?.[0]?.message || event.errors?.[0]?.title || "WhatsApp reported a failure.";
      patch.last_error = clipError(reason);
    }
    await admin.from("reminders").update(patch).eq("id", row.id).eq("status", row.status);
  }
  return { ok: true as const, status: 200 };
}
