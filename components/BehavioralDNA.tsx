import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants';
import { Transaction } from '../types';
import { SkeletonCard } from './SkeletonCard';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Pattern {
  emoji: string;
  title: string;
  description: string;
}

interface Props {
  transactions: Transaction[];
}

const MIN_TXS = 5;

export default function BehavioralDNA({ transactions }: Props) {
  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || transactions.length < MIN_TXS) return;
    hasFetched.current = true;
    fetchDNA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  const fetchDNA = async () => {
    setLoading(true);
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

      const prompt = `You are a behavioral finance expert analyzing a Solana wallet.
Analyze these transactions and identify exactly 3 behavioral patterns this person has.
Be specific, brutally honest, and slightly uncomfortable — like a therapist who has read their diary.
Each pattern must reference actual behavior visible in the data.
Format response as JSON only:
{
  "patterns": [
    { "emoji": "string", "title": "string", "description": "string" },
    { "emoji": "string", "title": "string", "description": "string" },
    { "emoji": "string", "title": "string", "description": "string" }
  ]
}

Transaction history:
${txSummary}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.patterns) && parsed.patterns.length > 0) {
        setPatterns(parsed.patterns);
      }
    } catch (err) {
      console.error('[BehavioralDNA] fetch error:', err);
      // silently fail — component just won't render
    } finally {
      setLoading(false);
    }
  };

  // Not enough tx history yet — stay invisible until data arrives
  if (transactions.length < MIN_TXS) return null;

  // Loading
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🧬 Your Behavioral DNA</Text>
        <Text style={styles.subtitle}>Analyzing your on-chain behavior…</Text>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  // Not yet fetched or failed silently
  if (!patterns) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🧬 Your Behavioral DNA</Text>
      <Text style={styles.subtitle}>How you really behave on-chain</Text>

      {patterns.map((p, i) => (
        <View key={i} style={styles.pill}>
          <Text style={styles.pillEmoji}>{p.emoji}</Text>
          <View style={styles.pillContent}>
            <Text style={styles.pillTitle}>{p.title}</Text>
            <Text style={styles.pillDesc}>{p.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a0a2e',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    marginBottom: SPACING.md,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#2a0f40',
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  pillEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  pillContent: {
    flex: 1,
  },
  pillTitle: {
    color: COLORS.text,
    fontSize: FONTS.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  pillDesc: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    lineHeight: 18,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
