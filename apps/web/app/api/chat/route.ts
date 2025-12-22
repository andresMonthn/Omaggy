import { NextResponse } from "next/server";

export const runtime = 'nodejs';
const BRAIN_URL = "http://127.0.0.1:8000/v1/interview/answer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(`[Proxy] Forwarding request to ${BRAIN_URL}`);
    const upstream = await fetch(BRAIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: body.question,
          max_tokens: body.max_tokens || 500
        }), 
      });
    console.log(`[Proxy] Upstream status: ${upstream.status}`);
    if (!upstream.ok) {
       console.error(`[Proxy] Upstream error: ${upstream.statusText}`);
    }
    return upstream;
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }
}
