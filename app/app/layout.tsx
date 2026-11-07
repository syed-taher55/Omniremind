import { Shell } from "@/components/shell";
import { isPlatformAdmin } from "@/lib/env";
import { requireWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { tenant, user, wallet } = await requireWorkspace();
  return (
    <Shell
      tenant={tenant}
      email={user.email ?? ""}
      wallet={wallet}
      showOperator={isPlatformAdmin(user.email)}
    >
      {children}
    </Shell>
  );
}
