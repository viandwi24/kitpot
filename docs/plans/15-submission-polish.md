# Plan 16 — Submission Polish & Documentation

> Goal: Everything a judge needs to give us high marks: README, architecture docs, live demo, description, submission.json. This is the FINAL plan before submit.

---

## Why This Matters

- "Working Demo & Completeness" (20% scoring) — judges need to SEE it work
- Description quality matters: top submissions have 10k-17k chars, median is 2.3k
- README is the first thing judges look at
- Architecture docs show you're not just hacking but thinking

---

## Deliverables

### 1. README.md

```markdown
# Kitpot — Trustless Savings Circles on Initia

> 500 years of rotating savings circles. Now trustless.

[Live Demo](https://kitpot.vercel.app) | [Demo Video](https://youtu.be/...) | [Contract on Explorer](...)

## What is Kitpot?

300M+ people worldwide participate in rotating savings circles (ROSCA).
Every one of them still relies on a single trusted person who could disappear with the money.

Kitpot is the first trustless rotating savings circle on-chain, powered by Initia's native features:
- **Auto-signing** — approve once, contributions run automatically for 12 months
- **.init usernames** — invite friends by name, not wallet address
- **Interwoven Bridge** — deposit seamlessly from Initia hub
- **Social login** — Google/Apple sign-in, no crypto knowledge needed

## How It Works

1. Create a circle → set contribution, members, duration
2. Members join via .init username → each approves auto-pay once
3. Every cycle: contributions collected automatically, pot distributed to next member
4. Reputation builds on-chain → unlock access to higher-value circles
5. Earn soulbound achievement NFTs for milestones

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contracts | Solidity 0.8.26, Foundry, OpenZeppelin v5 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, wagmi |
| Wallet | InterwovenKit + Privy (social login) |
| Chain | kitpot-1 (EVM rollup via Weave CLI) |
| Deploy | Vercel |

## Architecture

[Include diagram showing: User → Frontend → Contract → Reputation → Achievements]

## Run Locally

...

## Test

...

## Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| KitpotCircle | 0x... | Core ROSCA protocol |
| KitpotReputation | 0x... | On-chain reputation registry |
| KitpotAchievements | 0x... | Soulbound NFT badges |
| MockUSDC | 0x... | Testnet token |

## License

MIT
```

### 2. `.initia/submission.json`

```json
{
  "chain_id": "kitpot-1",
  "contracts": {
    "KitpotCircle": "0x...",
    "KitpotReputation": "0x...",
    "KitpotAchievements": "0x...",
    "MockUSDC": "0x..."
  },
  "demo_url": "https://kitpot.vercel.app",
  "video_url": "https://youtu.be/..."
}
```

### 3. DoraHacks Description (Target: 10k+ chars)

Structure:
1. **Hook** (300 chars) — The problem in one paragraph
2. **Problem** (1500 chars) — Detailed pain points with numbers
3. **Solution** (2000 chars) — How Kitpot solves each pain point
4. **Initia Integration** (2000 chars) — Table mapping each feature to Initia
5. **Technical Architecture** (1500 chars) — Contract design, trust model
6. **Reputation & Trust** (1000 chars) — How the trust system works
7. **Demo Flow** (1000 chars) — What the video shows
8. **Market** (800 chars) — 300M users, $50B volume, diaspora angle
9. **Revenue** (500 chars) — 1% fee model
10. **Team & Vision** (400 chars) — Solo builder, open source, roadmap

### 4. Demo Video Script (Updated for Plan 11-14 features)

Add to existing scenario-1:
- Show reputation badge on member profile
- Show tier-gated circle (can't join without Silver)
- Show achievement earned after first pot
- Show collateral deposit on join
- Show late penalty applied (optional, if time)

### 5. Architecture Diagram

Create simple SVG or ASCII diagram showing:
```
User (Social Login)
    ↓
Frontend (Next.js + InterwovenKit)
    ↓
┌─────────────────────────────────┐
│ kitpot-1 Rollup (EVM)          │
│                                 │
│ KitpotCircle ←→ Reputation     │
│      ↓                ↓        │
│ Achievements      Tier Gate    │
│                                 │
│ MockUSDC (Testnet)             │
└─────────────────────────────────┘
    ↕ Interwoven Bridge
Initia Hub (L1)
```

---

## Checklist Before Submit

- [ ] README.md with live links
- [ ] `.initia/submission.json` with correct addresses
- [ ] Demo video uploaded to YouTube (unlisted)
- [ ] DoraHacks description pasted (10k+ chars)
- [ ] All contracts verified on explorer (if possible)
- [ ] Frontend deployed on Vercel (production)
- [ ] All pages functional (no broken links)
- [ ] Dark/light mode both look good
- [ ] Mobile responsive
- [ ] No console errors in production build

---

## Output Files

```
README.md                              ← NEW (submission-ready)
.initia/submission.json                ← UPDATED with all contract addresses
docs/submission-description.md         ← NEW: DoraHacks description draft
docs/architecture-diagram.svg          ← NEW: visual architecture
```

---

## Dependencies

- **Blocked by:** Plan 10 (needs deployed contracts), Plan 11-15 (needs all features)
- **Blocks:** nothing (this is the final submission step)
