import { getConfig } from "./storage";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResult {
  texto: string;
  provedor: string;
  modelo: string;
  erro?: string;
}

function autoDetectProvider(key: string): { url: string; modelo: string; nome: string } {
  const k = key.trim();
  if (k.startsWith("gsk_"))    return { url: "https://api.groq.com/openai/v1", modelo: "llama-3.3-70b-versatile", nome: "Groq" };
  if (k.startsWith("AIza"))    return { url: "https://generativelanguage.googleapis.com/v1beta/openai", modelo: "gemini-2.0-flash", nome: "Gemini" };
  if (k.startsWith("sk-or-"))  return { url: "https://openrouter.ai/api/v1", modelo: "meta-llama/llama-3.3-70b-instruct:free", nome: "OpenRouter" };
  if (k.startsWith("sk-ant"))  return { url: "https://api.anthropic.com/v1", modelo: "claude-haiku-4-20250514", nome: "Claude" };
  if (k.startsWith("pplx-"))   return { url: "https://api.perplexity.ai", modelo: "sonar-pro", nome: "Perplexity" };
  if (k.startsWith("xai-"))    return { url: "https://api.x.ai/v1", modelo: "grok-2", nome: "xAI Grok" };
  if (k.startsWith("sk-"))     return { url: "https://api.openai.com/v1", modelo: "gpt-4o-mini", nome: "OpenAI" };
  return { url: "https://api.groq.com/openai/v1", modelo: "llama-3.3-70b-versatile", nome: "Groq" };
}

async function chatOpenAICompatible(
  key: string,
  url: string,
  modelo: string,
  messages: AIMessage[],
  maxTokens = 8000,
): Promise<string> {
  const base = url.endsWith("/") ? url.slice(0, -1) : url;
  const resp = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`[${resp.status}] ${err.slice(0, 300)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function enviarParaIA(
  system: string,
  userMsg: string,
  historicoMsgs: AIMessage[] = [],
): Promise<AIResult> {
  const cfg = await getConfig();

  // Determina qual chave usar
  let key = "";
  let url = "";
  let modelo = "";
  let nome = "";

  if (cfg.modeloAtivo === "chave1" && cfg.chave1) {
    key = cfg.chave1;
    const detected = autoDetectProvider(key);
    url = cfg.chave1Url || detected.url;
    modelo = cfg.chave1Modelo || detected.modelo;
    nome = detected.nome;
  } else if (cfg.modeloAtivo === "chave2" && cfg.chave2) {
    key = cfg.chave2;
    const detected = autoDetectProvider(key);
    url = cfg.chave2Url || detected.url;
    modelo = cfg.chave2Modelo || detected.modelo;
    nome = detected.nome;
  } else {
    // Chave demo (Groq gratuita)
    key = cfg.chaveDemo;
    url = cfg.chaveDemoUrl;
    modelo = cfg.chaveDemoModelo;
    nome = "Groq (Demo)";
  }

  if (!key) {
    return { texto: "", provedor: "", modelo: "", erro: "Nenhuma chave de IA configurada. VÃ¡ em ConfiguraÃ§Ãµes e adicione uma chave." };
  }

  try {
    const messages: AIMessage[] = [
      { role: "system", content: system },
      ...historicoMsgs,
      { role: "user", content: userMsg },
    ];

    const texto = await chatOpenAICompatible(key, url, modelo, messages);
    return { texto, provedor: nome, modelo };
  } catch (e: any) {
    return { texto: "", provedor: nome, modelo, erro: e.message || "Erro ao chamar a IA" };
  }
}

export async function enviarComChaveEspecifica(
  key: string,
  urlCustom: string | undefined,
  modeloCustom: string | undefined,
  system: string,
  msgs: AIMessage[],
): Promise<AIResult> {
  const detected = autoDetectProvider(key);
  const url = urlCustom || detected.url;
  const modelo = modeloCustom || detected.modelo;
  const nome = detected.nome;

  try {
    const messages: AIMessage[] = [{ role: "system", content: system }, ...msgs];
    const texto = await chatOpenAICompatible(key, url, modelo, messages);
    return { texto, provedor: nome, modelo };
  } catch (e: any) {
    return { texto: "", provedor: nome, modelo, erro: e.message || "Erro ao chamar a IA" };
  }
}

export { autoDetectProvider };
