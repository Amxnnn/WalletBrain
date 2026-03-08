import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AgentTrade {
  id: string;
  timestamp: number;
  action: 'hold' | 'swap' | 'rebalance';
  fromToken?: string;
  toToken?: string;
  percentage?: number;
  reasoning: string;
  confidence: number;
  /** Simulated USD P&L (devnet) or approximate SOL-denominated gain (mainnet). */
  virtualPnl: number;
  /** Real on-chain transaction signature, if available. */
  txSignature?: string;
  network: 'mainnet' | 'devnet';
}

interface AgentState {
  // ── Wallet ─────────────────────────────────────────────────────────────────
  /** On-chain public key of the agent wallet. */
  agentWallet: string | null;
  /** true = this app generated the keypair (private key in SecureStore). */
  walletGenerated: boolean;
  /** Active network for this agent session. */
  network: 'mainnet' | 'devnet';

  // ── Status ─────────────────────────────────────────────────────────────────
  agentActive: boolean;
  agentLoading: boolean;
  agentError: string | null;

  // ── Config ─────────────────────────────────────────────────────────────────
  riskLevel: 'conservative' | 'balanced' | 'aggressive';

  // ── Balances ───────────────────────────────────────────────────────────────
  /** Actual on-chain SOL balance (refreshed before each decision). */
  realSolBalance: number;
  /** SOL balance at the time the agent was activated (for %PnL calc). */
  startingSolBalance: number;
  /** Devnet virtual USD portfolio value. */
  currentBalance: number;
  startingBalance: number;

  // ── History ────────────────────────────────────────────────────────────────
  trades: AgentTrade[];
  lastDecisionTime: number | null;
  lastTxSignature: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setAgentWallet: (address: string | null) => void;
  setWalletGenerated: (v: boolean) => void;
  setNetwork: (network: 'mainnet' | 'devnet') => void;
  setAgentActive: (active: boolean) => void;
  setAgentLoading: (loading: boolean) => void;
  setAgentError: (error: string | null) => void;
  setRiskLevel: (level: 'conservative' | 'balanced' | 'aggressive') => void;
  setRealSolBalance: (balance: number) => void;
  setStartingSolBalance: (balance: number) => void;
  setStartingBalance: (amount: number) => void;
  setCurrentBalance: (amount: number) => void;
  setLastTxSignature: (sig: string | null) => void;
  addTrade: (trade: AgentTrade) => void;
  clearAgent: () => void;
}

const initialAgentState = {
  agentWallet: null,
  walletGenerated: false,
  network: 'devnet' as const,
  agentActive: false,
  agentLoading: false,
  agentError: null,
  riskLevel: 'balanced' as const,
  realSolBalance: 0,
  startingSolBalance: 0,
  currentBalance: 100,
  startingBalance: 100,
  trades: [],
  lastDecisionTime: null,
  lastTxSignature: null,
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      ...initialAgentState,
      setAgentWallet:       (agentWallet)        => set({ agentWallet }),
      setWalletGenerated:   (walletGenerated)    => set({ walletGenerated }),
      setNetwork:           (network)            => set({ network }),
      setAgentActive:       (agentActive)        => set({ agentActive }),
      setAgentLoading:      (agentLoading)       => set({ agentLoading }),
      setAgentError:        (agentError)         => set({ agentError }),
      setRiskLevel:         (riskLevel)          => set({ riskLevel }),
      setRealSolBalance:    (realSolBalance)     => set({ realSolBalance }),
      setStartingSolBalance:(startingSolBalance) => set({ startingSolBalance }),
      setStartingBalance:   (startingBalance)    => set({ startingBalance, currentBalance: startingBalance }),
      setCurrentBalance:    (currentBalance)     => set({ currentBalance }),
      setLastTxSignature:   (lastTxSignature)    => set({ lastTxSignature }),
      addTrade: (trade) =>
        set((state) => ({
          trades: [trade, ...state.trades],
          currentBalance: Number((state.currentBalance + trade.virtualPnl).toFixed(2)),
          lastDecisionTime: trade.timestamp,
          lastTxSignature: trade.txSignature ?? state.lastTxSignature,
        })),
      clearAgent: () => set(initialAgentState),
    }),
    {
      name: 'walletbrain-agent',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
