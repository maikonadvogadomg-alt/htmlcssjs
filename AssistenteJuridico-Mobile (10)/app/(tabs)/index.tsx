import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Audio } from "expo-av";
import { COLORS } from "@/constants/colors";
import { ResultCard } from "@/components/ResultCard";
import { falar, pararVoz } from "@/services/voice";
import { enviarParaIA } from "@/services/ai";
import { getConfig, addHistorico, getHistorico, getSnippets, saveSnippet, HistoricoItem, Snippet, AppConfig } from "@/services/storage";
import { SYSTEM_JURIDICO, PROMPTS } from "@/constants/prompts";
import { Audio as AvAudio } from "expo-av";

type Acao = keyof typeof PROMPTS;

interface AcaoConfig { id: Acao; label: string; icon: string; cor: string; grupo: string }

const ACOES: AcaoConfig[] = [
  { id: "corrigir",    label: "Corrigir Texto",       icon: "â",  cor: "#10b981", grupo: "modo" },
  { id: "redacao",     label: "RedaÃ§Ã£o JurÃ­dica",      icon: "â", cor: "#f97316", grupo: "modo" },
  { id: "lacunas",     label: "Verificar Lacunas",     icon: "ð", cor: "#ef4444", grupo: "modo" },
  { id: "resumir",     label: "Resumir",               icon: "ð", cor: "#3b82f6", grupo: "acao" },
  { id: "revisar",     label: "Revisar",               icon: "â", cor: "#22c55e", grupo: "acao" },
  { id: "refinar",     label: "Refinar",               icon: "â¨", cor: "#f59e0b", grupo: "acao" },
  { id: "simplificar", label: "Linguagem Simples",     icon: "ð£", cor: "#8b5cf6", grupo: "acao" },
  { id: "minuta",      label: "Gerar Minuta",          icon: "ð", cor: "#ec4899", grupo: "acao" },
  { id: "analisar",    label: "Analisar",              icon: "ð¬", cor: "#06b6d4", grupo: "acao" },
];

