import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMobileWallet } from "../hooks/useMobileWallet";
import { useHelius } from "../hooks/useHelius";
import { useWalletStore } from "../stores/walletStore";
import { requestNotificationPermission } from "../hooks/useNotifications";

export default function OnboardingScreen() {
  const router = useRouter();
  const { connect } = useMobileWallet();
  const { fetchWalletData, fetchTransactions } = useHelius();
  const { setAddress, setConnected, setLoading, setError } = useWalletStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  async function handleConnect() {
    setIsConnecting(true);
    setConnectError(null);
    setLoading(true);
    setError(null);
    try {
      const account = await connect();
      const address = account.publicKey.toBase58();
      setAddress(address);
      setConnected(true);

      // Request notification permission right after connect
      requestNotificationPermission().catch(() => {});

      // Navigate immediately — home screen handles data fetching
      router.replace("/(tabs)/home");

      // Kick off data fetch in background (non-blocking)
      fetchWalletData(address).catch(() => {});
      fetchTransactions(address).catch(() => {});
    } catch (err: any) {
      const raw: string = err?.message ?? "Wallet connection failed";
      // MWA websocket error → show friendly message
      let friendly = raw;
      if (
        raw.includes("ConnectionFailedException") ||
        raw.includes("websocket") ||
        raw.includes("LocalAssociation") ||
        raw.includes("CancellationException")
      ) {
        friendly = "Open Phantom (or Solflare) first, then tap Connect again.";
      }
      setConnectError(friendly);
      setError(raw);
      console.error("[Onboarding] connect error:", err);
    } finally {
      setIsConnecting(false);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <Text style={styles.emoji}>🧠</Text>
        <Text style={styles.appName}>WalletBrain</Text>
        <Text style={styles.tagline}>
          Daily insights that make you a better trader.
        </Text>
        <Text style={styles.subtitle}>
          Like Duolingo — but for your Solana wallet.
        </Text>
      </View>

      {/* Connect button */}
      <View style={styles.bottomArea}>
        {isConnecting ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>Loading your wallet…</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            activeOpacity={0.85}
          >
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        )}
        {connectError && (
          <Text style={styles.errorText}>{connectError}</Text>
        )}
        <Text style={styles.subtext}>
          Supports Phantom &amp; Solflare on Android
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  appName: {
    fontSize: 40,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 17,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: -4,
  },
  bottomArea: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  connectButton: {
    width: "100%",
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  loadingArea: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 15,
  },
  subtext: {
    color: "#6b7280",
    fontSize: 13,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
