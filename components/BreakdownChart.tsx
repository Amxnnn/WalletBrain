import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { WalletData } from '../types';
import { generateBreakdownData } from '../utils/chartHelpers';

interface Props {
  walletData: WalletData;
}

const BreakdownChart = ({ walletData }: Props) => {
  const tokensValue = walletData.tokens.reduce((s, t) => s + t.usdValue, 0);
  const pieData = generateBreakdownData(
    walletData.solBalanceUSD,
    tokensValue,
    walletData.nfts.length
  );

  const total = pieData.reduce((s, d) => s + d.value, 0);

  // If all values are zero, show empty state instead of crashing
  if (pieData.length === 0 || total === 0) {
    return (
      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 12,
          padding: 24,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: COLORS.textMuted, fontSize: FONTS.body }}>
          No portfolio data yet
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
      }}
    >
      <PieChart
        data={pieData}
        donut
        radius={90}
        innerRadius={62}
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: FONTS.large,
                fontWeight: 'bold',
              }}
            >
              {total >= 1000
                ? '$' + (total / 1000).toFixed(1) + 'k'
                : '$' + total.toFixed(0)}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small }}>
              Total
            </Text>
          </View>
        )}
      />

      {/* Legend */}
      <View style={{ width: '100%', marginTop: SPACING.md }}>
        {pieData.map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SPACING.sm,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.color,
                marginRight: SPACING.sm,
              }}
            />
            <Text
              style={{
                color: COLORS.textSecondary,
                flex: 1,
                fontSize: FONTS.body,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                color: COLORS.textMuted,
                fontSize: FONTS.small,
                marginRight: 12,
              }}
            >
              ${item.value.toFixed(2)}
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontSize: FONTS.small,
                fontWeight: 'bold',
                width: 42,
                textAlign: 'right',
              }}
            >
              {((item.value / total) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default React.memo(BreakdownChart);
