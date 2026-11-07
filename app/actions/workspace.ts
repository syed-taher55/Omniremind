"use server";

import { revalidatePath } from "next/cache";
import { MAX_CSV_ROWS, MAX_UPLOAD_BYTES } from "@/lib/constants";
import {
  isAdminConfigured,
  isPlatformAdmin,
  selfTopUpEnabled,
} from "@/lib/env";
import { newApiKey } from "@/lib/keys";
import { insertReminders, parseScheduleDraft } from "@/lib/schedule";
import { createAdmin } from "@/lib/supabase/admin";
import { isCurrency, isTimeZone } from "@/lib/time";
import { verticals, type ActionState, type ValidReminder, type Vertical } from "@/lib/types";
import { requireWorkspace } from "@/lib/workspace";

function amountFrom(formData: FormData) {
  const amount = Number(formData.get("amount"));
  if (!Number.isInteger(amount) || amount < 1 || amount > 100_000) return null;
  return amount;
}

export async function scheduleReminder(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, tenant } = await requireWorkspace();
  const parsed = parseScheduleDraft(
    {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      sendAt: String(formData.get("send_at") ?? ""),
      params: [
        String(formData.get("param_1") ?? ""),
        String(formData.get("param_2") ?? ""),
        String(formData.get("param_3") ?? ""),
      ],
      estimatedValue: String(formData.get("value") ?? ""),
      externalId: String(formData.get("external_id") ?? ""),
    },
    tenant.timezone,
    "Reminder",
  );
  if (!parsed.ok) return { error: parsed.error };
  const result = await insertReminders(supabase, tenant.id, "manual", [parsed.value]);
  if (result.error) return { error: result.error, notice: undefined };
  revalidatePath("/app");
  revalidatePath("/app/reminders");
  return { notice: "Reminder is in the queue." };
}

export async function importReminders(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, tenant } = await requireWorkspace();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV or Excel file." };
  }
  if (file.size > MAX_UPLOAD_BYTES) return { error: "File is larger than 1 MB." };
  const { parseUpload } = await import("@/lib/sheet");
  const parsedFile = parseUpload(Buffer.from(await file.arrayBuffer()));
  if (parsedFile.error) return { error: parsedFile.error };
  if (parsedFile.rows.length === 0) return { error: "No reminder rows were found." };
  if (parsedFile.rows.length > MAX_CSV_ROWS) {
    return { error: `Import up to ${MAX_CSV_ROWS} rows at a time.` };
  }
  const valid: ValidReminder[] = [];
  const errors: string[] = [];
  parsedFile.rows.forEach((row, index) => {
    const parsed = parseScheduleDraft(
      {
        name: row.name,
        phone: row.phone,
        sendAt: row.sendAt,
        params: row.params,
        estimatedValue: row.value,
        externalId: row.externalId,
      },
      tenant.timezone,
      `Row ${index + 2}`,
    );
    if (parsed.ok) valid.push(parsed.value);
    else errors.push(parsed.error);
  });
  if (valid.length === 0) {
    return { error: errors.slice(0, 3).join(" ") || "Nothing to schedule." };
  }
  const result = await insertReminders(supabase, tenant.id, "csv", valid);
  revalidatePath("/app");
  revalidatePath("/app/reminders");
  const skipped = errors.length ? ` ${errors.length} rows skipped.` : "";
  const detail = errors.slice(0, 2).join(" ");
  if (result.error) return { error: `${result.error}${skipped} ${detail}`.trim() };
  return { notice: `Scheduled ${result.scheduled} reminders.${skipped} ${detail}`.trim() };
}

