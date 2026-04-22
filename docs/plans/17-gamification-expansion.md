# Plan 17 — Gamification Expansion + Initia Native Maxing

> Goal: Match and exceed every gamification feature of CrediKye (Grand Prize winner of BUIDL CTC), while leaning hard on Initia-native features to dominate the hackathon rubric.
>
> Timeline: **2026-04-22 → 2026-04-26** (5 days, ~40 build hours available)
> Deadline: 2026-04-26 23:59 UTC
> Status: **ACTIVE — Sprint 1 in progress**

---

## 1. Context & Why

CrediKye won Grand Prize ($15k, 76 submissions) on Creditcoin with these gamification hooks:
- XP + Level system (Novice → Master)
- Trust Ranks (Bronze → Diamond)
- Achievement Badges (Soulbound NFTs)
- Daily Quests + streak tracking
- Referral system (+50 rep both sides)
- On-chain public profile
- Telegram Mini App

Kitpot already has **Trust Ranks** and **Soulbound Achievements** on-chain but zero UI surface for them, no XP layer, no quests, no referrals, no public profile, no leaderboard. We're not losing on contract architecture — we're losing on *visible polish*.

At the same time, judges score **"Initia-native feature usage"** heavily. CrediKye is on Creditcoin (zero Initia features). Every native feature we wire up is pure score we can't be outcompeted on.

**Rubric areas this plan hits:**
| Scoring dimension | How this plan hits it |
|---|---|
| Product Value & UX (20%) | XP/quest/profile/leaderboard makes app feel like a game, not DeFi |
| Technical Execution (30%) | XP + quests on-chain, `.init` resolver, bridge, oracle integration |
| Initia-Native (25%) | Auto-signing ✅ + `.init` ✅ + Bridge ✅ + Connect Oracle ✅ (4/4 native features) |
| Design / Polish (15%) | Framer Motion level-up animation, streak flames, tier badges |
| Demo (10%) | Gamification creates a better 3-minute narrative arc |

---

## 2. Scope — What's In, What's Out

### IN — Must ship by 2026-04-26

**Contract layer (extend existing):**
- XP points + Level system on-chain (KitpotReputation v2)
- Daily Quest tracking on-chain (claimable quests)
- Referral tracking on-chain (referrer address + rewards)

**Initia-native expansion:**
- `.init` username resolver (REST query to `rest.initia.xyz`)
- Interwoven Bridge UI (deposit flow into rollup)
- Connect Oracle price feed display (USDC → IDR bonus)

**Frontend gamification UI:**
- Public profile page `/u/[address]` (stats, badges, circles, rank, XP)
- Global leaderboard `/leaderboard` (top by XP, by completed circles, by streak)
- Navbar XP bar + level badge (always visible)
- Daily quest panel component (home page + profile)
- Achievement gallery page (`/achievements`)
- Streak visualization (flame icon scales with streak count)
- Level-up celebration (confetti + toast)
- Referral link generator + tracking

**Polish:**
- Hero landing page revamp (gamification-forward messaging)
- Framer Motion transitions for core flows
- Tier badge component (reused everywhere)

### OUT — Deferred to post-hackathon

- Telegram Mini App (CrediKye has it, but it's extra infra we can't ship in 5 days)
- IBC cross-rollup state feature (cross-rollup read-state complexity, not needed — Bridge already covers cross-chain UX)
- Multi-token vaults (stay USDC-only for demo clarity)
- **Demo video + DoraHacks submission** — handled separately outside this build plan
- Grammy bot for notifications (push notifications via Web APIs if time)
- Mobile native app
- Governance / DAO

---

## 3. Gap Analysis Matrix

| Feature | CrediKye | Kitpot (current) | Kitpot (after this plan) |
|---|:---:|:---:|:---:|
| On-chain savings circles | ✅ | ✅ | ✅ |
| Payout rotation (round-robin) | ✅ | ✅ | ✅ |
| Trust Ranks | ✅ 5-tier | ✅ 5-tier | ✅ 5-tier |
| Soulbound badges | ✅ | ✅ 12 types | ✅ 12+ types |
| XP + Level system | ✅ | ❌ | ✅ 6 levels |
| Daily Quests | ✅ | ❌ | ✅ on-chain |
| Referral system | ✅ | ❌ | ✅ on-chain |
| Public profile | ✅ | ❌ | ✅ |
| Global leaderboard | ✅ (implied) | ❌ | ✅ |
| Streak visualization | ✅ | ❌ (on-chain only) | ✅ flame anim |
| **Auto-signing** | ❌ | ✅ | ✅ |
| **`.init` username** | ❌ | ❌ partial | ✅ full resolver |
| **Interwoven Bridge** | ❌ | ❌ placeholder | ✅ full flow |
| **Connect Oracle** | ❌ | ❌ | ✅ USDC→IDR |
| Social login (Privy) | ❌ | ✅ | ✅ |
| Telegram Mini App | ✅ | ❌ | ❌ (deferred) |

