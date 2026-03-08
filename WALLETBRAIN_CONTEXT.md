# WALLETBRAIN — MASTER CONTEXT FILE
# Read this before writing a single line of code.
# Last updated: Solana Mobile Hackathon 2026

---

## WHAT IS THIS PROJECT?

WalletBrain is an AI-powered Solana wallet analyst built as an Android mobile app
for the Solana Mobile Hackathon 2026. It targets Seeker device owners.

The user connects their Solana wallet once via Mobile Wallet Adapter (MWA).
The app reads their entire on-chain history using Helius APIs, then lets them:
- See their portfolio visually in clean charts
- Get auto-generated plain English insights about their wallet
- Ask an AI anything about their wallet in natural language
- Get AI suggestions on their token holdings and market conditions
- Track their SKR staking performance

One line pitch: "Your Solana wallet finally talks back."

---

## WHAT THIS APP IS NOT

Do not add, suggest, or build any of these — ever:
- NO trading or swap functionality (read-only, no execution)
- NO technical analysis charts (no RSI, MACD, Bollinger Bands, nothing)
- NO Binance/exchange-style UI (no overwhelming dashboards)
- NO custom Anchor smart contracts or Rust programs
- NO iOS support (Android only, Seeker device first)
- NO social feed or following other wallets
- NO portfolio rebalancing execution
- NO more than 1 chart visible at a time on any screen
- NO crypto jargon in AI responses — always plain English
- NO financial advice disclaimers on every message

---

## HACKATHON CONTEXT (why decisions are made)

- Hackathon: Solana Mobile Hackathon 2026
- Prize: $10,000 for top 10 winners + $10,000 SKR bonus track
- Build time: 2 days using AI-assisted vibe coding
- Platform: Android only (Seeker device + any Android phone)
- Submission: Android APK + GitHub repo + demo video + pitch deck

Judging criteria (each 25%):
  1. Stickiness & PMF — does it create daily habits?
  2. User Experience — intuitive, polished, enjoyable
  3. Innovation / X-Factor — novel, creative, stands out
  4. Presentation & Demo Quality — clear communication, great demo

Key judges:
  - Toly (Solana Labs co-founder)
  - Emmett (GM, Solana Mobile)
  - Mert (Helius — WE ARE USING HIS API, this is a silent power move)
  - Mike S, Chase, Akshay (all Solana Mobile)

SKR Bonus Track: Best SKR integration wins additional $10,000 in SKR.
WalletBrain has a dedicated SKR tab — this qualifies.

---

## TECH STACK — EXACT VERSIONS AND PACKAGES

### App Framework
- Expo (managed workflow → bare for MWA)
- React Native
- TypeScript (always use TypeScript, never plain JS)
- Expo Router for navigation

### Wallet Connection
- Package: @solana-mobile/mobile-wallet-adapter-protocol-web3js
- Package: @solana-mobile/mobile-wallet-adapter-protocol
- Hook pattern: useMobileWallet (from Solana Mobile Expo Template)
- Supported wallets: Phantom, Solflare (both support MWA on Android)
- MWA is Android-only. Never attempt iOS MWA.

Init command (use yarn, NOT npm/npx/pnpm — known CLI issues with npm):
  yarn create expo-app WalletBrain --template @solana-mobile/solana-mobile-dapp-scaffold

### Solana Core
- Package: @solana/web3.js
- Package: @solana-mobile/mobile-wallet-adapter-protocol-web3js
- Package: spl-token
- RPC: Use Helius RPC endpoint, NOT public Solana RPC (rate limits)

### Required Polyfills (must import at top of index.js, before anything else)
- react-native-get-random-values
- buffer
- expo-crypto (if using Expo SDK 49+)

Polyfill setup in index.js:
```js
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}
const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto();
Object.defineProperty(global, 'crypto', { value: webCrypto });
```

### Data Layer — Helius SDK
- Package: helius-sdk
- Install: yarn add helius-sdk
- API key: get from https://dashboard.helius.dev
- RPC endpoint: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