export async function retryReminder(formData: FormData) {
  const { supabase, tenant } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("reminders")
    .update({
      status: "pending",
      last_error: null,
      claimed_at: null,
      send_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .eq("status", "failed");
  if (error) console.error("retry failed", error.code);
  revalidatePath("/app/reminders");
}

export async function saveSettings(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, tenant, role } = await requireWorkspace();
  if (role !== "owner") return { error: "Only the workspace owner can change settings." };
  const name = String(formData.get("name") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? tenant.vertical);
  const timezone = String(formData.get("timezone") ?? tenant.timezone).trim();
  const currency = String(formData.get("currency") ?? tenant.currency).trim().toUpperCase();
  const phoneNumberId = String(formData.get("phone_number_id") ?? "").trim();
  const templateName = String(formData.get("template_name") ?? "").trim();
  const templateLanguage = String(formData.get("template_language") ?? "").trim();
  const accessToken = String(formData.get("access_token") ?? "").trim();
  const appSecret = String(formData.get("app_secret") ?? "").trim();
  const clearToken = formData.get("clear_token") === "on";
  const clearSecret = formData.get("clear_secret") === "on";

  if (name.length < 2 || name.length > 80) {
    return { error: "Business name must be 2 to 80 characters." };
  }
  if (!verticals.includes(vertical as Vertical)) return { error: "Choose a valid workspace type." };
  if (!isTimeZone(timezone)) return { error: "Timezone is not recognized." };
  if (!isCurrency(currency)) return { error: "Currency must be a 3-letter code such as USD or INR." };
  if (phoneNumberId && !/^\d{6,30}$/.test(phoneNumberId)) {
    return { error: "Phone number ID should be the digits from Meta." };
  }
  if (!/^[a-z0-9_]{1,64}$/.test(templateName)) {
    return { error: "Template name uses lowercase letters, numbers, and underscores." };
  }
  if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(templateLanguage)) {
    return { error: "Language should look like en or en_US." };
  }
  if (accessToken.length > 2000 || appSecret.length > 500) {
    return { error: "That credential is too long." };
  }

  const { error: tenantError } = await supabase
    .from("tenants")
    .update({ name, vertical, timezone, currency })
    .eq("id", tenant.id);
  if (tenantError) return { error: "Could not update the workspace." };

  const { error: metaError } = await supabase
    .from("meta_settings")
    .update({
      phone_number_id: phoneNumberId,
      template_name: templateName,
      template_language: templateLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenant.id);
  if (metaError) {
    if (metaError.code === "23505") {
      return { error: "That phone number ID is already used by another workspace." };
    }
    return { error: "Could not update WhatsApp settings." };
  }

  if (accessToken || appSecret || clearToken || clearSecret) {
    if (!isAdminConfigured()) {
      return { error: "Public settings were saved. Add the service role key to store Meta credentials." };
    }
    const admin = createAdmin();
    const patch: { access_token?: string; app_secret?: string } = {};
    if (clearToken) patch.access_token = "";
    if (accessToken) patch.access_token = accessToken;
    if (clearSecret) patch.app_secret = "";
    if (appSecret) patch.app_secret = appSecret;
    const { error: secretError } = await admin
      .from("meta_secrets")
      .update(patch)
      .eq("tenant_id", tenant.id);
    if (secretError) return { error: "Could not store the Meta credential." };
  }

  revalidatePath("/app", "layout");
  return { notice: "Settings saved." };
}

export async function createKey(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, tenant, role } = await requireWorkspace();
  if (role !== "owner") return { error: "Only the workspace owner can create API keys." };
  const name = String(formData.get("name") ?? "CRM").trim().slice(0, 40) || "CRM";
  const key = newApiKey();
  const { error } = await supabase.from("api_keys").insert({
    tenant_id: tenant.id,
    name,
    key_prefix: key.prefix,
    key_hash: key.hash,
  });
  if (error) return { error: "Could not create an API key." };
  revalidatePath("/app/developers");
  return { notice: "Copy this key now. It is stored only as a hash.", token: key.token };
}

export async function revokeKey(formData: FormData) {
  const { supabase, tenant, role } = await requireWorkspace();
  if (role !== "owner") return;
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .is("revoked_at", null);
  revalidatePath("/app/developers");
}

export async function topUpOwn(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { tenant, role, user } = await requireWorkspace();
  const allowed = role === "owner" && (selfTopUpEnabled() || isPlatformAdmin(user.email));
  if (!allowed) return { error: "Prepaid credits are added by the platform operator." };
  return grantToTenant(tenant.id, amountFrom(formData), "self_topup");
}

export async function grantCredits(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireWorkspace();
  if (!isPlatformAdmin(user.email)) return { error: "Operator access only." };
  const tenantId = String(formData.get("tenant_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
    return { error: "Choose a workspace." };
  }
  return grantToTenant(tenantId, amountFrom(formData), "prepaid_grant");
}

async function grantToTenant(
  tenantId: string,
  amount: number | null,
  reason: string,
): Promise<ActionState> {
  if (!amount) return { error: "Enter a whole number of credits from 1 to 100000." };
  if (!isAdminConfigured()) return { error: "Add the Supabase service role key before granting credits." };
  const admin = createAdmin();
  const { data, error } = await admin.rpc("add_credits", {
    p_tenant: tenantId,
    p_amount: amount,
    p_reason: reason,
    p_release: true,
  });
  if (error) {
    console.error("grant failed", error.code);
    return { error: "Could not add credits." };
  }
  revalidatePath("/app", "layout");
  return { notice: `Balance is now ${data} credits. Paused reminders are waiting again.` };
}
