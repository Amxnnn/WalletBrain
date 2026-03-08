import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../stores/walletStore';
import { useUIStore } from '../../stores/uiStore';
import { useHelius } from '../../hooks/useHelius';
import { useAI } from '../../hooks/useAI';
import { SkeletonCard } from '../../components/SkeletonCard';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { formatUSD } from '../../utils/formatters';
import { Token } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const SEASON_DATA = {
  season: 2,
  name: 'Season 2',
  status: 'LIVE',
  daysRemaining: 45,
  description: 'Earn SKR by using dApps on your Seeker device',
};

const QUESTIONS = [
  { emoji: '👑', text: 'How do I become a Legendary SKR holder?' },
  { emoji: '📈', text: 'What will SKR be worth if Seeker sells 500k units?' },
  { emoji: '⏰', text: 'When should I unstake my SKR?' },
  { emoji: '🗓️', text: 'How do I maximize my Season 2 rewards?' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface SKRStakeInfo {
  daysStaked: number;
  stakedAmount: number;
  earned: number;
  yearly: number;
  apy: number;
}

// ─── Rating helpers ───────────────────────────────────────────────────────────
const getSKRRating = (token: Token | null, stake: SKRStakeInfo | null): number => {
  let points = 0;
  if (token) points += 20;
  if (token && token.balance >= 5000) points += 30;
  else if (token && token.balance >= 1000) points += 20;
  else if (token && token.balance >= 100) points += 10;
  if (stake) points += 20;
  if (stake && stake.daysStaked >= 90) points += 30;
  else if (stake && stake.daysStaked >= 30) points += 20;
  else if (stake && stake.daysStaked >= 7) points += 10;
  return points;
};

const getRatingLabel = (points: number) => {
  if (points >= 90) return { label: 'LEGENDARY', emoji: '👑', stars: 5 };
  if (points >= 70) return { label: 'GOLD', emoji: '⭐', stars: 4 };
  if (points >= 50) return { label: 'SILVER', emoji: '🥈', stars: 3 };
  if (points >= 30) return { label: 'BRONZE', emoji: '🥉', stars: 2 };
  return { label: 'STARTER', emoji: '🌱', stars: 1 };
};

// ─── SKRRatingCard ────────────────────────────────────────────────────────────
function SKRRatingCard({
  skrToken,
  skrStakeInfo,
}: {
  skrToken: Token;
  skrStakeInfo: SKRStakeInfo | null;
}) {
  const points = getSKRRating(skrToken, skrStakeInfo);
  const rating = getRatingLabel(points);
  const tierLabel =
    skrToken.balance >= 5000 ? 'Whale' :
    skrToken.balance >= 1000 ? 'Holder' :
    skrToken.balance >= 100  ? 'Member' : 'Starter';
  const topPct =
    skrToken.balance >= 5000 ? 'Top 5%' :
    skrToken.balance >= 1000 ? 'Top 20%' :
    skrToken.balance >= 100  ? 'Top 40%' : 'Top 60%';

  return (
    <View style={ratingStyles.card}>
      <View style={ratingStyles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={ratingStyles.cardLabel}>SKR HOLDER RATING</Text>
          <Text style={ratingStyles.ratingTitle}>
            {rating.emoji}  {rating.label}
          </Text>
        </View>
        <View style={ratingStyles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) =>
            i <= rating.stars ? (
              <Text key={i} style={ratingStyles.starFilled}>⭐</Text>
            ) : (
              <Text key={i} style={[ratingStyles.starFilled, { color: COLORS.textMuted }]}>☆</Text>
            )
          )}
        </View>
      </View>

      <View style={ratingStyles.divider} />

      <View style={ratingStyles.statsRow}>
        <View style={ratingStyles.statBox}>
          <Text style={ratingStyles.statValue}>{tierLabel}</Text>
          <Text style={ratingStyles.statLabel}>Tier</Text>
        </View>
        <View style={ratingStyles.statBox}>
          <Text style={[ratingStyles.statValue, {
            color: skrStakeInfo ? COLORS.success : COLORS.warning,
          }]}>
            {skrStakeInfo ? 'Active' : 'Inactive'}
          </Text>
          <Text style={ratingStyles.statLabel}>Staking</Text>
        </View>
        <View style={ratingStyles.statBox}>
          <Text style={ratingStyles.statValue}>{topPct}</Text>
          <Text style={ratingStyles.statLabel}>Holders</Text>
        </View>
      </View>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  ratingTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starFilled: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});

// ─── SeasonsCard ──────────────────────────────────────────────────────────────
function SeasonsCard({ skrStakeInfo }: { skrStakeInfo: SKRStakeInfo | null }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const seasonEarned = skrStakeInfo
    ? (skrStakeInfo.earned * 1.2).toFixed(2)
    : '0.00';
  const progress = Math.round(((90 - SEASON_DATA.daysRemaining) / 90) * 100);

  return (
    <View style={seasonStyles.card}>
      <View style={seasonStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={seasonStyles.cardLabel}>🗓️  SOLANA MOBILE</Text>
          <Text style={seasonStyles.title}>Season 2 is Live</Text>
        </View>
        <View style={seasonStyles.liveBadge}>
          <Animated.View style={[seasonStyles.liveDot, { opacity: pulseAnim }]} />
          <Text style={seasonStyles.liveText}>  LIVE</Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={seasonStyles.infoRow}>
          {'⏰  '}
          <Text style={{ color: COLORS.text }}>
            {SEASON_DATA.daysRemaining} days remaining
          </Text>
        </Text>
        <Text style={seasonStyles.infoRow}>
          {'⭐  '}
          <Text style={{ color: COLORS.text }}>
            Est. earned this season: {seasonEarned} SKR
          </Text>
        </Text>
        <Text style={[seasonStyles.infoRow, { color: COLORS.textSecondary }]}>
          {'📱  Use dApps on Seeker to earn more'}
        </Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <View style={seasonStyles.progressTrack}>
          <View style={[seasonStyles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <View style={seasonStyles.progressLabels}>
          <Text style={seasonStyles.progressLabel}>Season start</Text>
          <Text style={[seasonStyles.progressLabel, { textAlign: 'right' }]}>45 days left</Text>
        </View>
      </View>
    </View>
  );
}

const seasonStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '22',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.success + '44',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoRow: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    marginTop: 6,
  },
  progressLabel: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
  },
});