Init:
```ts
import { Helius } from 'helius-sdk';
const helius = new Helius('YOUR_API_KEY');
```

EXACT API METHODS TO USE (do not guess or hallucinate other methods):

1. Get all tokens + NFTs owned by wallet:
```ts
const assets = await helius.rpc.getAssetsByOwner({
  ownerAddress: walletAddress,
  page: 1,
  limit: 100,
  displayOptions: { showFungible: true, showNativeBalance: true }
});
// Returns: items[] with token name, symbol, balance, USD value
```

2. Get parsed transaction history (human-readable, NOT raw):
```ts
const transactions = await helius.enhanced.getTransactionsByAddress({
  address: walletAddress,
  limit: 100,
});
// Returns: parsed txs with type (SWAP, NFT_SALE, TRANSFER etc.), amounts, dApp names
// This is the key method — 500+ transaction types auto-parsed
// Do NOT use getSignaturesForAddress — it returns raw signatures only
```

3. Get specific transaction details:
```ts
const txDetails = await helius.enhanced.getTransactions({
  transactions: ['txSignature1', 'txSignature2'],
});
```

4. Get SOL balance (raw RPC):
```ts
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=YOUR_KEY');
const balance = await connection.getBalance(new PublicKey(walletAddress));
const solBalance = balance / LAMPORTS_PER_SOL;
```

HELIUS API DECISION TABLE (use correct one, never confuse):
| Goal | Use This | NOT This |
|------|----------|----------|
| Get wallet tokens + NFTs | getAssetsByOwner (DAS API) | getTokenAccountsByOwner |
| Get parsed tx history | getTransactionsByAddress | getSignaturesForAddress |
| Get multiple tx details | getTransactions() | raw RPC getParsedTransaction |
| Portfolio tracker use case | DAS API + Enhanced Transactions | anything else |

### AI Layer
  Gemini API (free) — model: gemini-2.5-flash-lite
  Package: @google/generative-ai
  NOT Claude API anymore
- Include wallet data as system prompt context
- Keep AI responses to max 4-5 plain English sentences
- Never expose API key in client — use a simple backend proxy or Expo env vars

AI system prompt pattern:
```
You are WalletBrain, a personal Solana wallet analyst.
You are talking to a real person about their actual wallet.
Always use their real numbers. Be honest but kind.
Talk like a smart friend, not a compliance officer.
Never use crypto jargon. Always plain English.
Keep answers to 4-5 sentences maximum.

User's wallet data:
- Wallet: {address}
- SOL Balance: {sol} SOL (${usd})
- Top tokens: {tokenList}
- NFTs owned: {nftCount}
- Total transactions: {txCount}
- Last 30 days: {recentTxCount} transactions
- Most used dApps: {dappList}
- Total fees paid: {fees} SOL
- Recent transactions: {last20Txs}
- Net P&L this month: {pnl}
- SKR staked: {skrStaked} SKR since {stakeDays} days ago
```

### Charts
- Package: react-native-gifted-charts OR victory-native
- Use victory-native — better React Native support
- Install: yarn add victory-native
- Only 3 chart types used in the entire app:
  1. LineChart — portfolio value over time
  2. PieChart — portfolio breakdown (SOL / Tokens / NFTs / Idle)
  3. BarChart — transaction activity per day

Rules for all charts (NEVER BREAK THESE):
  - Max 1 chart visible per screen at a time
  - Max data points shown without scroll: 30
  - Always labeled in plain English
  - No technical indicators whatsoever
  - Soft colors — no aggressive trading-app red/green

### State Management
- Zustand (yarn add zustand)
- Store: walletStore (address, connected, balances, transactions, insights)
- Store: uiStore (loading states, active tab, chat history)

### Push Notifications
- expo-notifications
- Weekly digest every Monday 9am
- "Your contribution is due" type alerts
- Permission requested after wallet connect

