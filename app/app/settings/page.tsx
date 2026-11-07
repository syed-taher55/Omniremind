import { SettingsForm } from "@/components/settings-form";
import { verifyToken } from "@/lib/env";
import { requestOrigin } from "@/lib/origin";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "WhatsApp" };

export default async function SettingsPage() {
  const { supabase, tenant, role } = await requireWorkspace();
  const origin = await requestOrigin();
  const [{ data: settings, error }, { data: flags }] = await Promise.all([
    supabase
      .from("meta_settings")
      .select("phone_number_id, template_name, template_language")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase.rpc("secret_flags"),
  ]);
  if (error || !settings) throw new Error(error?.message || "WhatsApp settings are missing.");
  const flag = Array.isArray(flags) ? flags[0] : flags;
  const callback = origin ? `${origin}/api/webhooks/whatsapp` : "/api/webhooks/whatsapp";
  const token = verifyToken();

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">WhatsApp</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Create a utility template such as “Hello {"{{1}}"}, this is a reminder from {"{{2}}"} about {"{{3}}"}.”
          Approve it in this business Meta app, then match the name here.
        </p>
      </header>
      {role === "owner" ? (
        <SettingsForm
          tenant={tenant}
          phoneNumberId={settings.phone_number_id}
          templateName={settings.template_name}
          templateLanguage={settings.template_language}
          hasToken={Boolean(flag?.has_token)}
          hasSecret={Boolean(flag?.has_secret)}
        />
      ) : (
        <p className="text-sm text-muted">Only the owner can change WhatsApp settings.</p>
      )}
      <section className="rounded-3xl border border-line bg-card p-5 text-sm leading-6">
        <h2 className="font-serif text-2xl">Status callback</h2>
        <p className="mt-2 text-muted">
          In the Meta app, set the callback URL and verify token. Status events move a reminder from sent to delivered to read.
        </p>
        <p className="mt-3 break-all font-mono text-xs">{callback}</p>
        <p className="mt-2 font-mono text-xs">{token || "Set WHATSAPP_VERIFY_TOKEN in the server environment."}</p>
      </section>
    </div>
  );
}
