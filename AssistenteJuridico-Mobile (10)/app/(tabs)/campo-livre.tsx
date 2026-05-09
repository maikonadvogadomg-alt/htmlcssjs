import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { COLORS } from "@/constants/colors";
import { MensagemFormatada } from "@/components/CodeBlock";
import { falar, pararVoz } from "@/services/voice";
import { enviarParaIA, AIMessage } from "@/services/ai";
import { getConfig, getConversa, saveConversa, clearConversa, Mensagem, AppConfig } from "@/services/storage";
import { CAMPO_LIVRE_SYSTEM } from "@/constants/prompts";

const TAMANHOS = [
  { label: "Conciso", tokens: 1000, desc: "Respostas curtas e diretas" },
  { label: "Normal", tokens: 3000, desc: "Resposta padrÃ£o equilibrada" },
  { label: "Detalhado", tokens: 6000, desc: "ExplicaÃ§Ã£o completa" },
  { label: "MÃ¡ximo", tokens: 12000, desc: "Resposta mais longa possÃ­vel" },
];

export default function CampoLivre() {
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [tamanho, setTamanho] = useState(1); // Normal
  const [vozResposta, setVozResposta] = useState(false);
  const [falando, setFalando] = useState(false);
  const [arquivoAnexado, setArquivoAnexado] = useState<{ nome: string; conteudo: string } | null>(null);
  const [showTamanho, setShowTamanho] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getConfig().then(setCfg);
    getConversa().then(setMsgs);
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs]);

  async function enviar() {
    const texto = input.trim();
    if (!texto && !arquivoAnexado) return;
    if (loading) return;

    let conteudo = texto;
    if (arquivoAnexado) {
      conteudo = conteudo
        ? `${conteudo}\n\n[Arquivo: ${arquivoAnexado.nome}]\n${arquivoAnexado.conteudo}`
        : `[Arquivo: ${arquivoAnexado.nome}]\n${arquivoAnexado.conteudo}`;
    }

    const novaMsgUser: Mensagem = { id: Date.now().toString(), role: "user", content: conteudo, data: Date.now() };
    const novasMsgs = [...msgs, novaMsgUser];
    setMsgs(novasMsgs);
    setInput("");
    setArquivoAnexado(null);
    setLoading(true);

    try {
      const historico: AIMessage[] = novasMsgs.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      const result = await enviarParaIA(CAMPO_LIVRE_SYSTEM, "", historico);

      if (result.erro) {
        const errMsg: Mensagem = { id: (Date.now() + 1).toString(), role: "assistant", content: `â Erro: ${result.erro}`, data: Date.now() };
        const finalMsgs = [...novasMsgs, errMsg];
        setMsgs(finalMsgs);
        await saveConversa(finalMsgs);
      } else {
        const assistMsg: Mensagem = { id: (Date.now() + 1).toString(), role: "assistant", content: result.texto, data: Date.now() };
        const finalMsgs = [...novasMsgs, assistMsg];
        setMsgs(finalMsgs);
        await saveConversa(finalMsgs);
        if (vozResposta && cfg) {
          setFalando(true);
          await falar(result.texto, cfg.vozVelocidade);
          setFalando(false);
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
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/*", "application/json", "application/pdf"] });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const conteudo = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const truncado = conteudo.length > 20000 ? conteudo.slice(0, 20000) + "\n...[truncado]" : conteudo;
      setArquivoAnexado({ nome: asset.name || "arquivo.txt", conteudo: truncado });
    } catch (e) {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel ler o arquivo.");
    }
  }

  async function exportarConversa() {
    if (msgs.length === 0) { Alert.alert("Conversa vazia"); return; }
    const texto = msgs.map((m) => `${m.role === "user" ? "ð¤ VocÃª" : "ð¤ Jasmim"} [${new Date(m.data).toLocaleString("pt-BR")}]:\n${m.content}`).join("\n\n---\n\n");
    try {
      const path = `${FileSystem.documentDirectory}conversa_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, texto);
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Exportar Conversa" });
    } catch {
      Alert.alert("Erro ao exportar");
    }
  }

  async function limparConversa() {
    Alert.alert("Limpar conversa?", "Todas as mensagens serÃ£o apagadas.", [
      { text: "Cancelar" },
      { text: "Limpar", style: "destructive", onPress: async () => { await clearConversa(); setMsgs([]); } },
    ]);
  }

  async function toggleVoz(texto: string) {
    if (falando) { await pararVoz(); setFalando(false); }
    else if (cfg) { setFalando(true); await falar(texto, cfg.vozVelocidade); setFalando(false); }
  }

  function formatarHora(ts: number) {
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ð¬ Campo Livre</Text>
          <Text style={styles.sub}>Chat jurÃ­dico livre com Jasmim</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setVozResposta(!vozResposta)}>
            <Ionicons name={vozResposta ? "volume-high" : "volume-mute-outline"} size={20} color={vozResposta ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={exportarConversa}>
            <Ionicons name="download-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={limparConversa}>
            <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de tamanho */}
      <View style={styles.tamanhoBar}>
        <Text style={styles.tamanhoLabel}>Resposta:</Text>
        {TAMANHOS.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tamanhoBtn, tamanho === i && styles.tamanhoBtnAtivo]} onPress={() => setTamanho(i)}>
            <Text style={[styles.tamanhoText, tamanho === i && styles.tamanhoTextAtivo]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mensagens */}
      <ScrollView ref={scrollRef} style={styles.msgs} contentContainerStyle={{ padding: 12, paddingBottom: 4 }}>
        {msgs.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>ð¬</Text>
            <Text style={styles.emptyTitle}>Campo Livre</Text>
            <Text style={styles.emptyDesc}>Converse livremente sobre qualquer tema jurÃ­dico. Pode perguntar sobre leis, pedir minutas, analisar casos, pesquisar jurisprudÃªncia...</Text>
          </View>
        )}
        {msgs.map((m) => (
          <View key={m.id} style={[styles.msgBubble, m.role === "user" ? styles.msgUser : styles.msgAssist]}>
            {m.role === "assistant" && (
              <View style={styles.msgHeader}>
                <Text style={styles.msgAuthor}>âï¸ Jasmim</Text>
                <View style={styles.msgActions}>
                  <TouchableOpacity onPress={() => toggleVoz(m.content)}>
                    <Ionicons name="volume-high-outline" size={14} color={COLORS.textDim} />
                  </TouchableOpacity>
                  <Text style={styles.msgHora}>{formatarHora(m.data)}</Text>
                </View>
              </View>
            )}
            {m.role === "user" ? (
              <Text style={styles.msgTextoUser}>{m.content}</Text>
            ) : (
              <MensagemFormatada texto={m.content} />
            )}
            {m.role === "user" && <Text style={styles.msgHoraUser}>{formatarHora(m.data)}</Text>}
          </View>
        ))}
        {loading && (
          <View style={styles.digitando}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.digitandoText}>Jasmim estÃ¡ pensando...</Text>
          </View>
        )}
      </ScrollView>

      {/* Arquivo anexado */}
      {arquivoAnexado && (
        <View style={styles.arquivoBox}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
          <Text style={styles.arquivoNome} numberOfLines={1}>{arquivoAnexado.nome}</Text>
          <TouchableOpacity onPress={() => setArquivoAnexado(null)}>
            <Ionicons name="close-circle" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.inputBtn} onPress={importarArquivo}>
          <Ionicons name="attach-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Pergunte algo jurÃ­dico..."
          placeholderTextColor={COLORS.textDim}
          value={input}
          onChangeText={setInput}
          multiline
          maxHeight={120}
        />
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() && !arquivoAnexado) && styles.sendBtnDisabled]} onPress={enviar} disabled={loading || (!input.trim() && !arquivoAnexado)}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: COLORS.bgCard },
  tamanhoBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bgCard },
  tamanhoLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginRight: 2 },
  tamanhoBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  tamanhoBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  tamanhoText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  tamanhoTextAtivo: { color: COLORS.primary },
  msgs: { flex: 1 },
  empty: { alignItems: "center", marginTop: 60, padding: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 22 },
  msgBubble: { marginBottom: 12, borderRadius: 14, padding: 12, maxWidth: "90%" },
  msgUser: { alignSelf: "flex-end", backgroundColor: "#1a3a2a", borderBottomRightRadius: 4 },
  msgAssist: { alignSelf: "flex-start", backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4, maxWidth: "95%" },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  msgAuthor: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  msgActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  msgHora: { fontSize: 10, color: COLORS.textDim },
  msgHoraUser: { fontSize: 10, color: "#4a8a6a", marginTop: 6, alignSelf: "flex-end" },
  msgTextoUser: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
  digitando: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  digitandoText: { color: COLORS.textMuted, fontSize: 13 },
  arquivoBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0f2d1f", padding: 8, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  arquivoNome: { flex: 1, fontSize: 12, color: COLORS.primary },
  inputArea: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bgCard },
  inputBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.text, fontSize: 14, maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
});
