import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { ScoreBreakdown } from '../utils/scoreEngine';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface Props {
  score: ScoreBreakdown;
  walletAddress: string;
  personalityEmoji: string;
  personalityLabel: string;
}

const WalletScoreCard = ({
  score,
  walletAddress,
  personalityEmoji,
  personalityLabel,
}: Props) => {
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      // Add small delay to ensure layout is complete before capture
      await new Promise(r => setTimeout(r, 100));
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Share.share({
          message: `My WalletBrain Score: ${score.total}/100 (${score.grade}) — ${score.label}\n\nI'm a ${personalityLabel} ${personalityEmoji} on Solana.\n\nAnalyze your wallet at WalletBrain on Solana Mobile dApp Store.`,
          url: uri,
        });
      } else {
        // Fallback to text-only share if capture fails
        await Share.share({
          message: `My WalletBrain Score: ${score.total}/100 (${score.grade}) — ${score.label} ${personalityEmoji}\n\nCheck your wallet health at WalletBrain on Solana Mobile!`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const ringColor = score.color;

  return (
    <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>

      {/* SHAREABLE CARD — captured by ViewShot */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 0.95 }}
      >
        <LinearGradient
          colors={['#1a0533', '#0f0f1a', '#0a0a0a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.primary + '44',
          }}
        >
          {/* TOP ROW: personality + wallet address */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>
              {personalityEmoji}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: COLORS.text,
                fontSize: FONTS.body,
                fontWeight: '600',
              }}>
                {personalityLabel}
              </Text>
              <Text style={{
                color: COLORS.textMuted,
                fontSize: FONTS.small,
              }}>
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </Text>
            </View>
            {/* WalletBrain watermark */}
            <Text style={{
              color: COLORS.primary,
              fontSize: 11,
              fontWeight: '700',
            }}>
              🧠 WalletBrain
            </Text>
          </View>

          {/* CENTER: Big Score Number */}
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            {/* Score circle */}
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 6,
              borderColor: ringColor,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: ringColor + '11',
              marginBottom: 12,
            }}>
              <Text style={{
                color: ringColor,
                fontSize: 42,
                fontWeight: '900',
                lineHeight: 48,
              }}>
                {score.total}
              </Text>
              <Text style={{
                color: COLORS.textMuted,
                fontSize: FONTS.small,
                marginTop: -4,
              }}>
                / 100
              </Text>
            </View>

            {/* Grade badge */}
            <View style={{
              backgroundColor: ringColor + '22',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: ringColor + '66',
              marginBottom: 6,
            }}>
              <Text style={{
                color: ringColor,
                fontSize: FONTS.medium,
                fontWeight: '700',
                letterSpacing: 1,
              }}>
                Grade {score.grade} — {score.label}
              </Text>
            </View>

            <Text style={{
              color: COLORS.textSecondary,
              fontSize: FONTS.small,
              textAlign: 'center',
              marginTop: 4,
              paddingHorizontal: 16,
            }}>
              {score.advice}
            </Text>
          </View>

          {/* BOTTOM: 4 category scores */}
          <View style={{
            flexDirection: 'row',
            marginTop: 16,
            gap: 8,
          }}>
            {[
              { label: 'Diversity', value: score.diversification, max: 25 },
              { label: 'Activity', value: score.activity, max: 25 },
              { label: 'Efficiency', value: score.efficiency, max: 25 },
              { label: 'Growth', value: score.growth, max: 25 },
            ].map(cat => (
              <View key={cat.label} style={{ flex: 1, alignItems: 'center' }}>
                {/* Mini bar */}
                <View style={{
                  width: '100%',
                  height: 4,
                  backgroundColor: COLORS.cardBorder,
                  borderRadius: 2,
                  marginBottom: 4,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${(cat.value / cat.max) * 100}%`,
                    height: '100%',
                    backgroundColor: ringColor,
                    borderRadius: 2,
                  }} />
                </View>
                <Text style={{
                  color: COLORS.text,
                  fontSize: 13,
                  fontWeight: '700',
                }}>
                  {cat.value}
                </Text>
                <Text style={{
                  color: COLORS.textMuted,
                  fontSize: 9,
                  textAlign: 'center',
                  marginTop: 1,
                }}>
                  {cat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Powered by */}
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 9,
            textAlign: 'center',
            marginTop: 16,
            letterSpacing: 0.5,
          }}>
            Powered by Helius · Solana Mobile Hackathon 2026
          </Text>

        </LinearGradient>
      </ViewShot>

      {/* SHARE BUTTON — outside ViewShot so it's not captured */}
      <TouchableOpacity
        onPress={handleShare}
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: 12,
          padding: 14,
          alignItems: 'center',
          marginTop: 12,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 16 }}>🔗</Text>
        <Text style={{
          color: COLORS.text,
          fontSize: FONTS.medium,
          fontWeight: '600',
        }}>
          Share My Score
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default WalletScoreCard;
