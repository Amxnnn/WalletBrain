import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useWalletStore } from "../../stores/walletStore";
import { useUIStore } from "../../stores/uiStore";
import { useHelius } from "../../hooks/useHelius";
import { generateInsights } from "../../utils/insightEngine";
import { getPersonality } from "../../utils/personalityEngine";
import { calculateWalletScore } from "../../utils/scoreEngine";
import { InsightCard } from "../../components/InsightCard";
import { SkeletonList, SkeletonCard } from "../../components/SkeletonCard";
import { PersonalityBadge } from "../../components/PersonalityBadge";
import { NetworkSwitcher } from "../../components/NetworkSwitcher";
import { ErrorState } from "../../components/ErrorState";
import WalletScoreCard from "../../components/WalletScoreCard";
import BehavioralDNA from "../../components/BehavioralDNA";
import PreCrimeWarning from "../../components/PreCrimeWarning";
import { scheduleWeeklyReport, requestNotificationPermission } from "../../hooks/useNotifications";
import { Feather } from "@expo/vector-icons";
import { formatAddress } from "../../utils/formatters";
import { COLORS, SPACING, FONTS } from "../../constants/theme";
import { Insight } from "../../types";

export default function HomeScreen() {
  const {
    address,
    network,
    walletData,
    transactions,
    isLoading,
    error,
    reset,
    setScore,
  } = useWalletStore();

  const { refetch } = useHelius();
  const setPendingChatMessage = useUIStore((s) => s.setPendingChatMessage);
  const clearChat = useUIStore((s) => s.clearChat);

  const [settingsVisible, setSettingsVisible] = useState(false);

  // ── Compute score, insights & personality locally ─────────────────────
  const score = useMemo(
    () => (walletData ? calculateWalletScore(walletData, transactions) : null),
    [walletData, transactions]
  );

  // Sync score to store + schedule notification when first computed
  useEffect(() => {
    if (score) {
      setScore(score);
      (async () => {
        try {
          const granted = await requestNotificationPermission();
          if (granted) {
            await scheduleWeeklyReport(score.total, score.grade);
          }
        } catch {
          // Notification scheduling is non-critical — never crash the app
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score?.total, score?.grade]);

  // ── Compute insights & personality locally ─────────────────────────────────────
  const insights = useMemo(
    () => (walletData ? generateInsights(walletData, transactions, score ?? undefined) : []),
    [walletData, transactions, score]
  );
  const personality = useMemo(
    () => (transactions.length > 0 ? getPersonality(transactions) : null),
    [transactions]
  );

  // ── Pull‑to‑refresh ────────────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    if (address) refetch(address, network);
  }, [address, network, refetch]);

  // ── Insight tap: pre‑fill chat + navigate ─────────────────────────────
  const handleInsightPress = useCallback(
    (insight: Insight) => {
      setPendingChatMessage(insight.actionTopic);
      router.push("/(tabs)/chat");
    },
    [setPendingChatMessage]
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // ── Render ───────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading || (!walletData && !error)) {
      return <SkeletonList />;
    }
    if (error) {
      return (
        <View style={styles.centred}>
          <ErrorState
            message="Couldn't load wallet data. Check your connection."
            onRetry={onRefresh}
          />
        </View>
      );
    }
    if (insights.length === 0) {
      return (
        <View style={styles.centred}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>Fresh wallet! No activity yet.</Text>
          <Text style={styles.emptySubText}>
            Interact with Solana to unlock insights.
          </Text>
        </View>
      );
    }
    return (
      <>
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onPress={handleInsightPress}
          />
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          {address && (
            <Text style={styles.address}>{formatAddress(address)}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <NetworkSwitcher />
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={{ padding: 6 }}
          >
            <Feather name="settings" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable insight list ──────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Pre-Crime Warning — top of feed, dismissable, medium/high only */}
        {walletData && !isLoading && !error && (
          <PreCrimeWarning transactions={transactions} />
        )}

        {/* Score Card */}
        {score && address ? (
          <WalletScoreCard
            score={score}
            walletAddress={address}
            personalityEmoji={personality?.emoji ?? '🧠'}
            personalityLabel={personality?.label ?? 'Wallet'}
          />
        ) : isLoading ? (
          <SkeletonCard />
        ) : null}

        {renderContent()}

        {/* ── Behavioral DNA — shows below insight cards ── */}
        {walletData && !isLoading && !error && transactions.length > 0 && (
          <BehavioralDNA transactions={transactions} />
        )}

        {/* bottom spacer so PersonalityBadge doesn't cover last card */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {personality && (
        <View style={styles.badgeContainer}>
          <PersonalityBadge personality={personality} />
        </View>
      )}

      {/* ── Settings Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={() => {
                setSettingsVisible(false);
                reset();
                clearChat();
                router.replace('/onboarding');
              }}
            >
              <Feather
                name="log-out"
                size={18}
                color="#ff4444"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.disconnectText}>Disconnect Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  greeting: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: "700",
  },
  address: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
  },
  badgeContainer: {
    position: "absolute",
    bottom: SPACING.md,
    left: 0,
    right: 0,
  },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: SPACING.sm,
  },
  errorEmoji: { fontSize: 40 },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.body,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
  },
  retryBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: FONTS.body,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: "600",
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: FONTS.body,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
  },
  // ── Settings modal ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    margin: 32,
    width: '80%',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  disconnectBtn: {
    backgroundColor: '#ff444422',
    borderWidth: 1,
    borderColor: '#ff444444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disconnectText: {
    color: '#ff4444',
    fontSize: 15,
  },
  cancelBtn: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: FONTS.body,
  },
});