### Navigation
- Expo Router (file-based routing)
- Bottom tab navigation with 5 tabs

### Styling
- NativeWind (Tailwind for React Native) OR StyleSheet
- Prefer NativeWind for speed
- Design tokens defined in theme.ts

---

## APP STRUCTURE — FILE SYSTEM

```
WalletBrain/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home — Insights Feed
│   │   ├── portfolio.tsx      # Portfolio — Charts + Balances
│   │   ├── chat.tsx           # AI Chat
│   │   ├── insights.tsx       # AI Market Insights
│   │   └── skr.tsx            # SKR Tab
│   ├── onboarding.tsx         # Connect Wallet screen
│   └── _layout.tsx            # Root layout + polyfills
├── components/
│   ├── InsightCard.tsx        # Single insight card component
│   ├── TokenRow.tsx           # Token list item
│   ├── ChatBubble.tsx         # AI chat message bubble
│   ├── PersonalityCard.tsx    # Shareable personality card
│   ├── PortfolioChart.tsx     # Line chart wrapper
│   ├── BreakdownChart.tsx     # Pie chart wrapper
│   └── ActivityChart.tsx      # Bar chart wrapper
├── hooks/
│   ├── useMobileWallet.ts     # MWA connect/disconnect/sign
│   ├── useHelius.ts           # All Helius API calls
│   ├── useWalletInsights.ts   # Compute insights from raw data
│   └── useAI.ts               # Claude API calls
├── stores/
│   ├── walletStore.ts         # Wallet state (Zustand)
│   └── uiStore.ts             # UI state (Zustand)
├── utils/
│   ├── formatters.ts          # USD formatting, SOL formatting
│   ├── insightEngine.ts       # Logic that generates auto-insights
│   ├── personalityEngine.ts   # Logic that assigns personality type
│   └── constants.ts           # API keys (via env vars), app identity
├── types/
│   └── index.ts               # TypeScript interfaces
├── index.js                   # Polyfill entry point
└── app.json                   # Expo config
```

---

## SCREENS — EXACT SPEC

### Screen 1: Onboarding (onboarding.tsx)
- Shows when no wallet connected
- App logo + tagline "Your Solana wallet finally talks back."
- Single button: "Connect Wallet" → triggers MWA transact()
- Loading spinner while Helius fetches initial data
- Transitions to Home tab on success
- No back button, no other navigation

### Screen 2: Home — Insights Feed (index.tsx)
- Shows 5-6 auto-generated insight cards
- Each card: emoji + short title + one sentence explanation
- Pull to refresh
- Tap any card → opens AI Chat with that topic pre-loaded
- Bottom of screen: personality type badge (tappable → shows full card)
- NO charts on this screen

Auto-insights generated by insightEngine.ts:
  1. Portfolio total value + 30-day change %
  2. Best performing token since purchase
  3. Idle SOL warning (if >2 SOL idle >30 days)
  4. Failed transaction fee waste
  5. Most used dApp this month
  6. SKR staking status one-liner

### Screen 3: Portfolio (portfolio.tsx)
- Top: Total value (large text) + 24h change
- Timeframe selector: 7D | 30D | 90D (switches chart data)
- Chart area (ONE chart at a time, swipeable between charts):
  - Chart 1: Line chart — portfolio value over selected timeframe
  - Chart 2: Pie chart — SOL vs Tokens vs NFTs vs Idle breakdown
  - Chart 3: Bar chart — transactions per day over 30 days
- Below charts: token list
  - Each row: token logo + name + balance + USD value + 24h %
  - Tap token → opens AI chat about that specific token
- NFT count row at bottom of list

### Screen 4: AI Chat (chat.tsx)
- Clean chat interface, WhatsApp-style bubbles
- First open: show 6 suggestion chips:
  - "Am I a good trader?"
  - "What's my biggest win?"
  - "How much in fees have I paid?"
  - "Should I stake my idle SOL?"
  - "How is my SKR performing?"
  - "What should I do with my portfolio?"
