import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

const LINKS = [
  { label: "TJMG â Portal de Processos", url: "https://www.tjmg.jus.br/portal-tjmg/processos/", icon: "ðï¸" },
  { label: "CNJ â Painel de Processos", url: "https://painel.cnj.jus.br/", icon: "âï¸" },
  { label: "PDPJ â Portal Digital", url: "https://pdpj.jus.br/", icon: "ð»" },
  { label: "Projudi MG", url: "https://projudi.tjmg.jus.br/projudi/", icon: "ð" },
  { label: "STJ â Consulta Processual", url: "https://processo.stj.jus.br/SCON/", icon: "ð" },
  { label: "STF â Consulta Processual", url: "https://portal.stf.jus.br/processos/", icon: "ð" },
  { label: "TRT 3Âª RegiÃ£o", url: "https://consulta.trt3.jus.br/consulta/consulta", icon: "âï¸" },
];

export default function Tramitacao() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>â¡ TramitaÃ§Ã£o Processual</Text>
        <Text style={styles.sub}>Acesso rÃ¡pido aos portais de consulta</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {LINKS.map((l) => (
          <TouchableOpacity key={l.url} style={styles.card} onPress={() => Linking.openURL(l.url)}>
            <Text style={styles.cardIcon}>{l.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{l.label}</Text>
              <Text style={styles.cardUrl} numberOfLines={1}>{l.url}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ð¡ Dica</Text>
          <Text style={styles.infoText}>
            Para consultas automatizadas via PDPJ, configure seu Token na aba PDPJ e use o robÃ´ de comunicaÃ§Ãµes.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  cardIcon: { fontSize: 24 },
  cardLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  cardUrl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  infoBox: { backgroundColor: "#1a2a1a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2d4a2d", marginTop: 8 },
  infoTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
});
