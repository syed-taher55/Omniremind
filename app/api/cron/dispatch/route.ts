import { dispatchDue } from "@/lib/dispatch";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await dispatchDue();
    return Response.json(result);
  } catch (error) {
    console.error("dispatch failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Dispatch failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
