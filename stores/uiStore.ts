import { create } from "zustand";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface UIState {
  activeTab: string;
  chatHistory: ChatMessage[];
  isAILoading: boolean;
  pendingChatMessage: string | null;
  marketPulseLastUpdated: number | null;
  marketPulse: { emoji: string; observation: string }[];

  // Actions
  setActiveTab: (tab: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setAILoading: (loading: boolean) => void;
  clearChat: () => void;
  setPendingChatMessage: (msg: string | null) => void;
  setMarketPulse: (pulse: { emoji: string; observation: string }[]) => void;
  setMarketPulseLastUpdated: (ts: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  chatHistory: [],
  isAILoading: false,
  pendingChatMessage: null,
  marketPulseLastUpdated: null,
  marketPulse: [],

  setActiveTab: (activeTab) => set({ activeTab }),
  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  setAILoading: (isAILoading) => set({ isAILoading }),
  clearChat: () => set({ chatHistory: [] }),
  setPendingChatMessage: (pendingChatMessage) => set({ pendingChatMessage }),
  setMarketPulse: (marketPulse) => set({ marketPulse }),
  setMarketPulseLastUpdated: (marketPulseLastUpdated) =>
    set({ marketPulseLastUpdated }),
}));
