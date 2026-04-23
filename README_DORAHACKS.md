# Kitpot — Trustless Savings Circles on Initia

> 500 years of rotating savings circles. Now trustless, automatic, and open to everyone.

**Live App:** https://kitpot.vercel.app · **Track:** Gaming & Consumer

---

## The Problem

Meet Siti. She runs a 10-person arisan in her diaspora WhatsApp group. Every month she:
- Sends 47 individual payment reminders
- Manually verifies 10 bank transfers across 3 countries and 2 currencies
- Updates a Google Sheet that 3 people have already edited incorrectly
- Prays the elected treasurer doesn't disappear with $5,000

She's not alone. **300 million+ people** worldwide run rotating savings circles — called Arisan in Indonesia, Chit Fund in India, Hui in China, Tontine in West Africa, Paluwagan in the Philippines. Combined, these informal circles move **$50 billion+ per year in Indonesia alone**.

Every single one of them has the same problem: **they require trusting a human treasurer.**

The treasurer collects. The treasurer distributes. The treasurer can run.

---

## The Solution

**Kitpot** is the first trustless rotating savings circle on-chain.

The smart contract is the treasurer. It can't run.

**Auto-signing** means contributions happen automatically — members approve once, pay forever. No WhatsApp reminders, no manual transfers, no "I forgot." Just set it and watch it run.

**One flow:**

```
Create → Join → Approve once → Contributions run automatically → Pot distributed by code
```

---

## Why This Only Works on Initia

Kitpot is not a generic DeFi app dressed up as a consumer product. The core features depend on Initia-native primitives that don't exist elsewhere with the same UX.

### 1. Auto-Signing Sessions ⭐

The killer feature. Without this, Kitpot is just another DeFi protocol where users need to click "confirm" every month.

With Initia's auto-signing:
- Members approve a session key with spending limits (max amount per cycle + expiry date)
- An automated operator calls `depositContribution()` on their behalf
- Members never see a wallet popup again until the circle ends

This is what makes Kitpot feel like a subscription service, not a blockchain app.

**Impossible to replicate on Ethereum** — no native session keys, no built-in spending limits, no trustless operator model.

### 2. .init Usernames ⭐

Real people don't invite friends with hex addresses.

`alice.init` is who you invite to your savings circle. Not `0x3338...ACb6`.

Kitpot resolves `.init` names from the Initia REST API in real time — in the member list, in the leaderboard, in the connect button. It makes the app feel like a social product, not a blockchain product.

### 3. Social Login via Privy + InterwovenKit

Google, Apple, email, X — connect without a wallet extension.

This is the onboarding gate. For diaspora communities unfamiliar with crypto: if they have to install MetaMask before they can join their friend's savings circle, they won't. With social login, the barrier disappears.

### 4. Dedicated Rollup (kitpot-2)

All circle state lives on `kitpot-2` — an EVM rollup on Initia testnet (chain ID: `64146729809684`, Bridge ID: `1883`). 

Full transparency: every circle, every payment, every pot distribution is on-chain and verifiable. No multi-sig, no admin keys on the payment path.

---

## How Kitpot Works

### Creating a Circle

1. Connect wallet (or sign in with Google)
2. Set: contribution amount, number of members (3–20), cycle duration, minimum reputation tier
3. Share the circle link or invite by `.init` username
4. Deploy — circle is live on kitpot-2

### Joining a Circle

1. Open the circle link
2. Deposit collateral (1x contribution — returned when circle completes)
3. Set up auto-signing: approve max spend per cycle + session expiry
4. Done — you're in

### Running Automatically

Once all members have joined and set up auto-signing:
- Every cycle, an automated operator collects contributions from all members in a single batch transaction
- The collected pot is sent to the next member in the round-robin queue
- Reputation and XP are updated on-chain after each successful payment

No reminders. No chasing. No trust required.

### Completing a Circle

When all cycles are done:
- Collateral is returned to each member
- Final reputation update: tier upgrade if eligible
- Achievements minted as soulbound NFTs

---

## The Reputation Layer

Trust is the hardest problem in ROSCA. In Web2, it's solved by social proof — you only join groups with people you know. Kitpot makes trust on-chain and portable.

**KitpotReputation.sol** tracks every address:
- Circles completed
- On-time payment rate
- Longest streak
- Total contributed and received
- XP score and level

**Trust Tiers:** Unranked → Bronze → Silver → Gold → Diamond

