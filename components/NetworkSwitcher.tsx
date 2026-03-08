import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useWalletStore } from "../stores/walletStore";
import { useHelius } from "../hooks/useHelius";
import { NetworkType } from "../constants";
import { COLORS, SPACING, FONTS } from "../constants/theme";

export function NetworkSwitcher() {
  const [modalVisible, setModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { network, setNetwork, address } = useWalletStore();
  const { refetch } = useHelius();

  const dotColor =
    network === "mainnet" ? COLORS.success : COLORS.warning;
  const label = network === "mainnet" ? "Mainnet" : "Devnet";

  const handleSwitch = async (newNetwork: NetworkType) => {
    if (newNetwork === network) {
      setModalVisible(false);
      return;
    }
    setModalVisible(false);
    setSwitching(true);
    setNetwork(newNetwork);
    if (address) {
      await refetch(address, newNetwork);
    }
    setSwitching(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.pill}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {switching ? (
          <ActivityIndicator size={10} color={COLORS.textSecondary} />
        ) : (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
        <Text style={styles.pillText}>{label}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Switch Network</Text>
            {(["mainnet", "devnet"] as NetworkType[]).map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.menuItem,
                  n === network && styles.menuItemActive,
                ]}
                onPress={() => handleSwitch(n)}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        n === "mainnet" ? COLORS.success : COLORS.warning,
                    },
                  ]}
                />
                <Text style={styles.menuItemText}>
                  {n === "mainnet" ? "Mainnet Beta" : "Devnet"}
                </Text>
                {n === network && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.md,
    width: 220,
    gap: SPACING.sm,
  },
  menuTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: 10,
    gap: SPACING.sm,
  },
  menuItemActive: {
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: FONTS.body,
    flex: 1,
  },
  checkmark: {
    color: COLORS.primary,
    fontSize: FONTS.body,
    fontWeight: "600",
  },
});
