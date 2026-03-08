import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  data: { value: number; label: string }[];
  timeframe: '7D' | '30D' | '90D';
}

const PortfolioChart = ({ data }: Props) => {
  // Always provide fallback — never pass empty array to LineChart
  const chartData =
    data.length > 0
      ? data
      : [
          { value: 0, label: 'No data' },
          { value: 0, label: '' },
        ];

  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        paddingRight: SPACING.md,
        overflow: 'hidden',
      }}
    >
      <LineChart
        data={chartData}
        width={screenWidth - 80}
        height={180}
        color={COLORS.primary}
        thickness={2}
        curved
        hideDataPoints
        areaChart
        startFillColor={COLORS.primary}
        endFillColor="transparent"
        startOpacity={0.25}
        endOpacity={0}
        backgroundColor={COLORS.card}
        rulesColor="transparent"
        yAxisColor="transparent"
        xAxisColor={COLORS.cardBorder}
        yAxisTextStyle={{ color: COLORS.textMuted, fontSize: 9 }}
        xAxisLabelTextStyle={{ color: COLORS.textMuted, fontSize: 9 }}
        noOfSections={3}
        yAxisLabelPrefix="$"
        formatYLabel={(val: string) => {
          const num = parseFloat(val);
          if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
          return num.toFixed(0);
        }}
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: COLORS.cardBorder,
          pointerStripWidth: 1,
          pointerColor: COLORS.primary,
          radius: 4,
          pointerLabelWidth: 90,
          pointerLabelHeight: 36,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value?: number }[]) => (
            <View
              style={{
                backgroundColor: COLORS.card,
                padding: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: COLORS.primary,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 12 }}>
                ${items[0]?.value?.toFixed(2) ?? '0.00'}
              </Text>
            </View>
          ),
        }}
      />
    </View>
  );
};

export default React.memo(PortfolioChart);
