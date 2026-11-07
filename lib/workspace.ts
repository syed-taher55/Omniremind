import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { verticals, type Role, type Tenant, type Wallet } from "@/lib/types";

type Client = Awaited<ReturnType<typeof createClient>>;

export type Workspace =
  | { configured: false }
  | { configured: true; user: null; supabase: null }
  | { configured: true; user: User; tenant: null; supabase: Client }
  | {
      configured: true;
      user: User;
      tenant: Tenant;
      role: Role;
      wallet: Wallet;
      supabase: Client;
    };

function unwrapTenant(value: Tenant | Tenant[] | null): Tenant | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const getWorkspace = cache(async (): Promise<Workspace> => {
  if (!isSupabaseConfigured()) return { configured: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, user: null, supabase: null };

  const { data, error } = await supabase
    .from("memberships")
    .select("role, tenants(id, name, slug, vertical, timezone, currency)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    return { configured: true, user, tenant: null, supabase };
  }
  const tenant = unwrapTenant(data.tenants as Tenant | Tenant[] | null);
  if (!tenant || !verticals.includes(tenant.vertical)) {
    return { configured: true, user, tenant: null, supabase };
  }
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance_credits, credit_cost_per_message")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!wallet) return { configured: true, user, tenant: null, supabase };
  return {
    configured: true,
    user,
    tenant,
    role: data.role as Role,
    wallet,
    supabase,
  };
});

export async function requireWorkspace() {
  const workspace = await getWorkspace();
  if (!workspace.configured || !workspace.user) redirect("/login");
  if (!workspace.tenant) redirect("/signup?missing=workspace");
  return workspace;
}
