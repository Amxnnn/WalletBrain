# 🧠 WalletBrain

**"Your Solana wallet finally talks back."**

WalletBrain is an AI-powered Solana wallet analyst built as an Android mobile app for the Solana Mobile Hackathon 2026. Designed primarily for the Solana Seeker device, it transforms raw on-chain data into plain English insights and interactive conversations.

Connect your wallet once via Mobile Wallet Adapter (MWA) and let WalletBrain tell your wallet's story.

---

## ✨ Features

- **Personalized Insights**: Auto-generated plain English summaries of your portfolio, idle SOL warnings, and fee waste analysis.
- **AI Chat Analyst**: Talk to your wallet. Ask questions like *"Am I a good trader?"*, *"How much have I paid in fees?"*, or *"What is my biggest win?"*
- **Visual Portfolio**: Clean, readable charts showing your portfolio value over time, asset breakdown, and transaction activity.
- **Holdings Analysis & Market Pulse**: Get a one-line AI verdict on every token you hold and daily observations about the Solana ecosystem.
- **SKR Staking Tracker**: Dedicated dashboard to track your SKR staking performance, APY, and estimated earnings.
- **Wallet Personality**: Are you a *Diamond Hand 💎*, a *DeFi Farmer 🌾*, or a *Flip Machine 🔁*? WalletBrain analyzes your transaction history to assign you a unique personality card.

---

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (Android Only)
- **Web3 Engine**: [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) & [Mobile Wallet Adapter (MWA)](https://docs.solanamobile.com/react-native/expo)
- **Data Layer**: [Helius SDK](https://www.helius.dev/) (DAS API + Enhanced Transactions)
- **AI Layer**: [Google Generative AI (Gemini)](https://ai.google.dev/) / [Anthropic (Claude)](https://www.anthropic.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI & Charts**: React Native Paper, React native Gifted Charts

> **Note:** This app is fully functional on **Android only** due to the Mobile Wallet Adapter (MWA) constraints. It's built specifically with the Solana Seeker device in mind!

---

## 🚀 Quick Start

### Prerequisites

1. An **Android device or emulator**.
2. An MWA-compliant wallet installed on the device (e.g., **Phantom** or **Solflare**).
3. A **Helius API Key** (Get one at [dashboard.helius.dev](https://dashboard.helius.dev)).
4. An **AI API Key** (Gemini or Claude).

### 1. Installation

Clone the repository and install dependencies using `yarn` (do not use `npm` due to MWA package resolutions):

```bash
git clone https://github.com/your-repo/walletbrain.git
cd WalletBrain
yarn install
```

### 2. Environment Setup

Create a `.env` file in the root directory and add your API keys:

```ini
EXPO_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
EXPO_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key_here
EXPO_PUBLIC_AI_API_KEY=your_gemini_or_claude_api_key_here
EXPO_PUBLIC_NETWORK=mainnet-beta
```

### 3. Running the App

Start the Expo development server:

```bash
yarn start
```

Press `a` to open the app on your connected Android device or emulator.

If you encounter issues with standard Expo Go, you need to build a custom development client (EAS):

```bash
# Build a local development APK
yarn build:local

# Or build on Expo EAS servers
yarn build
```

---

## 🐛 Troubleshooting

- **`crypto.getRandomValues() not supported`**: Ensure the polyfills are correctly imported at the very top of `index.js`.
- **`@solana-mobile/mobile-wallet-adapter-protocol not found`**: Clean your project dependencies and make sure you used `yarn install` instead of `npm install`.
- **MWA package doesn't seem to be linked**: Expo Go does not support custom native modules like MWA out-of-the-box. You must compile a custom development build (`yarn build:local` or `yarn android`).
- **No data is loading**: Ensure your target wallet is on Mainnet and has actual transaction history. Ensure the `EXPO_PUBLIC_HELIUS_API_KEY` is properly loaded.

---

## 🏆 Hackathon Context

Built for the **Solana Mobile Hackathon 2026**, aiming for the Seeker device track and the SKR bonus track.

*WalletBrain — Because every Solana wallet has a story.*
