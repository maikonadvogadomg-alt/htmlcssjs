import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Share, Alert, Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { COLORS } from "@/constants/colors";
import { falar, pararVoz } from "@/services/voice";
import { saveSnippet } from "@/services/storage";

interface Props {
  texto: string;
  provedor?: string;
  modelo?: string;
  vozAtiva?: boolean;
  vozVelocidade?: number;
  onEditar?: () => void;
}

export function ResultCard({ texto, provedor, modelo, vozAtiva = false, vozVelocidade = 1.1, onEditar }: Props) {
  const [falando, setFalando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function toggleVoz() {
    if (falando) {
      await pararVoz();
      setFalando(false);
    } else {
      setFalando(true);
      await falar(texto, vozVelocidade);
      setFalando(false);
    }
  }

  function copiar() {
    Clipboard.setString(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function salvarSnippet() {
    const titulo = `${new Date().toLocaleDateString("pt-BR")} â ${texto.slice(0, 40)}...`;
    await saveSnippet(titulo, texto);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  async function exportarTxt() {
    try {
      const path = `${FileSystem.documentDirectory}resultado_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, texto, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: "Exportar resultado" });
    } catch (e) {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel exportar o arquivo.");
    }
  }

  if (!texto) return null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dot} />
          <Text style={styles.headerLabel}>Resultado</Text>
          {provedor && <Text style={styles.badge}>{provedor}</Text>}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={toggleVoz}>
            <Ionicons name={falando ? "stop-circle" : "volume-high-outline"} size={18} color={falando ? COLORS.danger : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={copiar}>
            <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={18} color={copiado ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={salvarSnippet}>
            <Ionicons name={salvo ? "bookmark" : "bookmark-outline"} size={18} color={salvo ? COLORS.warning : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={exportarTxt}>
            <Ionicons name="download-outline" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          {onEditar && (
            <TouchableOpacity style={styles.btn} onPress={onEditar}>
              <Ionicons name="create-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* ConteÃºdo */}
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        <Text style={styles.texto} selectable>{texto}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.bgCard, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden", marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  headerLabel: { color: COLORS.text, fontWeight: "600", fontSize: 13 },
  badge: { backgroundColor: "#1e3a2f", color: COLORS.primary, fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  actions: { flexDirection: "row", gap: 4 },
  btn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  scroll: { maxHeight: 400, padding: 14 },
  texto: { color: COLORS.text, fontSize: 14, lineHeight: 22 },
});
