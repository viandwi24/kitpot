# Kitpot — DoraHacks Submission Description

> Target: 10,000+ characters. Paste this into DoraHacks submission.

---

## The Problem

300 million people worldwide participate in rotating savings circles — known as ROSCA (Rotating Savings and Credit Association), Arisan (Indonesia), Chit Fund (India/Pakistan), Hui (China/Taiwan), Tontine (West Africa/Caribbean), and Paluwagan (Philippines). In Indonesia alone, roughly 60% of households have participated in at least one, with an estimated $50 billion+ flowing through these informal circles annually.

The concept is beautifully simple: a group of people agrees to contribute a fixed amount each month. Every month, one person receives the entire pot. After everyone has received once, the circle completes. It's peer-to-peer savings, community-driven, and has existed for over 500 years across dozens of cultures.

But the problems have never been solved:

**1. The treasurer can disappear.** Every circle has a single person who holds the money. There's no contract, no insurance, no recourse. Billions of dollars flow through trust alone — and trust fails.

**2. Coordination is exhausting.** Monthly WhatsApp reminders, manual bank transfers, Excel spreadsheets for tracking, and one-by-one payment confirmations. For a 12-month circle with 10 members, that's 120 individual payment events to track manually.

**3. No enforcement.** If someone doesn't pay, the only consequence is social pressure. There's no automated penalty, no collateral, no mechanism to ensure the circle completes.

**4. It doesn't scale.** A circle of 50 people is coordination chaos. A circle across countries — different banks, currencies, timezones — is practically impossible.

**5. Zero credit history.** Someone who has been a perfect participant for years in savings circles has nothing to show for it. No portable reputation, no credit score, no proof of trustworthiness.

Previous attempts to solve this have all fallen short. WhatsApp groups add no enforcement. Google Sheets add no automation. Web2 ROSCA apps are centralized, require KYC, aren't available in all countries, and can shut down at any time. And on-chain ROSCA implementations on other chains require manual wallet approval every single month — making the UX *worse* than WhatsApp.

---

## The Solution: Kitpot

Kitpot is the first trustless rotating savings circle that is truly automated, built natively on Initia's unique features.

**How it works:**

1. **Create a circle.** Set the contribution amount (e.g., 100 USDC), number of members (3-20), and cycle duration. The circle is deployed as an on-chain smart contract.

2. **Invite members by .init username.** No hex addresses. Type `alice.init`, `bob.init` — as natural as mentioning someone on Instagram. Each member deposits collateral equal to one contribution as a safety guarantee.

3. **Set up auto-pay (one time).** Each member approves an auto-signing session. This is the last time they click anything. For the next 12 months (or however long the circle runs), contributions are collected automatically — like subscribing to Netflix.

4. **Automated collection and distribution.** Every cycle, a single transaction collects contributions from all members with active auto-pay sessions. The pot (minus a 1% platform fee) is sent directly to the next member in the round-robin order. No human intervention. No treasurer.

5. **Collateral protects the circle.** If a member pays late, a penalty is deducted from their collateral. If they miss entirely, collateral covers their contribution. When the circle completes successfully, collateral is returned in full.

6. **Reputation builds on-chain.** Every on-time payment increases your reputation score. Complete circles to level up through trust tiers: Bronze → Silver → Gold → Diamond. Higher tiers unlock access to higher-value, more exclusive circles. Your reputation is tied to your address and portable across all circles.

7. **Earn soulbound achievement NFTs.** Milestones like "First Circle Completed," "Perfect Payment Streak," and "Diamond Tier" are minted as non-transferable ERC721 tokens with fully on-chain SVG metadata. Visible proof of trustworthiness — no IPFS dependency.

---

## Why Initia? Six Native Features That Make This Possible

Kitpot isn't just deployed on Initia — it leverages native features that aren't available on any other chain, making the UX impossible to replicate elsewhere.

| Initia Feature | What It Enables for Kitpot | Without It |
|---|---|---|
| **Auto-Signing Sessions** | Approve once, contributions collected automatically for months. Zero monthly pop-ups. | Users must manually approve every single payment — worse than WhatsApp. |
| **.init Usernames** | Invite members by human-readable name (`budi.init`). Social, natural, familiar. | Hex wallet addresses. No one shares `0x1a2b3c...` in a group chat. |
| **Interwoven Bridge** | Deposit from Initia hub to kitpot-1 rollup seamlessly. Users never see two chains. | No standard mechanism to move assets to a custom rollup. |
| **Social Login (Privy)** | Google, Apple, or email sign-in. No wallet setup, no seed phrases, no crypto knowledge. | Must install MetaMask or similar. Blocks 99% of target users. |
| **Dedicated Rollup** | kitpot-1: all circle history in one place. Transparent, immutable, dedicated. | Mixed with unrelated transactions on a shared chain. |
| **Revenue Capture** | 1% fee stays with the app developer, doesn't leak to L1 validators. | Fee revenue lost to the base chain. Not sustainable. |

