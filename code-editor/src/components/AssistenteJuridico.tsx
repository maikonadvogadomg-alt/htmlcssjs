import { useState, useRef, useCallback, useEffect } from "react";
import {
  Scale, ArrowLeft, Eye, EyeOff, Save, Key, X, Settings,
  Mic, MicOff, Volume2, VolumeX, Download, Copy, Check,
  Loader2, StopCircle, Trash2, FileText, FileAudio,
  ChevronDown, ChevronUp, MessageSquare, Send,
} from "lucide-react";
import { speak, stopSpeaking, loadTTSConfig } from "@/lib/tts-service";

const SYSTEM_PROMPT = `Voce e uma assistente juridica especializada em Direito brasileiro. Produza documentos COMPLETOS, EXTENSOS e PRONTOS PARA USO IMEDIATO.

REGRAS ABSOLUTAS:
1. DOCUMENTO COMPLETO E EXTENSO — nunca resuma, nunca corte, nunca omita. Escreva o documento inteiro do inicio ao fim. O advogado copia e cola direto no Word.
2. ESTRUTURA OBRIGATORIA para peticoes e minutas: Endereçamento → Qualificação das partes → Dos Fatos (detalhado) → Do Direito (com fundamentacao legal) → Dos Pedidos → Local, data e assinatura.
3. FUNDAMENTACAO ROBUSTA — cite artigos de lei, numeros de lei, doutrina, principios. Desenvolva cada argumento em paragrafos proprios.
4. Base-se EXCLUSIVAMENTE no texto fornecido. Nao invente fatos. Se faltar dado: [INFORMAR: descricao]. Se ha ementas selecionadas, CITE-AS literalmente.
5. MANTENHA nomes, CPFs, numeros, dados pessoais EXATAMENTE como estao. NAO altere nenhum dado.
6. TEXTO PURO sem markdown. NAO use asteriscos (*), hashtags (#), tracos (---), nem nenhuma sintaxe markdown. Para titulos, escreva em CAIXA ALTA. Para negrito, escreva em CAIXA ALTA. Paragrafos separados por linha em branco.
7. CADA PARAGRAFO maximo 5 linhas. Nunca junte varios argumentos num bloco so. Separe cada ideia em paragrafo proprio.
8. NUNCA produza um rascunho curto. O MINIMO ABSOLUTO para qualquer minuta ou peticao e 15 PAGINAS completas (aproximadamente 7.500 palavras).
9. PROIBIDO entregar texto com menos de 15 paginas em minutas e peticoes. Se necessario, aprofunde argumentacao, inclua mais jurisprudencia, desenvolva teses alternativas.
10. FORMATACAO ABNT: Titulos e subtitulos em CAIXA ALTA, negrito, justificados (NAO centralizados). Paragrafos justificados com RECUO OBRIGATORIO DE 4CM (quatro centimetros) na primeira linha. Citacoes longas recuadas 4cm pela esquerda. Assinatura CAIXA ALTA justificada.
11. O RECUO DE PARAGRAFO E 4CM. NAO use 2cm, NAO use 1.25cm, NAO use tab. QUATRO CENTIMETROS em todo paragrafo normal.
12. TITULOS E SUBTITULOS: sempre em CAIXA ALTA + negrito + justificado, sem espacamento extra antes ou depois. Exemplos corretos: DOS FATOS, DO DIREITO, DOS PEDIDOS, DA FUNDAMENTACAO, DA CONCLUSAO.`;

