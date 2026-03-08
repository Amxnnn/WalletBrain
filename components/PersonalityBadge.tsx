import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Share,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PersonalityResult } from "../types";
import { COLORS, SPACING, FONTS } from "../constants/theme";

interface PersonalityBadgeProps {
  personality: PersonalityResult;
}

export function PersonalityBadge({ personality }: PersonalityBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm a ${personality.label} ${personality.emoji} on Solana!\n\nAnalyzed by WalletBrain — the AI wallet analyst for Seeker.\n\nCheck it out on the Solana Mobile dApp Store.`,
        title: 'My WalletBrain Personality',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#7c3aed", "#9f67f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.badge}
        >
          <Text style={styles.badgeEmoji}>{personality.emoji}</Text>
          <View>
            <Text style={styles.badgeLabel}>{personality.label}</Text>
            <Text style={styles.badgeTagline} numberOfLines={1}>
              {personality.tagline}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={styles.sheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.handle} />

            <Text style={styles.modalEmoji}>{personality.emoji}</Text>
            <Text style={styles.modalLabel}>{personality.label}</Text>
            <Text style={styles.modalTagline}>{personality.tagline}</Text>

            <View style={styles.statsRow}>
              <StatBox
                label="Total Txs"
                value={String(personality.stats.totalTxs)}
              />
              <StatBox label="Top dApp" value={personality.stats.topDapp} />
              <StatBox label="Net P&L" value={personality.stats.netPnL} />
            </View>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share My Personality 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeLabel: {
    color: "#fff",
    fontSize: FONTS.medium,
    fontWeight: "700",
  },
  badgeTagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FONTS.small,
    flex: 1,
    flexShrink: 1,
  },
  chevron: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 22,
    marginLeft: "auto",
    fontWeight: "300",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
  },
  modalEmoji: {
    fontSize: 56,
  },
  modalLabel: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: "700",
  },
  modalTagline: {
    color: COLORS.textSecondary,
    fontSize: FONTS.body,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: "700",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  shareBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl,
    width: "100%",
    alignItems: "center",
  },
  shareBtnText: {
    color: "#fff",
    fontSize: FONTS.medium,
    fontWeight: "700",
  },
  closeBtn: {
    paddingVertical: SPACING.sm,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: FONTS.body,
  },
});
