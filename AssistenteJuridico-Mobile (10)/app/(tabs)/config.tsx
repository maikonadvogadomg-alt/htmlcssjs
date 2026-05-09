import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { getConfig, saveConfig, clearHistorico, clearConversa, AppConfig } from "@/services/storage";
import { autoDetectProvider } from "@/services/ai";

export default function Config() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [secao, setSecao] = useState<"chaves" | "senha" | "db" | "pref">("chaves");

  useEffect(() => { getConfig().then(setCfg); }, []);

  async function salvar() {
    if (!cfg) return;
    await saveConfig(cfg);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  function update(key: keyof AppConfig, val: any) {
    setCfg((c) => c ? { ...c, [key]: val } : c);
  }

  const chave1Info = cfg?.chave1 ? autoDetectProvider(cfg.chave1) : null;
  const chave2Info = cfg?.chave2 ? autoDetectProvider(cfg.chave2) : null;

  if (!cfg) return <View style={styles.loading}><Text style={{ color: COLORS.textMuted }}>Carregando...</Text></View>;

  const SECOES = [
    { id: "chaves", icon: "key-outline", label: "Chaves IA" },
    { id: "senha", icon: "lock-closed-outline", label: "Senha" },
    { id: "db", icon: "server-outline", label: "Banco" },
    { id: "pref", icon: "options-outline", label: "PreferÃªncias" },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>âï¸ ConfiguraÃ§Ãµes</Text>
        <Text style={styles.sub}>Tudo salvo localmente no dispositivo</Text>
      </View>

      {/* Seletor de seÃ§Ã£o */}
      <View style={styles.tabBar}>
        {SECOES.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.tabBtn, secao === s.id && styles.tabBtnAtivo]} onPress={() => setSecao(s.id)}>
            <Ionicons name={s.icon} size={16} color={secao === s.id ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabLabel, secao === s.id && styles.tabLabelAtivo]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* CHAVES */}
        {secao === "chaves" && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ð¤ Chave Principal (Chave 1)</Text>
              <TextInput style={styles.input} placeholder="gsk_... ou AIza... ou sk-..." placeholderTextColor={COLORS.textDim} value={cfg.chave1} onChangeText={(v) => update("chave1", v)} autoCapitalize="none" autoCorrect={false} />
              {chave1Info && <Text style={styles.detected}>â {chave1Info.nome} â {chave1Info.modelo}</Text>}
              <Text style={styles.label}>URL personalizada (opcional)</Text>
              <TextInput style={styles.input} placeholder="https://api.groq.com/openai/v1" placeholderTextColor={COLORS.textDim} value={cfg.chave1Url || ""} onChangeText={(v) => update("chave1Url", v)} autoCapitalize="none" autoCorrect={false} />
              <Text style={styles.label}>Modelo personalizado (opcional)</Text>
              <TextInput style={styles.input} placeholder="llama-3.3-70b-versatile" placeholderTextColor={COLORS.textDim} value={cfg.chave1Modelo || ""} onChangeText={(v) => update("chave1Modelo", v)} autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ð¤ Chave SecundÃ¡ria (Chave 2)</Text>
              <TextInput style={styles.input} placeholder="Segunda chave (outro provedor)" placeholderTextColor={COLORS.textDim} value={cfg.chave2} onChangeText={(v) => update("chave2", v)} autoCapitalize="none" autoCorrect={false} />
              {chave2Info && <Text style={styles.detected}>â {chave2Info.nome} â {chave2Info.modelo}</Text>}
              <Text style={styles.label}>URL personalizada (opcional)</Text>
              <TextInput style={styles.input} placeholder="https://..." placeholderTextColor={COLORS.textDim} value={cfg.chave2Url || ""} onChangeText={(v) => update("chave2Url", v)} autoCapitalize="none" autoCorrect={false} />
              <Text style={styles.label}>Modelo personalizado (opcional)</Text>
              <TextInput style={styles.input} placeholder="modelo-aqui" placeholderTextColor={COLORS.textDim} value={cfg.chave2Modelo || ""} onChangeText={(v) => update("chave2Modelo", v)} autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ð¯ Modelo Ativo</Text>
              {(["demo", "chave1", "chave2"] as const).map((m) => (
                <TouchableOpacity key={m} style={[styles.opcao, cfg.modeloAtivo === m && styles.opcaoAtiva]} onPress={() => update("modeloAtivo", m)}>
                  <Ionicons name={cfg.modeloAtivo === m ? "radio-button-on" : "radio-button-off"} size={18} color={cfg.modeloAtivo === m ? COLORS.primary : COLORS.textMuted} />
                  <Text style={styles.opcaoText}>
                    {m === "demo" ? "ð¯ Demo Groq (gratuito, sem chave)" : m === "chave1" ? "ð Chave 1" + (chave1Info ? ` â ${chave1Info.nome}` : "") : "ð Chave 2" + (chave2Info ? ` â ${chave2Info.nome}` : "")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Provedores suportados (auto-detectados)</Text>
              {[["gsk_...", "Groq â GRATUITO"], ["AIza...", "Google Gemini â GRATUITO"], ["sk-or-...", "OpenRouter"], ["sk-ant...", "Anthropic Claude"], ["pplx-...", "Perplexity (busca web)"], ["xai-...", "xAI Grok"], ["sk-...", "OpenAI GPT-4o"]].map(([p, d]) => (
                <Text key={p} style={styles.infoItem}>â¢ <Text style={{ fontFamily: "monospace", color: COLORS.primary }}>{p}</Text>  {d}</Text>
              ))}
            </View>
          </>
        )}

        {/* SENHA */}
        {secao === "senha" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ð Senha de Acesso</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Exigir senha ao abrir o app</Text>
              <Switch value={cfg.loginConfigurado} onValueChange={(v) => update("loginConfigurado", v)} trackColor={{ true: COLORS.primary }} />
            </View>
            {cfg.loginConfigurado && (
              <>
                <Text style={styles.label}>Nova senha</Text>
                <TextInput style={styles.input} placeholder="Nova senha (mÃ­nimo 4 caracteres)" placeholderTextColor={COLORS.textDim} value={cfg.senhaLogin} onChangeText={(v) => update("senhaLogin", v)} secureTextEntry autoCapitalize="none" />
                <Text style={[styles.infoItem, { marginTop: 10 }]}>A senha Ã© salva apenas no dispositivo. Se esquecer, desinstale e reinstale o app.</Text>
              </>
            )}
          </View>
        )}

        {/* BANCO */}
        {secao === "db" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ðï¸ Banco de Dados Neon</Text>
            <Text style={[styles.infoItem, { marginBottom: 12 }]}>Conecte ao Neon (PostgreSQL) para sincronizar histÃ³rico e snippets entre dispositivos. Opcional â sem banco, tudo fica salvo localmente.</Text>
            <TextInput
              style={[styles.input, { minHeight: 90 }]}
              placeholder="postgresql://usuario:senha@host.neon.tech/banco?sslmode=require"
              placeholderTextColor={COLORS.textDim}
              value={cfg.databaseUrl}
              onChangeText={(v) => update("databaseUrl", v)}
              multiline autoCapitalize="none" autoCorrect={false}
            />
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>SQL para criar as tabelas no Neon:</Text>
              <Text style={styles.codeHint}>Abra o arquivo SQL_SETUP.sql incluÃ­do no projeto e execute no painel do Neon.</Text>
            </View>
          </View>
        )}

        {/* PREFERÃNCIAS */}
        {secao === "pref" && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ð Voz</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Leitura em voz (TTS)</Text>
                <Switch value={cfg.vozAtiva} onValueChange={(v) => update("vozAtiva", v)} trackColor={{ true: COLORS.primary }} />
              </View>
              <Text style={styles.label}>Velocidade da voz</Text>
              <View style={styles.speedRow}>
                {[0.8, 1.0, 1.1, 1.3, 1.5].map((v) => (
                  <TouchableOpacity key={v} style={[styles.speedBtn, cfg.vozVelocidade === v && styles.speedBtnAtivo]} onPress={() => update("vozVelocidade", v)}>
                    <Text style={[styles.speedText, cfg.vozVelocidade === v && styles.speedTextAtivo]}>{v}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ðï¸ Dados Locais</Text>
              <TouchableOpacity style={styles.btnDanger} onPress={() => Alert.alert("Limpar histÃ³rico?", "Apaga todo o histÃ³rico de processamentos.", [{ text: "Cancelar" }, { text: "Limpar", style: "destructive", onPress: clearHistorico }])}>
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                <Text style={styles.btnDangerText}>Limpar HistÃ³rico de Processamentos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={() => Alert.alert("Limpar conversa?", "Apaga toda a conversa do Campo Livre.", [{ text: "Cancelar" }, { text: "Limpar", style: "destructive", onPress: clearConversa }])}>
                <Ionicons name="chatbox-outline" size={16} color={COLORS.danger} />
                <Text style={styles.btnDangerText}>Limpar Conversa Campo Livre</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* BotÃ£o salvar */}
        <TouchableOpacity style={[styles.btnSalvar, salvo && styles.btnSalvarOk]} onPress={salvar}>
          <Ionicons name={salvo ? "checkmark" : "save-outline"} size={18} color="#fff" />
          <Text style={styles.btnSalvarText}>{salvo ? "Salvo!" : "Salvar ConfiguraÃ§Ãµes"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  tabBar: { flexDirection: "row", backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10 },
  tabBtnAtivo: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  tabLabelAtivo: { color: COLORS.primary },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 14 },
  label: { fontSize: 11, color: COLORS.textMuted, marginTop: 10, marginBottom: 4, fontWeight: "600", textTransform: "uppercase" },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 13 },
  detected: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
  opcao: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  opcaoAtiva: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  opcaoText: { color: COLORS.text, fontSize: 14 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  switchLabel: { fontSize: 14, color: COLORS.text },
  speedRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  speedBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  speedBtnAtivo: { borderColor: COLORS.primary, backgroundColor: "#0f2d1f" },
  speedText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 13 },
  speedTextAtivo: { color: COLORS.primary },
  btnDanger: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger, marginBottom: 8, backgroundColor: "#1a0808" },
  btnDangerText: { color: COLORS.danger, fontSize: 13, fontWeight: "600" },
  infoBox: { backgroundColor: "#0f1a0f", borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  infoTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 8 },
  infoItem: { fontSize: 12, color: COLORS.textDim, marginBottom: 4, lineHeight: 18 },
  codeHint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  btnSalvar: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSalvarOk: { backgroundColor: COLORS.primaryDark },
  btnSalvarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
