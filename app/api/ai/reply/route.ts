// ─── AI reply drafting ────────────────────────────────────
// Server-side so the API key never reaches the browser. Calls Claude when
// ANTHROPIC_API_KEY is set; otherwise returns { unavailable: true } and the
// client falls back to its local draft engine. No SDK — plain fetch to the
// Anthropic Messages API.

export const runtime = "nodejs";

interface DraftRequest {
  customer: string;
  channel: string;                       // sms | email | call | …
  linked?: string;                       // "Active job: AC Tune-Up (En route) · Invoice INV-2041 (Past due)"
  history: { from: "customer" | "us"; text: string }[];
}

const SYSTEM = [
  "You are a professional, warm customer-service assistant for a home-services company (HVAC, plumbing, roofing, electrical, etc.).",
  "Draft the company's next reply to the customer's most recent message.",
  "Rules:",
  "- Keep it concise and friendly. For SMS, 1–2 short sentences; for email, a few sentences, no signature block.",
  "- Use ONLY the facts in the provided context. Never invent prices, appointment times, technician names, or commitments that aren't given.",
  "- If you don't have enough information, ask one clarifying question or say a team member will follow up shortly.",
  "- Write only the reply text — no preamble, quotes, or labels.",
].join("\n");

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ unavailable: true });

  let body: DraftRequest;
  try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const transcript = (body.history ?? [])
    .map(m => `${m.from === "us" ? "Us" : body.customer || "Customer"}: ${m.text}`)
    .join("\n");
  const userContent =
    `Customer: ${body.customer}\nChannel: ${body.channel}` +
    (body.linked ? `\nContext: ${body.linked}` : "") +
    `\n\nConversation (oldest first):\n${transcript}\n\nWrite our next reply to the customer.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 400, system: SYSTEM, messages: [{ role: "user", content: userContent }] }),
    });
    if (!r.ok) return Response.json({ unavailable: true, error: (await r.text()).slice(0, 300) }, { status: 200 });
    const data = await r.json();
    const reply = (data?.content?.[0]?.text ?? "").trim();
    if (!reply) return Response.json({ unavailable: true });
    return Response.json({ reply, model });
  } catch (e) {
    return Response.json({ unavailable: true, error: String(e).slice(0, 200) }, { status: 200 });
  }
}