// ─── ComparisonCard ───────────────────────────────────────────────────────────
function ComparisonCard({
  skrToken,
  skrStakeInfo,
}: {
  skrToken: Token;
  skrStakeInfo: SKRStakeInfo | null;
}) {
  const skrYield = skrStakeInfo?.yearly ?? 0;
  const pricePerToken = skrToken.balance > 0 ? skrToken.usdValue / skrToken.balance : 0.07;
  const skrYieldUSD = skrYield * pricePerToken;

  return (
    <View style={compStyles.card}>
      <Text style={compStyles.header}>💡 SKR vs Just Holding SOL</Text>
      <View style={compStyles.columnsRow}>
        <View style={compStyles.skrCol}>
          <Text style={compStyles.skrTitle}>⭐ SKR</Text>
          <Text style={compStyles.skrYield}>+{skrYield.toFixed(0)} SKR/yr</Text>
          <Text style={compStyles.skrUsd}>~${skrYieldUSD.toFixed(0)} value</Text>
          <View style={[compStyles.badge, {
            backgroundColor: skrStakeInfo ? COLORS.success + '22' : COLORS.warning + '22',
            borderColor: skrStakeInfo ? COLORS.success + '44' : COLORS.warning + '44',
          }]}>
            <Text style={[compStyles.badgeText, {
              color: skrStakeInfo ? COLORS.success : COLORS.warning,
            }]}>
              {skrStakeInfo ? 'Active staking' : 'Not staking'}
            </Text>
          </View>
        </View>

        <View style={compStyles.solCol}>
          <Text style={compStyles.solTitle}>◎ SOL (idle)</Text>
          <Text style={compStyles.solYield}>+0 SOL/yr</Text>
          <Text style={compStyles.solUsd}>No yield</Text>
          <View style={[compStyles.badge, {
            backgroundColor: COLORS.cardBorder,
            borderColor: COLORS.cardBorder,
          }]}>
            <Text style={[compStyles.badgeText, { color: COLORS.textMuted }]}>
              No rewards
            </Text>
          </View>
        </View>
      </View>
      <Text style={[compStyles.verdict, {
        color: skrStakeInfo ? COLORS.success : COLORS.warning,
      }]}>
        {skrStakeInfo
          ? `✓ You're earning ${skrYield.toFixed(0)} SKR/year by staying in the ecosystem.`
          : 'Stake your SKR to start earning rewards.'}
      </Text>
    </View>
  );
}

const compStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  header: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skrCol: {
    flex: 1,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    alignItems: 'center',
  },
  skrTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skrYield: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: 'bold',
  },
  skrUsd: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  solCol: {
    flex: 1,
    backgroundColor: COLORS.cardBorder + '40',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  solTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  solYield: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: 'bold',
  },
  solUsd: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
  },
  verdict: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});

export default function SkrScreen() {
  const router = useRouter();
  const { walletData, transactions, address, network, isLoading, isConnected } = useWalletStore();
  const { setPendingChatMessage } = useUIStore();
  const { refetch } = useHelius();
  const { sendMessage } = useAI();

  const [skrInsight, setSkrInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── SKR token detection ──────────────────────────────────────────────
  const skrToken = useMemo(
    () => walletData?.tokens.find(t => t.symbol?.toUpperCase() === 'SKR') ?? null,
    [walletData?.tokens]
  );
  const hasSKR = !!skrToken;

  // ── Staking detection from transaction history ───────────────────────
  const skrStakeInfo = useMemo(() => {
    if (!skrToken) return null;
    const stakeTxs = transactions.filter(
      (tx) =>
        tx.type?.includes('STAKE') ||
        tx.dappName?.toLowerCase().includes('skr') ||
        tx.type?.toLowerCase().includes('skr')
    );
    if (stakeTxs.length === 0) return null;

    const oldest = stakeTxs[stakeTxs.length - 1];
    const daysStaked = oldest?.timestamp
      ? Math.floor((Date.now() - oldest.timestamp * 1000) / 86_400_000)
      : 0;
    const stakedAmount = skrToken.balance ?? 0;
    const apy = 0.24;
    const earned = stakedAmount * apy * (daysStaked / 365);
    const yearly = stakedAmount * apy;

    return { daysStaked, stakedAmount, earned, yearly, apy };
  }, [transactions, skrToken]);

  // ── AI insight for SKR ───────────────────────────────────────────────
  const loadSKRInsight = useCallback(async () => {
    if (!skrToken || !walletData) return;
    setIsLoadingInsight(true);
    try {
      const result = await sendMessage(
        `In one sentence (max 15 words), give insight about holding ${skrToken.balance.toFixed(2)} SKR worth ${formatUSD(skrToken.usdValue)}.`,
        walletData,
        transactions
      );
      setSkrInsight(result);
    } finally {
      setIsLoadingInsight(false);
    }
  }, [skrToken, walletData, transactions, sendMessage]);

  useEffect(() => {
    if (hasSKR && !skrInsight) {
      loadSKRInsight();
    }
  }, [hasSKR]);

  const handleRefresh = async () => {
    if (!address) return;
    setIsRefreshing(true);
    await refetch(address, network);
    setIsRefreshing(false);
  };

  // ════════════════════════════════════════════════════════════════════
  // NOT CONNECTED
  // ════════════════════════════════════════════════════════════════════
  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48 }}>⭐</Text>
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>
          Connect wallet to view SKR
        </Text>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ padding: SPACING.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // NO SKR — empty state
  // ════════════════════════════════════════════════════════════════════
  if (!hasSKR) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.emptyScrollContent}>

          {/* Section 1 — What is SKR */}
          <View style={styles.emptyCard}>
            <Text style={styles.emptyStarEmoji}>⭐</Text>
            <Text style={styles.emptyTitle}>No SKR Detected</Text>
            <Text style={styles.emptyDesc}>
              SKR is how Solana Mobile rewards its most loyal users.
            </Text>
            <View style={styles.emptyDivider} />
            <Text style={styles.emptyLearnMore}>How to earn SKR:</Text>
            {[
              '📱  Use dApps on your Seeker device',
              '🗓️  Participate in Seasons',
              '🤝  Be active in the ecosystem',
            ].map((item) => (
              <Text key={item} style={styles.earnRow}>{item}</Text>
            ))}
          </View>

          {/* Section 2 — Season 2 Banner */}
          <View style={styles.seasonBanner}>
            <Text style={styles.seasonBannerEmoji}>🗓️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.seasonBannerTitle}>Season 2 is Live</Text>
              <Text style={styles.seasonBannerDesc}>
                Start using Solana dApps to earn your first SKR
              </Text>
            </View>
          </View>

          {/* Section 3 — CTA Buttons */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => {
                setPendingChatMessage(
                  'Tell me everything about SKR token and how Seeker owners earn it during Season 2'
                );
                router.push('/(tabs)/chat');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaPrimaryText}>🧠  Ask WalletBrain About SKR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => {
                setPendingChatMessage(
                  'How do I get SKR as a Seeker device owner? Give me a step by step guide'
                );
                router.push('/(tabs)/chat');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaSecondaryText}>📱  How Do I Get SKR?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => {
                setPendingChatMessage(
                  'Compare SKR staking rewards vs just holding SOL. Which is better for me?'
                );
                router.push('/(tabs)/chat');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaSecondaryText}>⚖️  SKR vs Holding SOL</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // HAS SKR — full screen
  // ════════════════════════════════════════════════════════════════════
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
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SKR</Text>
          <View style={[styles.networkBadge, {
            backgroundColor: network === 'mainnet' ? COLORS.success + '33' : COLORS.warning + '33',
          }]}>
            <Text style={[styles.networkBadgeText, {
              color: network === 'mainnet' ? COLORS.success : COLORS.warning,
            }]}>
              {network === 'mainnet' ? '● Mainnet' : '● Devnet'}
            </Text>
          </View>
        </View>

        {/* ── 1. SKR Balance Card ──────────────────────────────────── */}
        <LinearGradient
          colors={['#3b1f8c', '#1a0533', '#0a0a0a']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.balanceCard}
        >
          <View style={styles.balanceCardTop}>
            <Text style={styles.skrLabel}>⭐ SKR</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {skrToken.balance.toFixed(2)} SKR
          </Text>
          <Text style={styles.balanceUsd}>{formatUSD(skrToken.usdValue)}</Text>
          <Text style={styles.ecosystemTag}>
            Solana Mobile Ecosystem Token
          </Text>
        </LinearGradient>

        {/* ── 2. SKR Holder Rating ─────────────────────────────────── */}
        <SKRRatingCard skrToken={skrToken} skrStakeInfo={skrStakeInfo} />

        {/* ── 3. Seasons Card ──────────────────────────────────────── */}
        <SeasonsCard skrStakeInfo={skrStakeInfo} />

        {/* ── 4. Staking Overview ──────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>STAKING OVERVIEW</Text>

        {skrStakeInfo ? (
          <View style={[styles.statsGrid, { marginBottom: 12 }]}>
            <View style={[styles.statBox, { marginRight: 4 }]}>
              <Text style={styles.statValue}>
                {skrStakeInfo.daysStaked} days
              </Text>
              <Text style={styles.statLabel}>Staking Duration</Text>
            </View>
            <View style={[styles.statBox, { marginLeft: 4 }]}>
              <Text style={styles.statValue}>
                ~{(skrStakeInfo.apy * 100).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Est. APY</Text>
            </View>
            <View style={[styles.statBox, { marginRight: 4, marginTop: 8 }]}>
              <Text style={styles.statValue}>
                {skrStakeInfo.earned.toFixed(4)} SKR
              </Text>
              <Text style={styles.statLabel}>Est. Earned</Text>
            </View>
            <View style={[styles.statBox, { marginLeft: 4, marginTop: 8 }]}>
              <Text style={styles.statValue}>
                {skrStakeInfo.yearly.toFixed(2)} SKR
              </Text>
              <Text style={styles.statLabel}>Yearly Projection</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.noStakeCard, { marginBottom: 12 }]}>
            <Text style={styles.noStakeText}>No active staking detected</Text>
            <Text style={styles.noStakeSubtext}>
              Stake your SKR to earn rewards
            </Text>
          </View>
        )}

        {/* ── 5. Comparison Card ───────────────────────────────────── */}
        <ComparisonCard skrToken={skrToken} skrStakeInfo={skrStakeInfo} />

        {/* ── 6. AI SKR Insight ────────────────────────────────────── */}
        <View style={[styles.insightCard, { marginBottom: 12 }]}>
          <Text style={styles.insightEmoji}>🧠</Text>
          <View style={styles.insightBody}>
            <Text style={styles.insightLabel}>WalletBrain says:</Text>
            {isLoadingInsight ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginTop: 4 }}
              />
            ) : skrInsight ? (
              <Text style={styles.insightText}>{skrInsight}</Text>
            ) : (
              <Text style={styles.insightPlaceholder}>
                Analyzing your SKR position...
              </Text>
            )}
          </View>
        </View>

        {/* ── 7. Quick Questions ───────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>
          ASK WALLETBRAIN
        </Text>
        {QUESTIONS.map((q) => (
          <TouchableOpacity
            key={q.text}
            style={styles.questionChip}
            onPress={() => {
              setPendingChatMessage(q.text);
              router.push('/(tabs)/chat');
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.questionEmoji}>{q.emoji}</Text>
            <Text style={styles.questionText}>{q.text}</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
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

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  networkBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  networkBadgeText: {
    color: COLORS.success,
    fontSize: FONTS.small,
    textTransform: 'capitalize',
  },

  // ── Balance card ────────────────────────────────────────────────────
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skrLabel: {
    color: COLORS.text,
    fontSize: FONTS.medium,
  },
  balanceAmount: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 8,
  },
  balanceUsd: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 4,
  },
  ecosystemTag: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 12,
  },

  // ── Section label ────────────────────────────────────────────────────
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // ── Staking grid ────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 16,
    flex: 1,
    minWidth: '40%',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  noStakeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  noStakeText: {
    color: COLORS.textMuted,
    fontSize: FONTS.body,
  },
  noStakeSubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    marginTop: 6,
  },

  // ── AI Insight card ──────────────────────────────────────────────────
  insightCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  insightBody: {
    flex: 1,
  },
  insightLabel: {
    color: COLORS.primary,
    fontSize: 11,
    marginBottom: 4,
  },
  insightText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  insightPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 14,
  },

  // ── Quick question chips ─────────────────────────────────────────────
  questionChip: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  questionEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },

  // ── Empty state ──────────────────────────────────────────────────────
  emptyScrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStarEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  emptyDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  emptyLearnMore: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  earnRow: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  seasonBanner: {
    backgroundColor: '#1a0a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  seasonBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  seasonBannerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  seasonBannerDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  ctaContainer: {
    gap: 12,
  },
  ctaPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  ctaSecondary: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ctaSecondaryText: {
    color: COLORS.text,
    fontSize: 15,
  },
});