export default function Consulta() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [acaoAtiva, setAcaoAtiva] = useState<Acao>("resumir");
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [provedor, setProvedor] = useState("");
  // Modais
  const [showHistorico, setShowHistorico] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  // Voz
  const [gravando, setGravando] = useState(false);
  const [vozLoading, setVozLoading] = useState(false);
  const recordingRef = useRef<AvAudio.Recording | null>(null);
  // Modelo ativo
  const [modeloLabel, setModeloLabel] = useState("Demo");

  useEffect(() => {
    getConfig().then((c) => {
      setCfg(c);
      if (c.modeloAtivo === "chave1" && c.chave1) setModeloLabel("Chave 1");
      else if (c.modeloAtivo === "chave2" && c.chave2) setModeloLabel("Chave 2");
      else setModeloLabel("Demo Groq");
    });
  }, []);

  async function processar(acao?: Acao) {
    const a = acao || acaoAtiva;
    if (!texto.trim()) { Alert.alert("Texto vazio", "Cole ou dicte o texto jurÃ­dico para processar."); return; }
    if (loading) return;

    setLoading(true);
    setResultado("");
    setProvedor("");

    try {
      const prompt = PROMPTS[a].replace("{texto}", texto);
      const result = await enviarParaIA(SYSTEM_JURIDICO, prompt);

      if (result.erro) {
        Alert.alert("Erro de IA", result.erro);
      } else {
        setResultado(result.texto);
        setProvedor(result.provedor);
        await addHistorico({ tipo: a, entrada: texto.slice(0, 200), saida: result.texto, provedor: result.provedor });
        if (cfg?.vozAtiva) {
          await falar(result.texto, cfg.vozVelocidade);
        }
      }
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function importarArquivo() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/*", "application/json", "*/*"] });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const conteudo = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const truncado = conteudo.length > 150000 ? conteudo.slice(0, 150000) + "\n\n...[truncado em 150k caracteres]" : conteudo;
      setTexto(truncado);
      Alert.alert("Arquivo importado", `${asset.name} (${Math.round(conteudo.length / 1024)}KB)`);
    } catch {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel importar o arquivo. Verifique se Ã© um arquivo de texto.");
    }
  }

  async function exportarResultado() {
    if (!resultado) { Alert.alert("Sem resultado para exportar"); return; }
    try {
      const path = `${FileSystem.documentDirectory}resultado_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, resultado);
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Exportar Resultado" });
    } catch { Alert.alert("Erro ao exportar"); }
  }

  async function iniciarDitado() {
    try {
      await AvAudio.requestPermissionsAsync();
      await AvAudio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await AvAudio.Recording.createAsync(AvAudio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setGravando(true);
    } catch (e: any) {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel acessar o microfone: " + e.message);
    }
  }

  async function pararDitado() {
    setGravando(false);
    setVozLoading(true);
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;

      const currentCfg = await getConfig();
      const chave = currentCfg.chave1 || currentCfg.chaveDemo;

      const formData = new FormData();
      formData.append("file", { uri, type: "audio/m4a", name: "ditado.m4a" } as any);
      formData.append("model", "whisper-large-v3");
      formData.append("language", "pt");
      formData.append("response_format", "json");

      const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}` },
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.text) setTexto((prev) => prev ? `${prev}\n${data.text}` : data.text);
      } else {
        Alert.alert("Erro", `TranscriÃ§Ã£o falhou: ${resp.status}`);
      }
    } catch (e: any) {
      console.warn("Erro ditado:", e);
    } finally {
      setVozLoading(false);
    }
  }

  function abrirHistorico() {
    getHistorico().then((h) => { setHistorico(h); setShowHistorico(true); });
  }
  function abrirSnippets() {
    getSnippets().then((s) => { setSnippets(s); setShowSnippets(true); });
  }

  const grupoModo = ACOES.filter((a) => a.grupo === "modo");
  const grupoAcao = ACOES.filter((a) => a.grupo === "acao");

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>âï¸ Assistente JurÃ­dico</Text>
            <Text style={styles.sub}>Consulta e processamento de peÃ§as</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.modeloBadge}>
              <Text style={styles.modeloText}>{modeloLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={abrirHistorico}>
              <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={abrirSnippets}>
              <Ionicons name="bookmark-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seletor de aÃ§Ã£o â Modos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MODOS DE OPERAÃÃO</Text>
          <View style={styles.acaoRow}>
            {grupoModo.map((a) => (
              <TouchableOpacity key={a.id} style={[styles.acaoBtn, acaoAtiva === a.id && { borderColor: a.cor, backgroundColor: `${a.cor}18` }]} onPress={() => { setAcaoAtiva(a.id); processar(a.id); }}>
                <Text style={[styles.acaoBtnIcon, { color: a.cor }]}>{a.icon}</Text>
                <Text style={[styles.acaoBtnLabel, acaoAtiva === a.id && { color: a.cor }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Entrada de texto */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Entrada de texto:</Text>
            <TouchableOpacity style={[styles.ditarBtn, gravando && styles.ditarBtnAtivo]} onPressIn={iniciarDitado} onPressOut={pararDitado}>
              {vozLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name={gravando ? "mic" : "mic-outline"} size={16} color={gravando ? "#fff" : COLORS.primary} />}
              <Text style={[styles.ditarText, gravando && { color: "#fff" }]}>{vozLoading ? "Processando..." : gravando ? "Gravando..." : "DITAR"}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.inputTexto}
            placeholder="Cole aqui o texto do documento, petiÃ§Ã£o, sentenÃ§a, contrato ou qualquer outro texto jurÃ­dico que deseja processar..."
            placeholderTextColor={COLORS.textDim}
            value={texto}
            onChangeText={setTexto}
            multiline textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <TouchableOpacity style={styles.footerBtn} onPress={importarArquivo}>
              <Ionicons name="cloud-upload-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.footerBtnText}>Importar arquivo</Text>
            </TouchableOpacity>
            {texto.length > 0 && <Text style={styles.charCount}>{texto.length} chars</Text>}
            {texto.length > 0 && (
              <TouchableOpacity style={styles.footerBtn} onPress={() => setTexto("")}>
                <Ionicons name="trash-outline" size={14} color={COLORS.textDim} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* AÃ§Ãµes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OUTRAS AÃÃES</Text>
          <View style={styles.acaoGrid}>
            {grupoAcao.map((a) => (
              <TouchableOpacity key={a.id} style={[styles.acaoGridBtn, acaoAtiva === a.id && { borderColor: a.cor }]} onPress={() => { setAcaoAtiva(a.id); processar(a.id); }}>
                <Text style={{ fontSize: 16 }}>{a.icon}</Text>
                <Text style={[styles.acaoGridLabel, acaoAtiva === a.id && { color: a.cor }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BotÃ£o principal */}
        <TouchableOpacity style={[styles.btnProcessar, loading && styles.btnProcessarLoading]} onPress={() => processar()} disabled={loading}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.btnProcessarText}>Processando com IA...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.btnProcessarText}>{ACOES.find((a) => a.id === acaoAtiva)?.label || "Processar"}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Resultado */}
        {resultado ? (
          <ResultCard texto={resultado} provedor={provedor} vozAtiva={cfg?.vozAtiva} vozVelocidade={cfg?.vozVelocidade} onEditar={() => setTexto(resultado)} />
        ) : !loading && (
          <View style={styles.resultadoVazio}>
            <Ionicons name="hammer-outline" size={40} color={COLORS.textDim} />
            <Text style={styles.resultadoVazioText}>Cole o texto e escolha uma aÃ§Ã£o para comeÃ§ar</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal HistÃ³rico */}
      <Modal visible={showHistorico} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ð HistÃ³rico</Text>
            <TouchableOpacity onPress={() => setShowHistorico(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <FlatList
            data={historico}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum processamento ainda.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.histItem} onPress={() => { setResultado(item.saida); setShowHistorico(false); }}>
                <View style={styles.histItemHeader}>
                  <Text style={styles.histTipo}>{item.tipo}</Text>
                  <Text style={styles.histData}>{new Date(item.data).toLocaleDateString("pt-BR")}</Text>
                </View>
                <Text style={styles.histEntrada} numberOfLines={2}>{item.entrada}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Modal Snippets */}
      <Modal visible={showSnippets} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ð Trechos Salvos</Text>
            <TouchableOpacity onPress={() => setShowSnippets(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <FlatList
            data={snippets}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum trecho salvo. Use o botÃ£o ð no resultado para salvar.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.histItem} onPress={() => { setTexto(item.conteudo); setShowSnippets(false); }}>
                <Text style={styles.histTipo}>{item.titulo}</Text>
                <Text style={styles.histEntrada} numberOfLines={2}>{item.conteudo}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 52, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  modeloBadge: { backgroundColor: "#0f2d1f", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  modeloText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: COLORS.bgCard },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 10, color: COLORS.textDim, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  acaoRow: { flexDirection: "row", gap: 8 },
  acaoBtn: { flex: 1, alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bgCard, gap: 4 },
  acaoBtnIcon: { fontSize: 16 },
  acaoBtnLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600", textAlign: "center" },
  inputCard: { backgroundColor: COLORS.bgCard, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, overflow: "hidden" },
  inputHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  inputLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  ditarBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0f2d1f", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  ditarBtnAtivo: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  ditarText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  inputTexto: { minHeight: 160, padding: 14, color: COLORS.text, fontSize: 14, lineHeight: 22 },
  inputFooter: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.bgInput },
  footerBtnText: { fontSize: 12, color: COLORS.textMuted },
  charCount: { marginLeft: "auto", fontSize: 11, color: COLORS.textDim },
  acaoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  acaoGridBtn: { width: "30%", flexGrow: 1, alignItems: "center", gap: 4, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  acaoGridLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", textAlign: "center" },
  btnProcessar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginBottom: 16 },
  btnProcessarLoading: { backgroundColor: "#166534" },
  btnProcessarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resultadoVazio: { alignItems: "center", paddingVertical: 40, gap: 12 },
  resultadoVazioText: { color: COLORS.textDim, fontSize: 13, textAlign: "center" },
  modal: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  histItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  histItemHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  histTipo: { fontSize: 13, fontWeight: "700", color: COLORS.primary, textTransform: "capitalize" },
  histData: { fontSize: 11, color: COLORS.textDim },
  histEntrada: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  emptyText: { color: COLORS.textMuted, textAlign: "center", padding: 40 },
});
