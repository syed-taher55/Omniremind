import { MAX_API_ROWS } from "@/lib/constants";
import { hashApiKey } from "@/lib/keys";
import { insertReminders, parseScheduleDraft } from "@/lib/schedule";
import type { ValidReminder } from "@/lib/types";
import { createAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Incoming = {
  name?: unknown;
  phone?: unknown;
  send_at?: unknown;
  params?: unknown;
  estimated_value?: unknown;
  external_id?: unknown;
};

export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token.startsWith("omni_")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdmin();
  const { data: key } = await admin
    .from("api_keys")
    .select("tenant_id, revoked_at")
    .eq("key_hash", hashApiKey(token))
    .maybeSingle();
  if (!key || key.revoked_at) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: tenant } = await admin
    .from("tenants")
    .select("timezone")
    .eq("id", key.tenant_id)
    .maybeSingle();
  if (!tenant) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { reminders?: Incoming[] } & Incoming;
  try {
    body = (await request.json()) as { reminders?: Incoming[] } & Incoming;
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  const incoming = Array.isArray(body.reminders) ? body.reminders : [body];
  if (incoming.length === 0 || incoming.length > MAX_API_ROWS) {
    return Response.json(
      { error: `Send 1 to ${MAX_API_ROWS} reminders.` },
      { status: 400 },
    );
  }

  const valid: ValidReminder[] = [];
  const errors: string[] = [];
  incoming.forEach((item, index) => {
    const params = Array.isArray(item.params) ? item.params.map((value) => String(value)) : [];
    const parsed = parseScheduleDraft(
      {
        name: String(item.name ?? ""),
        phone: String(item.phone ?? ""),
        sendAt: String(item.send_at ?? ""),
        params,
        estimatedValue:
          typeof item.estimated_value === "number"
            ? Number.isFinite(item.estimated_value)
              ? item.estimated_value.toFixed(2)
              : "invalid"
            : String(item.estimated_value ?? ""),
        externalId: item.external_id == null ? "" : String(item.external_id),
      },
      tenant.timezone,
      `Item ${index + 1}`,
    );
    if (parsed.ok) valid.push(parsed.value);
    else errors.push(parsed.error);
  });
  if (valid.length === 0) {
    return Response.json({ scheduled: 0, errors }, { status: 400 });
  }
  const result = await insertReminders(admin, key.tenant_id, "api", valid);
  if (result.error) {
    return Response.json(
      { scheduled: result.scheduled, errors: [result.error, ...errors] },
      { status: 409 },
    );
  }
  return Response.json({ scheduled: result.scheduled, errors }, { status: 201 });
}
