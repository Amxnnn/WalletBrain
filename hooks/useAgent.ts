import { useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GEMINI_API_KEY, GEMINI_MODEL, HELIUS_API_KEY } from '../constants';
import { useAgentStore, AgentTrade } from '../stores/agentStore';
import {
  generateAgentWallet,
  loadAgentKeypair,
  deleteAgentWallet,
  getOnChainBalance,
  requestDevnetAirdrop,
} from '../utils/agentWalletService';
import {
  getJupiterQuote,
  executeJupiterSwap,
  executeDevnetMemo,
  solToLamports,
} from '../utils/jupiterService';

// ── Helius data fetchers ──────────────────────────────────────────────────────

async function fetchHoldings(
  address: string,
  network: 'mainnet' | 'devnet',
): Promise<string> {
  if (network === 'devnet') {
    const bal = await getOnChainBalance(address, 'devnet');
    return `SOL: ${bal.toFixed(4)} (devnet sandbox)`;
  }
  try {
    const [assetsRes, solRes] = await Promise.all([
      fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: '1', method: 'getAssetsByOwner',
          params: {
            ownerAddress: address, page: 1, limit: 50,
            displayOptions: { showFungible: true, showNativeBalance: true },
          },
        }),
      }),
      fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getBalance', params: [address] }),
      }),
    ]);
    const assetsJson = await assetsRes.json();
    const solJson    = await solRes.json();
    const items: any[] = assetsJson?.result?.items ?? [];
    const tokens = items
      .filter((i: any) => i?.interface === 'FungibleToken' || i?.interface === 'FungibleAsset')
      .map((i: any) => {
        const info    = i.token_info ?? {};
        const balance = (info.balance ?? 0) / Math.pow(10, info.decimals ?? 6);
        const usd     = info.price_info?.total_price ?? 0;
        const symbol  = info.symbol?.trim() || i.content?.metadata?.symbol?.trim() || 'UNK';
        return `${symbol}: ${balance.toFixed(4)} ($${usd.toFixed(2)})`;
      });
    const solBalance = ((solJson?.result?.value ?? 0) / 1e9).toFixed(4);
    return [`SOL: ${solBalance}`, ...tokens].join(', ') || 'No holdings found';
  } catch {
    return 'Holdings unavailable';
  }
}

