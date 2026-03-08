import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants';
import { Transaction, WalletData } from '../types';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  walletData: WalletData | null;
  transactions: Transaction[];
}

export default function ConfessionBooth({ walletData, transactions }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const txSummary =
        transactions.length > 0
          ? transactions
              .slice(0, 40)
              .map(
                (tx) =>
                  `${tx.type} ${tx.amountSOL ? tx.amountSOL.toFixed(3) + ' SOL' : ''} on ${tx.dappName || 'unknown'} (${tx.status})`
              )
              .join(', ')
          : 'No transaction history available.';

      const portfolioSummary = walletData
        ? `SOL: ${walletData.solBalance.toFixed(3)} ($${walletData.solBalanceUSD.toFixed(2)}), Portfolio: $${walletData.totalValueUSD.toFixed(2)}, Tokens: ${walletData.tokens.map((t) => t.symbol).join(', ') || 'none'}`
        : 'No portfolio data.';

      const prompt = `You are a brutally honest financial friend who has read this person's entire Solana wallet history: ${portfolioSummary}. Recent transactions: ${txSummary}. They are about to tell you what they're thinking of doing. Respond in 3-5 sentences maximum. Reference their actual past behavior. Be honest, slightly uncomfortable, but supportive. Do not use financial jargon. Talk like a smart friend, not a robot.

What they are thinking of doing: ${trimmed}`;

      const result = await model.generateContent(prompt);
      setResponse(result.response.text().trim());
    } catch (err) {
      console.error('[ConfessionBooth] error:', err);
      setResponse("Couldn't get a response right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResponse(null);
  };

  // Collapsed state — just the toggle button
  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.collapsedBtn}
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.collapsedText}>
          🚨 Confession Booth — Tell me what you're about to do
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>🚨 Confession Booth</Text>
        <TouchableOpacity
          onPress={() => { setExpanded(false); handleReset(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardSubtitle}>
        Tell me what you're thinking of doing. I've read your history.
      </Text>

      {/* Input — always shown, Gemini handles sparse context gracefully */}
      <TextInput
        style={styles.textInput}
        value={input}
        onChangeText={setInput}
        placeholder="I'm thinking of putting my SOL into..."
        placeholderTextColor={COLORS.textMuted}
        multiline
        maxLength={300}
        editable={!loading}
      />

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!input.trim() || loading) && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!input.trim() || loading}
        activeOpacity={0.8}
      >
        <Text style={styles.submitBtnText}>Be Honest With Me</Text>
      </TouchableOpacity>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            thinking about your history…
          </Text>
        </View>
      )}

      {/* Response */}
      {response && !loading && (
        <View style={styles.responseBox}>
          <Text style={styles.responseEmoji}>🧠</Text>
          <Text style={styles.responseText}>{response}</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Ask something else</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedBtn: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#f87171' + '66',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: '#f8717108',
  },
  collapsedText: {
    color: '#f87171',
    fontSize: FONTS.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.md,
    backgroundColor: '#1a0a2e',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '700',
  },
  closeBtn: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    marginBottom: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.body,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontStyle: 'italic',
  },
  responseBox: {
    backgroundColor: '#0f0a1e',
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  responseEmoji: {
    fontSize: 22,
  },
  responseText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    lineHeight: 22,
  },
  resetBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resetText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
});
