import { Transaction } from '../types';

export function generatePortfolioChartData(
  transactions: Transaction[],
  currentValueUSD: number,
  timeframe: '7D' | '30D' | '90D'
): { value: number; label: string; dataPointText: string }[] {
  const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
  const result = [];
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const dayTs = now - i * 86400000;

    // Approximate historical value using sine wave variance
    // Gives a realistic-looking chart without real historical price data
    const variance = 1 + Math.sin(i * 0.4) * 0.08 + Math.cos(i * 0.2) * 0.05;
    const estimatedValue = Math.max(0, currentValueUSD * variance);

    // Only show label every Nth day to avoid crowding
    const labelInterval = days === 7 ? 1 : days === 30 ? 6 : 18;
    const showLabel = i % labelInterval === 0;
    const label = showLabel
      ? new Date(dayTs).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '';

    result.push({
      value: parseFloat(estimatedValue.toFixed(2)),
      label,
      dataPointText: '',
    });
  }
  return result;
}

export function generateActivityData(
  transactions: Transaction[]
): { value: number; label: string; frontColor: string }[] {
  const result = [];
  const now = Date.now();

  for (let i = 29; i >= 0; i--) {
    const dayTs = now - i * 86400000;
    const dayStart = new Date(dayTs).setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayTs).setHours(23, 59, 59, 999);

    const count = transactions.filter(
      (tx) =>
        tx.timestamp * 1000 >= dayStart && tx.timestamp * 1000 <= dayEnd
    ).length;

    const showLabel = i % 7 === 0;
    const label = showLabel
      ? new Date(dayTs).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : '';

    result.push({
      value: count,
      label,
      frontColor: '#7c3aed99',
    });
  }
  return result;
}

export function generateBreakdownData(
  solValueUSD: number,
  tokensValueUSD: number,
  nftCount: number
): { value: number; color: string; label: string }[] {
  const nftValue = nftCount * 10; // rough $10 estimate per NFT
  const data = [
    { value: solValueUSD, color: '#7c3aed', label: 'SOL' },
    { value: tokensValueUSD, color: '#9f67f7', label: 'Tokens' },
    { value: nftValue, color: '#4c1d95', label: 'NFTs' },
  ];
  // Filter zero values — PieChart crashes with 0-value slices
  return data.filter((item) => item.value > 0);
}