async function fetchRecentTxs(
  address: string,
  network: 'mainnet' | 'devnet',
): Promise<string> {
  if (network === 'devnet') return 'New devnet agent wallet — no prior history';
  try {
    const res = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=20`,
    );
    const raw = await res.json();
    if (!Array.isArray(raw)) return 'No recent transactions';
    return raw
      .slice(0, 20)
      .map((tx: any) =>
        `${tx.type ?? 'UNKNOWN'} on ${tx.source ?? 'unknown'} (${tx.transactionError == null ? 'ok' : 'failed'})`,
      )
      .join(', ');
  } catch {
    return 'Transactions unavailable';
  }
}

// ── Devnet P&L simulation ─────────────────────────────────────────────────────
// Jupiter doesn't run on devnet so we simulate realistic P&L.
function simulatePnl(
  action: 'hold' | 'swap' | 'rebalance',
  riskLevel: 'conservative' | 'balanced' | 'aggressive',
  currentBalance: number,
): number {
  if (action === 'hold') return 0;
  const multiplier = { conservative: 0.012, balanced: 0.027, aggressive: 0.055 }[riskLevel];
  const isGain  = Math.random() < 0.65;
  const magnitude = currentBalance * multiplier * (0.4 + Math.random() * 0.8);
  return Number((isGain ? magnitude : -magnitude).toFixed(2));
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAgent() {
  const {
    agentWallet, network, riskLevel, currentBalance, realSolBalance,
    setAgentWallet, setWalletGenerated, setNetwork,
    setAgentLoading, setAgentError, setAgentActive,
    setRealSolBalance, setStartingSolBalance, setLastTxSignature,
    addTrade, clearAgent,
  } = useAgentStore();

  // ── Generate a brand-new agent wallet ──────────────────────────────────────
  const createWallet = useCallback(async (net: 'mainnet' | 'devnet') => {
    try {
      setAgentLoading(true);
      setAgentError(null);
      setNetwork(net);
      const pubkey = await generateAgentWallet();
      setAgentWallet(pubkey);
      setWalletGenerated(true);
      const bal = await getOnChainBalance(pubkey, net);
      setRealSolBalance(bal);
    } catch (err: any) {
      setAgentError(err?.message ?? 'Failed to generate wallet');
    } finally {
      setAgentLoading(false);
    }
  }, [setAgentLoading, setAgentError, setNetwork, setAgentWallet, setWalletGenerated, setRealSolBalance]);

  // ── Refresh on-chain balance ────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!agentWallet) return;
    try {
      const bal = await getOnChainBalance(agentWallet, network);
      setRealSolBalance(bal);
    } catch { /* silent */ }
  }, [agentWallet, network, setRealSolBalance]);

  // ── Devnet airdrop ──────────────────────────────────────────────────────────
  const airdrop = useCallback(async () => {
    if (!agentWallet || network !== 'devnet') return;
    try {
      setAgentLoading(true);
      setAgentError(null);
      const sig = await requestDevnetAirdrop(agentWallet);
      setLastTxSignature(sig);
      const bal = await getOnChainBalance(agentWallet, 'devnet');
      setRealSolBalance(bal);
    } catch (err: any) {
      setAgentError(err?.message ?? 'Airdrop failed — devnet faucet may be rate-limited. Try again in 30s.');
    } finally {
      setAgentLoading(false);
    }
  }, [agentWallet, network, setAgentLoading, setAgentError, setLastTxSignature, setRealSolBalance]);

  // ── Core AI decision + execution ────────────────────────────────────────────
  const makeDecision = useCallback(async () => {
    if (!agentWallet) return;
    setAgentLoading(true);
    setAgentError(null);

    try {
      // Always read fresh on-chain balance before deciding
      const latestBal = await getOnChainBalance(agentWallet, network);
      setRealSolBalance(latestBal);

      const [holdings, recentTxs] = await Promise.all([
        fetchHoldings(agentWallet, network),
        fetchRecentTxs(agentWallet, network),
      ]);

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = `You are an autonomous AI trading agent managing a dedicated Solana wallet.

Wallet: ${agentWallet}
Network: ${network.toUpperCase()}
Holdings: ${holdings}
Recent activity: ${recentTxs}
Risk level: ${riskLevel}
SOL balance: ${latestBal.toFixed(6)} SOL
Tradeable tokens: SOL, USDC, BONK, JUP, WIF

${network === 'mainnet'
  ? 'IMPORTANT: This is REAL trading with REAL funds. Be conservative. Always keep ≥0.005 SOL for gas. Maximum 40% of balance per trade. Prefer safer actions.'
  : 'This is devnet sandbox — trades are recorded as memo transactions. Be realistic but exploratory.'}

${latestBal < 0.005 ? 'Balance is too low to trade safely. Recommend HOLD.' : ''}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "action": "hold" | "swap" | "rebalance",
  "fromToken": "SOL" | "USDC" | "BONK" | "JUP" | "WIF" | null,
  "toToken": "SOL" | "USDC" | "BONK" | "JUP" | "WIF" | null,
  "percentage": 1-40,
  "reasoning": "2 clear sentences citing holdings and market context",
  "confidence": 0-100
}`;

      const result   = await model.generateContent(prompt);
      const text     = result.response.text().trim().replace(/```json|```/g, '').trim();
      const decision = JSON.parse(text);

      const action: AgentTrade['action'] = decision.action ?? 'hold';
      let txSignature: string | undefined;
      let virtualPnl = 0;

      const canTrade = latestBal > 0.01 && action !== 'hold';

      if (canTrade) {
        if (network === 'mainnet') {
          // ── Real Jupiter swap ────────────────────────────────────────────
          const keypair = await loadAgentKeypair();
          if (keypair && decision.fromToken && decision.toToken) {
            const pct        = Math.min(40, Math.max(1, decision.percentage ?? 20)) / 100;
            const swapSol    = latestBal * pct;
            // Keep minimum gas reserve
            const safeSol    = Math.max(0, Math.min(swapSol, latestBal - 0.005));
            const lamports   = solToLamports(safeSol);
            if (lamports > 5000) {
              const quoteResponse = await getJupiterQuote(
                decision.fromToken,
                decision.toToken,
                lamports,
              );
              txSignature = await executeJupiterSwap(keypair, quoteResponse);
              // Measure real SOL change as rough P&L indicator
              const newBal = await getOnChainBalance(agentWallet, 'mainnet');
              setRealSolBalance(newBal);
              virtualPnl = Number(((newBal - latestBal) * 150).toFixed(2)); // rough USD ~$150/SOL
            }
          }
        } else {
          // ── Devnet memo (records decision on-chain, simulates P&L) ───────
          const keypair = await loadAgentKeypair();
          if (keypair) {
            const memo =
              `WalletBrain|${action}|${decision.fromToken ?? '?'}→${decision.toToken ?? '?'}` +
              `|${decision.percentage ?? 0}%|${(decision.reasoning ?? '').slice(0, 120)}`;
            txSignature = await executeDevnetMemo(keypair, memo);
          }
          virtualPnl = simulatePnl(action, riskLevel, currentBalance);
        }
      }

      addTrade({
        id:          Date.now().toString(),
        timestamp:   Date.now(),
        action,
        fromToken:   decision.fromToken  ?? undefined,
        toToken:     decision.toToken    ?? undefined,
        percentage:  decision.percentage ?? undefined,
        reasoning:   decision.reasoning  ?? 'No reasoning provided.',
        confidence:  Math.min(100, Math.max(0, decision.confidence ?? 50)),
        virtualPnl,
        txSignature,
        network,
      });
    } catch (err: any) {
      setAgentError(err?.message ?? 'Decision failed. Please try again.');
    } finally {
      setAgentLoading(false);
    }
  }, [agentWallet, network, riskLevel, currentBalance, realSolBalance,
      setAgentLoading, setAgentError, setRealSolBalance, addTrade]);

  // ── Activate ────────────────────────────────────────────────────────────────
  const activateAgent = useCallback(async () => {
    if (!agentWallet) return;
    setAgentActive(true);
    const bal = await getOnChainBalance(agentWallet, network);
    setRealSolBalance(bal);
    setStartingSolBalance(bal);
    await makeDecision();
  }, [agentWallet, network, setAgentActive, setRealSolBalance, setStartingSolBalance, makeDecision]);

  // ── Pause ───────────────────────────────────────────────────────────────────
  const pauseAgent = useCallback(() => {
    setAgentActive(false);
  }, [setAgentActive]);

  // ── Remove wallet ───────────────────────────────────────────────────────────
  const removeWallet = useCallback(async () => {
    await deleteAgentWallet();
    clearAgent();
  }, [clearAgent]);

  return { createWallet, refreshBalance, airdrop, makeDecision, activateAgent, pauseAgent, removeWallet };
}
