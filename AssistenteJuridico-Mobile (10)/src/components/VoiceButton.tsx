import React, { useState, useRef } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { COLORS } from "@/constants/colors";

interface Props {
  onTranscricao: (texto: string) => void;
  size?: number;
  style?: any;
}

export function VoiceButton({ onTranscricao, size = 22, style }: Props) {
  const [gravando, setGravando] = useState(false);
  const [loading, setLoading] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  async function iniciarGravacao() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setGravando(true);
    } catch (e) {
      console.warn("Erro ao iniciar gravaÃ§Ã£o:", e);
    }
  }

  async function pararGravacao() {
    setGravando(false);
    setLoading(true);
    try {
      if (!recordingRef.current) return;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;

      // Aqui usamos Whisper via Groq (gratuito) para transcriÃ§Ã£o
      const formData = new FormData();
      formData.append("file", { uri, type: "audio/m4a", name: "audio.m4a" } as any);
      formData.append("model", "whisper-large-v3");
      formData.append("language", "pt");
      formData.append("response_format", "json");

      const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${global.__GROQ_KEY__ || ""}` },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        onTranscricao(data.text || "");
      }
    } catch (e) {
      console.warn("Erro transcriÃ§Ã£o:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ActivityIndicator color={COLORS.primary} size="small" style={style} />;

  return (
    <TouchableOpacity
      style={[styles.btn, gravando && styles.btnAtivo, style]}
      onPressIn={iniciarGravacao}
      onPressOut={pararGravacao}
    >
      <Ionicons name={gravando ? "mic" : "mic-outline"} size={size} color={gravando ? "#fff" : COLORS.primary} />
      {gravando && <View style={styles.pulso} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  btnAtivo: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  pulso: {
    position: "absolute", width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: COLORS.danger, opacity: 0.4,
  },
});
