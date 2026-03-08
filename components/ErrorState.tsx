import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { COLORS, FONTS, SPACING } from "../constants/theme";

interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={{ alignItems: "center", padding: SPACING.xl }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠️</Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: FONTS.body,
          textAlign: "center",
          marginBottom: 20,
          lineHeight: 22,
        }}
      >
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          backgroundColor: COLORS.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 24,
        }}
      >
        <Text style={{ color: COLORS.text, fontWeight: "600" }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
