import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { useAgentStore, AgentTrade } from '../../stores/agentStore';
import { useAgent } from '../../hooks/useAgent';
import { explorerUrl } from '../../utils/jupiterService';
import { SkeletonCard } from '../../components/SkeletonCard';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function truncateSig(sig: string): string {
  return `${sig.slice(0, 8)}...${sig.slice(-6)}`;
}

const ACTION_CONFIG = {
  hold:      { bg: '#2a2a2a', color: '#9ca3af', label: 'HOLD' },
  swap:      { bg: '#1e3a5f', color: '#60a5fa', label: 'SWAP' },
  rebalance: { bg: '#2d1b5e', color: '#a78bfa', label: 'REBALANCE' },
};

function ActionBadge({ action }: { action: AgentTrade['action'] }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <View style={[bs.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[bs.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function NetworkPill({ network }: { network: 'mainnet' | 'devnet' }) {
  const isMain = network === 'mainnet';
  return (
    <View style={[bs.netPill, { borderColor: isMain ? COLORS.success : COLORS.warning }]}>
      <View style={[bs.netDot, { backgroundColor: isMain ? COLORS.success : COLORS.warning }]} />
      <Text style={[bs.netText, { color: isMain ? COLORS.success : COLORS.warning }]}>
        {isMain ? 'MAINNET' : 'DEVNET'}
      </Text>
    </View>
  );
}

const bs = StyleSheet.create({
  badge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  text:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  netPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  netDot:  { width: 7, height: 7, borderRadius: 4 },
  netText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AgentScreen() {
  const {
    agentWallet, agentActive, agentLoading, agentError,
    network, riskLevel, realSolBalance, startingSolBalance,
    currentBalance, startingBalance, trades,
    setAgentError, setRiskLevel,
  } = useAgentStore();

  const { createWallet, refreshBalance, airdrop, makeDecision, activateAgent, pauseAgent, removeWallet } = useAgent();

  const [generateVisible, setGenerateVisible] = useState(false);
  const [pendingNet,      setPendingNet]       = useState<'mainnet' | 'devnet'>('devnet');
  const [mainnetWarn,     setMainnetWarn]      = useState(false);
  const [copied,          setCopied]           = useState(false);

  // Computed stats
  const latestTrade  = trades[0] ?? null;
  const winRate      = trades.length > 0 ? Math.round((trades.filter(t => t.virtualPnl > 0).length / trades.length) * 100) : 0;
  const bestTrade    = trades.length > 0 ? Math.max(...trades.map(t => t.virtualPnl)) : 0;
  const solPnlPct    = startingSolBalance > 0
    ? ((realSolBalance - startingSolBalance) / startingSolBalance) * 100
    : 0;
  const devnetPnlPct = startingBalance > 0
    ? ((currentBalance - startingBalance) / startingBalance) * 100
    : 0;
  const pnlPct       = network === 'mainnet' ? solPnlPct : devnetPnlPct;

  async function copyAddress() {
    if (!agentWallet) return;
    await Clipboard.setStringAsync(agentWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openExplorer(sig: string) {
    Linking.openURL(explorerUrl(sig, network));
  }

  function handleActivate() {
    if (network === 'mainnet') {
      setMainnetWarn(true);
    } else {
      activateAgent();
    }
  }

  function handleGenerateConfirm() {
    setGenerateVisible(false);
    createWallet(pendingNet);
  }

  function handleRemove() {
    Alert.alert(
      'Remove Agent Wallet',
      'This will delete the private key from this device. Make sure you have no funds in the wallet, or you will lose them permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeWallet() },
      ],
    );
  }

  // ── Generate Wallet Modal ─────────────────────────────────────────────────
  const GenerateModal = (
    <Modal visible={generateVisible} transparent animationType="slide" onRequestClose={() => setGenerateVisible(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <Text style={{ fontSize: 32, textAlign: 'center' }}>🔑</Text>
          <Text style={s.modalTitle}>Generate Agent Wallet</Text>
          <Text style={s.modalSubtitle}>
            A new Solana keypair will be created. The private key is stored encrypted on this device only. Send your funds to the generated address and the AI will start trading.
          </Text>

          <Text style={s.fieldLabel}>Select Network</Text>
          <View style={s.netToggle}>
            {(['devnet', 'mainnet'] as const).map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.netToggleBtn, pendingNet === n && (n === 'mainnet' ? s.netBtnMainActive : s.netBtnDevActive)]}
                onPress={() => setPendingNet(n)}
                activeOpacity={0.8}
              >
                <Text style={[s.netToggleText, pendingNet === n && s.netToggleTextActive]}>
                  {n === 'mainnet' ? '🔴 Mainnet' : '🟡 Devnet'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {pendingNet === 'mainnet' && (
            <View style={s.warningBox}>
              <Text style={s.warningText}>
                ⚠️ Mainnet uses REAL SOL. Only deposit what you're willing to risk. AI trading involves financial risk.
              </Text>
            </View>
          )}
          {pendingNet === 'devnet' && (
            <View style={s.infoBox}>
              <Text style={s.infoText}>
                ✅ Devnet is a sandbox. Trades are recorded as real on-chain memo transactions but use free test SOL. No real funds at risk.
              </Text>
            </View>
          )}

          <TouchableOpacity style={s.primaryBtn} onPress={handleGenerateConfirm} activeOpacity={0.8}>
            <Text style={s.primaryBtnText}>Generate Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setGenerateVisible(false)}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ── Mainnet Activation Warning Modal ─────────────────────────────────────
  const MainnetWarnModal = (
    <Modal visible={mainnetWarn} transparent animationType="slide" onRequestClose={() => setMainnetWarn(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <Text style={{ fontSize: 36, textAlign: 'center' }}>⚠️</Text>
          <Text style={[s.modalTitle, { color: COLORS.danger }]}>Real Funds Warning</Text>
          <Text style={s.modalSubtitle}>
            You are about to activate the AI agent on <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Mainnet</Text>. It will execute REAL swaps using Jupiter DEX with your SOL.
          </Text>
          {[
            'Max 40% of balance per trade',
            '≥0.005 SOL reserved for gas',
            '1% slippage protection',
            'You can pause at any time',
          ].map((f) => (
            <View key={f} style={s.featureRow}>
              <Text style={s.featureCheck}>✓</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: '#7f1d1d', borderColor: COLORS.danger, borderWidth: 1 }]}
            onPress={() => { setMainnetWarn(false); activateAgent(); }}
            activeOpacity={0.8}
          >
            <Text style={s.primaryBtnText}>I understand — Activate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setMainnetWarn(false)}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ── STATE: Loading ────────────────────────────────────────────────────────
  if (agentLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>🤖 AI Agent</Text>
          {agentWallet && <NetworkPill network={network} />}
        </View>
        <View style={{ padding: SPACING.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
        <Text style={s.loadingText}>
          {agentWallet ? 'Agent is thinking…' : 'Generating wallet…'}
        </Text>
      </SafeAreaView>
    );
  }

  // ── STATE: Error ──────────────────────────────────────────────────────────
  if (agentError) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>🤖 AI Agent</Text>
          {agentWallet && <NetworkPill network={network} />}
        </View>
        <View style={s.centred}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={s.errorText}>{agentError}</Text>
          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: SPACING.md }]}
            onPress={() => { setAgentError(null); if (agentWallet) makeDecision(); }}
            activeOpacity={0.8}
          >
            <Text style={s.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
          {!agentWallet && (
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAgentError(null)}>
              <Text style={s.cancelText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── STATE: No wallet ──────────────────────────────────────────────────────
  if (!agentWallet) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centred}>
          <Text style={s.bigEmoji}>🤖</Text>
          <Text style={s.emptyTitle}>AI Trading Agent</Text>
          <Text style={s.emptySubtitle}>
            Generate a dedicated wallet. Send SOL to it. The AI will analyze markets and trade autonomously on Mainnet or Devnet.
          </Text>

          <View style={s.featureGrid}>
            {[
              { icon: '⚡', label: 'Real Jupiter swaps (Mainnet)' },
              { icon: '🧪', label: 'Devnet sandbox with memo txns' },
              { icon: '🔒', label: 'Private key on your device only' },
              { icon: '🎯', label: 'Max 40% per trade + gas reserve' },
            ].map((f) => (
              <View key={f.label} style={s.featureItem}>
                <Text style={s.featureItemIcon}>{f.icon}</Text>
                <Text style={s.featureItemLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: SPACING.lg }]}
            onPress={() => setGenerateVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.primaryBtnText}>Generate Agent Wallet</Text>
          </TouchableOpacity>
        </View>

        {GenerateModal}
      </SafeAreaView>
    );
  }

  // ── STATE: Setup (wallet ready, agent not yet active) ────────────────────
  if (!agentActive) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>🤖 AI Agent</Text>
          <NetworkPill network={network} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Wallet address card */}
          <View style={s.walletCard}>
            <Feather name="cpu" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.walletCardLabel}>Agent Wallet</Text>
              <Text style={s.walletCardAddr}>{truncateAddr(agentWallet)}</Text>
            </View>
            <TouchableOpacity onPress={copyAddress} style={s.copyBtn}>
              <Feather name={copied ? 'check' : 'copy'} size={16} color={copied ? COLORS.success : COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* On-chain balance */}
          <View style={s.balanceCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.balanceCardLabel}>On-Chain Balance</Text>
              <Text style={s.balanceCardValue}>{realSolBalance.toFixed(6)} SOL</Text>
              {realSolBalance === 0 && (
                <Text style={[s.balanceHint, { color: network === 'mainnet' ? COLORS.warning : COLORS.textMuted }]}>
                  {network === 'mainnet'
                    ? '⚠️ Send SOL to the address above to start trading'
                    : 'Tap Airdrop to get free devnet SOL'}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={refreshBalance} style={s.refreshIconBtn}>
              <Feather name="refresh-cw" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Devnet airdrop */}
          {network === 'devnet' && (
            <TouchableOpacity style={s.airdropBtn} onPress={airdrop} activeOpacity={0.8}>
              <Feather name="cloud-lightning" size={16} color={COLORS.warning} style={{ marginRight: 6 }} />
              <Text style={s.airdropBtnText}>Airdrop 1 SOL (devnet)</Text>
            </TouchableOpacity>
          )}

          {/* Mainnet deposit hint */}
          {network === 'mainnet' && realSolBalance === 0 && (
            <View style={s.depositCard}>
              <Text style={s.depositTitle}>How to fund your agent wallet</Text>
              <Text style={s.depositStep}>1. Copy the wallet address above</Text>
              <Text style={s.depositStep}>2. Send SOL from your main wallet</Text>
              <Text style={s.depositStep}>3. Come back and activate the agent</Text>
              <TouchableOpacity onPress={copyAddress} style={[s.primaryBtn, { marginTop: SPACING.sm }]}>
                <Text style={s.primaryBtnText}>{copied ? '✓ Copied!' : 'Copy Address'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Risk level */}
          <View style={s.setupCard}>
            <Text style={s.setupLabel}>Risk Level</Text>
            <View style={s.riskRow}>
              {(['conservative', 'balanced', 'aggressive'] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[s.riskBtn, riskLevel === lvl && s.riskBtnActive]}
                  onPress={() => setRiskLevel(lvl)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.riskBtnText, riskLevel === lvl && s.riskBtnTextActive]}>
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.riskDesc}>
              {riskLevel === 'conservative' && '≤1.2% per trade — steady, low risk'}
              {riskLevel === 'balanced'     && '≤2.7% per trade — moderate risk/reward'}
              {riskLevel === 'aggressive'   && '≤5.5% per trade — high risk, high reward'}
            </Text>
          </View>

          <TouchableOpacity
            style={[s.activateBtn, realSolBalance === 0 && { opacity: 0.4 }]}
            onPress={handleActivate}
            disabled={realSolBalance === 0}
            activeOpacity={0.8}
          >
            <Text style={s.activateBtnText}>
              {realSolBalance === 0 ? '⚡ Fund wallet first' : '⚡ Activate Agent'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRemove} style={s.removeBtn}>
            <Text style={s.removeBtnText}>Remove Wallet</Text>
          </TouchableOpacity>

          <Text style={s.disclaimer}>
            {network === 'devnet'
              ? 'Devnet — real on-chain txns, no real funds at risk'
              : 'Mainnet — real funds, real trades via Jupiter DEX'}
          </Text>
        </ScrollView>

        {MainnetWarnModal}
      </SafeAreaView>
    );
  }

  // ── STATE: Active ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>🤖 AI Agent</Text>
        <NetworkPill network={network} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status */}
        <View style={s.statusBar}>
          <View style={s.activeBadge}>
            <View style={s.greenDot} />
            <Text style={s.activeBadgeText}>ACTIVE</Text>
          </View>
          <Text style={s.walletSmall}>{truncateAddr(agentWallet)}</Text>
          <TouchableOpacity onPress={copyAddress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? COLORS.success : COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Performance card */}
        <View style={s.performanceCard}>
          <Text style={s.balanceLabel}>On-Chain Balance</Text>
          <Text style={s.balanceValue}>{realSolBalance.toFixed(6)} SOL</Text>
          <Text style={[s.returnPct, { color: pnlPct >= 0 ? COLORS.success : COLORS.danger }]}>
            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
            {network === 'devnet' && <Text style={{ color: COLORS.textMuted, fontSize: 11 }}> (simulated)</Text>}
          </Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{winRate}%</Text>
              <Text style={s.statLabel}>Win Rate</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{trades.length}</Text>
              <Text style={s.statLabel}>Trades</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: bestTrade >= 0 ? COLORS.success : COLORS.danger }]}>
                {bestTrade >= 0 ? '+' : ''}${bestTrade.toFixed(2)}
              </Text>
              <Text style={s.statLabel}>Best P&L</Text>
            </View>
          </View>
        </View>

        {/* Latest decision */}
        {latestTrade && (
          <View style={s.latestCard}>
            <Text style={s.sectionTitle}>Latest Decision</Text>
            <View style={s.latestHeader}>
              <ActionBadge action={latestTrade.action} />
              {latestTrade.fromToken && latestTrade.toToken ? (
                <Text style={s.tradeTokens} numberOfLines={1}>
                  {latestTrade.fromToken} → {latestTrade.toToken}
                  {latestTrade.percentage ? ` (${latestTrade.percentage}%)` : ''}
                </Text>
              ) : null}
              <Text style={s.timeAgo}>{formatTimeAgo(latestTrade.timestamp)}</Text>
            </View>
            <Text style={s.reasoning}>{latestTrade.reasoning}</Text>

            {/* Confidence bar */}
            <View style={s.confidenceRow}>
              <Text style={s.confidenceLabel}>Confidence</Text>
              <Text style={s.confidenceValue}>{latestTrade.confidence}%</Text>
            </View>
            <View style={s.confidenceTrack}>
              <View style={[s.confidenceFill, { width: `${latestTrade.confidence}%` as any }]} />
            </View>

            {/* Explorer link */}
            {latestTrade.txSignature && (
              <TouchableOpacity
                style={s.explorerBtn}
                onPress={() => openExplorer(latestTrade.txSignature!)}
                activeOpacity={0.8}
              >
                <Feather name="external-link" size={12} color={COLORS.primary} />
                <Text style={s.explorerText}>
                  {network === 'mainnet' ? 'View swap on Solscan' : 'View memo on Solscan (devnet)'}
                  {' — '}{truncateSig(latestTrade.txSignature)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Trade history */}
        {trades.length > 0 && (
          <View style={s.historyCard}>
            <Text style={s.sectionTitle}>Trade History</Text>
            {trades.slice(0, 15).map((trade) => (
              <View key={trade.id} style={s.historyRow}>
                <ActionBadge action={trade.action} />
                <Text style={s.historyTokens} numberOfLines={1}>
                  {trade.fromToken && trade.toToken
                    ? `${trade.fromToken} → ${trade.toToken}`
                    : trade.action === 'hold'
                    ? 'Hold position'
                    : trade.action}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.historyPnl, { color: trade.virtualPnl >= 0 ? COLORS.success : COLORS.danger }]}>
                    {trade.virtualPnl >= 0 ? '+' : ''}{trade.virtualPnl.toFixed(2)}
                  </Text>
                  {trade.txSignature && (
                    <TouchableOpacity onPress={() => openExplorer(trade.txSignature!)}>
                      <Text style={s.txLink}>{truncateSig(trade.txSignature)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={s.historyTime}>{formatTimeAgo(trade.timestamp)}</Text>
              </View>
            ))}
          </View>
        )}

        {trades.length === 0 && (
          <Text style={s.noTrades}>No decisions yet — tap Refresh Agent.</Text>
        )}

        {/* Devnet airdrop button (even when active) */}
        {network === 'devnet' && (
          <TouchableOpacity style={s.airdropBtn} onPress={airdrop} activeOpacity={0.8}>
            <Feather name="cloud-lightning" size={14} color={COLORS.warning} style={{ marginRight: 6 }} />
            <Text style={s.airdropBtnText}>Airdrop 1 SOL (devnet)</Text>
          </TouchableOpacity>
        )}

        {/* Action buttons */}
        <TouchableOpacity style={s.refreshBtn} onPress={makeDecision} activeOpacity={0.8}>
          <Feather name="refresh-cw" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={s.refreshBtnText}>Refresh Agent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.pauseBtn} onPress={pauseAgent} activeOpacity={0.8}>
          <Feather name="pause-circle" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={s.pauseBtnText}>Pause Agent</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRemove} style={s.removeBtn}>
          <Text style={s.removeBtnText}>Remove Wallet</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          {network === 'devnet'
            ? 'Devnet — real on-chain txns, no real funds at risk'
            : 'Mainnet — real funds, real trades via Jupiter DEX'}
        </Text>

      </ScrollView>

      {MainnetWarnModal}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.background },
  centred:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  scrollContent: { padding: SPACING.md, paddingBottom: 100, gap: SPACING.md },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  headerTitle: { color: COLORS.text, fontSize: FONTS.large, fontWeight: '700' },

  // ── Empty state ───────────────────────────────────────────────────────────
  bigEmoji:      { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle:    { color: COLORS.text, fontSize: FONTS.xlarge, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: FONTS.body, textAlign: 'center', maxWidth: 300, lineHeight: 22, marginBottom: SPACING.md },

  featureGrid:     { gap: SPACING.sm, width: '100%' },
  featureItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 10, padding: 12 },
  featureItemIcon: { fontSize: 18 },
  featureItemLabel:{ color: COLORS.textSecondary, fontSize: FONTS.small, flex: 1 },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingText: { color: COLORS.textMuted, fontSize: FONTS.body, textAlign: 'center', marginTop: SPACING.md },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorText: { color: COLORS.danger, fontSize: FONTS.body, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.lg, lineHeight: 22 },

  // ── Wallet card ───────────────────────────────────────────────────────────
  walletCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary + '44',
    borderRadius: 12, padding: SPACING.md,
  },
  walletCardLabel: { color: COLORS.textMuted, fontSize: FONTS.small },
  walletCardAddr:  { color: COLORS.text, fontSize: FONTS.small, fontWeight: '600', fontFamily: 'monospace' },
  copyBtn:         { padding: 6 },

  // ── Balance card ──────────────────────────────────────────────────────────
  balanceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 12, padding: SPACING.md,
  },
  balanceCardLabel: { color: COLORS.textMuted, fontSize: FONTS.small },
  balanceCardValue: { color: COLORS.text, fontSize: FONTS.large, fontWeight: '700', fontFamily: 'monospace' },
  balanceHint:      { fontSize: FONTS.small, marginTop: 4 },
  refreshIconBtn:   { padding: 8 },

  // ── Airdrop button ────────────────────────────────────────────────────────
  airdropBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2a1f00', borderWidth: 1, borderColor: COLORS.warning + '88',
    borderRadius: 12, padding: 12,
  },
  airdropBtnText: { color: COLORS.warning, fontSize: FONTS.small, fontWeight: '600' },

  // ── Deposit hint card ─────────────────────────────────────────────────────
  depositCard: {
    backgroundColor: '#1a0a00', borderWidth: 1, borderColor: COLORS.warning + '66',
    borderRadius: 12, padding: SPACING.md, gap: 6,
  },
  depositTitle: { color: COLORS.warning, fontSize: FONTS.body, fontWeight: '700', marginBottom: 4 },
  depositStep:  { color: COLORS.textSecondary, fontSize: FONTS.small },

  // ── Setup cards ───────────────────────────────────────────────────────────
  setupCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 12, padding: SPACING.md, gap: 6,
  },
  setupLabel: { color: COLORS.text, fontSize: FONTS.body, fontWeight: '600' },
  riskRow:    { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  riskBtn:    { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  riskBtnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  riskBtnText:       { color: COLORS.textMuted, fontSize: FONTS.small, fontWeight: '600' },
  riskBtnTextActive: { color: '#fff' },
  riskDesc:   { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  // ── Activate ──────────────────────────────────────────────────────────────
  activateBtn:     { backgroundColor: '#0a2e1a', borderWidth: 1.5, borderColor: COLORS.success, borderRadius: 12, padding: 14, alignItems: 'center' },
  activateBtnText: { color: COLORS.success, fontSize: FONTS.medium, fontWeight: '700' },
  removeBtn:       { alignItems: 'center', paddingVertical: SPACING.sm },
  removeBtnText:   { color: COLORS.danger, fontSize: FONTS.small },
  disclaimer:      { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },

  // ── Active: status bar ────────────────────────────────────────────────────
  statusBar:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  activeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0a2e1a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  greenDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  activeBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  walletSmall:     { color: COLORS.textMuted, fontSize: 11, fontFamily: 'monospace', flex: 1 },

  // ── Performance card ──────────────────────────────────────────────────────
  performanceCard: {
    borderWidth: 1.5, borderColor: COLORS.primary + '66', borderRadius: 16,
    padding: SPACING.md, alignItems: 'center', backgroundColor: '#1a0a2e',
  },
  balanceLabel: { color: COLORS.textMuted, fontSize: FONTS.small, marginBottom: 4 },
  balanceValue: { color: COLORS.text, fontSize: FONTS.xxlarge, fontWeight: '900', fontFamily: 'monospace' },
  returnPct:    { fontSize: FONTS.body, fontWeight: '600', marginTop: 2, marginBottom: SPACING.md },
  statsRow:     { flexDirection: 'row', alignItems: 'center', width: '100%' },
  statItem:     { flex: 1, alignItems: 'center' },
  statValue:    { color: COLORS.text, fontSize: FONTS.medium, fontWeight: '700' },
  statLabel:    { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  statDivider:  { width: 1, height: 32, backgroundColor: COLORS.cardBorder },

  // ── Latest decision ───────────────────────────────────────────────────────
  latestCard:     { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 16, padding: SPACING.md, gap: SPACING.sm },
  sectionTitle:   { color: COLORS.text, fontSize: FONTS.body, fontWeight: '700' },
  latestHeader:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  tradeTokens:    { color: COLORS.textSecondary, fontSize: FONTS.small, flex: 1 },
  timeAgo:        { color: COLORS.textMuted, fontSize: FONTS.small },
  reasoning:      { color: COLORS.text, fontSize: FONTS.body, lineHeight: 20 },
  confidenceRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  confidenceLabel: { color: COLORS.textMuted, fontSize: FONTS.small },
  confidenceValue: { color: COLORS.primary, fontSize: FONTS.small, fontWeight: '600' },
  confidenceTrack: { height: 4, backgroundColor: COLORS.cardBorder, borderRadius: 2, overflow: 'hidden' },
  confidenceFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  explorerBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  explorerText:   { color: COLORS.primary, fontSize: 11 },

  // ── Trade history ─────────────────────────────────────────────────────────
  historyCard:    { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 16, padding: SPACING.md, gap: 4 },
  historyRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder + '66' },
  historyTokens:  { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.small },
  historyPnl:     { fontSize: FONTS.small, fontWeight: '700' },
  txLink:         { color: COLORS.primary + 'aa', fontSize: 10, marginTop: 1 },
  historyTime:    { color: COLORS.textMuted, fontSize: 10 },
  noTrades:       { color: COLORS.textMuted, fontSize: FONTS.small, textAlign: 'center', paddingVertical: SPACING.md },

  // ── Action buttons ────────────────────────────────────────────────────────
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 12, padding: 14,
  },
  refreshBtnText: { color: COLORS.text, fontSize: FONTS.body, fontWeight: '600' },
  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '88', borderRadius: 12, padding: 14,
  },
  pauseBtnText: { color: COLORS.primary, fontSize: FONTS.body, fontWeight: '600' },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  modalCard:     { backgroundColor: COLORS.card, borderRadius: 20, padding: SPACING.lg, width: '90%', gap: SPACING.sm },
  modalTitle:    { color: COLORS.text, fontSize: FONTS.large, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { color: COLORS.textMuted, fontSize: FONTS.small, textAlign: 'center', lineHeight: 20 },
  fieldLabel:    { color: COLORS.textSecondary, fontSize: FONTS.small, fontWeight: '600' },

  netToggle:   { flexDirection: 'row', gap: SPACING.sm },
  netToggleBtn:         { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  netBtnMainActive:     { backgroundColor: '#0a2e0a', borderColor: COLORS.success },
  netBtnDevActive:      { backgroundColor: '#2a1f00', borderColor: COLORS.warning },
  netToggleText:        { color: COLORS.textMuted, fontSize: FONTS.small, fontWeight: '600' },
  netToggleTextActive:  { color: COLORS.text },

  warningBox:  { backgroundColor: '#2a0a0a', borderWidth: 1, borderColor: COLORS.danger + '66', borderRadius: 10, padding: 10 },
  warningText: { color: COLORS.danger, fontSize: 12, lineHeight: 18 },
  infoBox:     { backgroundColor: '#0a2e0a', borderWidth: 1, borderColor: COLORS.success + '66', borderRadius: 10, padding: 10 },
  infoText:    { color: COLORS.success, fontSize: 12, lineHeight: 18 },

  primaryBtn:     { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: FONTS.body, fontWeight: '700' },
  cancelBtn:      { padding: 12, alignItems: 'center' },
  cancelText:     { color: COLORS.textMuted, fontSize: FONTS.body },

  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featureCheck: { color: COLORS.success, fontSize: FONTS.body, fontWeight: '700' },
  featureText:  { color: COLORS.textSecondary, fontSize: FONTS.small, flex: 1 },
});