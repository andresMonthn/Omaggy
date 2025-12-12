import { NextResponse } from "next/server";
export const runtime = 'nodejs';

const OLLAMA_URL =
  process.env.OLLAMA_URL ??
  (process.env.NEXT_PUBLIC_OLLAMA_URL
    ? `${process.env.NEXT_PUBLIC_OLLAMA_URL}/api/generate`
    : "http://localhost:11434/api/generate");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3";
const OLLAMA_NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT ?? -1);
const OLLAMA_TEMPERATURE = Number(process.env.OLLAMA_TEMPERATURE ?? 0.2);
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE ?? "10m";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    let ollamaRes: Response;
    const controller = new AbortController();
    const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 30000);
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      ollamaRes = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: true,
          options: {
            num_predict: OLLAMA_NUM_PREDICT,
            temperature: OLLAMA_TEMPERATURE,
            keep_alive: OLLAMA_KEEP_ALIVE,
          },
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(t);
      const msg = e?.message ? String(e.message) : "Model connection error";
      return NextResponse.json({ error: "Upstream connection failed", details: msg }, { status: 502 });
    }
    clearTimeout(t);
    if (!ollamaRes.ok) {
      const text = await ollamaRes.text().catch(() => '');
      return NextResponse.json({ error: "Upstream error", details: text }, { status: 502 });
    }
    if (!ollamaRes.body) {
      try {
        const txt = await ollamaRes.text();
        return new Response(txt, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      } catch {
        return NextResponse.json({ error: "No upstream body" }, { status: 502 });
      }
    }
    let buffer = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader();
        const td = new TextDecoder();
        const te = new TextEncoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += td.decode(value);
          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            newlineIndex = buffer.indexOf("\n");
            if (!line) continue;
            try {
              const json = JSON.parse(line);
              if (json?.done === true) {
                controller.close();
                return;
              }
              const chunk = json?.response ?? "";
              if (chunk) controller.enqueue(te.encode(chunk));
            } catch {
              controller.enqueue(te.encode(line));
            }
          }
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
