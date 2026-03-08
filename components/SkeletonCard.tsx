import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

export const SkeletonCard = React.memo(function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      {/* Emoji placeholder */}
      <View style={styles.emojiPlaceholder} />
      <View style={styles.content}>
        {/* Title placeholder */}
        <View style={styles.titlePlaceholder} />
        {/* Description placeholders */}
        <View style={styles.descPlaceholder} />
        <View style={[styles.descPlaceholder, { width: "70%" }]} />
      </View>
    </Animated.View>
  );
});

export const SkeletonList = React.memo(function SkeletonList() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </>
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
  emojiPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBorder,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titlePlaceholder: {
    height: 16,
    width: "50%",
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
  },
  descPlaceholder: {
    height: 12,
    width: "90%",
    borderRadius: 6,
    backgroundColor: COLORS.cardBorder,
  },
});
