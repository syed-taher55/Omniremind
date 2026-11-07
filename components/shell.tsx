import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { LiveRefresh } from "@/components/live-refresh";
import { SideNav } from "@/components/side-nav";
import { SubmitButton } from "@/components/submit-button";
import { verticalCopy, type Tenant, type Wallet } from "@/lib/types";

export function Shell({
  tenant,
  email,
  wallet,
  showOperator,
  children,
}: {
  tenant: Tenant;
  email: string;
  wallet: Wallet;
  showOperator: boolean;
  children: React.ReactNode;
}) {
  const copy = verticalCopy[tenant.vertical];
  return (
    <div className="min-h-full md:grid md:grid-cols-[240px_1fr]">
      <LiveRefresh tenantId={tenant.id} />
      <aside className="border-b border-line bg-card md:min-h-full md:border-r md:border-b-0">
        <div className="px-5 py-5">
          <Link href="/app" className="font-serif text-2xl tracking-tight">
            OmniRemind
          </Link>
          <p className="mt-3 text-sm">{tenant.name}</p>
          <p className="text-xs text-pine">{copy.label}</p>
        </div>
        <SideNav showOperator={showOperator} />
        <div className="hidden px-5 py-5 md:block">
          <p className="text-xs text-muted">Sending credits</p>
          <p className="font-serif text-4xl tabular-nums">{wallet.balance_credits}</p>
          <p className="mt-3 truncate text-xs text-muted">{email}</p>
          <form action={signOut} className="mt-4">
            <SubmitButton pendingLabel="Signing out…">Sign out</SubmitButton>
          </form>
        </div>
      </aside>
      <div>
        {wallet.balance_credits === 0 ? (
          <p className="bg-[#f8e4dc] px-5 py-3 text-sm text-clay md:px-10">
            This workspace has no OmniRemind sending credits, so due reminders stay paused.
            Meta is not called.
          </p>
        ) : null}
        <div className="px-5 py-6 md:px-10 md:py-8">{children}</div>
        <form action={signOut} className="px-5 pb-8 md:hidden">
          <SubmitButton pendingLabel="Signing out…">Sign out</SubmitButton>
        </form>
      </div>
    </div>
  );
}
