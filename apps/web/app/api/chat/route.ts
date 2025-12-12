import { NextResponse } from "next/server";
import { CHAT_PERSONA, CHAT_PERSONA_TREE } from "./persona";
import { readFile, appendFile, writeFile } from "fs/promises";

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
const OLLAMA_EMBED_URL = ((): string => {
  if (process.env.OLLAMA_URL) {
    return process.env.OLLAMA_URL.replace(/\/api\/generate$/, "/api/embed");
  }
  if (process.env.NEXT_PUBLIC_OLLAMA_URL) {
    return `${process.env.NEXT_PUBLIC_OLLAMA_URL}/api/embed`;
  }
  return "http://localhost:11434/api/embed";
})();
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

type PredicQA = { pregunta: string; respuesta: string };
let PREDIC_CACHE: PredicQA[] = [];
const LAYER_LOG: string[] = [];
type PredicEmbeddings = {
  docs: { qa: PredicQA; vec: Float32Array }[];
};
let PREDIC_EMB_CACHE: PredicEmbeddings | null = null;
let PREDIC_EMB_HASH_CACHE: string | null = null;

async function loadPredic(): Promise<PredicQA[]> {
  if (PREDIC_CACHE.length) return PREDIC_CACHE;
  try {
    const url = new URL("./predic.json", import.meta.url);
    const buf = await readFile(url);
    const json = JSON.parse(buf.toString());
    const arr = Array.isArray(json?.preguntas) ? json.preguntas : [];
    PREDIC_CACHE = arr.filter(
      (x: any) => typeof x?.pregunta === "string" && typeof x?.respuesta === "string",
    );
    return PREDIC_CACHE;
  } catch {
    PREDIC_CACHE = [];
    return PREDIC_CACHE;
  }
}

async function loadPredicCategorias(): Promise<Record<string, { keywords: string[] }>> {
  try {
    const url = new URL("./predic.json", import.meta.url);
    const buf = await readFile(url);
    const json = JSON.parse(buf.toString());
    const cats = typeof json?.categorias === "object" && json.categorias ? json.categorias : {};
    return cats;
  } catch {
    return {};
  }
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string) {
  return new Set(normalize(s).split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return inter / union;
}

function bestMatches(prompt: string, faqs: PredicQA[], topN = 3) {
  const ptok = tokens(prompt);
  const scored = faqs
    .map((qa) => ({ qa, score: jaccard(ptok, tokens(qa.pregunta)) }))
    .sort((x, y) => y.score - x.score);
  return scored.slice(0, topN);
}

function expandTokens(src: Set<string>) {
  const out = new Set<string>(src);
  const has = (k: string) => out.has(k);
  if (has("multi") && has("tenant")) out.add("multitenant");
  if (has("multi‑inquilino") || has("multi-inquilino")) out.add("multitenant");
  if (has("rls") || (has("row") && has("level") && has("security"))) out.add("rowlevelsecurity");
  if (has("jwt")) out.add("token");
  if (has("rbac")) out.add("roles");
  if (has("websocket") || has("websockets")) out.add("tiemporeal");
  if (has("rest")) out.add("stateless");
  if (has("patch")) out.add("put");
  if (has("dto")) out.add("transferobject");
  if (has("interceptor")) out.add("middleware");
  if (has("middleware")) out.add("interceptor");
  if (has("tailwindcss")) out.add("tailwind");
  if (has("shadcn") || has("shadcn/ui")) out.add("tailwind");
  if (has("pern")) out.add("postgresql");
  if (has("stripe")) out.add("pagos");
  if (has("indice") || has("indice") || has("index")) out.add("sql");
  if (has("normalizacion") || has("normalización")) out.add("sql");
  if (has("transaccion") || has("transacción")) out.add("sql");
  if (has("docker")) out.add("contenedores");
  if (has("ci") || has("cd")) out.add("cicd");
  if (has("gitflow")) out.add("ramas");
  if (has("microservicios")) out.add("arquitectura");
  if (has("eventos") || has("orientada") || has("event")) out.add("eventdriven");
  if (has("vercel")) out.add("deploy");
  return out;
}

function bestMatchesExtended(prompt: string, faqs: PredicQA[], topN = 3) {
  const ptokBase = tokens(prompt);
  const ptok = expandTokens(ptokBase);
  const scored = faqs
    .map((qa) => {
      const qtok = tokens(qa.pregunta);
      const atok = tokens(qa.respuesta);
      const union = new Set<string>([...qtok, ...atok]);
      return { qa, score: jaccard(ptok, union) };
    })
    .sort((x, y) => y.score - x.score);
  return scored.slice(0, topN);
}

async function embedText(input: string): Promise<Float32Array> {
  const res = await fetch(OLLAMA_EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input }),
  });
  const json = await res.json();
  const arr: number[] =
    Array.isArray(json?.embedding) ? json.embedding : Array.isArray(json?.embeddings?.[0]) ? json.embeddings[0] : [];
  const vec = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) vec[i] = Number(arr[i] ?? 0);
  return vec;
}

