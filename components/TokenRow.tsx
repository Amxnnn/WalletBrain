import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Token } from '../types';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { formatUSD, formatPercent } from '../utils/formatters';

interface Props {
  token: Token;
  onPress: () => void;
}

const TokenRow = ({ token, onPress }: Props) => {
  const changeColor =
    token.change24h > 0
      ? COLORS.success
      : token.change24h < 0
      ? COLORS.danger
      : COLORS.textMuted;

  const displaySymbol = (!token.symbol || token.symbol === '???' || token.symbol === 'UNK')
    ? token.mint?.slice(0, 5)?.toUpperCase()
    : token.symbol;

  const displayName = (!token.name || token.name === 'Unknown Token')
    ? `${token.mint?.slice(0, 8)}...`
    : token.name;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: SPACING.md,
        }}
      >
        {/* Avatar — first letter of symbol */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.primary + '33',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text
            style={{
              color: COLORS.primary,
              fontSize: FONTS.medium,
              fontWeight: 'bold',
            }}
          >
            {token.symbol?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>

        {/* Name + Symbol */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: COLORS.text,
              fontSize: FONTS.medium,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {displaySymbol}
          </Text>
          <Text
            style={{ color: COLORS.textMuted, fontSize: FONTS.small }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </View>

        {/* Value + 24h change */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              color: COLORS.text,
              fontSize: FONTS.medium,
              fontWeight: '600',
            }}
          >
            {formatUSD(token.usdValue)}
          </Text>
          <Text style={{ color: changeColor, fontSize: FONTS.small }}>
            {formatPercent(token.change24h)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View
        style={{
          height: 0.5,
          backgroundColor: COLORS.cardBorder,
          marginLeft: 68,
        }}
      />
    </>
  );
};

export default React.memo(TokenRow);
