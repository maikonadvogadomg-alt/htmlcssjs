/**
 * Ponte do Gemini — chave nova "AQ." (e a antiga "AIza").
 *
 * O Google trocou o formato das chaves (2026): as novas começam com "AQ." e
 * são RECUSADAS no caminho "compatível com OpenAI" (…/v1beta/openai/…) quando
 * vão como "Authorization: Bearer". No caminho próprio do Gemini elas funcionam.
 *
 * Esta ponte troca, para o programa inteiro, qualquer pedido feito a
 *   https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
 *   https://generativelanguage.googleapis.com/v1beta/openai/models
 * pelo caminho próprio do Gemini (:generateContent / :streamGenerateContent /
 * /models), com a chave no cabeçalho x-goog-api-key, e devolve a resposta no
 * formato da OpenAI. Assim nenhuma tela precisa mudar.
 * Precisa ser importada ANTES de qualquer código que use a IA.
 */
const COMPAT = "https://generativelanguage.googleapis.com/v1beta/openai";
const NATIVO = "https://generativelanguage.googleapis.com/v1beta";
const original = globalThis.fetch.bind(globalThis);

export const ehChaveGemini = (k: string | null | undefined): boolean => /^(AIza|AQ\.)/.test(String(k || "").trim());

type Parte = { text?: string; inlineData?: { mimeType: string; data: string } };
function partes(conteudo: unknown): Parte[] {
  if (typeof conteudo === "string") return [{ text: conteudo }];
  if (!Array.isArray(conteudo)) return [{ text: String(conteudo ?? "") }];
  const out: Parte[] = [];
  for (const p of conteudo as Array<Record<string, any>>) {
    if (p?.type === "text") out.push({ text: String(p.text ?? "") });
    else if (p?.type === "image_url") {
      const u = String(p.image_url?.url ?? p.image_url ?? "");
      const m = /^data:([^;]+);base64,(.*)$/.exec(u);
      if (m) out.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
  }
  return out.length ? out : [{ text: "" }];
}
function corpoNativo(b: Record<string, any>) {
  const sistema: string[] = [];
  const contents: Array<{ role: string; parts: Parte[] }> = [];
  for (const m of (b.messages || []) as Array<Record<string, any>>) {
    if (m.role === "system" || m.role === "developer") { sistema.push(partes(m.content).map((p) => p.text || "").join("\n")); continue; }
    const role = m.role === "assistant" ? "model" : "user";
    const ps = partes(m.content);
    const ult = contents[contents.length - 1];
    if (ult && ult.role === role) ult.parts.push(...ps); else contents.push({ role, parts: ps }); // o Gemini não aceita dois "user" seguidos
  }
  if (!contents.length) contents.push({ role: "user", parts: [{ text: "" }] });
  const cfg: Record<string, unknown> = {};
  if (typeof b.temperature === "number") cfg.temperature = b.temperature;
  if (typeof b.top_p === "number") cfg.topP = b.top_p;
  const max = b.max_completion_tokens ?? b.max_tokens;
  if (typeof max === "number") cfg.maxOutputTokens = max;
  if (b.stop) cfg.stopSequences = Array.isArray(b.stop) ? b.stop : [b.stop];
  const corpo: Record<string, unknown> = { contents, generationConfig: cfg };
  if (sistema.length) corpo.systemInstruction = { parts: [{ text: sistema.join("\n\n") }] };
  return corpo;
}
const textoDe = (j: any): string => ((j?.candidates?.[0]?.content?.parts || []) as Array<{ text?: string }>).map((p) => p.text || "").join("");
const fim = (j: any): string | null => { const r = j?.candidates?.[0]?.finishReason; return !r ? null : r === "MAX_TOKENS" ? "length" : r === "STOP" ? "stop" : "content_filter"; };
function erroOpenAI(status: number, texto: string): Response {
  let msg = texto;
  try { const j = JSON.parse(texto); msg = j?.error?.message || j?.[0]?.error?.message || texto; } catch { /* texto puro */ }
  return new Response(JSON.stringify({ error: { message: "Gemini: " + msg, type: "gemini_error", code: status } }), { status, headers: { "content-type": "application/json" } });
}

async function chat(chave: string, b: Record<string, any>): Promise<Response> {
  const modelo = String(b.model || "gemini-2.5-flash").replace(/^models\//, "");
  const cab = { "content-type": "application/json", "x-goog-api-key": chave };
  const corpo = JSON.stringify(corpoNativo(b));
  const id = "chatcmpl-gemini-" + Date.now(), criado = Math.floor(Date.now() / 1000);
  if (!b.stream) {
    const r = await original(`${NATIVO}/models/${encodeURIComponent(modelo)}:generateContent`, { method: "POST", headers: cab, body: corpo });
    const t = await r.text();
    if (!r.ok) return erroOpenAI(r.status, t);
    const j = JSON.parse(t), u = j.usageMetadata || {};
    return new Response(JSON.stringify({
      id, object: "chat.completion", created: criado, model: modelo,
      choices: [{ index: 0, message: { role: "assistant", content: textoDe(j) }, finish_reason: fim(j) || "stop" }],
      usage: { prompt_tokens: u.promptTokenCount || 0, completion_tokens: u.candidatesTokenCount || 0, total_tokens: u.totalTokenCount || 0 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const r = await original(`${NATIVO}/models/${encodeURIComponent(modelo)}:streamGenerateContent?alt=sse`, { method: "POST", headers: cab, body: corpo });
  if (!r.ok || !r.body) return erroOpenAI(r.status, await r.text());
  const enc = new TextEncoder(), dec = new TextDecoder();
  let resto = "", motivo: string | null = null;
  const pedaco = (delta: Record<string, unknown>, fr: string | null) => enc.encode("data: " + JSON.stringify({ id, object: "chat.completion.chunk", created: criado, model: modelo, choices: [{ index: 0, delta, finish_reason: fr }] }) + "\n\n");
  let primeiro = true;
  const conversor = new TransformStream<Uint8Array, Uint8Array>({
    transform(bloco, ctl) {
      resto += dec.decode(bloco, { stream: true });
      const linhas = resto.split(/\r?\n/); resto = linhas.pop() || "";
      for (const l of linhas) {
        if (!l.startsWith("data:")) continue;
        const dado = l.slice(5).trim(); if (!dado) continue;
        let j: any; try { j = JSON.parse(dado); } catch { continue; }
        const t = textoDe(j); motivo = fim(j) || motivo;
        if (t) { ctl.enqueue(pedaco(primeiro ? { role: "assistant", content: t } : { content: t }, null)); primeiro = false; }
      }
    },
    flush(ctl) {
      ctl.enqueue(pedaco({}, motivo || "stop"));
      ctl.enqueue(enc.encode("data: [DONE]\n\n"));
    },
  });
  return new Response(r.body.pipeThrough(conversor), { status: 200, headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" } });
}

async function modelos(chave: string): Promise<Response> {
  const r = await original(`${NATIVO}/models?pageSize=200`, { headers: { "x-goog-api-key": chave } });
  const t = await r.text();
  if (!r.ok) return erroOpenAI(r.status, t);
  const j = JSON.parse(t);
  const data = ((j.models || []) as Array<Record<string, any>>)
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => ({ id: String(m.name).replace(/^models\//, ""), object: "model", created: 0, owned_by: "google" }));
  return new Response(JSON.stringify({ object: "list", data }), { status: 200, headers: { "content-type": "application/json" } });
}

globalThis.fetch = (async (entrada: any, opcoes?: RequestInit) => {
  const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : String(entrada?.url ?? "");
  if (!url.startsWith(COMPAT)) return original(entrada, opcoes);
  try {
    const cab = new Headers(opcoes?.headers || (entrada instanceof Request ? entrada.headers : undefined));
    const chave = (cab.get("x-goog-api-key") || (cab.get("authorization") || "").replace(/^Bearer\s+/i, "") || new URL(url).searchParams.get("key") || "").trim();
    if (!chave) return original(entrada, opcoes);
    const caminho = new URL(url).pathname.replace(/^\/v1beta\/openai/, "");
    if (caminho.startsWith("/models")) return await modelos(chave);
    if (caminho.startsWith("/chat/completions")) {
      let corpo: any = opcoes?.body;
      if (corpo == null && entrada instanceof Request) corpo = await entrada.clone().text();
      if (corpo instanceof Uint8Array || corpo instanceof ArrayBuffer) corpo = new TextDecoder().decode(corpo as ArrayBuffer);
      return await chat(chave, JSON.parse(String(corpo || "{}")));
    }
  } catch (e) {
    return erroOpenAI(500, "ponte do Gemini falhou: " + ((e as Error)?.message || String(e)));
  }
  return original(entrada, opcoes);
}) as typeof fetch;