function simpleHashFaqs(faqs: PredicQA[]) {
  let h = 0;
  const s = faqs.map((x) => `${x.pregunta}::${x.respuesta}`).join("||");
  for (let i = 0; i < s.length; i++) {
    h = (h * 131 + s.charCodeAt(i)) >>> 0;
  }
  return String(h);
}

async function loadEmbeddingsFromDisk(faqs: PredicQA[]): Promise<PredicEmbeddings | null> {
  try {
    const url = new URL("./predic.embeddings.json", import.meta.url);
    const buf = await readFile(url);
    const json = JSON.parse(buf.toString());
    const vectors: number[][] = Array.isArray(json?.vectors) ? json.vectors : [];
    const hash: string = typeof json?.hash === "string" ? json.hash : "";
    if (!vectors.length || vectors.length !== faqs.length) return null;
    const expected = simpleHashFaqs(faqs);
    if (!hash || hash !== expected) return null;
    const docs = faqs.map((qa, i) => {
      const v = vectors[i] ?? [];
      const vec = new Float32Array(v.length);
      for (let j = 0; j < v.length; j++) vec[j] = Number(v[j] ?? 0);
      return { qa, vec };
    });
    PREDIC_EMB_HASH_CACHE = hash;
    return { docs };
  } catch {
    return null;
  }
}

async function saveEmbeddingsToDisk(emb: PredicEmbeddings, faqs: PredicQA[]) {
  try {
    const vectors = emb.docs.map((d) => Array.from(d.vec));
    const hash = simpleHashFaqs(faqs);
    const url = new URL("./predic.embeddings.json", import.meta.url);
    const payload = JSON.stringify({ vectors, hash });
    await writeFile(url, payload);
    PREDIC_EMB_HASH_CACHE = hash;
  } catch {}
}

async function ensurePredicEmbeddings(faqs: PredicQA[]): Promise<PredicEmbeddings> {
  if (PREDIC_EMB_CACHE && PREDIC_EMB_CACHE.docs.length === faqs.length) return PREDIC_EMB_CACHE;
  const onDisk = await loadEmbeddingsFromDisk(faqs);
  if (onDisk) {
    PREDIC_EMB_CACHE = onDisk;
    return onDisk;
  }
  const docs: { qa: PredicQA; vec: Float32Array }[] = [];
  const concurrency = 4;
  let i = 0;
  while (i < faqs.length) {
    const batch = faqs.slice(i, i + concurrency);
    const embeds = await Promise.all(batch.map((qa) => embedText(`${qa.pregunta} ${qa.respuesta}`)));
    for (let k = 0; k < batch.length; k++) {
      docs.push({ qa: batch[k], vec: embeds[k] });
    }
    i += concurrency;
  }
  PREDIC_EMB_CACHE = { docs };
  await saveEmbeddingsToDisk(PREDIC_EMB_CACHE, faqs).catch(() => {});
  return PREDIC_EMB_CACHE;
}

async function embedPromptVector(prompt: string): Promise<Float32Array> {
  const vec = await embedText(prompt);
  return vec;
}

function cosine(a: Float32Array, b: Float32Array) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}

async function bestMatchesEmbed(prompt: string, faqs: PredicQA[], topN = 3) {
  const emb = await ensurePredicEmbeddings(faqs);
  const pvec = await embedPromptVector(prompt);
  const scored = emb.docs.map(({ qa, vec }) => ({ qa, score: cosine(pvec, vec) })).sort((x, y) => y.score - x.score);
  return scored.slice(0, topN);
}

function fallbackFromMatches(matches: { qa: PredicQA; score: number }[]) {
  const top = matches[0];
  if (top && typeof top.qa?.respuesta === "string" && top.qa.respuesta.length > 0) {
    return sanitizeChunk(top.qa.respuesta);
  }
  return "Sin respuesta disponible basada en persona y predic.";
}

function logFailure(layer: string, prompt: string, details?: string) {
  const msg = `[${new Date().toISOString()}] ${layer} fail${details ? ` (${details})` : ""} :: ${normalize(prompt)}`;
  LAYER_LOG.push(msg);
  if (LAYER_LOG.length > 100) LAYER_LOG.shift();
  try {
    const url = new URL("./layer_failures.log", import.meta.url);
    appendFile(url, msg + "\n").catch(() => {});
  } catch {}
}

