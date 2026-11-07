"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isTimeZone } from "@/lib/time";
import { verticals, type ActionState } from "@/lib/types";

async function origin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

export async function signIn(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Add the Supabase URL and anon key before signing in." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/app");
}

export async function signUp(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Add the Supabase URL and anon key before creating a workspace." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const business = String(formData.get("business") ?? "").trim();
  const vertical = String(formData.get("vertical") ?? "retail");
  const timezone = String(formData.get("timezone") ?? "UTC");
  if (business.length < 2 || business.length > 80) {
    return { error: "Business name must be 2 to 80 characters." };
  }
  if (!verticals.includes(vertical as (typeof verticals)[number])) {
    return { error: "Choose a hospital, school, or retail shop." };
  }
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const zone = isTimeZone(timezone) ? timezone : "UTC";
  const supabase = await createClient();
  const site = await origin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { business_name: business, vertical, timezone: zone },
      emailRedirectTo: site ? `${site}/auth/callback` : undefined,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/app");
  return {
    notice: "Check your email to confirm the workspace, then sign in.",
  };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
