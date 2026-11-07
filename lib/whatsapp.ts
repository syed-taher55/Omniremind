export async function sendTemplateMessage(args: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  language: string;
  params: string[];
}): Promise<{ id: string } | { error: string }> {
  const version = process.env.META_GRAPH_VERSION || "v22.0";
  const template: Record<string, unknown> = {
    name: args.templateName,
    language: { code: args.language },
  };
  if (args.params.length > 0) {
    template.components = [
      {
        type: "body",
        parameters: args.params.map((text) => ({ type: "text", text })),
      },
    ];
  }
  let response: Response;
  try {
    response = await fetch(
      `https://graph.facebook.com/${version}/${args.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: args.to,
          type: "template",
          template,
        }),
      },
    );
  } catch {
    return { error: "Could not reach WhatsApp." };
  }
  const json = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    messages?: Array<{ id?: string }>;
  } | null;
  if (!response.ok) {
    return {
      error: json?.error?.message || `WhatsApp rejected the send (${response.status}).`,
    };
  }
  const id = json?.messages?.[0]?.id;
  if (!id) return { error: "WhatsApp did not return a message id." };
  return { id };
}