- User types → sends to Claude API with wallet context as system prompt
- AI response appears as chat bubble
- Responses: max 4-5 sentences, plain English, uses real wallet numbers
- Thumbs up/down on AI responses (log to local state)
- Keyboard-aware scroll (chat stays above keyboard)

### Screen 5: AI Insights (insights.tsx)
Two sections:

Section A — Your Holdings Analysis:
- List of tokens user holds
- Each token: name + emoji signal + one sentence AI verdict
- Signals: ↑ Strong | → Hold | ↓ Review
- Example: "JUP ↑ You're in profit. Consider partial gains."
- Tap any token → AI chat deepdive

Section B — Market Pulse:
- 3 daily AI observations about Solana ecosystem
- Refreshes every 24 hours
- Example: "🔥 Jupiter volume up 40% — DeFi picking up"
- Tap any observation → AI chat deepdive
- "Powered by Helius data" attribution (Mert is a judge)

### Screen 6: SKR Tab (skr.tsx)
- SKR balance (large) + USD value
- Staking card:
  - Amount staked
  - Days staked
  - Current APY
  - SKR earned so far (number)
  - Estimated yearly earnings
- Simple line chart: SKR earned over time
- AI one-liner about their SKR position
- Quick questions:
  - "When should I unstake?"
  - "Is SKR a good hold?"
  - "SKR vs just holding SOL?"
- These open AI Chat with question pre-filled

---

## WALLET PERSONALITY TYPES

Generated by personalityEngine.ts based on transaction patterns.
Shown on Home screen as a badge. Full card is shareable.

Logic rules:
```
if (nftTxCount > tokenSwapCount * 2) → NFT Collector 🖼️
if (swapCount > 30 && avgHoldDays < 7) → Flip Machine 🔁
if (stakingTxCount > swapCount) → DeFi Farmer 🌾
if (txCount < 10 && avgTxValueSOL > 50) → Silent Whale 🐋
if (totalTxCount < 20 && accountAgeDays < 30) → Fresh Wallet 🆕
if (avgHoldDays > 90 && sellCount < buyCount * 0.2) → Diamond Hand 💎
else → Zen Holder 🧘
```

Shareable card format:
- Dark background, personality emoji (large)
- Personality name
- 3 stats: total txs, net P&L, most used dApp
- "Powered by WalletBrain" watermark
- Share button → exports as image to camera roll

---

## DATA FLOW — HOW IT ALL CONNECTS

```
1. User taps "Connect Wallet"
   └── MWA transact() called
       └── Phantom/Solflare popup opens
           └── User approves
               └── walletAddress stored in walletStore

2. On wallet connect → useHelius hook fires:
   ├── helius.rpc.getAssetsByOwner() → tokens + NFTs + balances
   ├── helius.enhanced.getTransactionsByAddress() → last 100 parsed txs
   └── connection.getBalance() → SOL balance

3. Raw data → insightEngine.ts:
   ├── Computes portfolio USD value
   ├── Calculates 30-day P&L
   ├── Identifies idle SOL
   ├── Finds most used dApps
   ├── Calculates fee waste
   └── Returns 6 insight objects → displayed on Home

4. Raw data → personalityEngine.ts:
   └── Runs logic rules → returns personality type + stats

5. User opens AI Chat:
   ├── Wallet data serialized to string (system prompt)
   ├── User question sent to Claude API
   └── Response streamed back → displayed as chat bubble

6. User opens Portfolio:
   ├── Charts rendered from transaction history (price over time)
   └── Token list from getAssetsByOwner results

7. User opens SKR tab:
   ├── SKR balance from getAssetsByOwner (filter by SKR mint)
   └── SKR staking data from parsed transactions (filter by STAKE type)
```

---

## DEVELOPMENT PHASES

---

### PHASE 1 — Foundation (Day 1, Morning ~4 hours)
Goal: App runs, wallet connects, data loads. Nothing else.

