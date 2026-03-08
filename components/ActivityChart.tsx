import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { Transaction } from '../types';
import { generateActivityData } from '../utils/chartHelpers';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  transactions: Transaction[];
}

const ActivityChart = ({ transactions }: Props) => {
  const data = generateActivityData(transactions);
  const maxVal = Math.max(...data.map((d) => d.value), 3);

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
      <Text
        style={{
          color: COLORS.textMuted,
          fontSize: FONTS.small,
          marginLeft: SPACING.md,
          marginBottom: SPACING.sm,
        }}
      >
        Last 30 days
      </Text>
      <BarChart
        data={data}
        width={screenWidth - 80}
        height={140}
        barWidth={7}
        barBorderRadius={3}
        spacing={3}
        backgroundColor={COLORS.card}
        rulesColor="transparent"
        yAxisColor="transparent"
        xAxisColor={COLORS.cardBorder}
        yAxisTextStyle={{ color: COLORS.textMuted, fontSize: 9 }}
        xAxisLabelTextStyle={{ color: COLORS.textMuted, fontSize: 9 }}
        noOfSections={3}
        maxValue={maxVal}
        hideYAxisText={false}
        showFractionalValues={false}
      />
    </View>
  );
};

export default React.memo(ActivityChart);
