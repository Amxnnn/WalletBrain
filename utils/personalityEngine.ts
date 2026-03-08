import { Transaction, PersonalityType, PersonalityResult } from "../types";

function countType(txs: Transaction[], type: string) {
  return txs.filter((tx) => tx.type?.toUpperCase().includes(type.toUpperCase()))
    .length;
}

function getTopDapp(txs: Transaction[]): string {
  const counts: Record<string, number> = {};
  txs.forEach((tx) => {
    if (tx.dappName) counts[tx.dappName] = (counts[tx.dappName] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "None";
}

function getFailedCount(txs: Transaction[]): number {
  return txs.filter((tx) => tx.status === "failed").length;
}

const PERSONALITIES: Record<
  PersonalityType,
  { label: string; emoji: string; tagline: string }
> = {
  [PersonalityType.FRESH_WALLET]: {
    label: "Fresh Wallet",
    emoji: "🌱",
    tagline: "Just getting started. The Solana journey begins!",
  },
  [PersonalityType.NFT_COLLECTOR]: {
    label: "NFT Collector",
    emoji: "🖼️",
    tagline: "Digital art is your love language.",
  },
  [PersonalityType.FLIP_MACHINE]: {
    label: "Flip Machine",
    emoji: "⚡",
    tagline: "Buy. Sell. Repeat. Speed is your edge.",
  },
  [PersonalityType.DEFI_FARMER]: {
    label: "DeFi Farmer",
    emoji: "🌾",
    tagline: "Yield is life. Liquidity is oxygen.",
  },
  [PersonalityType.SILENT_WHALE]: {
    label: "Silent Whale",
    emoji: "🐳",
    tagline: "Moves markets quietly. Few know.",
  },
  [PersonalityType.DIAMOND_HAND]: {
    label: "Diamond Hands",
    emoji: "💎",
    tagline: "Never sold. Never will. WAGMI.",
  },
  [PersonalityType.ZEN_HOLDER]: {
    label: "Zen Holder",
    emoji: "🧘",
    tagline: "Rarely trades. Deeply believes.",
  },
};

export function getPersonality(transactions: Transaction[]): PersonalityResult {
  const total = transactions.length;
  const nftTxCount = countType(transactions, "NFT");
  const swapCount = countType(transactions, "SWAP");
  const stakeCount = countType(transactions, "STAKE");
  const failedCount = getFailedCount(transactions);
  const topDapp = getTopDapp(transactions);

  const failedLabel =
    failedCount === 0 ? "Clean record" : `${failedCount} failed txs`;

  let type: PersonalityType;

  if (total < 5) {
    type = PersonalityType.FRESH_WALLET;
  } else if (nftTxCount > total * 0.4) {
    type = PersonalityType.NFT_COLLECTOR;
  } else if (swapCount > total * 0.6) {
    type = PersonalityType.FLIP_MACHINE;
  } else if (stakeCount > total * 0.3) {
    type = PersonalityType.DEFI_FARMER;
  } else if (total > 500) {
    type = PersonalityType.SILENT_WHALE;
  } else if (swapCount < 3 && total > 10) {
    type = PersonalityType.DIAMOND_HAND;
  } else {
    type = PersonalityType.ZEN_HOLDER;
  }

  const personality = PERSONALITIES[type];

  return {
    type,
    label: personality.label,
    emoji: personality.emoji,
    tagline: personality.tagline,
    stats: {
      totalTxs: total,
      topDapp,
      netPnL: failedLabel,
    },
  };
}