const ACTION_PROMPTS: Record<string, string> = {
  resumir:    "Elabore RESUMO ESTRUTURADO do documento com as seguintes secoes, CADA UMA em bloco separado:\n\n1. NATUREZA DA DEMANDA\n[descricao]\n\n2. FATOS PRINCIPAIS\n[datas, nomes, valores]\n\n3. FUNDAMENTOS JURIDICOS\n[bases legais e argumentos]\n\n4. CONCLUSAO E PEDIDO\n[resultado pretendido]\n\nNao omita detalhes.\n\nDOCUMENTO:\n{{texto}}{{juris}}",
  revisar:    "Analise erros gramaticais, concordancia, logica juridica. Sugira melhorias de redacao. Aponte omissoes e contradicoes.\n\nTEXTO:\n{{texto}}{{juris}}",
  refinar:    "Reescreva elevando linguagem para padrao de tribunais superiores. Melhore fluidez e vocabulario juridico.\n\nTEXTO:\n{{texto}}{{juris}}",
  simplificar:"Traduza para linguagem simples e acessivel, mantendo rigor tecnico. Cliente leigo deve entender.\n\nTEXTO:\n{{texto}}{{juris}}",
  minuta:     "Elabore PETICAO/MINUTA JURIDICA COMPLETA, EXTENSA E PROFISSIONAL com NO MINIMO 15 PAGINAS (7.500+ palavras). Inclua OBRIGATORIAMENTE todas as secoes abaixo:\n\nEXMO(A). SR(A). DR(A). JUIZ(A) DE DIREITO DA ... VARA DE ... DA COMARCA DE ...\n\n[QUALIFICACAO COMPLETA DAS PARTES]\n\nDOS FATOS\n[Narrativa EXTENSA, detalhada e cronologica — minimo 8 paragrafos]\n\nDO DIREITO\n[Fundamentacao juridica ROBUSTA com artigos, leis, principios — minimo 12 paragrafos]\n\nDA JURISPRUDENCIA\n[Citacao de precedentes — minimo 5 julgados]{{juris}}\n\nDOS PEDIDOS\n[Lista numerada e DETALHADA — minimo 8 pedidos]\n\nDO VALOR DA CAUSA\n[Fundamentacao]\n\n[Data e assinatura]\n\nINFORMACOES:\n{{texto}}",
  analisar:   "Elabore ANALISE JURIDICA com as seguintes secoes:\n\n1. RISCOS PROCESSUAIS\n2. TESES FAVORAVEIS E CONTRARIAS\n3. JURISPRUDENCIA APLICAVEL\n4. PROXIMOS PASSOS\n\nDOCUMENTO:\n{{texto}}{{juris}}",
  corrigir:   "Corrija APENAS erros gramaticais e de estilo juridico. Nao altere estrutura ou conteudo. Retorne o texto corrigido completo.\n\nTEXTO:\n{{texto}}",
  redacao:    "Reescreva o texto tornando-o uma PETICAO PROFISSIONAL persuasiva e tecnicamente robusta, mantendo todos os dados e fatos.\n\nTEXTO:\n{{texto}}{{juris}}",
  lacunas:    "Identifique LACUNAS e pontos que precisam de complementacao pelo advogado. Liste cada lacuna com: o que falta, onde deve ser inserido, e sugestao de conteudo.\n\nTEXTO:\n{{texto}}",
};

const MODES = [
  { id: "corrigir",   label: "Corrigir Texto",   color: "bg-blue-800/30 border-blue-600/40 text-blue-300" },
  { id: "redacao",    label: "Redação Jurídica",  color: "bg-purple-800/30 border-purple-600/40 text-purple-300" },
  { id: "lacunas",    label: "Verificar Lacunas", color: "bg-yellow-800/30 border-yellow-600/40 text-yellow-300" },
];

const ACTIONS = [
  { id: "resumir",     label: "Resumir" },
  { id: "revisar",     label: "Revisar" },
  { id: "refinar",     label: "Refinar" },
  { id: "simplificar", label: "Linguagem Simples" },
  { id: "minuta",      label: "Gerar Minuta" },
  { id: "analisar",    label: "Analisar" },
];

const AUTO_DETECT: [string, string, string, string][] = [
  ["gsk_",  "https://api.groq.com/openai/v1",                          "llama-3.3-70b-versatile", "Groq"],
  ["sk-or-","https://openrouter.ai/api/v1",                             "openai/gpt-4o-mini",      "OpenRouter"],
  ["pplx-", "https://api.perplexity.ai",                               "sonar-pro",               "Perplexity"],
  ["AIza",  "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.0-flash",        "Google Gemini"],
  ["xai-",  "https://api.x.ai/v1",                                     "grok-2-latest",           "xAI/Grok"],
  ["sk-ant","https://api.anthropic.com/v1",                             "claude-haiku-4-20250514", "Anthropic"],
  ["sk-",   "https://api.openai.com/v1",                               "gpt-4o-mini",             "OpenAI"],
];

function detectProvider(key: string) {
  const k = (key || "").trim();
  for (const [prefix, url, model, name] of AUTO_DETECT) {
    if (k.startsWith(prefix)) return { url, model, name };
  }
  return null;
}

interface SavedKey { id: string; label: string; key: string; url: string; model: string; provider: string; }
interface ChatMsg { role: "user" | "assistant"; content: string; }

