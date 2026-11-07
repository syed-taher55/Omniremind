import { revokeKey } from "@/app/actions/workspace";
import { KeyForm } from "@/components/key-form";
import { SubmitButton } from "@/components/submit-button";
import { requestOrigin } from "@/lib/origin";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "API" };

export default async function DevelopersPage() {
  const { supabase, tenant, role } = await requireWorkspace();
  const origin = await requestOrigin();
  const endpoint = `${origin || ""}/api/v1/reminders`;
  if (role !== "owner") {
    return <p className="text-sm text-muted">Only the owner can manage API keys.</p>;
  }
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, revoked_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">API</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Point a CRM at this workspace. The key selects the tenant. A tenant id in the body is ignored.
        </p>
      </header>
      <KeyForm />
      <ul className="divide-y divide-line text-sm">
        {(data ?? []).map((key) => (
          <li key={key.id} className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className="block">{key.name}</span>
              <span className="font-mono text-xs text-muted">{key.key_prefix}…</span>
              {key.revoked_at ? <span className="ml-2 text-xs text-clay">Revoked</span> : null}
            </span>
            {key.revoked_at ? null : (
              <form action={revokeKey}>
                <input type="hidden" name="id" value={key.id} />
                <SubmitButton pendingLabel="Revoking…">Revoke</SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>
      <pre className="overflow-x-auto rounded-3xl bg-ink p-4 text-xs leading-6 text-paper">{`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer omni_..." \\
  -H "Content-Type: application/json" \\
  -d '{"reminders":[{"name":"Ada","phone":"15551234567","send_at":"2026-12-01 09:00","params":["Ada","City Clinic","9:00 AM"],"estimated_value":75,"external_id":"visit-1001"}]}'`}</pre>
    </div>
  );
}
