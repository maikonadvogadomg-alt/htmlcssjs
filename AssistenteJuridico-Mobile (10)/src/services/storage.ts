import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppConfig {
  senhaLogin: string;
  loginConfigurado: boolean;
  primeiroAcesso: boolean;
  // Chaves de IA
  chave1: string;
  chave1Url?: string;
  chave1Modelo?: string;
  chave2: string;
  chave2Url?: string;
  chave2Modelo?: string;
  chaveDemo: string;
  chaveDemoModelo: string;
  chaveDemoUrl: string;
  chavePerplexity: string;
  // Banco de dados
  databaseUrl: string;
  // PreferÃªncias
  temaEscuro: boolean;
  vozAtiva: boolean;
  vozVelocidade: number;
  modeloAtivo: "chave1" | "chave2" | "demo";
}

const CONFIG_KEY = "@aj_config";
const HISTORY_KEY = "@aj_history";
const SNIPPETS_KEY = "@aj_snippets";
const CONVERSA_KEY = "@aj_conversa";

const DEFAULT_CONFIG: AppConfig = {
  senhaLogin: "",
  loginConfigurado: false,
  primeiroAcesso: true,
  chave1: "",
  chave1Url: "",
  chave1Modelo: "",
  chave2: "",
  chave2Url: "",
  chave2Modelo: "",
  chaveDemo: "gsk_demo_placeholder",
  chaveDemoModelo: "llama-3.3-70b-versatile",
  chaveDemoUrl: "https://api.groq.com/openai/v1",
  chavePerplexity: "",
  databaseUrl: "",
  temaEscuro: true,
  vozAtiva: false,
  vozVelocidade: 1.1,
  modeloAtivo: "demo",
};

export async function getConfig(): Promise<AppConfig> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(partial: Partial<AppConfig>): Promise<void> {
  const current = await getConfig();
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...partial }));
}

export async function isPrimeiroAcesso(): Promise<boolean> {
  const cfg = await getConfig();
  return cfg.primeiroAcesso;
}

export async function verificarSenha(senha: string): Promise<boolean> {
  const cfg = await getConfig();
  if (!cfg.loginConfigurado || !cfg.senhaLogin) return true;
  return cfg.senhaLogin === senha;
}

// HistÃ³rico de processamentos
export interface HistoricoItem {
  id: string;
  tipo: string;
  entrada: string;
  saida: string;
  data: number;
  provedor?: string;
}

export async function getHistorico(): Promise<HistoricoItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addHistorico(item: Omit<HistoricoItem, "id" | "data">): Promise<void> {
  const hist = await getHistorico();
  const novo: HistoricoItem = {
    ...item,
    id: Date.now().toString(),
    data: Date.now(),
  };
  const updated = [novo, ...hist].slice(0, 100);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearHistorico(): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}

// Snippets (trechos salvos)
export interface Snippet {
  id: string;
  titulo: string;
  conteudo: string;
  data: number;
}

export async function getSnippets(): Promise<Snippet[]> {
  try {
    const raw = await AsyncStorage.getItem(SNIPPETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveSnippet(titulo: string, conteudo: string): Promise<void> {
  const snips = await getSnippets();
  snips.unshift({ id: Date.now().toString(), titulo, conteudo, data: Date.now() });
  await AsyncStorage.setItem(SNIPPETS_KEY, JSON.stringify(snips.slice(0, 50)));
}

export async function deleteSnippet(id: string): Promise<void> {
  const snips = await getSnippets();
  await AsyncStorage.setItem(SNIPPETS_KEY, JSON.stringify(snips.filter(s => s.id !== id)));
}

// Conversa do Campo Livre
export interface Mensagem {
  id: string;
  role: "user" | "assistant";
  content: string;
  data: number;
}

export async function getConversa(): Promise<Mensagem[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveConversa(msgs: Mensagem[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSA_KEY, JSON.stringify(msgs.slice(-200)));
}

export async function clearConversa(): Promise<void> {
  await AsyncStorage.setItem(CONVERSA_KEY, JSON.stringify([]));
}
