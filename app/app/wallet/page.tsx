import { TopUpForm } from "@/components/credit-forms";
import { isPlatformAdmin, selfTopUpEnabled } from "@/lib/env";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Sending credits" };

export default async function WalletPage() {
  const { supabase, tenant, role, user, wallet } = await requireWorkspace();
  const { data: ledger, error } = await supabase
    .from("wallet_ledger")
    .select("id, delta, reason, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(15);
  if (error) throw new Error(error.message);
  const canTopUp = role === "owner" && (selfTopUpEnabled() || isPlatformAdmin(user.email));

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="font-serif text-4xl tracking-tight">Sending credits</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          These are OmniRemind credits, used as an internal sending allowance.
          One credit is reserved before a reminder is sent and returned if Meta
          rejects it. They are separate from WhatsApp charges, which Meta bills
          to this business.
        </p>
      </header>
      <p className="font-serif text-6xl tabular-nums">{wallet.balance_credits}</p>
      <p className="text-sm text-muted">{wallet.credit_cost_per_message} OmniRemind credit per attempted reminder.</p>
      {canTopUp ? (
        <TopUpForm />
      ) : (
        <p className="text-sm text-muted">
          Credits are issued by the platform operator.
        </p>
      )}
      <section>
        <h2 className="mb-3 font-serif text-2xl">Ledger</h2>
        {ledger && ledger.length > 0 ? (
          <ul className="divide-y divide-line text-sm">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-3">
                <span>
                  <span className="block">{entry.reason.replaceAll("_", " ")}</span>
                  <span className="text-xs text-muted">
                    {new Date(entry.created_at).toLocaleString("en-GB", { timeZone: tenant.timezone })}
                  </span>
                </span>
                <span className="tabular-nums">{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No credit movements yet.</p>
        )}
      </section>
    </div>
  );
}
