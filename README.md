# Kitpot — Trustless Savings Circles on Initia

> 500 years of rotating savings circles. Now trustless.

**Live Demo:** [kitpot.vercel.app](https://kitpot.vercel.app) · **Demo Video:** [YouTube](https://youtu.be/TODO) · **Track:** Gaming & Consumer

---

## What is Kitpot?

**300 million+ people** worldwide participate in rotating savings circles (known as ROSCA, Arisan, Chit Fund, Hui, Tontine, Paluwagan). Every single one of them still relies on a trusted treasurer who could disappear with everyone's money, WhatsApp reminders for monthly payments, and manual bank transfers across timezones.

**Kitpot** is the first trustless rotating savings circle on-chain. Smart contracts replace the treasurer — contributions are collected automatically via auto-signing, and the pot is distributed by code, not by trust.

### Why Initia?

Kitpot uses **6 native Initia features** that make this impossible to replicate on any other chain with the same UX:

| Feature | What It Enables |
|---------|----------------|
| **Auto-Signing Sessions** | Approve once, contributions run automatically for the entire circle duration. Like Netflix — no monthly wallet pop-ups. |
| **.init Usernames** | Invite friends by name (`alice.init`), not hex addresses. Social coordination, not crypto jargon. |
| **Interwoven Bridge** | Seamless deposit from Initia hub to the kitpot-1 rollup. Users never know two chains are involved. |
| **Social Login (Privy)** | Google / Apple / email sign-in. No MetaMask, no seed phrases, no crypto knowledge needed. |
| **Dedicated Rollup** | `kitpot-1` — all circle history on one chain, fully transparent, immutable. |
| **InterwovenKit** | Required SDK for wallet integration, tx signing, and bridge access. |

---

## How It Works

```
1. CREATE    → Start a circle, set contribution amount, invite members by .init username
2. JOIN      → Members join + deposit collateral (returned after circle completes)
3. AUTO-SIGN → Each member approves auto-pay once — no more clicking, ever
4. COLLECT   → Every cycle, contributions collected automatically via auto-signing
5. DISTRIBUTE→ Pot goes to next member in round-robin order, minus 1% platform fee
6. COMPLETE  → After all cycles, collateral returned, reputation updated, achievements earned
```

---

## Features

### Core Protocol
- **Circle creation** with configurable contribution, members (3-20), and cycle duration
- **Round-robin distribution** — deterministic, fair, every member gets the pot exactly once
- **Auto-signing sessions** — operator deposits on behalf of members with valid sessions
- **Batch deposits** — single transaction collects from all auto-signed members
- **1% platform fee** per pot (capped at 5%, configurable by owner)

### Trust & Safety
- **Collateral system** — members deposit 1x contribution as collateral on join, returned after completion
- **Late payment penalties** — grace period, then collateral is slashed (5% default)
- **Missed payment handling** — collateral automatically covers missed contributions
- **Tier-gated circles** — creators can require minimum trust tier to join

### Reputation System
- **On-chain reputation registry** (`KitpotReputation.sol`)
- Tracks: circles completed, on-time rate, streak, total contributed/received
- **Trust tiers:** Unranked → Bronze → Silver → Gold → Diamond
- Tier calculated from completion count + on-time payment rate
- Higher tier = access to higher-value, more exclusive circles

### Achievement NFTs
- **Soulbound (non-transferable)** ERC721 badges (`KitpotAchievements.sol`)
- **12 achievement types:** First Circle, First Pot, Perfect Circle, Streak milestones, Veteran, Diamond, Early Adopter, and more
- **On-chain SVG metadata** — no IPFS dependency, fully self-contained
- Visual proof of trustworthiness tied to your wallet

### Discovery
- **Public circles** — browse and join open circles from the Discover page
- Filter by contribution amount, minimum tier, available slots

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Contracts** | Solidity 0.8.26 · Foundry · OpenZeppelin v5 |
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **UI** | shadcn/ui · Dark/Light mode |
| **Wallet** | InterwovenKit · Privy (social login) · wagmi · viem |
| **Chain** | kitpot-1 (EVM rollup via Weave CLI) |
| **Deploy** | Vercel |

---

## Contracts

| Contract | Purpose | Key Features |
|----------|---------|-------------|
| `KitpotCircle.sol` | Core ROSCA protocol | Circles, payments, auto-signing, collateral, penalties |
| `KitpotReputation.sol` | On-chain reputation | Payment tracking, tier calculation, streak system |
| `KitpotAchievements.sol` | Soulbound NFT badges | 12 types, on-chain SVG, non-transferable |
| `MockUSDC.sol` | Testnet ERC20 | 6 decimals, public mint |

---

## Project Structure

```
kitpot/
├── contracts/               # Solidity (Foundry)
│   ├── src/
│   │   ├── KitpotCircle.sol
│   │   ├── KitpotReputation.sol
│   │   ├── KitpotAchievements.sol
│   │   └── MockUSDC.sol
│   ├── test/                # 30 comprehensive tests
│   └── script/              # Deploy + demo setup
├── apps/web/                # Next.js 16 frontend
│   └── src/
│       ├── app/             # Pages (landing, circles, dashboard, discover, join)
│       ├── components/      # UI components (circle, reputation, achievements, bridge)
│       └── hooks/           # wagmi contract hooks
└── docs/                    # Product spec, plans, scenarios
```

---

## Run Locally

```bash
# Prerequisites: Bun 1.x, Foundry, Go 1.23+, Docker

# 1. Clone
git clone <repo> && cd kitpot

# 2. Install frontend deps
bun install

# 3. Install contract deps
cd contracts && forge install && cd ..

# 4. Start rollup
weave rollup start -d
weave opinit start executor -d
weave relayer start -d

# 5. Deploy contracts
cd contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# 6. Start frontend
cp .env.example .env.local  # fill in contract addresses
bun dev
```

---

## Run Tests

```bash
cd contracts
forge test -vv
```

---

## Market

- **300M+** global ROSCA participants (World Bank)
- **$50B+/year** informal savings circles in Indonesia alone
- Known as: Arisan (Indonesia), Chit Fund (India), Hui (China), Tontine (West Africa), Paluwagan (Philippines)
- First target: diaspora communities (cross-border coordination pain point)

---

## Revenue Model

- **1% platform fee** per pot distribution
- Example: 5 members × 100 USDC = 500 USDC pot → 5 USDC fee per cycle
- Fee configurable by owner (capped at 5%)
- Sustainable, transparent, on-chain

---

## Reference

Kitpot's ROSCA pattern is validated by **CrediKye**, which won Grand Prize ($15k, 76 submissions) at BUIDL CTC 2026 with the same concept on Creditcoin. Kitpot adds 5 Initia-specific advantages: auto-signing, .init usernames, Interwoven Bridge, social login, and a dedicated rollup.

---

## License

MIT
