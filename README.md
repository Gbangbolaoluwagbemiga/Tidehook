# TideHook 🌊

> **Dual-Market Liquidity Routing for Uniswap v4** — Separating retail and whale trades to eliminate MEV and protect LPs.

Built for the **UHI8 Hookathon** by the Uniswap Foundation & Atrium Academy.

---

## 🧠 What is TideHook?

TideHook is a Uniswap v4 Hook that implements a **dual-market execution system**:

- **Retail trades** (< $500k) → Execute immediately through the standard AMM at a fair dynamic fee.
- **Whale trades** (≥ $500k) → Intercepted and routed into a **Dutch Auction**, where the price decays block-by-block until a fair market price is found.

This design protects liquidity providers from inventory imbalances and eliminates the MEV extraction opportunities (sandwich attacks, arbitrage front-running) that typically target large AMM swaps.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🎯 **Dual-Market Routing** | Automatic segmentation of retail vs. whale trades in `beforeSwap` |
| 📉 **Dutch Auction Engine** | On-chain price decay using `AuctionMath` library |
| 🤖 **Autonomous Ticking** | Reactive Network automatically advances auctions every few blocks |
| 🛡️ **MEV Resistance** | Auction spans multiple blocks, making sandwich attacks unprofitable |
| 💧 **LP Protection** | Smoothed execution prevents inventory spikes and toxic order flow |
| ⚙️ **Configurable Thresholds** | Pool owners can set custom `whaleThreshold`, `auctionDuration`, and fees |

---

## 🤝 Partner Integrations

### [Reactive Network](https://dev.reactive.network/)

TideHook is **deeply integrated with the Reactive Network** for autonomous, cross-chain auction management.

**How it works:**
1. When a whale trade is detected, `TideHook` emits a `WhaleAuctionStarted` event on Unichain Sepolia.
2. The `TideReactive` contract (deployed on Reactive Network Lasna) listens for this event via a Reactive subscription.
3. Every few blocks, `TideReactive` automatically calls `tickAuction()` on TideHook, decaying the price and filling the auction in proportional chunks.
4. When the auction price reaches the market price, the hook settles the trade internally via `poolManager.unlock()`.

This makes TideHook a **fully autonomous protocol** — no keeper bots, no manual intervention.

**Deployed Contracts:**
- `TideHook` (Unichain Sepolia): `0xfa3778D71aa1e1eA62584052EA5f37A8b8CF50c8`
- `TideReactive` (Reactive Network Lasna): `0x659d3ede264f2017c84c341000d02c13d1004490`

---

## 🏗️ Architecture

```
User Swap Request
       │
       ▼
 TideHook.beforeSwap()
       │
  ┌────┴─────┐
  │          │
Retail     Whale
  │          │
  ▼          ▼
Standard   Dutch Auction
  AMM       Initialized
             │
             ▼
    Reactive Network Listener
    (TideReactive.sol on Lasna)
             │
     Every few blocks...
             ▼
    tickAuction() called
             │
             ▼
    poolManager.unlock()
    → Internal swap executed
    → Tokens sent to whale
```

---

## 📁 Project Structure

```
TideHook/
├── src/
│   ├── TideHook.sol          # Core hook logic
│   ├── interfaces/
│   │   └── ITideHook.sol     # Hook interface + structs
│   └── libraries/
│       └── AuctionMath.sol   # Dutch auction math
├── reactive/
│   └── TideReactive.sol      # Reactive Network contract
├── script/
│   ├── DeployTideHook.s.sol
│   ├── DeployTideReactive.s.sol
│   └── MineSalt.s.sol
├── test/
│   └── TideHook.t.sol        # Foundry test suite
└── frontend/                 # Next.js 14 dashboard
```

---

## 🧪 Testing

```bash
# Install dependencies
forge install

# Run core tests
forge test -vv
```

---

## 👨‍⚖️ For Judges: Testing Guide

We have prepared a **comprehensive E2E testing guide** specifically for hackathon reviewers. This guide covers full protocol deployment, manual auction ticking, and verification steps.

👉 **[Read the Scripting & Testing Guide (E2E)](script/README.md)**

---

**Test Coverage:**
- ✅ `test_RetailSwapNormalExecution` — Retail routes through standard AMM
- ✅ `test_WhaleSwapInitiatesAuction` — Whale interception and auction creation
- ✅ `test_WhaleAuctionPriceDecay` — Dutch auction price decay verification
- ✅ `test_AuctionSettlesProperlyAtFullDuration` — Full settlement flow with token distribution
- ✅ `test_TickRevertsIfNotReactiveNetwork` — Authorization guards
- ✅ `test_MultipleConcurrentWhaleAuctions` — Concurrent auction isolation

---

## 🚀 Deployment

```bash
# Deploy TideHook to Unichain Sepolia
forge script script/DeployTideHook.s.sol --rpc-url https://sepolia.unichain.org --broadcast

# Deploy TideReactive to Reactive Network Lasna
forge script script/DeployTideReactive.s.sol --rpc-url https://lasna-rpc.rnk.dev/ --broadcast
```

---

## 🖥️ Frontend Dashboard

A professional Next.js 14 dashboard is included in `frontend/` featuring:
- **Swap UI** with real-time retail/whale classification
- **Auction Panel** showing live Dutch auction state and decay charts
- **Analytics** with price impact comparison (AMM vs TideHook)
- **Demo Mode** for live presentations without an active wallet

```bash
cd frontend
npm install
npm run dev
```

---

## 📜 License

MIT
