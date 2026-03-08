import { WalletData, Transaction, Insight } from "../types";
import { formatUSD, formatSOL } from "./formatters";
import { ScoreBreakdown } from "./scoreEngine";

export function generateInsights(
  walletData: WalletData,
  transactions: Transaction[],
  score?: ScoreBreakdown
): Insight[] {
  const insights: Insight[] = [];

  // ── INSIGHT 0 — WalletBrain Score ─────────────────────────────────────────
  if (score) {
    insights.push({
      id: 'score',
      emoji: '🏆',
      title: 'WalletBrain Score',
      description: `Your wallet scored ${score.total}/100 — Grade ${score.grade}. ${score.advice}`,
      type: 'score',
      actionTopic: 'How can I improve my WalletBrain Score?',
    });
  }
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const monthlyTxs = transactions.filter(
    (tx) => tx.timestamp * 1000 > thirtyDaysAgo
  );

  // ── INSIGHT 1 — Portfolio Overview ────────────────────────────────────────
  insights.push({
    id: "portfolio",
    emoji: "💼",
    title: "Portfolio Overview",
    description: `Your wallet is worth ${formatUSD(walletData.totalValueUSD)}. You have ${formatSOL(walletData.solBalance)} and ${walletData.tokens.length} tokens.`,
    type: "portfolio",
    actionTopic: "Tell me about my overall portfolio",
  });

  // ── INSIGHT 2 — Best Token ────────────────────────────────────────────────
  if (walletData.tokens.length > 0) {
    const bestToken = [...walletData.tokens].sort(
      (a, b) => b.change24h - a.change24h
    )[0];
    insights.push({
      id: "best-token",
      emoji: "🏆",
      title: "Best Performer",
      description:
        bestToken.change24h > 0
          ? `${bestToken.symbol} is your top performer, up ${bestToken.change24h.toFixed(1)}% today worth ${formatUSD(bestToken.usdValue)}.`
          : `${bestToken.symbol} is your largest holding at ${formatUSD(bestToken.usdValue)}.`,
      type: "token",
      actionTopic: `Tell me about my ${bestToken.symbol} position`,
    });
  } else {
    insights.push({
      id: "best-token",
      emoji: "🏆",
      title: "Best Performer",
      description: "No tokens found yet. Start exploring Solana DeFi!",
      type: "token",
      actionTopic: "What tokens should I look at on Solana?",
    });
  }

  // ── INSIGHT 3 — Idle SOL Warning ─────────────────────────────────────────
  const hasRecentStaking = transactions.some(
    (tx) =>
      tx.timestamp * 1000 > thirtyDaysAgo &&
      (tx.type?.includes("STAKE") ||
        tx.dappName?.toLowerCase().includes("stake"))
  );
  if (walletData.solBalance > 2 && !hasRecentStaking) {
    insights.push({
      id: "idle-sol",
      emoji: "💤",
      title: "Idle SOL Detected",
      description: `You have ${formatSOL(walletData.solBalance)} sitting idle with no recent staking. That's about ${formatUSD(walletData.solBalanceUSD * 0.2)} in missed yearly yield.`,
      type: "warning",
      actionTopic: "Should I stake my idle SOL?",
    });
  }

  // ── INSIGHT 4 — Fee Report ────────────────────────────────────────────────
  const failedTxs = monthlyTxs.filter((tx) => tx.status === "failed");
  const failedFees = failedTxs.reduce((sum, tx) => sum + (tx.fee ?? 0), 0);
  insights.push({
    id: "fees",
    emoji: "💸",
    title: "Fee Report",
    description:
      failedTxs.length > 0
        ? `You had ${failedTxs.length} failed transactions this month, wasting ${formatSOL(failedFees)} in fees. Total: ${monthlyTxs.length} transactions.`
        : `You made ${monthlyTxs.length} transactions this month with no failures. Great execution!`,
    type: "fees",
    actionTopic: "How much have I spent on fees?",
  });

  // ── INSIGHT 5 — Most Used dApp ────────────────────────────────────────────
  const dappCounts: Record<string, number> = {};
  monthlyTxs.forEach((tx) => {
    if (tx.dappName)
      dappCounts[tx.dappName] = (dappCounts[tx.dappName] || 0) + 1;
  });
  const topDapp = Object.entries(dappCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  insights.push({
    id: "top-dapp",
    emoji: "🔥",
    title: "Your Favorite dApp",
    description: topDapp
      ? `You used ${topDapp[0]} ${topDapp[1]} times this month. It's your most active dApp on Solana.`
      : "No dApp activity detected this month. Try Jupiter or Drift!",
    type: "activity",
    actionTopic: topDapp
      ? `Tell me more about my activity on ${topDapp[0]}`
      : "What dApps should I try on Solana?",
  });

  // ── INSIGHT 6 — SKR Status ────────────────────────────────────────────────
  const skrToken = walletData.tokens.find(
    (t) => t.symbol?.toUpperCase() === "SKR"
  );
  insights.push({
    id: "skr",
    emoji: "⭐",
    title: "SKR Position",
    description: skrToken
      ? `You hold ${skrToken.balance.toFixed(2)} SKR worth ${formatUSD(skrToken.usdValue)}. SKR is the native Solana Mobile ecosystem token.`
      : "No SKR detected in your wallet. SKR is the native Seeker device token — consider getting some.",
    type: "skr",
    actionTopic: "Tell me about SKR token and how to get it",
  });

  return insights;
}
