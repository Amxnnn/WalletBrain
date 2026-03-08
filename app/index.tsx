import { Redirect } from "expo-router";
import { useWalletStore } from "../stores/walletStore";

export default function Index() {
  const isConnected = useWalletStore((s) => s.isConnected);
  return isConnected ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/onboarding" />
  );
}
