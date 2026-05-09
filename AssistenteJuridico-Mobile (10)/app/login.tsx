import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { verificarSenha } from "@/services/storage";

export default function Login() {
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  async function entrar() {
    setLoading(true);
    setErro(false);
    const ok = await verificarSenha(senha);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      setErro(true);
      setSenha("");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.icon}>âï¸</Text>
      <Text style={styles.title}>Assistente JurÃ­dico</Text>
      <Text style={styles.sub}>Digite sua senha para continuar</Text>

      <TextInput
        style={[styles.input, erro && { borderColor: COLORS.danger }]}
        placeholder="Senha"
        placeholderTextColor={COLORS.textDim}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={entrar}
      />
      {erro && <Text style={styles.erro}>Senha incorreta. Tente novamente.</Text>}

      <TouchableOpacity style={styles.btn} onPress={entrar} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Verificando..." : "Entrar"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  sub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 32 },
  input: { width: "100%", backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, color: COLORS.text, fontSize: 16, marginBottom: 8 },
  erro: { color: COLORS.danger, fontSize: 13, marginBottom: 12 },
  btn: { width: "100%", backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
