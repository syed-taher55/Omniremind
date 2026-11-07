import { headers } from "next/headers";
import { appBaseUrl } from "@/lib/env";

export async function requestOrigin() {
  const configured = appBaseUrl();
  if (configured) return configured;
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return "";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
