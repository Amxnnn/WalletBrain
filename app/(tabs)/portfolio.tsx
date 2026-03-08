import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '../../stores/walletStore';
import { useUIStore } from '../../stores/uiStore';
import { useHelius } from '../../hooks/useHelius';
import PortfolioChart from '../../components/PortfolioChart';
import BreakdownChart from '../../components/BreakdownChart';
import ActivityChart from '../../components/ActivityChart';
import TokenRow from '../../components/TokenRow';
import { SkeletonCard } from '../../components/SkeletonCard';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { formatUSD, formatAddress, formatPercent } from '../../utils/formatters';
import { generatePortfolioChartData } from '../../utils/chartHelpers';

type ChartTab = 'value' | 'breakdown' | 'activity';
type Timeframe = '7D' | '30D' | '90D';

export default function PortfolioScreen() {
  const router = useRouter();
  const { walletData, transactions, isLoading, address, network } = useWalletStore();
  const { setPendingChatMessage } = useUIStore();
  const { refetch } = useHelius();

  const [activeChart, setActiveChart] = useState<ChartTab>('value');
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!address) return;
    setIsRefreshing(true);
    await refetch(address, network);
    setIsRefreshing(false);
  };

  const handleTokenPress = (symbol: string) => {
    setPendingChatMessage(`Tell me about my ${symbol} position`);
    router.push('/(tabs)/chat');
  };

  const handleNFTPress = () => {
    setPendingChatMessage('Tell me about my NFTs');
    router.push('/(tabs)/chat');
  };

  // Sort tokens by USD value descending
  const sortedTokens = useMemo(
    () => [...(walletData?.tokens ?? [])].sort((a, b) => b.usdValue - a.usdValue),
    [walletData?.tokens]
  );

  // Calculate 24h portfolio change (sum of each token's usd delta)
  const portfolioChange = useMemo(() => {
    if (!walletData?.tokens) return 0;
    return walletData.tokens.reduce(
      (sum, t) => sum + t.usdValue * (t.change24h / 100),
      0
    );
  }, [walletData?.tokens]);

  // Chart data (memoised — only recomputes when timeframe or totalValue changes)
  const chartData = useMemo(
    () =>
      generatePortfolioChartData(
        transactions,
        walletData?.totalValueUSD ?? 0,
        timeframe
      ),
    [transactions, walletData?.totalValueUSD, timeframe]
  );

  const CHART_TABS: { key: ChartTab; label: string }[] = [
    { key: 'value', label: 'Value' },
    { key: 'breakdown', label: 'Breakdown' },
    { key: 'activity', label: 'Activity' },
  ];

  const TIMEFRAMES: Timeframe[] = ['7D', '30D', '90D'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── SECTION 1: HEADER ── */}
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.md,
          }}
        >
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: FONTS.xxlarge,
                  fontWeight: 'bold',
                }}
              >
                {walletData ? formatUSD(walletData.totalValueUSD) : '--'}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color: portfolioChange >= 0 ? COLORS.success : COLORS.danger,
                    fontSize: FONTS.body,
                    marginRight: 8,
                  }}
                >
                  {portfolioChange >= 0 ? '+' : ''}
                  {formatUSD(portfolioChange)}{' '}
                  ({formatPercent(
                    walletData?.totalValueUSD
                      ? (portfolioChange / walletData.totalValueUSD) * 100
                      : 0
                  )})
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small }}>
                  24h
                </Text>
              </View>
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: FONTS.small,
                  marginTop: 4,
                }}
              >
                {formatAddress(address ?? '')}
              </Text>
            </>
          )}
        </View>

        {/* ── SECTION 2: TIMEFRAME SELECTOR ── */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: SPACING.lg,
            gap: SPACING.sm,
            marginBottom: SPACING.md,
          }}
        >
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf}
              onPress={() => setTimeframe(tf)}
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor:
                  timeframe === tf ? COLORS.primary : COLORS.card,
              }}
            >
              <Text
                style={{
                  color: timeframe === tf ? COLORS.text : COLORS.textMuted,
                  fontSize: FONTS.small,
                  fontWeight: timeframe === tf ? '600' : '400',
                }}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SECTION 3: CHART TABS ── */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.cardBorder,
            marginBottom: SPACING.md,
          }}
        >
          {CHART_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveChart(tab.key)}
              style={{
                marginRight: SPACING.lg,
                paddingBottom: SPACING.sm,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeChart === tab.key ? COLORS.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeChart === tab.key ? COLORS.text : COLORS.textMuted,
                  fontSize: FONTS.body,
                  fontWeight: activeChart === tab.key ? '600' : '400',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SECTION 4: ACTIVE CHART (only one rendered at a time) ── */}
        <View
          style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.lg }}
        >
          {isLoading ? (
            <SkeletonCard />
          ) : activeChart === 'value' ? (
            <PortfolioChart data={chartData} timeframe={timeframe} />
          ) : activeChart === 'breakdown' && walletData ? (
            <BreakdownChart walletData={walletData} />
          ) : activeChart === 'activity' ? (
            <ActivityChart transactions={transactions} />
          ) : (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.textMuted }}>No data available</Text>
            </View>
          )}
        </View>

        {/* ── SECTION 5: TOKEN LIST ── */}
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            marginBottom: SPACING.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SPACING.sm,
            }}
          >
            <Text
              style={{
                color: COLORS.textMuted,
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                flex: 1,
              }}
            >
              Your Tokens
            </Text>
            <View
              style={{
                backgroundColor: COLORS.primary + '22',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 11 }}>
                {sortedTokens.length} tokens
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
            }}
          >
            {isLoading ? (
              <View style={{ padding: SPACING.md }}>
                <SkeletonCard />
              </View>
            ) : sortedTokens.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.body }}>
                  No tokens in this wallet yet.
                </Text>
              </View>
            ) : (
              sortedTokens.map((token) => (
                <TokenRow
                  key={token.mint}
                  token={token}
                  onPress={() => handleTokenPress(token.symbol)}
                />
              ))
            )}
          </View>
        </View>

        {/* ── SECTION 6: NFT ROW ── */}
        {(walletData?.nfts?.length ?? 0) > 0 && (
          <View
            style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}
          >
            <TouchableOpacity
              onPress={handleNFTPress}
              activeOpacity={0.7}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🖼️</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontWeight: '600',
                    fontSize: FONTS.medium,
                  }}
                >
                  NFTs
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small }}>
                  {walletData?.nfts.length} items
                </Text>
              </View>
              <Text style={{ color: COLORS.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SECTION 7: NETWORK LABEL ── */}
        <View style={{ alignItems: 'center', paddingBottom: 40 }}>
          <Text
            style={{
              color:
                network === 'mainnet' ? COLORS.success : COLORS.warning,
              fontSize: 12,
            }}
          >
            ● Connected on{' '}
            {network === 'mainnet' ? 'Mainnet Beta' : 'Devnet'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