Tasks:
  1. Init Expo project from Solana Mobile scaffold
     ```
     yarn create expo-app WalletBrain --template @solana-mobile/solana-mobile-dapp-scaffold
     ```
  2. Set up polyfills in index.js (exact code above)
  3. Install dependencies:
     ```
     yarn add helius-sdk zustand victory-native @solana/web3.js
     yarn add expo-notifications expo-router nativewind
     ```
  4. Create walletStore.ts and uiStore.ts (Zustand)
  5. Build Onboarding screen — logo + connect button
  6. Wire MWA connect via useMobileWallet hook
  7. Wire Helius API calls in useHelius.ts
  8. Console.log wallet data to verify — don't build UI yet
  9. Set up Expo Router tab navigation (5 tabs, placeholder screens)

Definition of done: wallet connects, Helius data logs to console, 5 tabs navigate.

---

### PHASE 2 — Home + AI Chat (Day 1, Afternoon ~4 hours)
Goal: Core value prop working. Insights show. AI answers questions.

Tasks:
  1. Build insightEngine.ts — generates 6 insights from raw wallet data
  2. Build Home screen — InsightCard components, pull to refresh
  3. Build personalityEngine.ts — assigns personality type
  4. Show personality badge on Home screen
  5. Set up Claude API proxy (simple fetch in useAI.ts)
  6. Build AI Chat screen — chat bubbles + input field
  7. Wire wallet data → AI system prompt → Claude API → response
  8. Add 6 suggestion chips to Chat screen
  9. Test with real wallets — verify AI gives accurate answers

Definition of done: Home shows insights, Chat answers questions with real wallet data.

---

### PHASE 3 — Portfolio + Charts (Day 1, Evening ~2 hours)
Goal: Visual data representation working.

Tasks:
  1. Build Portfolio screen layout
  2. Integrate victory-native charts:
     - LineChart: portfolio value (mock historical if price API unavailable)
     - PieChart: portfolio breakdown from asset data
     - BarChart: tx count per day from transaction history
  3. Build TokenRow component — name, balance, USD, 24h change
  4. Build token list on Portfolio screen
  5. Add timeframe selector (7D/30D/90D) wired to chart data
  6. Make token rows tappable → open AI Chat with token context

Definition of done: Portfolio shows charts and token list. Charts are readable and clean.

---

### PHASE 4 — AI Insights + SKR Tab (Day 2, Morning ~3 hours)
Goal: SKR bonus track qualified. Insights screen complete.

Tasks:
  1. Build AI Insights screen:
     - Holdings analysis: call Claude for one-line verdict per token
     - Market Pulse: 3 daily AI observations (cached, refresh daily)
  2. Build SKR tab:
     - Filter getAssetsByOwner results for SKR token
     - Parse staking transactions from history
     - Build staking stats card (amount, APY, earned, days)
     - Small SKR earnings line chart
     - AI one-liner about SKR position
     - Quick question chips wired to Chat

Definition of done: SKR tab shows real staking data. AI Insights shows per-token verdicts.

---

### PHASE 5 — Polish + Demo Prep (Day 2, Afternoon ~3 hours)
Goal: App looks good enough to win. Demo is rehearsed.

Tasks:
  1. Consistent color theme applied across all screens
  2. Loading skeletons for all data-fetch states
  3. Error states — "couldn't load data, tap to retry"
  4. Empty states — "no transactions yet" for new wallets
  5. Shareable personality card — export as image
  6. Push notification setup (weekly digest)
  7. App icon + splash screen branded
  8. Test on real Android device end-to-end
  9. Build APK via EAS:
     ```
     npx eas build --profile development --platform android
     ```

Definition of done: App runs clean on real device with no crashes. Demo rehearsed 3x.

---

### PHASE 6 — Submission (Day 2, Evening ~2 hours)
  1. Record demo video (90 seconds max, script below)
  2. Create GitHub repo, push all code, write README
  3. Build pitch deck (10 slides max)
  4. Submit APK + all materials before deadline

