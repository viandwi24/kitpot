# Kitpot — Trustless Savings Circles on Initia

> 500 years of rotating savings circles. Now trustless.

**Demo Video:** [YouTube](<fill-after-recording>) · **Track:** Gaming & Consumer

---

## What is Kitpot?

**300 million+ people** worldwide participate in rotating savings circles (known as ROSCA, Arisan, Chit Fund, Hui, Tontine, Paluwagan). Every single one of them still relies on a trusted treasurer who could disappear with everyone's money.

**Kitpot** is the first trustless rotating savings circle on-chain. Smart contracts replace the treasurer — contributions are collected automatically via Initia's native auto-signing, and the pot is distributed by code, not by trust.

### Native Initia Feature: Auto-Signing

Kitpot uses InterwovenKit's **native auto-signing** (`autoSign.enable` / `autoSign.disable`) — Cosmos `x/authz` + `x/feegrant` under the hood. Members enable auto-sign once via the InterwovenKit drawer, and subsequent cycle deposits go through **with zero wallet pop-ups**. No custom Solidity session keys needed.

Additionally:
- **.init Usernames** — resolved natively via `useUsernameQuery` from InterwovenKit. Members see human-readable names, not hex addresses.
- **All transactions** are routed via `requestTxBlock` / `submitTxBlock` with `/minievm.evm.v1.MsgCall` — the correct InterwovenKit transaction flow for MiniEVM rollups.

---

## How It Works

```
1. CREATE    → Start a circle, set contribution amount, invite members
2. JOIN      → Members join + deposit collateral (returned after circle completes)
3. AUTO-SIGN → Enable native auto-signing once — no more clicking, ever
4. COLLECT   → Every cycle, contributions collected automatically
5. DISTRIBUTE→ Pot goes to next member in round-robin order, minus 1% platform fee
6. COMPLETE  → After all cycles, collateral returned, reputation updated, achievements earned
```

---

## Features

### Core Protocol (`KitpotCircle.sol`)
- **Circle creation** with configurable contribution, members (3–20), and cycle duration
- **Round-robin distribution** — deterministic, fair, every member gets the pot exactly once
- **Collateral system** — 1x contribution deposited on join, returned after completion
- **Late payment penalties** — grace period, then collateral slashed (5% default)
- **Tier-gated circles** — creators can require minimum reputation tier to join
- **1% platform fee** per pot (configurable, capped at 5%)

### Reputation System (`KitpotReputation.sol`)
- Tracks: circles completed, on-time rate, streak days, total contributed/received, XP
- **Trust tiers:** Unranked → Bronze → Silver → Gold → Diamond
- **Levels 0–5** with XP thresholds, visible in profile and leaderboard

### Achievement NFTs (`KitpotAchievements.sol`)
- **Soulbound (non-transferable)** ERC721 badges
- **12 achievement types:** First Circle, First Pot, Perfect Circle, Streak milestones, Veteran, Diamond, Early Adopter
- **On-chain SVG metadata** — no IPFS, fully self-contained

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Contracts** | Solidity 0.8.26 · Foundry · OpenZeppelin v5 |
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **UI** | shadcn/ui · Dark mode |
| **Wallet** | InterwovenKit (`@initia/interwovenkit-react`) |
| **Tx Signing** | `requestTxBlock` / `submitTxBlock` via `/minievm.evm.v1.MsgCall` |
| **Auto-Signing** | Native InterwovenKit `autoSign` (Cosmos authz + feegrant) |
| **Usernames** | Native `useUsernameQuery` from InterwovenKit |
| **Chain** | kitpot-2 (EVM rollup via Weave CLI on Initia testnet) |
| **Runtime** | Bun 1.x |

---

## Deployed Contracts (kitpot-2 rollup)

| Contract | Address |
|----------|---------|
| KitpotCircle | `<fill-after-redeploy>` |
| KitpotReputation | `<fill-after-redeploy>` |
| KitpotAchievements | `<fill-after-redeploy>` |
| MockUSDC | `<fill-after-redeploy>` |

**Rollup:** `kitpot-2` · **EVM Chain ID:** `64146729809684`

---

## Run Locally

**Prerequisites:** Bun 1.x, Foundry, Weave CLI

```bash
# 1. Clone and install
git clone https://github.com/viandwi24/kitpot && cd kitpot
bun install

# 2. Install contract deps
cd contracts && forge install && cd ..

# 3. Start local Initia rollup (NOT anvil — needs Cosmos RPC for InterwovenKit)
weave rollup start -d

# 4. Deploy contracts
export PRIVATE_KEY=<your-key>
cd contracts && forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast && cd ..

# 5. Create .env.local from example, fill contract addresses
cp apps/web/.env.example apps/web/.env.local

# 6. Start frontend
bun dev
# Open http://localhost:3000
```

---

## Run Tests

```bash
cd contracts && forge test -vv
```

---

## Project Structure

```
kitpot/
├── contracts/
│   ├── src/
│   │   ├── KitpotCircle.sol        # Core ROSCA protocol
│   │   ├── KitpotReputation.sol    # On-chain reputation + XP
│   │   ├── KitpotAchievements.sol  # Soulbound NFT badges
│   │   └── MockUSDC.sol            # Testnet stablecoin
│   └── test/                       # Foundry tests
├── apps/web/                        # Next.js 16 frontend
│   └── src/
│       ├── app/                    # Pages: landing, circles, dashboard, discover, faucet, leaderboard
│       ├── components/             # UI: circle, gamification, layout
│       └── hooks/
│           └── use-kitpot-tx.ts   # All contract calls via InterwovenKit MsgCall
└── .initia/
    └── submission.json
```

---

## Market

- **300M+** global ROSCA participants (World Bank)
- **$50B+/year** informal savings circles in Indonesia alone
- Known as: Arisan (Indonesia), Chit Fund (India), Hui (China), Tontine (West Africa), Paluwagan (Philippines)

## Revenue Model

- **1% platform fee** per pot distribution (configurable, capped at 5%)
- Fully on-chain, transparent

---

## License

MIT
