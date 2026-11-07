import { notFound } from "next/navigation";
import { GrantForm } from "@/components/credit-forms";
import { isAdminConfigured, isPlatformAdmin } from "@/lib/env";
import { createAdmin } from "@/lib/supabase/admin";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Operator" };

type TenantRow = {
  id: string;
  name: string;
  vertical: string;
  wallets: { balance_credits: number } | { balance_credits: number }[] | null;
};

function balanceOf(wallets: TenantRow["wallets"]) {
  if (!wallets) return 0;
  const row = Array.isArray(wallets) ? wallets[0] : wallets;
  return row?.balance_credits ?? 0;
}

export default async function OperatorPage() {
  const { user } = await requireWorkspace();
  if (!isPlatformAdmin(user.email)) notFound();
  if (!isAdminConfigured()) {
    return <p className="text-sm">Add SUPABASE_SERVICE_ROLE_KEY before granting credits.</p>;
  }
  const admin = createAdmin();
  const { data, error } = await admin
    .from("tenants")
    .select("id, name, vertical, wallets(balance_credits)")
    .order("name")
    .limit(100);
  if (error) throw new Error(error.message);
  const tenants = ((data ?? []) as TenantRow[]).map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    vertical: tenant.vertical,
    balance: balanceOf(tenant.wallets),
  }));

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">Operator</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Grant prepaid credits to a workspace. Paused reminders return to the queue.
        </p>
      </header>
      {tenants.length > 0 ? <GrantForm tenants={tenants} /> : <p className="text-sm">No workspaces yet.</p>}
      <ul className="divide-y divide-line text-sm">
        {tenants.map((tenant) => (
          <li key={tenant.id} className="flex items-center justify-between py-3">
            <span>
              <span className="block">{tenant.name}</span>
              <span className="text-xs capitalize text-muted">{tenant.vertical}</span>
            </span>
            <span className="tabular-nums">{tenant.balance}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
