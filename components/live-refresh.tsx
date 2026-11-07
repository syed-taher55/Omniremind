"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LiveRefresh({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };
    const channel = supabase
      .channel(`workspace-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reminders", filter: `tenant_id=eq.${tenantId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallets", filter: `tenant_id=eq.${tenantId}` },
        refresh,
      )
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router, tenantId]);
  return null;
}
