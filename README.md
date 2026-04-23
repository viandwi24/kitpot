# Kitpot — Trustless Savings Circles on Initia

> 500 years of rotating savings circles. Now trustless.

**Live Demo:** [kitpot.vercel.app](https://kitpot.vercel.app) · **Demo Video:** [YouTube](https://youtu.be/TODO) · **Track:** Gaming & Consumer

---

## What is Kitpot?

**300 million+ people** worldwide participate in rotating savings circles (known as ROSCA, Arisan, Chit Fund, Hui, Tontine, Paluwagan). Every single one of them still relies on a trusted treasurer who could disappear with everyone's money, WhatsApp reminders for monthly payments, and manual bank transfers across timezones.

**Kitpot** is the first trustless rotating savings circle on-chain. Smart contracts replace the treasurer — contributions are collected automatically via auto-signing, and the pot is distributed by code, not by trust.

### Why Initia?

Kitpot uses **5 native Initia features** that make this impossible to replicate on any other chain with the same UX:

| Feature | What It Enables |
|---------|----------------|
| **Auto-Signing Sessions** | Approve once, contributions run automatically for the entire circle duration. Like Netflix — no monthly wallet pop-ups. |
| **.init Usernames** | Invite friends by name (`alice.init`), not hex addresses. Social coordination, not crypto jargon. |
| **Social Login (Privy)** | Google / Apple / email sign-in. No MetaMask, no seed phrases, no crypto knowledge needed. |
| **Dedicated Rollup** | `kitpot-2` (EVM chain ID: `64146729809684`) — all circle history on one chain, fully transparent, immutable. |
| **InterwovenKit** | Required SDK for wallet integration and tx signing. |

---

## How It Works

```
1. CREATE    → Start a circle, set contribution amount, invite members
2. JOIN      → Members join + deposit collateral (returned after circle completes)
3. AUTO-SIGN → Each member approves auto-pay once — no more clicking, ever
4. COLLECT   → Every cycle, contributions collected automatically via auto-signing
5. DISTRIBUTE→ Pot goes to next member in round-robin order, minus 1% platform fee
6. COMPLETE  → After all cycles, collateral returned, reputation updated, achievements earned
```

---

## Features

### Core Protocol
- **Circle creation** with configurable contribution, members (3–20), and cycle duration
- **Round-robin distribution** — deterministic, fair, every member gets the pot exactly once
- **Auto-signing sessions** — approve once, contributions run automatically
- **Batch deposits** — single transaction collects from all auto-signed members
- **1% platform fee** per pot (configurable, capped at 5%)

### Trust & Safety
- **Collateral system** — 1x contribution deposited on join, returned after completion
- **Late payment penalties** — grace period, then collateral slashed (5% default)
- **Tier-gated circles** — creators can require minimum reputation tier to join

### Reputation System (`KitpotReputation.sol`)
- Tracks: circles completed, on-time rate, streak days, total contributed/received, XP
- **Trust tiers:** Unranked → Bronze → Silver → Gold → Diamond
- **Levels 0–5** with XP thresholds, visible in profile and leaderboard

### Achievement NFTs (`KitpotAchievements.sol`)
- **Soulbound (non-transferable)** ERC721 badges
- **12 achievement types:** First Circle, First Pot, Perfect Circle, Streak milestones, Veteran, Diamond, Early Adopter
- **On-chain SVG metadata** — no IPFS, fully self-contained

---

## Deployed Contracts (kitpot-2 rollup)

| Contract | Address |
|----------|---------|
| KitpotCircle | `0xecb3a0F9381FDA494C3891337103260503411621` |
| KitpotReputation | `0xf10267F194f8E09F9f2aa8Fc435e7A2Dac58172a` |
| KitpotAchievements | `0xC421652EC7efBad98dDF42646055e531a28f61Ea` |
| MockUSDC | `0xe5e7064B389a5d4ACE1d93b3C5E36bF27b4274Fa` |

**Rollup:** `kitpot-2` · **EVM Chain ID:** `64146729809684` · **Bridge ID:** `1883` · **DA:** Initia L1  
**L1 Proof:** [rest.testnet.initia.xyz/opinit/ophost/v1/bridges/1883](https://rest.testnet.initia.xyz/opinit/ophost/v1/bridges/1883)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Contracts** | Solidity 0.8.26 · Foundry · OpenZeppelin v5 |
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **UI** | shadcn/ui · Dark/Light mode |
| **Wallet** | InterwovenKit · Privy (social login) · wagmi · viem |
| **Chain** | kitpot-2 (EVM rollup via Weave CLI on Initia testnet) |
| **Deploy** | Vercel |

---

## Run Locally

**Prerequisites:** Bun 1.x, Foundry

```bash
# 1. Clone and install
git clone <repo> && cd kitpot
bun install

# 2. Install contract deps
cd contracts && forge install && cd ..

# 3. Start local chain
anvil

# 4. Set your deployer private key (Anvil account #0 by default)
export PRIVATE_KEY=<your-anvil-private-key>

# 5. Deploy contracts + auto-update .env.local
bun run deploy:local

# 6. Start frontend
bun dev
# Open http://localhost:3000 — select "Local" in the network switcher
```

> **Never put private keys in `.env.local`, scripts, READMEs, or anywhere in the repo.**
> For local Anvil testing, copy keys from `anvil` startup output — it prints 10 test accounts on launch.
> For testnet, use a dedicated throwaway wallet with no real funds.

**For test scripts** (`scripts/test/*`), set account keys as env vars:
```bash
export ACCOUNT_0=<key>   # Creator / deployer (Anvil account #0)
export ACCOUNT_1=<key>   # Alice
export ACCOUNT_2=<key>   # Bob
export ACCOUNT_3=<key>   # Charlie
export ACCOUNT_4=<key>   # Dave
```

---

## Run on Testnet (kitpot-2)

Contracts are already deployed on kitpot-2. You only need to point the frontend at the live RPC.

**Option A — Use the public VPS node (recommended)**

```bash
# apps/web/.env.local
NEXT_PUBLIC_TESTNET_RPC_URL=https://rpc.your-domain.xyz   # your VPS domain → port 8545
NEXT_PUBLIC_TESTNET_CHAIN_ID=64146729809684
NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS=0xecb3a0F9381FDA494C3891337103260503411621
NEXT_PUBLIC_TESTNET_USDC_ADDRESS=0xe5e7064B389a5d4ACE1d93b3C5E36bF27b4274Fa
NEXT_PUBLIC_TESTNET_REPUTATION_ADDRESS=0xf10267F194f8E09F9f2aa8Fc435e7A2Dac58172a
NEXT_PUBLIC_TESTNET_ACHIEVEMENTS_ADDRESS=0xC421652EC7efBad98dDF42646055e531a28f61Ea
NEXT_PUBLIC_DEFAULT_NETWORK=testnet

bun dev
# Switch to "Testnet" in the network switcher — or it defaults to testnet automatically
```

**Option B — Run your own kitpot-2 node via Docker**

```bash
# 1. Copy chain data to VPS
rsync -avz ~/.minitia user@your-vps:~/.minitia

# 2. On VPS — create .env from example
cp infra/dokploy/.env.example infra/dokploy/.env
# Edit .env: fill in mnemonics, set RUN_OPINIT=false for basic demo

# 3. Build and run
docker compose -f infra/dokploy/docker-compose.yml up --build

# 4. Verify node is live
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Redeploy contracts** (only if you need fresh addresses):

```bash
# Set testnet deployer key — use a dedicated throwaway wallet, never your main wallet
export PRIVATE_KEY=<testnet-deployer-key>

cd contracts
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.your-domain.xyz \
  --broadcast
```

---

## Run Tests

```bash
cd contracts && forge test -vv
# 85 tests, 0 failures
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
│   ├── test/                       # 85 Foundry tests
│   └── script/                     # Deploy.s.sol + SetupDemo.s.sol
├── apps/web/                        # Next.js 16 frontend
│   └── src/
│       ├── app/                    # Pages: landing, circles, dashboard, discover, faucet, leaderboard
│       ├── components/             # UI: circle, gamification, bridge, layout
│       └── hooks/                  # wagmi contract hooks
└── docs/                           # Product spec, plans
```

---

## Market

- **300M+** global ROSCA participants (World Bank)
- **$50B+/year** informal savings circles in Indonesia alone
- Known as: Arisan (Indonesia), Chit Fund (India), Hui (China), Tontine (West Africa), Paluwagan (Philippines)
- First target: diaspora communities (cross-border pain: timezone gaps, FX fees, trust gaps)

## Revenue Model

- **1% platform fee** per pot distribution
- Example: 5 members × 100 USDC/cycle = 500 USDC pot → 5 USDC fee
- Configurable per circle (capped at 5%), fully on-chain

## Why Initia Makes This Possible

ROSCA on other chains requires manual wallet approvals every cycle, exposes hex addresses as user identity, and needs separate onboarding for non-crypto users. Initia's auto-signing, .init usernames, social login, and InterwovenKit solve all three in one stack — making the UX feel like a consumer product, not a DeFi protocol.

---

## License

MIT
