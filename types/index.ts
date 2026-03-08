// ─── Token ────────────────────────────────────────────────────────────────────
export interface Token {
  name: string;
  symbol: string;
  mint: string;
  balance: number;
  usdValue: number;
  change24h: number;
  logoUri?: string;
  decimals: number;
}

// ─── NFT ──────────────────────────────────────────────────────────────────────
export interface NFT {
  name: string;
  mint: string;
  imageUri?: string;
  collectionName?: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface Transaction {
  signature: string;
  type: string;
  timestamp: number;
  dappName?: string;
  amountSOL: number;
  amountUSD: number;
  status: "success" | "failed";
  fee: number;
}

// ─── WalletData ───────────────────────────────────────────────────────────────
export interface WalletData {
  address: string;
  solBalance: number;
  solBalanceUSD: number;
  tokens: Token[];
  nfts: NFT[];
  totalValueUSD: number;
}

// ─── Insight ──────────────────────────────────────────────────────────────────
export interface Insight {
  id: string;
  emoji: string;
  title: string;
  description: string;
  type: "portfolio" | "token" | "warning" | "fees" | "activity" | "skr" | "score";
  actionTopic: string;
}

// ─── Personality ──────────────────────────────────────────────────────────────
export enum PersonalityType {
  DIAMOND_HAND = "DIAMOND_HAND",
  FLIP_MACHINE = "FLIP_MACHINE",
  DEFI_FARMER = "DEFI_FARMER",
  NFT_COLLECTOR = "NFT_COLLECTOR",
  SILENT_WHALE = "SILENT_WHALE",
  ZEN_HOLDER = "ZEN_HOLDER",
  FRESH_WALLET = "FRESH_WALLET",
}

export interface PersonalityResult {
  type: PersonalityType;
  label: string;
  emoji: string;
  tagline: string;
  stats: {
    totalTxs: number;
    topDapp: string;
    netPnL: string;
  };
}