function sanitizeChunk(text: string): string {
  const patterns = [
    /como asistente/gi,
    /\basistente\b/gi,
    /\bassistant\b/gi,
    /como ia/gi,
    /como modelo/gi,
    /\bsoy un asistente\b/gi,
    /\bsoy asistente\b/gi,
  ];
  let out = text;
  for (const p of patterns) {
    out = out.replace(p, "");
  }
  out = out.replace(/[¿?]+/g, "");
  return out;
}

function isExperienceQuery(prompt: string) {
  const t = tokens(prompt);
  const expTerms = new Set<string>([
    "experiencia",
    "trabajo",
    "trabajos",
    "trabajaste",
    "has",
    "donde",
    "dónde",
    "empresa",
    "empresas",
    "compania",
    "compañia",
    "compañía",
    "lugares",
    "cv",
    "curriculum",
    "resumen",
    "background",
    "career",
    "roles",
    // ingles
    "experience",
    "worked",
    "work",
    "where",
    "companies",
    "resume",
    "roles",
    "jobs",
  ]);
  let hits = 0;
  for (const k of expTerms) {
    if (t.has(k)) hits++;
  }
  if (hits >= 2) return true;
  const s = normalize(prompt);
  return (
    s.includes("donde trabajaste") ||
    s.includes("dónde trabajaste") ||
    s.includes("where have you worked") ||
    s.includes("where did you work") ||
    s.includes("has trabajado") ||
    s.includes("lugares de trabajo")
  );
}

function buildExperienceAnswer() {
  const exp = CHAT_PERSONA_TREE.experience ?? [];
  const parts = exp.map((e) => {
    const period =
      typeof e.period === "object"
        ? `${e.period.start.replace("-", "/")} – ${e.period.end}`
        : "";
    return `${e.company} (${e.location}) — ${e.role}, ${period}`;
  });
  if (!parts.length) {
    return "Cuento con experiencia como desarrollador full‑stack en entornos SaaS y PERN.";
  }
  return `He trabajado en: ${parts.join("; ")}.`;
}

function matchExperienceByCompany(prompt: string) {
  const s = normalize(prompt);
  const exps = CHAT_PERSONA_TREE.experience ?? [];
  for (const e of exps) {
    const cname = normalize(e.company);
    if (s.includes(cname)) return e;
  }
  return null;
}

function buildCompanyExperienceAnswer(e: (typeof CHAT_PERSONA_TREE)["experience"][number]) {
  const hs = Array.isArray(e.highlights) ? e.highlights : [];
  const short = hs.join("; ");
  const period =
    typeof e.period === "object" ? `${e.period.start.replace("-", "/")} – ${e.period.end}` : "";
  const header = `${e.company} (${e.location}) — ${e.role}, ${period}`;
  return `${header}. ${short}.`;
}

function buildCompanyHighlightsAnswer(e: (typeof CHAT_PERSONA_TREE)["experience"][number]) {
  const hs = Array.isArray(e.highlights) ? e.highlights : [];
  return hs.join("; ");
}

function matchAffirmative(prompt: string) {
  const s = normalize(prompt);
  const hasHcg = s.includes("hotel casa galeana");
  const hasAgs = s.includes("aguascalientes");
  if (hasHcg && hasAgs) return "si";
  return null;
}

