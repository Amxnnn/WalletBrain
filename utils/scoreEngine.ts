import { WalletData, Transaction } from '../types';

export interface ScoreBreakdown {
  total: number;           // 0-100 final score
  diversification: number; // 0-25
  activity: number;        // 0-25
  efficiency: number;      // 0-25
  growth: number;          // 0-25
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  label: string;
  color: string;
  advice: string;
}

export function calculateWalletScore(
  walletData: WalletData,
  transactions: Transaction[]
): ScoreBreakdown {

  // ── CATEGORY 1: DIVERSIFICATION (0-25) ──
  // More token types = better diversified = higher score
  let diversification = 0;
  const tokenCount = walletData.tokens.length;
  const hasNFTs = walletData.nfts.length > 0;

  if (tokenCount === 0) diversification = 5;
  else if (tokenCount === 1) diversification = 10;
  else if (tokenCount <= 3) diversification = 15;
  else if (tokenCount <= 7) diversification = 20;
  else diversification = 25;

  // Bonus: has both tokens and NFTs
  if (hasNFTs && tokenCount > 0) diversification = Math.min(25, diversification + 3);

  // Penalty: more than 90% of portfolio in one asset
  const totalValue = walletData.totalValueUSD;
  if (totalValue > 0) {
    const solPercent = walletData.solBalanceUSD / totalValue;
    const tokenValues = walletData.tokens.map(t => t.usdValue / totalValue);
    const maxTokenPercent = tokenValues.length > 0 ? Math.max(...tokenValues) : 0;
    if (solPercent > 0.9 || maxTokenPercent > 0.9) {
      diversification = Math.max(0, diversification - 8);
    }
  }

  // ── CATEGORY 2: ACTIVITY (0-25) ──
  // Regular activity = engaged user = higher score
  // But too much = potentially reckless
  let activity = 0;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentTxs = transactions.filter(
    tx => tx.timestamp * 1000 > thirtyDaysAgo
  );
  const txCount = recentTxs.length;

  if (txCount === 0) activity = 2;
  else if (txCount <= 3) activity = 10;
  else if (txCount <= 10) activity = 18;
  else if (txCount <= 30) activity = 25;
  else if (txCount <= 60) activity = 20; // very active, slight penalty
  else activity = 15; // extremely active, more penalty (degen risk)

  // ── CATEGORY 3: EFFICIENCY (0-25) ──
  // Low failed tx rate = efficient = higher score
  let efficiency = 25;
  const failedTxs = transactions.filter(tx => tx.status === 'failed');
  const failRate = transactions.length > 0
    ? failedTxs.length / transactions.length
    : 0;

  if (failRate > 0.3) efficiency = 5;
  else if (failRate > 0.2) efficiency = 10;
  else if (failRate > 0.1) efficiency = 15;
  else if (failRate > 0.05) efficiency = 20;
  else efficiency = 25;

  // Bonus: has staking (efficient use of idle SOL)
  const hasStaking = transactions.some(tx =>
    tx.type?.toUpperCase().includes('STAKE')
  );
  if (hasStaking) efficiency = Math.min(25, efficiency + 3);

  // ── CATEGORY 4: GROWTH (0-25) ──
  // Portfolio has value + positive momentum = higher score
  let growth = 0;

  if (totalValue <= 0) growth = 0;
  else if (totalValue < 10) growth = 5;
  else if (totalValue < 100) growth = 10;
  else if (totalValue < 500) growth = 15;
  else if (totalValue < 2000) growth = 20;
  else growth = 25;

  // Bonus: has tokens with positive 24h change
  const gainers = walletData.tokens.filter(t => t.change24h > 0);
  if (walletData.tokens.length > 0 && gainers.length > walletData.tokens.length / 2) {
    growth = Math.min(25, growth + 3);
  }

  // ── FINAL SCORE ──
  const total = Math.round(
    diversification + activity + efficiency + growth
  );

  // ── GRADE + LABEL ──
  let grade: ScoreBreakdown['grade'];
  let label: string;
  let color: string;
  let advice: string;

  if (total >= 85) {
    grade = 'S';
    label = 'Elite Wallet';
    color = '#fbbf24'; // gold
    advice = "Outstanding wallet health. You're in the top tier.";
  } else if (total >= 70) {
    grade = 'A';
    label = 'Strong Wallet';
    color = '#4ade80'; // green
    advice = 'Great habits. Keep diversifying and stay active.';
  } else if (total >= 55) {
    grade = 'B';
    label = 'Solid Wallet';
    color = '#7c3aed'; // purple
    advice = 'Good foundation. Reduce failed transactions to improve.';
  } else if (total >= 40) {
    grade = 'C';
    label = 'Developing Wallet';
    color = '#f97316'; // orange
    advice = 'Room to grow. Try staking idle SOL and diversifying.';
  } else {
    grade = 'D';
    label = 'New Wallet';
    color = '#f87171'; // red
    advice = 'Just getting started. Make some transactions to build history.';
  }

  return {
    total,
    diversification,
    activity,
    efficiency,
    growth,
    grade,
    label,
    color,
    advice,
  };
}
