import { useCallback } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletData, Token, NFT, Transaction } from "../types";
import { HELIUS_API_KEY, NetworkType, MAX_TRANSACTIONS } from "../constants";
import { useWalletStore } from "../stores/walletStore";

// --- Direct Helius REST/RPC helpers ------------------------------------------
// helius-sdk v2 removed the Helius class entirely � using direct fetch instead

function getRpcUrl(network: NetworkType): string {
  const sub = network === "devnet" ? "devnet" : "mainnet";
  return `https://${sub}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
}

function getEnhancedBase(network: NetworkType): string {
  return network === "devnet"
    ? "https://api-devnet.helius.xyz/v0"
    : "https://api.helius.xyz/v0";
}

async function dasRequest(
  network: NetworkType,
  method: string,
  params: object
): Promise<any> {
  const res = await fetch(getRpcUrl(network), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "DAS API error");
  return json.result;
}

async function getBalanceLamports(
  network: NetworkType,
  address: string
): Promise<number> {
  const res = await fetch(getRpcUrl(network), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address],
    }),
  });
  const json = await res.json();
  return json?.result?.value ?? 0;
}

function buildWalletData(
  ownerAddress: string,
  assetsResponse: any,
  solBalanceLamports: number
): WalletData {
  const items: any[] = assetsResponse?.items ?? [];

  const tokens: Token[] = [];
  items
    .filter(
      (item: any) =>
        item?.interface === "FungibleToken" ||
        item?.interface === "FungibleAsset"
    )
    .forEach((item: any) => {
      const tokenInfo = item.token_info ?? {};
      const decimals = tokenInfo.decimals ?? 6;
      const rawBalance = tokenInfo.balance ?? 0;
      const balance = rawBalance / Math.pow(10, decimals);
      const usdValue = tokenInfo.price_info?.total_price ?? 0;

      // Try every possible place Helius puts the symbol
      const symbol =
        tokenInfo.symbol?.trim() ||
        item.content?.metadata?.symbol?.trim() ||
        item.content?.metadata?.name?.slice(0, 6)?.toUpperCase()?.trim() ||
        item.id?.slice(0, 4)?.toUpperCase() ||
        'UNK';

      // Try every possible place Helius puts the name
      const name =
        item.content?.metadata?.name?.trim() ||
        tokenInfo.symbol?.trim() ||
        symbol ||
        'Unknown Token';

      // Only add token if it has meaningful balance
      if (balance > 0.000001) {
        tokens.push({
          name,
          symbol,
          mint: item.id ?? '',
          balance,
          decimals,
          usdValue,
          change24h: 0,
          logoUri:
            item.content?.links?.image ||
            item.content?.files?.[0]?.uri ||
            undefined,
        });
      }
    });

  const nfts: NFT[] = items
    .filter(
      (item: any) =>
        item?.interface === "V1_NFT" ||
        item?.interface === "ProgrammableNFT" ||
        item?.interface === "V2_NFT"
    )
    .map((item: any) => ({
      name: item?.content?.metadata?.name ?? "NFT",
      mint: item?.id ?? "",
      imageUri: item?.content?.links?.image ?? undefined,
      collectionName:
        item?.grouping?.find((g: any) => g.group_key === "collection")
          ?.collection_metadata?.name ?? undefined,
    }));

  const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;
  const solPrice = assetsResponse?.nativeBalance?.price_per_sol ?? 0;
  const solBalanceUSD = solBalance * solPrice;
  const tokensValueUSD = tokens.reduce((sum, t) => sum + t.usdValue, 0);

  return {
    address: ownerAddress,
    solBalance,
    solBalanceUSD,
    tokens,
    nfts,
    totalValueUSD: solBalanceUSD + tokensValueUSD,
  };
}

function buildTransactions(raw: any[]): Transaction[] {
  return (raw ?? []).map((tx: any) => ({
    signature: tx?.signature ?? "",
    type: tx?.type ?? "UNKNOWN",
    timestamp: tx?.timestamp ?? 0,
    dappName: tx?.source ?? undefined,
    amountSOL:
      Math.abs(
        (tx?.nativeTransfers ?? []).reduce(
          (sum: number, t: any) => sum + (t?.amount ?? 0),
          0
        )
      ) / LAMPORTS_PER_SOL,
    amountUSD: 0,
    status: tx?.transactionError == null ? "success" : "failed",
    fee: (tx?.fee ?? 0) / LAMPORTS_PER_SOL,
  }));
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useHelius() {
  const { setWalletData, setTransactions, setLoading, setError } =
    useWalletStore();

  const fetchWalletData = useCallback(
    async (
      ownerAddress: string,
      network: NetworkType = "mainnet"
    ): Promise<WalletData | null> => {
      if (!HELIUS_API_KEY) {
        setError("Helius API key not set. Add EXPO_PUBLIC_HELIUS_API_KEY to .env");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const [assetsResponse, solBalanceLamports] = await Promise.all([
          dasRequest(network, "getAssetsByOwner", {
            ownerAddress,
            page: 1,
            limit: 100,
            displayOptions: { showFungible: true, showNativeBalance: true },
          }),
          getBalanceLamports(network, ownerAddress),
        ]);

        const data = buildWalletData(
          ownerAddress,
          assetsResponse,
          solBalanceLamports
        );
        setWalletData(data);
        console.log("[useHelius] walletData loaded:", data.totalValueUSD, "USD");
        return data;
      } catch (err: any) {
        const msg = err?.message ?? "Failed to load wallet data";
        setError(msg);
        console.error("[useHelius] fetchWalletData error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setWalletData, setLoading, setError]
  );

  const fetchTransactions = useCallback(
    async (
      address: string,
      network: NetworkType = "mainnet"
    ): Promise<Transaction[]> => {
      if (!HELIUS_API_KEY) return [];
      try {
        // Enhanced Transactions API — direct fetch, no SDK class needed
        const url = `${getEnhancedBase(network)}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${MAX_TRANSACTIONS}`;
        const res = await fetch(url);
        const raw = await res.json();
        const txs = buildTransactions(Array.isArray(raw) ? raw : []);
        setTransactions(txs);
        console.log("[useHelius] transactions loaded:", txs.length);
        return txs;
      } catch (err: any) {
        console.error("[useHelius] fetchTransactions error:", err);
        return [];
      }
    },
    [setTransactions]
  );

  const refetch = useCallback(
    async (address: string, network: NetworkType = "mainnet") => {
      const [data, txs] = await Promise.all([
        fetchWalletData(address, network),
        fetchTransactions(address, network),
      ]);
      return { data, txs };
    },
    [fetchWalletData, fetchTransactions]
  );

  return { fetchWalletData, fetchTransactions, refetch };
}