Creators can gate their circles by minimum tier. Diamond-tier members have proven track records across multiple circles. Higher tiers get access to higher-value circles.

**Achievements (KitpotAchievements.sol):** Soulbound ERC721 badges for milestones — First Circle, First Pot, Perfect Circle (100% on-time), Streak Champion, Veteran (10+ circles), Diamond tier, Early Adopter. On-chain SVG metadata, no IPFS dependency.

---

## Product Screens

**Landing** — problem statement, how it works, why Initia

**Dashboard** — connected wallet's stats: trust tier, XP bar, streak flame, active circles, achievements earned, daily quest

**My Circles** — active and completed circles with payment status for each cycle

**Circle Detail** — member list with `.init` names, payment history, countdown to next cycle, deposit button, auto-signing setup

**Discover** — browse public circles, filter by contribution amount and tier requirement

**Faucet** — USDC balance, mint test USDC for testnet use

**Leaderboard** — ranked by XP with `.init` usernames, tier badges, streak flames

**Profile (`/u/[address]`)** — public reputation card: tier, XP level, achievements, circle history

---

## Deployed Contracts (kitpot-2 rollup)

| Contract | Address |
|----------|---------|
| KitpotCircle | `0xecb3a0F9381FDA494C3891337103260503411621` |
| KitpotReputation | `0xf10267F194f8E09F9f2aa8Fc435e7A2Dac58172a` |
| KitpotAchievements | `0xC421652EC7efBad98dDF42646055e531a28f61Ea` |
| MockUSDC | `0xe5e7064B389a5d4ACE1d93b3C5E36bF27b4274Fa` |

**Rollup:** `kitpot-2` · **EVM Chain ID:** `64146729809684` · **Bridge ID:** `1883`  
**L1 Proof:** https://rest.testnet.initia.xyz/opinit/ophost/v1/bridges/1883

**Tests:** 85 passed, 0 failed (`forge test -vv`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contracts | Solidity 0.8.26 · Foundry · OpenZeppelin v5 |
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| Wallet | `@initia/interwovenkit-react` · Privy · wagmi · viem |
| Rollup | kitpot-2 via Weave CLI (EVM, Initia testnet) |
| Deploy | Vercel |

---

## Market & Validation

**Total addressable market:**
- 300M+ ROSCA participants worldwide (World Bank)
- $50B+/year in Indonesia alone
- Growing diaspora communities in Singapore, Malaysia, Netherlands, Saudi Arabia

**Why diaspora?**
Cross-border ROSCA is the hardest version of the problem. Different banks, different timezones, FX fees, legal complexity. Blockchain solves all of them. Diaspora communities also tend to be more tech-forward and trust DeFi more than traditional finance.

**Why now:**  
Initia's rollup infrastructure, auto-signing primitives, and social login stack finally make it possible to build a ROSCA that feels like a consumer app, not a DeFi protocol. The timing is right — the tooling exists, the market is massive, and nobody has built this yet.

**Revenue model:**  
1% platform fee per pot distribution. Example: 10 members × $200/cycle = $2,000 pot → $20 fee per cycle. With 1,000 active circles, that's $20,000+ per cycle in protocol revenue.

---

## The "Improved by Initia" Test

Would Kitpot work the same on Ethereum or Solana?

| Feature | Ethereum/Solana | Kitpot on Initia |
|---------|----------------|-----------------|
| Monthly payments | Manual wallet popup every cycle | Auto-signing: approve once, pay forever |
| User identity | `0x...` hex address | `name.init` username |
| Onboarding | MetaMask required | Google login |
| Token onboarding | Complex bridge flow | Testnet faucet — mint USDC in one click |
| Circle state | Multi-sig or custodial | Trustless on dedicated rollup |

Every improvement is Initia-native. None of them are cosmetic.

---

## Run Locally

```bash
git clone <repo> && cd kitpot
bun install
anvil &                  # start local chain
export PRIVATE_KEY=<anvil-test-key>   # copy from anvil startup output
bun run deploy:local     # deploys contracts + updates .env.local
bun dev                  # open http://localhost:3000, select "Local" network
```

For Initia testnet: switch to "Testnet" in the network switcher. Contracts are already deployed on kitpot-2 — no redeploy needed.

---

*Built for INITIATE: The Initia Hackathon (Season 1) · Track: Gaming & Consumer*
