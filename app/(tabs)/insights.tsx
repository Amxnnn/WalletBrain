import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../stores/walletStore';
import { useUIStore } from '../../stores/uiStore';
import { useAI } from '../../hooks/useAI';
import { SkeletonCard } from '../../components/SkeletonCard';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

type TokenVerdict = {
  symbol: string;
  signal: 'up' | 'hold' | 'review';
  verdict: string;
};

function signalIcon(signal: 'up' | 'hold' | 'review') {
  if (signal === 'up') return { char: '↑', color: COLORS.success };
  if (signal === 'review') return { char: '↓', color: COLORS.danger };
  return { char: '→', color: COLORS.warning };
}

export default function InsightsScreen() {
  const router = useRouter();
  const { walletData, isConnected } = useWalletStore();
  const {
    marketPulse,
    marketPulseLastUpdated,
    setPendingChatMessage,
    setMarketPulse,
    setMarketPulseLastUpdated,
  } = useUIStore();
  const { generateTokenVerdicts, generateMarketPulse } = useAI();

  const [tokenVerdicts, setTokenVerdicts] = useState<TokenVerdict[]>([]);
  const [isLoadingVerdicts, setIsLoadingVerdicts] = useState(true);
  const [isLoadingPulse, setIsLoadingPulse] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVerdicts = useCallback(async () => {
    if (!walletData?.tokens?.length) {
      setIsLoadingVerdicts(false);
      return;
    }
    setIsLoadingVerdicts(true);
    try {
      const results = await generateTokenVerdicts(walletData.tokens);
      setTokenVerdicts(results);
    } catch (e) {
      console.error('verdicts error:', e);
      setTokenVerdicts([]);
    }
    setIsLoadingVerdicts(false);
  }, [walletData?.tokens, generateTokenVerdicts]);

  const loadPulseIfStale = useCallback(async (force = false) => {
    const isStale =
      !marketPulseLastUpdated ||
      Date.now() - marketPulseLastUpdated > 24 * 60 * 60 * 1000;
    if (!force && !isStale) {
      setIsLoadingPulse(false);
      return;
    }
    setIsLoadingPulse(true);
    try {
      const results = await generateMarketPulse();
      setMarketPulse(results);
      setMarketPulseLastUpdated(Date.now());
    } catch (e) {
      console.error('pulse error:', e);
    }
    setIsLoadingPulse(false);
  }, [generateMarketPulse, setMarketPulse, setMarketPulseLastUpdated, marketPulseLastUpdated]);

  useEffect(() => {
    loadVerdicts();
    loadPulseIfStale();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadVerdicts(), loadPulseIfStale(true)]);
    setIsRefreshing(false);
  }, [loadVerdicts, loadPulseIfStale]);

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centeredState]}>
        <Text style={styles.emptyEmoji}>🧠</Text>
        <Text style={styles.emptyTitle}>Connect your wallet</Text>
        <Text style={styles.emptySubtitle}>to see AI insights</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Insights</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            {isLoadingVerdicts || isLoadingPulse ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Feather name="refresh-cw" size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Your Holdings ────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>YOUR HOLDINGS</Text>

        {isLoadingVerdicts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tokenVerdicts.length > 0 ? (
          tokenVerdicts.map((item) => {
            const sig = signalIcon(item.signal);
            return (
              <TouchableOpacity
                key={item.symbol}
                style={styles.verdictRow}
                onPress={() => {
                  setPendingChatMessage(
                    `Tell me more about my ${item.symbol} position`
                  );
                  router.push('/(tabs)/chat');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.signalBox}>
                  <Text style={[styles.signalChar, { color: sig.color }]}>
                    {sig.char}
                  </Text>
                </View>
                <View style={styles.verdictMiddle}>
                  <Text style={styles.verdictSymbol}>{item.symbol}</Text>
                  <Text style={styles.verdictText}>{item.verdict}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptySectionText}>No tokens found in this wallet.</Text>
          </View>
        )}

        {/* ── Market Pulse ─────────────────────────────────────────── */}
        <View style={styles.pulseHeader}>
          <Text style={[styles.sectionLabel, { flex: 1 }]}>MARKET PULSE</Text>
          <Text style={styles.poweredBy}>Powered by Helius</Text>
        </View>

        {isLoadingPulse ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : marketPulse.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptySectionText}>
              Market data unavailable. Pull to refresh.
            </Text>
          </View>
        ) : (
          marketPulse.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.pulseCard}
              onPress={() => {
                setPendingChatMessage(item.observation);
                router.push('/(tabs)/chat');
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.pulseEmoji}>{item.emoji}</Text>
              <Text style={styles.pulseObservation}>{item.observation}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshBtn: {
    padding: 8,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  verdictRow: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalBox: {
    width: 32,
    alignItems: 'center',
  },
  signalChar: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  verdictMiddle: {
    flex: 1,
    marginLeft: 4,
  },
  verdictSymbol: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  verdictText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  poweredBy: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  pulseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  pulseEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  pulseObservation: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.body,
    lineHeight: 20,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptySectionText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: FONTS.body,
  },
});