function LegalText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: "13px", lineHeight: "1.9", color: "#e5e7eb" }}>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        const lines = trimmed.split("\n");
        const isSingleLine = lines.length === 1;
        const isTitle = isSingleLine && trimmed === trimmed.toUpperCase() && trimmed.length > 2 && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(trimmed) && !/^\d+\./.test(trimmed);
        const isSubtitle = isSingleLine && /^[A-Z]/.test(trimmed) && trimmed.length < 80 && !trimmed.endsWith(".") && /^(Do |Da |Das |Dos |De |Dos Fatos|Do Direito|Dos Pedidos|Da Causa|Das Preliminares|Da Competência|Do Mérito|Dos Danos|Da Responsabilidade|Da Conclusão|Do Valor|Das Provas|Da Prova|Dos Documentos)/i.test(trimmed);
        const isListItem = /^\d+[.\)]\s/.test(trimmed) || /^[a-z]\)/.test(trimmed) || /^[-–]\s/.test(trimmed);
        const isQuote = (trimmed.startsWith('"') || trimmed.startsWith('\u201c')) && trimmed.length > 60;
        if (isTitle) return <p key={i} style={{ textAlign: "justify", fontWeight: "bold", margin: "4px 0 0", textIndent: "0" }}>{trimmed}</p>;
        if (isSubtitle) return <p key={i} style={{ textAlign: "justify", fontWeight: "bold", margin: "4px 0 0", textIndent: "0" }}>{trimmed}</p>;
        if (isListItem) return <p key={i} style={{ textAlign: "justify", margin: "0", paddingLeft: "1cm", textIndent: "0" }}>{lines.map((l, j) => j === 0 ? l : <span key={j}><br />{l}</span>)}</p>;
        if (isQuote) return <p key={i} style={{ textAlign: "justify", margin: "0", paddingLeft: "4cm", fontSize: "12px" }}>{lines.map((l, j) => j === 0 ? l : <span key={j}><br />{l}</span>)}</p>;
        return <p key={i} style={{ textIndent: "4cm", textAlign: "justify", margin: "0" }}>{lines.map((l, j) => j === 0 ? l : <span key={j}><br />{l}</span>)}</p>;
      })}
    </div>
  );
}

interface Props { onBack: () => void; }

