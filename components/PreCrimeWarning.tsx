import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants';
import { Transaction } from '../types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface WarningResult {
  warning: string;
  riskLevel: 'low' | 'medium' | 'high';
  triggerPattern: string;
}

interface Props {
  transactions: Transaction[];
}

const RISK_CONFIG = {
  high: { border: '#f87171', icon: '⚠️', bg: '#f8717111' },
  medium: { border: '#fbbf24', icon: '🟡', bg: '#fbbf2411' },
  low: { border: '#4ade80', icon: '✅', bg: '#4ade8011' },
};

const MIN_TXS = 5;

export default function PreCrimeWarning({ transactions }: Props) {
  const [result, setResult] = useState<WarningResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || transactions.length < MIN_TXS) return;
    hasFetched.current = true;
    fetchWarning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  const fetchWarning = async () => {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const txSummary = transactions
        .slice(0, 50)
        .map(
          (tx) =>
            `${tx.type} ${tx.amountSOL ? tx.amountSOL.toFixed(3) + ' SOL' : ''} on ${tx.dappName || 'unknown'} (${tx.status})`
        )
        .join('\n');

      const prompt = `You are analyzing a Solana wallet's historical behavior to predict their next likely mistake. Look at their transaction patterns — what is this person most likely to do wrong in the next 7 days based on their history? Give ONE specific warning. Be direct, reference their actual behavior. Format as JSON only:
{
  "warning": "string",
  "riskLevel": "low" | "medium" | "high",
  "triggerPattern": "string"
}

Transaction history:
${txSummary}`;

      const res = await model.generateContent(prompt);
      const text = res.response.text().trim();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed: WarningResult = JSON.parse(cleaned);

      if (
        parsed.riskLevel &&
        parsed.warning &&
        parsed.triggerPattern
      ) {
        setResult(parsed);
      }
    } catch (err) {
      console.error('[PreCrimeWarning] fetch error:', err);
      // silent failure — banner simply doesn't show
    }
  };

  // Not enough history, not yet fetched, already dismissed, or low risk
  if (
    !result ||
    dismissed ||
    result.riskLevel === 'low' ||
    transactions.length < MIN_TXS
  ) {
    return null;
  }

  const cfg = RISK_CONFIG[result.riskLevel];

  return (
    <View
      style={[
        styles.banner,
        { borderLeftColor: cfg.border, backgroundColor: cfg.bg },
      ]}
    >
      {/* Top row: icon + title + dismiss */}
      <View style={styles.topRow}>
        <Text style={styles.icon}>{cfg.icon}</Text>
        <Text style={[styles.title, { color: cfg.border }]}>Pre-Crime Alert</Text>
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Warning text */}
      <Text style={styles.warningText}>{result.warning}</Text>

      {/* Trigger pattern badge */}
      <View style={[styles.badge, { borderColor: cfg.border + '88' }]}>
        <Text style={[styles.badgeText, { color: cfg.border }]}>
          {result.triggerPattern}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    flex: 1,
    fontSize: FONTS.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dismiss: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FONTS.small,
    fontWeight: '600',
  },
});
