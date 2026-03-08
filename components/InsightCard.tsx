import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Insight } from "../types";
import { COLORS, SPACING, FONTS } from "../constants/theme";

interface InsightCardProps {
  insight: Insight;
  onPress: (insight: Insight) => void;
}

export const InsightCard = React.memo(function InsightCard({ insight, onPress }: InsightCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPress={() => onPress(insight)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text style={styles.emoji}>{insight.emoji}</Text>
        <View style={styles.content}>
          <Text style={styles.title}>{insight.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {insight.description}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  emoji: {
    fontSize: 32,
    width: 44,
    textAlign: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: "600",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    lineHeight: 18,
  },
});