export default function AssistenteJuridico({ onBack }: Props) {
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem("aj_api_key")   || "");
  const [apiUrl,   setApiUrl]   = useState(() => localStorage.getItem("aj_api_url")   || "");
  const [apiModel, setApiModel] = useState(() => localStorage.getItem("aj_api_model") || "");
  const [showKey,       setShowKey]       = useState(false);
  const [showConfig,    setShowConfig]    = useState(false);
  const [showSavedKeys, setShowSavedKeys] = useState(false);
  const [keyLabel,      setKeyLabel]      = useState("");
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>(() => {
    try { return JSON.parse(localStorage.getItem("aj_saved_keys") || "[]"); } catch { return []; }
  });

  const [inputText,  setInputText]  = useState("");
  const [jurisText,  setJurisText]  = useState("");
  const [showJuris,  setShowJuris]  = useState(false);
  const [result,     setResult]     = useState("");
  const [streaming,  setStreaming]  = useState("");
  const [isLoading,  setIsLoading]  = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [ttsOn,      setTtsOn]      = useState(() => loadTTSConfig().enabled);
  const [isListening,setIsListening]= useState(false);
  const [copied,     setCopied]     = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [testResult, setTestResult] = useState<{ok:boolean;msg:string}|null>(null);
  const [testing,    setTesting]    = useState(false);

  // Chat de refinamento
  const [chatInput,   setChatInput]   = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const abortRef       = useRef<AbortController | null>(null);
  const resultRef      = useRef<HTMLDivElement>(null);
  const chatAbortRef   = useRef<AbortController | null>(null);
  const wantsListeningRef = useRef(false);
  const recognitionRef    = useRef<any>(null);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const audioInputRef     = useRef<HTMLInputElement>(null);
  const chatEndRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiKey)   localStorage.setItem("aj_api_key",   apiKey); else localStorage.removeItem("aj_api_key");
    if (apiUrl)   localStorage.setItem("aj_api_url",   apiUrl);
    if (apiModel) localStorage.setItem("aj_api_model", apiModel);
  }, [apiKey, apiUrl, apiModel]);

  useEffect(() => { localStorage.setItem("aj_saved_keys", JSON.stringify(savedKeys)); }, [savedKeys]);

  useEffect(() => {
    if (result || streaming) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result, streaming]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  useEffect(() => () => { wantsListeningRef.current = false; recognitionRef.current?.stop(); }, []);

  const applyKey = (k: string) => {
    setApiKey(k);
    setTestResult(null);
    const d = detectProvider(k);
    if (d) { setApiUrl(d.url); setApiModel(d.model); }
  };

  const testarChave = async () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) { setTestResult({ ok: false, msg: "❌ Insira uma chave primeiro." }); return; }
    setTesting(true); setTestResult(null);
    try {
      const url = (apiUrl || "https://api.openai.com/v1").replace(/\/$/, "");
      const model = apiModel || "gpt-4o-mini";
      const isGemini = cleanKey.startsWith("AIza");
      let result = "";
      if (isGemini) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Responda só: OK" }] }] }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || `Erro ${r.status}`);
        result = d.candidates?.[0]?.content?.parts?.[0]?.text || "OK";
      } else {
        const r = await fetch(`${url}/chat/completions`,
          { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${cleanKey}` },
            body: JSON.stringify({ model, messages: [{ role: "user", content: "Responda só: OK" }], max_tokens: 10 }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || `Erro ${r.status}`);
        result = d.choices?.[0]?.message?.content || "OK";
      }
      setTestResult({ ok: true, msg: `✅ Chave válida! Resposta: "${result.trim().slice(0, 40)}"` });
    } catch (e: any) {
      setTestResult({ ok: false, msg: `❌ ${e.message.slice(0, 120)}` });
    } finally { setTesting(false); }
  };

  const saveCurrentKey = () => {
    if (!apiKey.trim() || savedKeys.some(s => s.key === apiKey.trim())) return;
    const d = detectProvider(apiKey);
    const label = keyLabel.trim() || d?.name || "Chave " + (savedKeys.length + 1);
    setSavedKeys(prev => [...prev, { id: Date.now().toString(), label, key: apiKey.trim(), url: apiUrl, model: apiModel, provider: d?.name || "Custom" }]);
    setKeyLabel("");
  };

  const loadKey  = (sk: SavedKey) => { setApiKey(sk.key); setApiUrl(sk.url); setApiModel(sk.model); setShowSavedKeys(false); };
  const removeKey = (id: string) => setSavedKeys(prev => prev.filter(k => k.id !== id));

  // ─── Importar arquivo de texto ────────────────────────────────────────────
  const handleImportText = () => fileInputRef.current?.click();

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setInputText(prev => prev ? prev + "\n\n" + text : text);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  // ─── Importar áudio e transcrever com Whisper ─────────────────────────────
  const handleImportAudio = () => audioInputRef.current?.click();

  const onAudioSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      alert("Para transcrever áudio é necessário uma chave de API (Groq ou OpenAI).\nVá em ⚙️ Configurações e insira sua chave.");
      return;
    }

    setImporting(true);
    try {
      // Usar endpoint Whisper do Groq ou OpenAI
      const provider = detectProvider(cleanKey);
      const whisperUrl = cleanKey.startsWith("gsk_")
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";

      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("model", cleanKey.startsWith("gsk_") ? "whisper-large-v3" : "whisper-1");
      formData.append("language", "pt");
      formData.append("response_format", "text");

      const resp = await fetch(whisperUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${cleanKey}` },
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err.substring(0, 200));
      }

      const transcription = await resp.text();
      setInputText(prev => prev ? prev + "\n\n" + transcription.trim() : transcription.trim());
    } catch (err: any) {
      alert("Erro na transcrição: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // ─── Chamada à API ────────────────────────────────────────────────────────
  const callApi = useCallback(async (
    messages: { role: string; content: string }[],
    signal: AbortSignal,
    onChunk: (text: string) => void,
    onDone: (full: string) => void,
  ) => {
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages }),
        signal,
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || `Erro ${resp.status}`); }
      const data = await resp.json();
      onDone(data.content || "");
      return;
    }

    const url = (apiUrl || "https://api.groq.com/openai/v1").trim().replace(/\/$/, "");
    const model = apiModel || "llama-3.3-70b-versatile";
    const resp = await fetch(`${url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cleanKey}`, "HTTP-Referer": "https://sk-code-editor.app", "X-Title": "SK Jurídico" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        max_tokens: 16384,
      }),
      signal,
    });
    if (!resp.ok) { const e = await resp.text(); throw new Error(e.substring(0, 300)); }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error("Sem resposta");
    const decoder = new TextDecoder();
    let full = ""; let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const j = line.slice(6).trim();
        if (j === "[DONE]") continue;
        try {
          const p = JSON.parse(j);
          const delta = p.choices?.[0]?.delta?.content || "";
          if (delta) { full += delta; onChunk(full); }
        } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
      }
    }
    onDone(full);
  }, [apiKey, apiUrl, apiModel]);

  // ─── Ação principal ───────────────────────────────────────────────────────
  const runAction = useCallback(async (actionId: string) => {
    const text = inputText.trim();
    if (!text) { alert("Cole ou importe o texto do documento antes de escolher uma ação."); return; }
    if (isLoading) return;

    const jurisPart = jurisText.trim()
      ? `\n\nJURISPRUDENCIA FORNECIDA PELO ADVOGADO (use estas ementas OBRIGATORIAMENTE, cite-as literalmente):\n${jurisText.trim()}`
      : "";

    const template = ACTION_PROMPTS[actionId] || "Processe o seguinte texto juridico:\n\n{{texto}}";
    const userMessage = template.replace("{{texto}}", text).replace("{{juris}}", jurisPart);

    setIsLoading(true);
    setResult("");
    setStreaming("");
    setActiveMode(actionId);
    setChatHistory([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await callApi(
        [{ role: "user", content: userMessage }],
        controller.signal,
        (full) => setStreaming(full),
        (full) => {
          if (full.trim()) {
            setResult(full);
            if (ttsOn) speak(full.substring(0, 500), loadTTSConfig());
          }
        },
      );
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setResult(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
      setStreaming("");
      abortRef.current = null;
    }
  }, [inputText, jurisText, isLoading, ttsOn, callApi]);

  // ─── Chat de refinamento ──────────────────────────────────────────────────
  const sendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading || !result) return;

    const newHistory: ChatMsg[] = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    const controller = new AbortController();
    chatAbortRef.current = controller;

    // Contexto: resultado atual + conversa
    const messages = [
      { role: "user", content: `O documento que geramos foi o seguinte:\n\n${result}\n\n---\n\nAgora, por favor: ${msg}` },
      ...chatHistory.slice(1).map(m => ({ role: m.role, content: m.content })),
    ];
    if (chatHistory.length > 0) {
      // Se já há histórico, usa o histórico completo
      messages.splice(0, 1, { role: "user", content: `Documento gerado:\n\n${result}` });
      for (const m of chatHistory) messages.push({ role: m.role, content: m.content });
      messages.push({ role: "user", content: msg });
    }

    try {
      let aiReply = "";
      await callApi(
        messages,
        controller.signal,
        (full) => {
          aiReply = full;
          setChatHistory([...newHistory, { role: "assistant", content: full }]);
        },
        (full) => {
          aiReply = full;
          if (full.startsWith(result.substring(0, 50)) || full.length > 500) {
            // Se a resposta parece ser um novo documento, atualiza o resultado
            setResult(full);
          }
          setChatHistory([...newHistory, { role: "assistant", content: full }]);
        },
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setChatHistory([...newHistory, { role: "assistant", content: `❌ Erro: ${err.message}` }]);
      }
    } finally {
      setChatLoading(false);
      chatAbortRef.current = null;
    }
  }, [chatInput, chatLoading, result, chatHistory, callApi]);

  const stop = () => { abortRef.current?.abort(); abortRef.current = null; };

  // ─── Exportar ─────────────────────────────────────────────────────────────
  const downloadTxt = () => {
    const text = result || streaming;
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `juridico-${Date.now()}.txt`; a.click();
  };

  const downloadDocx = () => {
    const text = result || streaming;
    if (!text) return;
    // RTF com formatação ABNT - abre no Word
    const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
{\\f0\\fs26
${text
  .split(/\n\n+/)
  .map(block => {
    const t = block.trim();
    if (!t) return "";
    const isTitle = t === t.toUpperCase() && t.length > 2 && /[A-Z]/.test(t) && !/^\d/.test(t);
    if (isTitle) return `\\pard\\qj\\b ${t.replace(/[\\{}]/g, "\\$&")}\\b0\\par\\par`;
    if (/^\d+[.\)]\s/.test(t) || /^[-–]\s/.test(t)) return `\\pard\\qj\\li720 ${t.replace(/[\\{}]/g, "\\$&")}\\par\\par`;
    return `\\pard\\qj\\fi2268 ${t.replace(/[\\{}]/g, "\\$&")}\\par\\par`;
  })
  .join("\n")}
}}`;
    const blob = new Blob([rtf], { type: "application/rtf" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `juridico-${Date.now()}.rtf`; a.click();
  };

  const copyResult = () => {
    const text = result || streaming;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ─── Ditado por voz ───────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome ou Edge para ditar por voz."); return; }
    const rec = new SR(); rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = true;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null; let fullText = "";
    const scheduleStop = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        try { rec.stop(); } catch {}
        if (fullText.trim()) setInputText(prev => { const b = (prev || "").trimEnd(); return b ? b + "\n\n" + fullText.trim() : fullText.trim(); });
      }, 1800);
    };
    rec.onresult = (e: any) => {
      let final = ""; let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      fullText = final || interim;
      if (fullText) scheduleStop();
    };
    rec.onerror = () => { if (silenceTimer) clearTimeout(silenceTimer); recognitionRef.current = null; setIsListening(false); };
    rec.onend = () => { if (silenceTimer) clearTimeout(silenceTimer); recognitionRef.current = null; setIsListening(false); };
    recognitionRef.current = rec;
    try { rec.start(); setIsListening(true); } catch { setIsListening(false); }
  }, [isListening]);

  const activeProvider = detectProvider(apiKey);
  const displayText = streaming || result;

  return (
    <div className="h-[100dvh] flex flex-col bg-[#141c0d] text-gray-200 overflow-hidden">
      {/* HEADER */}
      <header className="h-11 flex items-center gap-2 px-3 bg-[#1c2714] border-b border-gray-700/50 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><ArrowLeft size={17} /></button>
        <Scale size={15} className="text-amber-400 shrink-0" />
        <span className="text-sm font-semibold flex-1 truncate">Assistente Jurídico</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700/30 shrink-0">
          {activeProvider ? activeProvider.name : "Gratuita ✨"}
        </span>
        <button onClick={() => { setTtsOn(v => { const n = !v; if (!n) stopSpeaking(); return n; }); }} className={`p-1.5 rounded-lg ${ttsOn ? "text-amber-400 bg-amber-900/20" : "text-gray-600 hover:bg-white/5"}`}>
          {ttsOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
        <button onClick={() => { setShowConfig(v => !v); setShowSavedKeys(false); }} className={`p-1.5 rounded-lg ${showConfig ? "bg-white/10 text-gray-200" : "hover:bg-white/5 text-gray-500"}`}>
          <Settings size={14} />
        </button>
        <button onClick={() => { setShowSavedKeys(v => !v); setShowConfig(false); }} className={`p-1.5 rounded-lg relative ${showSavedKeys ? "bg-white/10 text-gray-200" : "hover:bg-white/5 text-gray-500"}`}>
          <Key size={14} />
          {savedKeys.length > 0 && <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-amber-600 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{savedKeys.length}</span>}
        </button>
      </header>

      {/* CONFIG PANEL */}
      {showConfig && (
        <div className="border-b border-gray-700/40 bg-[#1c2714] p-3 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chave de API</span>
            <span className="text-[10px] text-amber-400">{apiKey ? "Sua chave ativa" : "Usando IA gratuita"}</span>
          </div>
          <div className="flex gap-1">
            <input type={showKey ? "text" : "password"} value={apiKey} onChange={e => applyKey(e.target.value.trim())}
              placeholder="gsk_..., AIza..., sk-..., pplx-..., xai-..."
              className="flex-1 h-8 px-2 text-[11px] font-mono bg-[#141c0d] border border-gray-700/50 rounded-lg text-gray-200 outline-none focus:border-amber-600/60" />
            <button onClick={() => setShowKey(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500">
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {apiKey && (
            <div className="flex gap-1 items-end">
              <input value={keyLabel} onChange={e => setKeyLabel(e.target.value)} placeholder={activeProvider?.name || "Nome para salvar"}
                className="flex-1 h-7 px-2 text-[11px] bg-[#141c0d] border border-gray-700/40 rounded text-gray-300 outline-none" />
              <button onClick={testarChave} disabled={testing}
                className="flex items-center gap-1 px-2 h-7 text-[11px] bg-blue-700/30 border border-blue-600/40 text-blue-300 rounded hover:bg-blue-700/50 disabled:opacity-50 shrink-0">
                {testing ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Testar
              </button>
              <button onClick={saveCurrentKey} className="flex items-center gap-1 px-2 h-7 text-[11px] bg-amber-700/30 border border-amber-600/40 text-amber-400 rounded hover:bg-amber-700/50 shrink-0">
                <Save size={11} /> Salvar
              </button>
            </div>
          )}
          {testResult && (
            <p className={`text-[10px] px-2 py-1 rounded ${testResult.ok ? "text-green-400 bg-green-900/20" : "text-red-400 bg-red-900/20"}`}>
              {testResult.msg}
            </p>
          )}
          {apiKey && activeProvider && <p className="text-[10px] text-amber-400">✓ {activeProvider.name} · {apiModel}</p>}
          <p className="text-[10px] text-gray-600">💡 Chave Groq (gsk_...) ou OpenAI (sk-...) ativa transcrição de áudio</p>
        </div>
      )}

      {/* SAVED KEYS */}
      {showSavedKeys && (
        <div className="border-b border-gray-700/40 bg-[#1c2714] p-3 space-y-1.5 shrink-0 max-h-40 overflow-y-auto">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chaves Salvas ({savedKeys.length})</span>
          {savedKeys.length === 0 ? <p className="text-[11px] text-gray-600 py-2 text-center">Nenhuma chave salva.</p> : savedKeys.map(sk => (
            <div key={sk.id} className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] ${sk.key === apiKey ? "bg-amber-900/20 border-amber-700/40" : "bg-[#141c0d] border-gray-700/30"}`}>
              <button onClick={() => loadKey(sk)} className="flex-1 text-left min-w-0">
                <div className="font-medium text-gray-200 truncate">{sk.label}</div>
                <div className="text-[10px] text-gray-500">{sk.provider} · {sk.key.substring(0, 8)}...{sk.key.slice(-4)}</div>
              </button>
              {sk.key === apiKey && <span className="text-[9px] text-amber-400 font-bold shrink-0">ATIVA</span>}
              <button onClick={() => removeKey(sk.id)} className="p-1 rounded hover:bg-red-900/20 text-gray-600 hover:text-red-400 shrink-0"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}

      {/* hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".txt,.md,.rtf" className="hidden" onChange={onFileSelected} />
      <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.mp4,.wav,.m4a,.ogg,.webm,.flac" className="hidden" onChange={onAudioSelected} />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">

        {/* INPUT */}
        <div className="p-3 border-b border-gray-700/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-500 font-medium">Texto do processo:</span>
            <div className="flex gap-1 flex-wrap justify-end">
              <button onClick={handleImportText} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-gray-700/40 text-gray-500 hover:text-amber-400 hover:border-amber-700/40">
                <FileText size={11} /> Importar .txt
              </button>
              <button onClick={handleImportAudio} disabled={importing} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-gray-700/40 text-gray-500 hover:text-amber-400 hover:border-amber-700/40 disabled:opacity-40">
                {importing ? <Loader2 size={11} className="animate-spin" /> : <FileAudio size={11} />}
                {importing ? "Transcrevendo..." : "Importar Áudio"}
              </button>
              <button onClick={startVoice} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all ${isListening ? "bg-red-600 text-white animate-pulse" : "border border-gray-700/40 text-gray-500 hover:text-amber-400 hover:border-amber-700/40"}`}>
                {isListening ? <><MicOff size={11} /> Parar</> : <><Mic size={11} /> Ditar</>}
              </button>
              <button onClick={() => setInputText("")} disabled={!inputText} className="px-2 py-1 rounded-lg text-[11px] border border-gray-700/40 text-gray-600 hover:text-red-400 disabled:opacity-30">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Cole o texto, importe um arquivo .txt, ou use os botões acima para importar áudio ou ditar por voz..."
            className="w-full h-32 resize-none bg-[#1c2714] border border-gray-700/40 rounded-xl px-3 py-2.5 text-[12px] text-gray-200 placeholder-gray-600 outline-none focus:border-amber-600/40 leading-relaxed"
          />
        </div>

        {/* JURISPRUDÊNCIA */}
        <div className="border-b border-gray-700/30">
          <button
            onClick={() => setShowJuris(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] text-gray-500 hover:text-amber-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Scale size={12} className="text-amber-600" />
              <span className="font-medium">Jurisprudência (opcional)</span>
              {jurisText && <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/30 text-amber-500 rounded-full border border-amber-700/30">{jurisText.split("\n").filter(l => l.trim()).length} linhas</span>}
            </div>
            {showJuris ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showJuris && (
            <div className="px-3 pb-3 space-y-1.5">
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Cole aqui as ementas de jurisprudência. A Jamile vai citá-las literalmente no documento — sem inventar.
              </p>
              <textarea
                value={jurisText}
                onChange={e => setJurisText(e.target.value)}
                placeholder="Cole aqui as ementas, súmulas ou precedentes que quer que ela use..."
                className="w-full h-28 resize-none bg-[#1c2714] border border-amber-800/30 rounded-xl px-3 py-2 text-[12px] text-gray-200 placeholder-gray-600 outline-none focus:border-amber-600/40 leading-relaxed"
              />
              {jurisText && (
                <button onClick={() => setJurisText("")} className="text-[10px] text-gray-600 hover:text-red-400 flex items-center gap-1">
                  <Trash2 size={10} /> Limpar jurisprudência
                </button>
              )}
            </div>
          )}
        </div>

        {/* MODOS */}
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Modos de operação:</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(m => (
              <button key={m.id} onClick={() => runAction(m.id)} disabled={isLoading}
                className={`flex items-center justify-center py-2.5 px-2 rounded-xl border text-[11px] font-medium transition-all active:scale-95 disabled:opacity-40 ${m.color}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* AÇÕES */}
        <div className="px-3 pb-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Outras ações:</p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map(a => (
              <button key={a.id} onClick={() => runAction(a.id)} disabled={isLoading}
                className="py-2.5 px-2 rounded-xl bg-[#1c2714] border border-gray-700/30 text-gray-400 text-[11px] font-medium hover:border-amber-700/40 hover:text-amber-400 transition-all active:scale-95 disabled:opacity-40">
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* RESULTADO */}
        {(displayText || isLoading) && (
          <div className="border-t border-gray-700/30 p-3" ref={resultRef}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                {isLoading ? (streaming ? "Gerando..." : "Processando...") : "Resultado"}
                {activeMode && <span className="ml-2 text-amber-500 capitalize">— {activeMode}</span>}
              </span>
              <div className="flex gap-1 flex-wrap justify-end">
                {isLoading ? (
                  <button onClick={stop} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-red-900/20 border border-red-700/30 text-red-400">
                    <StopCircle size={11} /> Parar
                  </button>
                ) : displayText ? (
                  <>
                    <button onClick={copyResult} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-gray-700/30 text-gray-500 hover:text-gray-300">
                      {copied ? <><Check size={11} className="text-green-400" /> Copiado!</> : <><Copy size={11} /> Copiar</>}
                    </button>
                    <button onClick={downloadTxt} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-gray-700/30 text-gray-500 hover:text-gray-300">
                      <Download size={11} /> .txt
                    </button>
                    <button onClick={downloadDocx} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-amber-800/40 text-amber-600 hover:text-amber-400">
                      <Download size={11} /> .rtf
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {isLoading && !streaming && (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 size={20} className="animate-spin text-amber-500" />
                <span className="text-sm text-gray-500">Processando com IA...</span>
              </div>
            )}

            {displayText && (
              <div className="bg-[#1c2714] border border-gray-700/30 rounded-xl p-4 relative">
                <LegalText text={displayText} />
                {isLoading && streaming && <span className="inline-block w-1.5 h-3.5 bg-amber-400 animate-pulse ml-0.5 rounded-sm" />}
              </div>
            )}
          </div>
        )}

        {/* CHAT DE REFINAMENTO */}
        {result && !isLoading && (
          <div className="border-t border-amber-800/20 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={12} className="text-amber-500" />
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Pedir modificações à Jamile</span>
            </div>
            <p className="text-[10px] text-gray-600">Peça ajustes, mudanças de tom, inclusões ou qualquer correção no texto gerado.</p>

            {chatHistory.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed ${msg.role === "user" ? "bg-amber-900/20 border border-amber-800/30 text-amber-200 ml-4" : "bg-[#1c2714] border border-gray-700/30 text-gray-300 mr-4"}`}>
                    <div className="text-[10px] font-bold mb-1 opacity-60">{msg.role === "user" ? "Você" : "Jamile"}</div>
                    {msg.content.length > 300 ? (
                      <details>
                        <summary className="cursor-pointer text-amber-400 text-[11px]">Ver resposta completa...</summary>
                        <div className="mt-2 whitespace-pre-wrap">{msg.content}</div>
                      </details>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-[#1c2714] border border-gray-700/30 rounded-xl px-3 py-2 flex items-center gap-2 mr-4">
                    <Loader2 size={12} className="animate-spin text-amber-500" />
                    <span className="text-[11px] text-gray-500">Jamile está respondendo...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Ex: Adicione mais fundamentação no capítulo do direito... / Mude o tom para mais formal... / Inclua pedido de tutela de urgência..."
                rows={2}
                className="flex-1 resize-none bg-[#1c2714] border border-amber-800/30 rounded-xl px-3 py-2 text-[12px] text-gray-200 placeholder-gray-600 outline-none focus:border-amber-600/50 leading-relaxed"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="self-end px-3 py-2 bg-amber-700/40 border border-amber-600/40 text-amber-300 rounded-xl hover:bg-amber-700/60 disabled:opacity-30 transition-colors"
              >
                {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
