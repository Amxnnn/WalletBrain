import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, GEMINI_MODEL } from "../constants";
import { WalletData, Transaction } from "../types";

function getMostUsedDapp(transactions: Transaction[]): string {
  const counts: Record<string, number> = {};
  transactions.forEach((tx) => {
    if (tx.dappName) counts[tx.dappName] = (counts[tx.dappName] || 0) + 1;
  });
  return (
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown"
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export function useAI() {
  const buildWalletContext = (
    walletData: WalletData,
    transactions: Transaction[]
  ): string => {
    const topDapp = getMostUsedDapp(transactions);
    const recentTxs = transactions
      .slice(0, 10)
      .map(
        (tx) =>
          `${tx.type} ${tx.amountSOL ? tx.amountSOL.toFixed(3) + " SOL" : ""} on ${tx.dappName || "unknown"} (${tx.status})`
      )
      .join(", ");

    return `
Wallet: ${walletData.address}
SOL Balance: ${walletData.solBalance.toFixed(3)} SOL ($${walletData.solBalanceUSD.toFixed(2)})
Total Portfolio: $${walletData.totalValueUSD.toFixed(2)}
Tokens held: ${walletData.tokens.map((t) => `${t.symbol} ($${t.usdValue.toFixed(2)})`).join(", ") || "none"}
NFTs owned: ${walletData.nfts.length}
Total transactions: ${transactions.length}
Most used dApp: ${topDapp}
Recent activity: ${recentTxs || "none"}
    `.trim();
  };

  const sendMessage = async (
    userMessage: string,
    walletData: WalletData | null,
    transactions: Transaction[]
  ): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const systemContext = walletData
        ? `You are WalletBrain, a personal Solana wallet analyst.
You are talking to a real person about their actual Solana wallet.
Always use their real numbers from the data below. Be honest but kind.
Talk like a smart friend, not a compliance officer.
Never use crypto jargon — always plain English.
Keep answers to 4-5 sentences maximum.
No bullet points. Just conversational sentences.
Never say "I cannot provide financial advice" — just answer naturally.

User's wallet data:
${buildWalletContext(walletData, transactions)}`
        : `You are WalletBrain, a Solana wallet analyst.
The user has not connected their wallet yet.
Keep answers brief and helpful. Max 3 sentences.`;

      const prompt = `${systemContext}\n\nUser question: ${userMessage}`;
      const result = await model.generateContent(prompt);
      return result.response.text() || "I couldn't analyze that right now. Try again.";
    } catch (error) {
      console.error("[useAI] Gemini error:", error);
      return "I couldn't analyze that right now. Check your connection and try again.";
    }
  };

  const generateTokenVerdicts = async (
    tokens: WalletData["tokens"]
  ): Promise<
    { symbol: string; signal: "up" | "hold" | "review"; verdict: string }[]
  > => {
    if (tokens.length === 0) return [];
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const prompt = `You are WalletBrain analyzing a Solana wallet.
For each token below, give exactly one verdict sentence (max 12 words).
Return ONLY valid JSON array, no markdown, no explanation.
Format: [{"symbol":"TOKEN","signal":"up","verdict":"One sentence verdict here."}]
signal must be exactly one of: "up", "hold", "review"

Tokens to analyze:
${tokens.map((t) => `${t.symbol}: balance=${t.balance.toFixed(4)}, usdValue=$${t.usdValue.toFixed(2)}, 24hChange=${t.change24h}%`).join("\n")}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[useAI] generateTokenVerdicts error:", error);
      return tokens.map((t) => ({
        symbol: t.symbol,
        signal: "hold" as const,
        verdict: "Unable to analyze this position right now.",
      }));
    }
  };

  const generateMarketPulse = async (): Promise<
    { emoji: string; observation: string }[]
  > => {
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const prompt = `You are WalletBrain.
Give 3 short observations about the Solana ecosystem right now.
Return ONLY valid JSON array, no markdown, no explanation.
Format: [{"emoji":"🔥","observation":"Short observation here max 10 words"}]
Focus on: DeFi activity, SKR ecosystem, Solana momentum. Be realistic.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[useAI] generateMarketPulse error:", error);
      return [
        { emoji: "⚡", observation: "Solana ecosystem activity remains strong." },
        { emoji: "⭐", observation: "SKR staking rewards are live." },
        { emoji: "🔄", observation: "DeFi volume picking up across protocols." },
      ];
    }
  };

  return { sendMessage, generateTokenVerdicts, generateMarketPulse };
}
