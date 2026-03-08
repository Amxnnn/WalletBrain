import { create } from "zustand";
import {
  WalletData,
  Transaction,
  Insight,
  PersonalityResult,
} from "../types";
import { NetworkType } from "../constants";
import { ScoreBreakdown } from "../utils/scoreEngine";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: NetworkType;
  walletData: WalletData | null;
  transactions: Transaction[];
  insights: Insight[];
  personality: PersonalityResult | null;
  score: ScoreBreakdown | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAddress: (address: string | null) => void;
  setConnected: (connected: boolean) => void;
  setNetwork: (network: NetworkType) => void;
  setWalletData: (data: WalletData | null) => void;
  setTransactions: (txs: Transaction[]) => void;
  setInsights: (insights: Insight[]) => void;
  setPersonality: (p: PersonalityResult | null) => void;
  setScore: (score: ScoreBreakdown) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  address: null,
  isConnected: false,
  network: "mainnet" as NetworkType,
  walletData: null,
  transactions: [],
  insights: [],
  personality: null,
  score: null,
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,
  setAddress: (address) => set({ address }),
  setConnected: (isConnected) => set({ isConnected }),
  // Switching network resets all wallet data so it re-fetches cleanly
  setNetwork: (network) =>
    set({ network, walletData: null, transactions: [], insights: [] }),
  setWalletData: (walletData) => set({ walletData }),
  setTransactions: (transactions) => set({ transactions }),
  setInsights: (insights) => set({ insights }),
  setPersonality: (personality) => set({ personality }),
  setScore: (score) => set({ score }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