async function filterFaqsByCategories(prompt: string, faqs: PredicQA[]) {
  const cats = await loadPredicCategorias();
  const s = normalize(prompt);
  const hits: string[] = [];
  for (const [k, v] of Object.entries(cats)) {
    const kws = Array.isArray(v?.keywords) ? v.keywords : [];
    for (const kw of kws) {
      const nk = normalize(kw);
      if (nk && s.includes(nk)) {
        hits.push(k);
        break;
      }
    }
  }
  if (!hits.length) return faqs;
  const selected: PredicQA[] = [];
  for (const qa of faqs) {
    const txt = normalize(`${qa.pregunta} ${qa.respuesta}`);
    for (const k of hits) {
      const kws = Array.isArray(cats[k]?.keywords) ? cats[k].keywords : [];
      let ok = false;
      for (const kw of kws) {
        const nk = normalize(kw);
        if (nk && txt.includes(nk)) {
          ok = true;
          break;
        }
      }
      if (ok) {
        selected.push(qa);
        break;
      }
    }
  }
  return selected.length ? selected : faqs;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    const normalized = prompt.trim().toLowerCase();
    const greetTokens = new Set(["hola", "hello", "hi", "buenas", "buenos", "dias", "días", "tardes", "noches"]);
    const ptoks = tokens(normalized);
    const allGreeting = [...ptoks].every((t) => greetTokens.has(t));
    let greetResponse: string | null = null;
    if (allGreeting) {
      const s = normalized.replace(/[!¡.,;:?]/g, " ");
      if (s.includes("buenos dias") || s.includes("buenos días")) {
        greetResponse = "Buenos días";
      } else if (s.includes("buenas tardes")) {
        greetResponse = "Buenas tardes";
      } else if (s.includes("buenas noches")) {
        greetResponse = "Buenas noches";
      } else if (ptoks.has("hello")) {
        greetResponse = "Hello";
      } else if (ptoks.has("hi")) {
        greetResponse = "Hi";
      } else if (ptoks.has("hola")) {
        greetResponse = "Hola";
      } else if (ptoks.has("buenas")) {
        greetResponse = "Buenas";
      }
    }
    if (greetResponse !== null) {
      return new Response(sanitizeChunk(greetResponse), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }
    const affirmative = matchAffirmative(prompt);
    if (affirmative) {
      return new Response(sanitizeChunk(affirmative), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }
    if (isExperienceQuery(prompt)) {
      const byCompany = matchExperienceByCompany(prompt);
      const answer = sanitizeChunk(
        byCompany ? buildCompanyHighlightsAnswer(byCompany) : buildExperienceAnswer(),
      );
      return new Response(answer, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }
    logFailure("persona", prompt, "no_match");
    // predic.json fallback and enrichment
    const faqsAll = await loadPredic();
    const faqs = await filterFaqsByCategories(prompt, faqsAll);
    const matches = await bestMatchesEmbed(prompt, faqs, 3);
    const top = matches[0];
    const HIGH_THRESHOLD = 0.45;
    const LOW_THRESHOLD = 0.25;
    if (top && top.score >= HIGH_THRESHOLD) {
      return new Response(sanitizeChunk(top.qa.respuesta), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }
    logFailure("predic", prompt, `score=${top?.score ?? 0}`);
    const CONTEXT_THRESHOLD = 0.35;
    const baseRules = `Responde directo y en español. No menciones que eres asistente ni hagas preguntas.`;
    const contextLines =
      top && top.score >= CONTEXT_THRESHOLD
        ? `\nContexto (QA Top1):\nA: ${top.qa.respuesta}\n\n${baseRules}`
        : `\n${baseRules}`;
    const finalPrompt = `${CHAT_PERSONA.content}\n${contextLines}\n\nUsuario: ${prompt}\nAsistente:`;
    const numPredict = top && top.score >= CONTEXT_THRESHOLD ? 80 : 40;
    let ollamaRes: Response;
    const controller = new AbortController();
    const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 2000);
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      ollamaRes = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: finalPrompt,
          stream: true,
          options: {
            num_predict: numPredict,
            temperature: OLLAMA_TEMPERATURE,
            keep_alive: OLLAMA_KEEP_ALIVE,
          },
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(t);
      const msg = e?.message ? String(e.message) : "Model connection error";
      logFailure("llm", prompt, msg);
      const fb = fallbackFromMatches(matches);
      return new Response(fb, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
    }
    clearTimeout(t);
    if (!ollamaRes.ok) {
      const text = await ollamaRes.text().catch(() => '');
      logFailure("llm", prompt, "upstream_not_ok");
      const fb = fallbackFromMatches(matches);
      return new Response(fb, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
    }
    if (!ollamaRes.body) {
      try {
        const txt = await ollamaRes.text();
        const sanitized = sanitizeChunk(txt);
        return new Response(sanitized, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      } catch {
        logFailure("llm", prompt, "no_body");
        const fb = fallbackFromMatches(matches);
        return new Response(fb, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      }
    }
    const reader = ollamaRes.body.getReader();
    const td = new TextDecoder();
    let buf = "";
    let acc = "";
    let doneFlag = false;
    function tryParseNextObject(): { obj: any; end: number } | null {
      let i = buf.indexOf("{");
      if (i === -1) return null;
      let depth = 0;
      let inStr = false;
      let esc = false;
      for (; i < buf.length; i++) {
        const ch = buf[i];
        if (inStr) {
          if (esc) {
            esc = false;
          } else if (ch === "\\") {
            esc = true;
          } else if (ch === '"') {
            inStr = false;
          }
        } else {
          if (ch === '"') {
            inStr = true;
          } else if (ch === "{") {
            depth++;
          } else if (ch === "}") {
            depth--;
            if (depth === 0) {
              const slice = buf.slice(buf.indexOf("{"), i + 1);
              try {
                const obj = JSON.parse(slice);
                return { obj, end: i + 1 };
              } catch {}
            }
          }
        }
      }
      return null;
    }
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += td.decode(value);
      while (true) {
        const parsed = tryParseNextObject();
        if (!parsed) break;
        const { obj, end } = parsed;
        buf = buf.slice(end);
        if (obj?.done === true) {
          doneFlag = true;
          break;
        }
        const chunk = obj?.response ?? "";
        if (chunk) acc += chunk;
      }
      if (doneFlag) break;
    }
    const finalText = sanitizeChunk(acc || buf);
    return new Response(finalText, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