**The most critical feature is auto-signing.** If Netflix asked you to manually approve payment every month, no one would subscribe. Auto-signing makes "subscribing to a savings circle" as easy as subscribing to a streaming service. This single feature transforms on-chain ROSCA from a toy into a usable product.

---

## Technical Architecture

**Smart Contracts (Solidity 0.8.26 + Foundry + OpenZeppelin v5):**

- `KitpotCircle.sol` — Core ROSCA protocol: circle creation, membership, deposits, round-robin distribution, auto-signing sessions, collateral management, late payment penalties, tier-gated access.
- `KitpotReputation.sol` — On-chain reputation registry: tracks payment behavior (on-time, late, missed), calculates trust tiers, maintains streaks, provides tier-gate verification.
- `KitpotAchievements.sol` — Soulbound (non-transferable) ERC721 NFTs: 12 achievement types with on-chain SVG metadata. Awarded automatically on milestones.
- `MockUSDC.sol` — Testnet ERC20 token (6 decimals, public mint).

**Frontend (Next.js 16 + React 19 + TypeScript + Tailwind CSS 4):**

Full-featured web app with: social login, circle creation with tier gating, join via invite link, circle dashboard with real-time countdown, payment status tracking, auto-pay setup, batch deposit trigger, collateral management, reputation display, achievement gallery, public circle discovery, dark/light mode.

**Test Suite:** 30 comprehensive Foundry tests covering circle lifecycle, deposits, penalties, sessions, batch operations, reputation tracking, collateral, and admin functions.

---

## Competitive Advantage

### vs. CrediKye (Grand Prize winner, BUIDL CTC 2026)

CrediKye proved this pattern can win a Grand Prize from 76 submissions. Kitpot takes the same core concept and adds everything CrediKye couldn't:

| Aspect | CrediKye | Kitpot |
|--------|----------|--------|
| Payment approval | Manual every month | **Auto-signing: approve once** |
| User onboarding | Telegram required | **Social login (Google/Apple)** |
| Member identification | Wallet address | **.init username** |
| Cross-chain deposit | None | **Interwoven Bridge** |
| Late payment handling | None | **Collateral + penalty system** |
| Revenue model | Not mentioned | **1% fee, on-chain, sustainable** |

### vs. Other INITIATE Submissions

Out of 33 submissions in the INITIATE hackathon:
- Kitpot is the **only ROSCA/savings circle project**
- Kitpot uses **the most Initia native features** (6) of any submission
- **5 of 10** submissions in the Gaming & Consumer track have no working demo — our live demo is an immediate advantage

---

## Market Understanding

- **Total addressable market:** 300M+ ROSCA participants globally, $1-6 trillion annual volume (informal, unrecorded)
- **Indonesia focus:** ~60% of households, $50B+/year
- **Initial target:** Diaspora communities (Singapore, Malaysia, Netherlands, Australia) — cross-border coordination pain point is most acute
- **Why now:** Auto-signing technology finally makes on-chain ROSCA viable. Without it, the UX is worse than the manual alternative.

---

## Business Model

- 1% platform fee per pot distribution
- 5 members × 100 USDC = 500 USDC pot → 5 USDC fee/cycle → 25 USDC total for a 5-cycle circle
- Fee configurable (max 5%), transparent, on-chain
- Revenue stays with the app (Initia rollup advantage)

---

## Demo

Our 3-minute demo video shows the complete flow:

1. Login via Google (no wallet setup)
2. Create a circle (3 members, 100 USDC, 60s demo cycle)
3. Invite via .init username
4. One-time auto-pay setup
5. Automated contribution collection (batch deposit)
6. Pot distribution to first recipient
7. Circle completion with reputation update
8. Achievement NFT earned

Every step runs on a live kitpot-1 rollup with real smart contract interactions.

---

*Built by a solo developer for the INITIATE Hackathon 2026. Open source. MIT license.*