**Score:** CrediKye 8/8 gamification + 0/4 Initia-native. Kitpot (after) 8/8 gamification + **4/4 Initia-native**. Net advantage: 4 unique Initia features + social login.

---

## 4. Sprint Breakdown

### Sprint 1 — Contract Gamification Layer (4h, 2026-04-23 morning)
**File: `contracts/src/KitpotReputation.sol` (extend existing)**

**1.1 — Add XP + Level storage**
```solidity
struct MemberReputation {
    // existing fields...
    uint256 xp;                   // NEW: total XP earned
    uint256 questStreakDays;      // NEW: consecutive days claimed quest
    uint256 lastQuestClaimDay;    // NEW: day index (block.timestamp / 1 days)
    address referrer;             // NEW: who invited this member
    bool referralRewarded;        // NEW: have we paid the +50 XP yet
}

enum Level {
    Novice,      // 0 XP         → 99 XP
    Apprentice,  // 100 XP       → 499 XP
    Saver,       // 500 XP       → 1499 XP
    Expert,      // 1500 XP      → 3999 XP
    Master,      // 4000 XP      → 9999 XP
    Legendary    // 10000 XP+
}
```

**1.2 — XP reward matrix (called by KitpotCircle on events)**
| Event | XP |
|---|---|
| On-time payment | +10 |
| Late payment (paid) | +3 |
| Circle joined | +20 |
| Circle completed (perfect) | +200 |
| Circle completed (with misses) | +100 |
| Streak milestone (3/10/25) | +50 / +150 / +500 |
| First pot received | +100 |
| Daily quest claimed | +25 |
| Referral (referee's first deposit) | +50 to both sides |

**1.3 — New external functions**
```solidity
function awardXP(address member, uint256 amount) external onlyAuthorized;
function claimDailyQuest() external returns (uint256 xpAwarded);
function setReferrer(address member, address referrer) external onlyAuthorized;
function getLevel(address member) external view returns (Level);
function xpForNextLevel(address member) external view returns (uint256 needed, uint256 total);
```

**1.4 — Emit events for every XP change** (so frontend can show toasts)
```solidity
event XPAwarded(address indexed member, uint256 amount, string reason, uint256 newTotal);
event LevelUp(address indexed member, Level oldLevel, Level newLevel);
event DailyQuestClaimed(address indexed member, uint256 streakDays, uint256 xpAwarded);
event ReferralRegistered(address indexed member, address indexed referrer);
event ReferralRewarded(address indexed referee, address indexed referrer, uint256 xpEach);
```

**1.5 — Wire XP hooks into KitpotCircle**
- In `_depositFor`: on-time → `reputation.awardXP(member, 10)`; late → `awardXP(member, 3)`
- In `advanceCycle` on pot distribution: `awardXP(recipient, 100)` (first time check)
- In `advanceCycle` on circle complete: loop members → `awardXP(member, 200 or 100)`
- In `joinCircle`: `awardXP(msg.sender, 20)` + if referrer → `setReferrer`

**1.6 — Update ABI TypeScript**
- Update `apps/web/src/lib/abi/KitpotReputation.ts` dengan semua function signature baru:
  - `getLevel(address)` → `uint8`
  - `xpForNextLevel(address)` → `(uint256 needed, uint256 total)`
  - `claimDailyQuest()` → `uint256`
  - `setReferrer(address, address)` → void
  - `rewardReferral(address)` → void
  - Events: `XPAwarded`, `LevelUp`, `DailyQuestClaimed`, `ReferralRegistered`, `ReferralRewarded`
- Update struct components di `getReputation` output: tambah field `xp`, `questStreakDays`, `lastQuestClaimDay`, `referrer`, `referralRewarded`

**Done when:** semua file contract dan ABI TypeScript sudah diedit.

---

### Sprint 2 — Daily Quests + Referral Logic (2h, 2026-04-23 afternoon)

**2.1 — Quest design (minimal MVP)**
Three rotating quests, chosen deterministically by `blockhash(block.number - 1) % 3`:
1. "Pay your cycle on time today" — completes automatically when on-time payment
2. "Check in daily" — user clicks "Claim" button → +25 XP + streak++
3. "Complete an invite" — completes when someone joins via your referral link

Store per-member: `lastQuestClaimDay`, `questStreakDays`. If `currentDay > lastQuestClaimDay + 1` → streak resets. If `currentDay == lastQuestClaimDay + 1` → streak++.

**2.2 — Referral flow**
- URL pattern: `/join/:circleId?ref=:username` or `?ref=:address`
- Frontend: when user lands with `?ref=`, resolve to address, pass to `joinCircle(circleId, ref)`
- Contract: new overload `joinCircle(uint256 circleId, address referrer)` that calls `reputation.setReferrer(msg.sender, referrer)`
- Reward trigger: on referee's first on-time deposit, `reputation.rewardReferral(referee)` → +50 XP each

**Done when:** semua contract dan frontend referral flow sudah diedit.

---

### Sprint 3 — Initia Native Deep Integration (5h, 2026-04-23 → 2026-04-24)

**3.1 — `.init` username resolver (2h)**

Initia mainchain stores usernames as a Move resource. On rollup, query via Initia L1 REST API:
```
GET https://rest.initia.xyz/indexer/pair/v1/usernames?address={address}
GET https://rest.initia.xyz/indexer/pair/v1/addresses?name={name}
```

**Implementation:**
- `apps/web/src/lib/initia/username.ts` — fetch helpers with in-memory cache
- `useInitUsername(address)` hook — returns `{ name, isLoading }`
- `useResolveUsername(name)` hook — reverse lookup, returns `{ address, isLoading }`
- Display component `<InitUsername address={addr} fallback="0x1234..." />` used in:
  - Circle member list
  - Profile page header
  - Leaderboard rows
  - Invite input (type `alice.init` → resolves as they type)

**3.2 — Interwoven Bridge UI (2h)**

> **IBC framing:** Interwoven Bridge IS IBC-powered — this is Initia's native IBC mechanism. No extra work needed beyond the bridge UI itself. Frame it in the DoraHacks description as "IBC-powered cross-chain deposit via Interwoven Bridge" for scoring purposes.

InterwovenKit exposes `useInterwovenKit()` which has `.requestBridge(params)`. Current code has placeholder in `apps/web/src/app/page.tsx`. Replace with:
- Dedicated `/bridge` page
- Source: Initia mainnet hub (INIT or USDC from any rollup)
- Destination: `kitpot-1` rollup USDC
- Amount input + price impact + fee display
- "Bridge from Initia Hub" button on circle detail page if user has 0 USDC on rollup
- Toast notifications for bridge status

**3.3 — Connect Oracle price display [OPTIONAL — skip if >30min]**

Initia Connect Oracle precompile at `0x031ECb63480983FD216D17BB6e1d393f3816b72F` exposes price feeds.
- `apps/web/src/lib/initia/oracle.ts` — read USDC/USD price
- Hook `useOraclePrice(symbol)` with 30s refresh
- In circle dashboard, show pot value in **IDR** using live price (USDC → USD → IDR via hardcoded FX or a second oracle call)
- Tagline in UI: "Live price via Initia Connect Oracle"

**Done when:** semua file lib, hooks, dan UI components sudah diedit/dibuat.

---

### Sprint 4 — Frontend Gamification UI (8h, 2026-04-24 → 2026-04-25)

**4.1 — Reusable components (2h) — `apps/web/src/components/gamification/`**
- `<TierBadge tier="Gold" size="sm" />` — colored pill with icon
- `<LevelBadge level="Expert" xp={2400} />` — circular with progress ring
- `<XPBar current={2400} next={3999} />` — horizontal progress bar
- `<StreakFlame days={12} />` — flame icon, grows + color changes with count
- `<AchievementCard achievement={...} earned={true} />` — card with SVG preview
- `<XPToast reason="On-time payment" amount={10} />` — toast notification

**4.2 — Public profile page `/u/[address]` (2h)**

Layout:
```
┌──────────────────────────────────────────┐
│ [avatar]  alice.init                      │
│           Level 4 · Expert · 2,400 XP     │
│           [████████░░] 60% to Master      │
│                                           │
│ [Gold Tier Badge]  🔥 12-day streak       │
│                                           │
│ ┌─ Stats ────────────────────────────┐   │
│ │ 8 circles completed · 96% on-time   │   │
│ │ Total contributed: 1,200 USDC       │   │
│ │ Total pot received: 1,200 USDC      │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ Achievements (6/12)                       │
│ [🏆][🎯][⭐][💎][🔥][📈]                   │
│                                           │
│ Active Circles                            │
│ [Circle card 1] [Circle card 2]           │
└──────────────────────────────────────────┘
```

Data sources:
- `KitpotReputation.getReputation(address)` — stats, XP, level
- `KitpotAchievements.memberTokenIds(address)` + `tokenURI` for each — badges
- `KitpotCircle.getCircles()` filtered by membership — circles
- InitUsername resolver — name

**4.3 — Global leaderboard `/leaderboard` (1.5h)**

Three tabs:
- Top by XP
- Top by circles completed
- Top by longest streak

Because Solidity doesn't sort efficiently, we'll do **off-chain indexing via event logs**:
- `apps/web/src/lib/leaderboard/index.ts` — reads `XPAwarded` events from contract since block 0, aggregates client-side
- Results cached in localStorage for 60s

Layout: Table with rank | username | stat | tier badge. Top 3 highlighted with gold/silver/bronze accent.

**4.4 — Daily quest panel (1h) — `<DailyQuestPanel />`**

Shown on home `/` and `/u/[address]` if own profile. Three quest cards:
- Quest 1 (auto): "Pay this cycle on time" — shows ⏳ / ✓
- Quest 2 (manual claim): "Daily check-in" — button "Claim +25 XP"
- Quest 3 (social): "Invite a friend" — button "Copy referral link"

On claim → writeContract → on success toast "+25 XP · 🔥 12-day streak".

**4.5 — Achievements gallery `/achievements` (1h)**

Grid of all 12 achievement types. For each:
- If earned: full-color SVG + earned date + "Minted #42"
- If locked: grayscale + description + progress hint

Read from `KitpotAchievements.hasAchievement(address, type)` for all 12 types in parallel.

**4.6 — Navbar XP bar + level-up animation (0.5h)**

Header shows:
- User's level badge (circular, clickable → profile)
- Thin XP progress bar under it
- Streak flame if > 0

On `LevelUp` event received → confetti (canvas-confetti lib) + full-screen modal "Level Up! You're now Expert 🎉"

---

### Sprint 5 — Landing + Polish + Animation (3h, 2026-04-25 afternoon)

> **Visual direction (confirmed):** modern minimalist rounded clean — like Leticia. No neon/gamer aesthetic. Dark luxury or light luxury with disciplined contrast, smooth Framer Motion transitions.

**5.1 — Landing page hero revamp (1.5h)**

Current: generic value props. New:
- Animated hero: 3 circles of avatars rotating, pot transferring between them (Framer Motion)
- Headline: "Save together. Level up together."
- Sub: "Trustless arisan on Initia with XP, badges, and on-chain reputation."
- CTA: "Create Circle" + "Explore Circles"
- Social proof section: "Backed by on-chain trust. 100% of deposits locked in smart contracts."
- Gamification showcase: screenshots of profile, leaderboard, quest panel

**5.2 — Framer Motion transitions (1h)**
- Page transitions (fade + slide)
- Card hover effects
- Circle join button → confetti on success
- Deposit button → coin-drop animation
- Tier badge entry animation (scale + bounce)

**5.3 — Error states + empty states (0.5h)**
- "No circles yet" illustration + CTA
- "No achievements yet" grayed gallery with hint
- Wallet not connected state

**Done when:** semua komponen UI dan animasi sudah diedit/dibuat.

---

## 5. File Map (all changes)

```
contracts/
├── src/
│   ├── KitpotReputation.sol       [MODIFY]  +XP, +levels, +quests, +referrals
│   ├── KitpotCircle.sol           [MODIFY]  wire XP awards on deposit/advance
│   └── interfaces/IKitpotReputation.sol [MODIFY] +new signatures
└── script/
    └── Deploy.s.sol               [NO CHANGE]

apps/web/src/
├── app/
│   ├── page.tsx                   [MODIFY]  new hero + quest panel
│   ├── leaderboard/page.tsx       [NEW]     global leaderboard
│   ├── achievements/page.tsx      [NEW]     gallery
│   ├── u/[address]/page.tsx       [NEW]     public profile
│   ├── bridge/page.tsx            [NEW]     dedicated bridge page
│   └── circles/[id]/page.tsx      [MODIFY]  show IDR price, XP toasts
├── components/
│   ├── gamification/
│   │   ├── TierBadge.tsx          [NEW]
│   │   ├── LevelBadge.tsx         [NEW]
│   │   ├── XPBar.tsx              [NEW]
│   │   ├── StreakFlame.tsx        [NEW]
│   │   ├── AchievementCard.tsx    [NEW]
│   │   ├── XPToast.tsx            [NEW]
│   │   ├── DailyQuestPanel.tsx    [NEW]
│   │   └── LevelUpModal.tsx       [NEW]
│   ├── username/
│   │   └── InitUsername.tsx       [NEW]
│   └── layout/
│       └── Navbar.tsx             [MODIFY]  add XP bar + level badge
├── hooks/
│   ├── useReputation.ts           [NEW]     wraps KitpotReputation reads
│   ├── useAchievements.ts         [NEW]     wraps KitpotAchievements
│   ├── useLeaderboard.ts          [NEW]     event log aggregator
│   ├── useInitUsername.ts         [NEW]     .init resolver
│   ├── useBridge.ts               [NEW]     InterwovenKit bridge wrapper
│   ├── useOraclePrice.ts          [NEW]     Connect oracle
│   └── useXPToast.ts              [NEW]     listen for XPAwarded events
└── lib/
    ├── initia/
    │   ├── username.ts            [NEW]     REST fetch + cache
    │   └── oracle.ts              [NEW]     Connect oracle ABI + read
    └── abi/
        └── KitpotReputation.ts    [MODIFY]  add new function sigs + events
```

Total: ~25 new files, ~8 modified files.

---

## 6. Risk & Contingency

| Risk | Likelihood | Impact | Mitigation |
|---|:---:|:---:|---|
| Solidity changes butuh update di beberapa file | Medium | Low | Belum production — breaking changes OK. Jika interface berubah, update semua file yang memanggilnya (KitpotCircle, ABI TypeScript, hooks) |
| `.init` REST API doesn't work on rollup-local addresses | Medium | Medium | Fallback: show truncated address + grey tooltip "username from Initia mainnet" |
| Connect Oracle returns zero on our rollup | High | Low | Hardcode fallback FX rate, display "Live oracle" only when value non-zero |
| Bridge UI doesn't actually work without hub testnet funds | High | Medium | Demo uses direct mint via faucet; bridge UI is "coming soon" status if blocked |
| Level-up confetti + Framer feels janky on low-end devices | Low | Low | `prefers-reduced-motion` media query kills animations |
| Scope too large for 5 days | **High** | High | Strict Sprint ordering — if Day 3 is behind, drop Sprint 5 polish and go straight to demo |

### Cutback order (if time runs out)
1. Drop Connect Oracle IDR display → Sprint 3.3
2. Drop level-up confetti → Sprint 4.6 (keep toast only)
3. Drop landing page revamp → Sprint 5.1 (ship as-is)
4. Drop referral system → Sprint 2.2 (leaves XP + quests core)
5. Drop daily quests → Sprint 2.1 (leaves XP + levels only)

Absolute minimum that MUST ship: **XP + Levels + Public profile + Leaderboard + `.init` resolver**. Without these we can't claim "gamification parity with CrediKye."

---

## 7. Success Criteria

This plan is done when:

**Functional:**
- [ ] User deposits on time → XP increases → toast shows → navbar updates in real-time
- [ ] User hits Level 2 threshold → confetti + modal fires
- [ ] User visits `/u/0x123…` → sees tier, level, XP, badges, streak, circles
- [ ] User visits `/leaderboard` → sees top 20 players
- [ ] User types `alice.init` in invite field → resolves to address
- [ ] User clicks "Bridge from Hub" → InterwovenKit bridge popup opens
- [ ] User claims daily quest → +25 XP + streak counter increments
- [ ] User shares `/join/42?ref=alice.init` → new joiner + alice both get +50 XP

**Deploy:** Handled di luar plan ini (testing + deployment dilakukan secara terpisah).

---

## 8. Execution Order (strict)

```
Sprint 1   Contract gamification layer (KitpotReputation + ABI)
Sprint 2   Daily quests + referral flow (contract + frontend wiring)
Sprint 3   Initia native integrations (.init + Bridge + Oracle optional)
Sprint 4   Frontend gamification UI (components + pages)
Sprint 5   Landing page revamp + Framer Motion polish
```

Setiap sprint diakhiri dengan update `docs/builder/changelog.md`.

---

## 9. Confirmed Decisions

1. **Scope:** Telegram Mini App skipped ✅. IBC cross-rollup state feature skipped ✅. Interwoven Bridge (IBC) framed as native IBC feature for scoring ✅.
2. **Visual direction:** Modern minimalist rounded clean — like Leticia. No neon/gamer aesthetic ✅.
3. **Demo + Submission:** Outside this build plan — handled separately ✅.
4. **Oracle:** Optional 15-min try-skip (Sprint 3.3) ✅.
