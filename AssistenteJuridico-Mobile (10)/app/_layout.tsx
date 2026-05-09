import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "@/constants/colors";
import { getConfig } from "@/services/storage";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="config-inicial" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      </Stack>
    </>
  );
}