---

## DEMO SCRIPT (90 seconds — memorize this)

0:00 — "Every Solana wallet has a story. WalletBrain tells it."
0:05 — Open app → show clean onboarding screen
0:10 — Tap Connect Wallet → MWA fires → approve in Phantom (fast)
0:20 — Home screen loads → 6 personal insights animate in
0:30 — "Here's what WalletBrain found about MY wallet..."
0:35 — Tap Portfolio → show line chart of value over 30 days
0:45 — Tap AI Chat → type "Am I a good trader?" → response appears
0:55 — "Honest. Specific. Uses your real numbers."
1:00 — Show SKR tab → staking earnings in plain English
1:10 — Show personality card → "I'm a Flip Machine 🔁"
1:15 — "Want to see yours?" → invite judge to connect their wallet live
1:25 — Their wallet loads → personal insights → judge reaction
1:30 — Done

The moment that wins the room: judge seeing their own wallet analyzed live.

---

## ENVIRONMENT VARIABLES

Create .env file (never commit to GitHub, add to .gitignore):
```
EXPO_PUBLIC_HELIUS_API_KEY=your_helius_key_here
EXPO_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_key_here
EXPO_PUBLIC_NETWORK=mainnet-beta
```

Access in code:
```ts
const HELIUS_KEY = process.env.EXPO_PUBLIC_HELIUS_API_KEY;
```

---

## COMMON ERRORS AND FIXES

Error: "Metro cannot resolve @solana-mobile/mobile-wallet-adapter-protocol"
Fix: You used npm. Delete node_modules, run yarn install.

Error: "getRandomValues is not a function"
Fix: Polyfills not imported first in index.js. Move them to top.

Error: "MWA package not linked"
Fix: You are running in Expo Go. Must use custom development build via EAS.

Error: Helius returns empty transaction array
Fix: Use getTransactionsByAddress not getSignaturesForAddress.

Error: Chart renders but is blank
Fix: victory-native needs data in exact format { x: number, y: number }[]

Error: "Cannot read property of undefined" on wallet data
Fix: Always null-check Helius responses before computing insights. Use optional chaining.

---

## KEY DECISIONS LOG (don't revisit these)

- Using Helius over raw Solana RPC → because enhanced transaction parsing saves 80% of work
- Using Expo over bare React Native → because EAS Build handles APK generation
- Using yarn over npm → because Expo template has known issues with npm
- Using Claude API over GPT → consistency with Anthropic tooling
- No custom smart contracts → zero Anchor/Rust needed, stays in 2-day budget
- Android only → MWA doesn't support iOS, hackathon is Android anyway
- Victory-native over recharts → recharts is web-only, victory works in React Native
- Zustand over Redux/Context → simpler, faster to set up, sufficient for this scale
- 5 tabs only → more tabs = worse UX on mobile, every feature fits in 5

---

## SCORING SELF-CHECK (run before submitting)

Stickiness (25%):
  [ ] Weekly push notification implemented
  [ ] New insights generate on each wallet refresh
  [ ] SKR tab gives reason to return daily

UX (25%):
  [ ] App loads and connects in under 10 seconds
  [ ] No screen has more than 1 chart visible
  [ ] All AI responses are plain English, max 5 sentences
  [ ] Loading states exist for all async operations
  [ ] Error states exist for all failure cases

Innovation (25%):
  [ ] No existing app on Seeker dApp store does this
  [ ] AI wallet analyst on mobile = novel combination
  [ ] SKR integration is meaningful, not cosmetic

Presentation (25%):
  [ ] Demo script rehearsed and under 90 seconds
  [ ] Judge connects their own wallet live during demo
  [ ] Pitch deck tells a story (problem → solution → demo → traction)

---

*WalletBrain — Solana Mobile Hackathon 2026*
*Stack: Expo + MWA + Helius SDK + Claude API + Victory Native + Zustand*
*Build time: 2 days*
