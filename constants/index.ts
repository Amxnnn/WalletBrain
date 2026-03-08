export const HELIUS_API_KEY = process.env.EXPO_PUBLIC_HELIUS_API_KEY ?? "";
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
export const GEMINI_MODEL = "gemini-2.5-flash-lite";
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const MAX_TRANSACTIONS = 100;
export const REFRESH_INTERVAL = 60_000;

export type NetworkType = "mainnet" | "devnet";

export const NETWORKS: Record<
  NetworkType,
  { name: string; rpcUrl: string; label: string; color: string }
> = {
  mainnet: {
    name: "Mainnet",
    rpcUrl: `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    label: "Mainnet Beta",
    color: "#4ade80",
  },
  devnet: {
    name: "Devnet",
    rpcUrl: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    label: "Devnet",
    color: "#fbbf24",
  },
};

export const APP_IDENTITY = {
  name: "WalletBrain",
  uri: "https://walletbrain.app",
  icon: "favicon.png",
};
