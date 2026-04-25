# Kitpot — Self-Scoring vs INITIATE Hackathon Rubric

> **Generated:** 2026‑04‑25 (D‑1 to extended deadline 2026‑04‑26 07:00 UTC)
> **Audit basis:** DoraHacks INITIATE detail page + `docs.initia.xyz/hackathon` + `docs/idea/raw-content.md`
> **Track filed:** Gaming & Consumer (matches "social apps, digital identity, community platforms")

---

## 0. TL;DR scorecard

| Criterion | Weight | Self-score | Weighted | Justification |
|---|---|---|---|---|
| Originality & Track Fit | 20% | **17 / 20** | 17.00 | First trustless ROSCA on Initia w/ multi-token + soulbound NFT gamification. Strong Gaming & Consumer fit. |
| Technical Execution & Initia Integration | 30% | **27 / 30** | 27.00 | All 3 native features integrated meaningfully (auto-sign, .init, Interwoven Bridge). Pull-claim + permissionless keeper above blueprint baseline. |
| Product Value & UX | 20% | **15 / 20** | 15.00 | Auto-sign silent deposit demoed; pre-flight balance gates; multi-asset; but no Telegram bot / mobile-first UX. |
| Working Demo & Completeness | 20% | **14 / 20** | 14.00 | Live testnet + 102 contract tests pass. **Demo video still missing** — biggest deduction. README needs final commit_sha + video URL. |
| Market Understanding | 10% | **7 / 10** | 7.00 | Problem framing strong (300M+ ROSCA users, treasurer trust gap). GTM mentioned in README but no explicit competitor matrix vs CrediKye. |
| **TOTAL** | **100%** | | **80.0 / 100** | Strong PASS, top-quartile if demo video lands by deadline. |

**Headline gap:** demo video. Without it, Working Demo & Completeness falls to ~9/20 (≈ −5 pts overall) and Originality/UX scores get capped because judges cannot easily see the auto-sign silence in action.

---

## 1. Eligibility checklist (hard gates)

These are PASS/FAIL — fail any one and the submission is rejected before scoring.

| Requirement (verbatim from DoraHacks) | Status | Evidence |
|---|---|---|
| Open to individuals/teams worldwide | ✅ | Solo builder |
| Original work, built during hackathon period (16 Mar – 26 Apr 2026) | ✅ | All commits within window; no pre-existing ROSCA codebase forked |
| Aligned with one of three tracks (DeFi/AI/Gaming) | ✅ | Track: **Gaming & Consumer** — savings circles = social financial app |
| Deployed as own Initia appchain / rollup | ✅ | Rollup `kitpot-2` (chain id `64146729809684`) live at https://kitpot-rpc.viandwi24.com |
| Valid rollup chain ID OR txn link OR deployment link | ✅ | All three: `kitpot-2`, contract addresses verifiable via cast, https://kitpot.vercel.app |
| Use `@initia/interwovenkit-react` for wallet/tx | ✅ | `apps/web/src/app/providers.tsx` mounts `InterwovenKitProvider`; `useInterwovenKit()` used everywhere; all writes go through `requestTxBlock` / `submitTxBlock` |
| At least one Initia-native feature (auto-sign / .init / Interwoven Bridge) | ✅ | **All three implemented**, see §3 |
| `.initia/submission.json` present | ⚠️ | File exists; needs final `commit_sha` + `demo_video_url` + updated `deployed_address` (post plan-22 redeploy) |
| `README.md` human-readable summary | ⚠️ | File exists 6 KB; needs final video URL section + plan-22 contract address refresh |
| Demo video 1–3 min | ❌ | **NOT YET RECORDED** — single biggest blocker |
| Mandatory Git repo link | ✅ | `https://github.com/viandwi24/kitpot` |
| Mandatory video link | ❌ | Same as demo video — pending |

**Result:** 10 / 12 hard gates green. The two amber/red items (demo video + final submission.json polish) are bundled solvable in the last day before deadline.

---

## 2. Track fit analysis (Gaming & Consumer, weight = 2)

DoraHacks track description verbatim:
> *"Games, social apps, digital identity, entertainment, community platforms. Anything that puts real humans in front of real interfaces."*

Kitpot's mapping:
- **Social app:** ROSCA is fundamentally a social-trust ritual — a savings circle is friends pooling money in turn. Kitpot ports the social ritual on-chain.
- **Community platform:** Discover page + leaderboard + soulbound NFT badges + reputation tiers create a community surface, not just a financial primitive.
- **Real humans in front of real interfaces:** Privy social login + auto-sign means "tap-to-deposit" UX with no wallet popups during normal flow.

DeFi-track adjacency (not chosen) — Kitpot has DeFi-flavored mechanics (collateral slash, fees, multi-token) but the **emotional surface** is community/social, not yield/leverage.

**Self-score: 17 / 20.** Loses 3 pts because:
- Could lean harder into community features (chat, group icons, friends).
- Telegram/social distribution unbuilt (CrediKye reference shipped this).
- Discoverable network effects shallow (no public squad-feed, no on-circle-completion social posts).

---

## 3. Initia-native feature integration (the 30%)

### 3.1 Auto-signing — meaningful, demo-able

| Aspect | Implementation |
|---|---|
| SDK pathway | `useInterwovenKit().autoSign.{enable,disable,isEnabledByChain,expiredAtByChain}` |
| Entry point | `apps/web/src/components/layout/auto-sign-toggle.tsx` — single header button |
| Pending UX (plan 21) | Local "Granting…" state with 90s timeout fallback masking the chain-finality wait |
| Tx routing (plan 18) | `apps/web/src/hooks/use-kitpot-tx.ts` switches `submitTxBlock` (auto) vs `requestTxBlock` (manual) based on `isEnabledByChain[CHAIN_ID]` |
| Provider config | `enableAutoSign={{ [cosmosChainId]: ["/minievm.evm.v1.MsgCall"] }}` declares scope at provider level |
| End-to-end proof | Plan 19 §12 demonstrates silent deposit on circle 0–3 ; plan 22 `prove-pull-claim.ts` does same on new contract |

Verdict: Initia-native, not custom. No hand-rolled session keys. **Score this 10/10.**

### 3.2 `.init` usernames — meaningful, honest

| Aspect | Implementation |
|---|---|
| SDK pathway | `useUsernameQuery(address)` returns the L1 registry hit |
| Component | `apps/web/src/components/username/init-username.tsx` — primary lookup + truncated-address fallback |
| Anti-fake guarantee (latest commit) | `turn-order.tsx` + `payment-status.tsx` no longer pass member-supplied display string as fallback. Self-claimed "alice.init"-shaped strings can never sneak in. |
| Test scripts | `simulate-members-join.ts` updated to pass truncated wallet address (not fake `.init`) so on-chain `member.initUsername` field is honest |
| Used at | Header XP badge, leaderboard, profile, dashboard, payment status, turn order |

Verdict: Initia-native, transparent. No misleading display. **Score this 8/10.** Loses 2 because we don't actively prompt users to register `.init` (link to registry would be a polish).

### 3.3 Interwoven Bridge — partially functional, narrative complete

| Aspect | Implementation |
|---|---|
| SDK pathway | `useInterwovenKit().{openDeposit, openWithdraw}` |
| Entry point | `apps/web/src/app/bridge/page.tsx` — bidirectional buttons (Deposit from L1, Withdraw to L1) |
| Token | Native `uinit` (per InterwovenKit registry constraints) |
| Local-test caveat surfaced honestly | UI banner: *"If the bridge modal shows 'No available assets', your wallet has no `uinit` on the source chain yet — documented limitation of the Interwoven UI when chain IDs are not in the public registry."* |
| Hackathon docs justification | Initia docs (`/hackathon/examples/evm-bank`) explicitly sanction unfunded local bridge as long as the user-flow is explained. We do explain it. |

Verdict: Bidirectional buttons + honest caveat copy + matching official docs guidance. **Score this 7/10.** Loses 3 because no actual L1↔rollup tx demoed end-to-end (kitpot-2 not registered yet).

### 3.4 Aggregate

CrediKye (the Creditcoin-track ROSCA we audited) implements **only** wallet connect + `requestTxBlock` — no auto-sign, no .init, no bridge. Kitpot ships **all three** at meaningful integration depth.

**Section 3 self-score: 27/30.**

---

## 4. Technical execution depth

### 4.1 Smart contracts

| File | Lines | What it owns |
|---|---|---|
| `KitpotCircle.sol` | ~520 | Core ROSCA logic + new `claimPot` / `substituteClaim` (plan 22) |
| `KitpotReputation.sol` | ~250 | XP / tier / streak |
| `KitpotAchievements.sol` | ~228 | Soulbound ERC721 badges, on-chain SVG |
| `MockUSDC.sol` / `MockUSDe.sol` | ~20 each | Permissionless mint test stables |

Contract test count: **102 passing** across 6 suites (plan 22 added PullClaim, SubstituteClaim, TimeDeterminism, ConfigValidation tests on top of pre-existing reputation + circle tests).

Notable patterns:
- **Pull-claim model + permissionless keeper safety net** (plan 22) — recipient claims their own pot atomic with cycle advance; if dormant >7 days, anyone earns 0.1% to deliver pot. Eliminates "stuck circle" failure mode. CrediKye reference does NOT have this — they rely on Telegram-bot reminders.
- **Deterministic time math** — next cycle deadline = previous start + cycleDuration, NOT block.timestamp at claim. Late claims do not extend the next cycle.
- **Tightened config validation** (plan 22) — strict `gracePeriod < cycleDuration`, name length bounds, min cycle 60 s.
- **Achievements use on-chain SVG** — no IPFS dependency; `tokenURI` returns a base64 data URI that renders the badge inline.

### 4.2 Frontend

13 routes across `apps/web/src/app/`:
- Public: `/`, `/discover`, `/leaderboard`, `/bridge` (faucet + bridge), `/about` (program overview), `/u/[address]` (profile)
- Auth-gated: `/dashboard`, `/circles`, `/circles/new`, `/circles/[id]`, `/circles/[id]/invite`, `/achievements`, `/join/[id]`

Hooks pattern: 1 hook per concern (`use-circles`, `use-circle-dashboard`, `use-create-circle`, `use-discover`, `use-init-username`, `use-kitpot-tx`, `use-achievements`, etc.). Type checking clean (`bun tsc --noEmit` exit 0).

UX plumbing shipped per plan 21:
- `parseTxError` helper turns raw EVM revert strings into actionable hints
- Pre-flight balance check disables submit when contributor lacks tokens
- Network warning banner for non-Kitpot chains with one-click `wallet_addEthereumChain`
- Auto-sign optimistic "Granting…" state during the 60 s on-chain finality wait
- Faucet API (`/api/gas-faucet`) drips GAS + 5000 USDC + 5000 USDe in one POST so a fresh wallet can immediately create a circle

### 4.3 Tooling

- `scripts/sync-deploy.sh` — single-command redeploy + env sync, mandated in CLAUDE.md so future deploys don't repeat the env-stale incident
- `scripts/test/prove-{pot-and-late, pull-claim, substitute-claim}.ts` — programmable proofs of contract behavior on testnet
- `scripts/test/simulate-members-join.ts` — generates fresh wallets + funds + joins to fill a circle from a single command

### 4.4 Section 4 self-score: 27/30

(Same as Initia integration — they're tightly coupled in the rubric.)

---

## 5. Product Value & UX (the 20%)

### Strengths
- **Multi-token circles** — pick USDC / USDe at create time. CrediKye is single-token.
- **Auto-sign silent deposit** — once enabled, the per-cycle UX is "tap pay → done". This is the headline killer-feature for the hackathon.
- **Soulbound NFT badges with on-chain SVG** — no IPFS, real images render in `/achievements` page; per-badge "Verify on-chain" expander shows contract address + cast call snippet (replaces the missing public explorer for our chain).
- **Pre-flight gates** — user with 0 USDC sees a banner telling them where to mint, instead of hitting an opaque revert.
- **Network warning banner** — Brave-on-mainnet judges get a one-click "Add Kitpot to Wallet" without leaving the page.

### Weaknesses
- **No Telegram / mobile mini app** — CrediKye reference covered this; we did not.
- **Discover empty when all circles are mid-cycle** — by design the feed only shows Pending circles, but the empty state could prompt "Create a circle to seed the feed".
- **No notifications when it's your turn** — pull-claim depends on the recipient noticing they can claim. A simple toast on entry to the dashboard if a claimable pot exists would close this gap. Plan 22 §3 mentions this; not yet shipped.
- **No mobile-specific layout testing** in the rubric scope — viewport-narrow form widths might be cramped.

**Section 5 self-score: 15/20.**

---

## 6. Working Demo & Completeness (the 20%)

### What judges can verify in <5 min today
1. Open `https://kitpot.vercel.app/about` → green-dot live status + 5 contract addresses with `cast code` snippet.
2. Connect via Privy Google or Brave wallet → auto-faucet drips GAS + USDC + USDe in one tx.
3. Click `Faucet` → see live balances; click `Mint USDC` to top up.
4. Click `Discover` → see `Plan 22 Pull-Claim Test` (or any seeded circle) with Active status, live cycle countdown.
5. Open the circle detail → click `Pay Contribution` → silent if auto-sign enabled.
6. Wait 60 s → recipient sees `Claim Pot` button → click → pot transferred + cycle advanced atomically.

### What's missing
- **Demo video (1–3 min)** — DoraHacks REQUIRED. Not recorded yet.
- **`commit_sha` in `.initia/submission.json`** — placeholder string still there.
- **`demo_video_url` in `.initia/submission.json`** — placeholder.
- **`deployed_address` in `.initia/submission.json` is STALE** — points at `0x62d244f3...` (pre plan-22 contract). Live address after plan 22 redeploy is `0x7526CE9959756Fb5fc5e4431999A2660eEd8cD86`. **MUST update before final submit.**

If demo video lands today, this section moves from 14/20 to 18/20. Until then, capped.

**Section 6 self-score: 14/20** (with demo video pending). With video: **18/20**.

---

## 7. Market Understanding (the 10%)

### Strengths
- **Concrete TAM number in README:** "300 million+ people worldwide participate in rotating savings circles". This is a real WSJ/IFC stat about ROSCA.
- **Universal localized branding:** ROSCA / Arisan / Chit Fund / Hui / Tontine / Paluwagan — names the product across diaspora communities (Indonesian, Indian, Chinese, French, Filipino…).
- **Problem framing is sharp:** "The treasurer is a single point of trust failure" — a ROSCA always has someone holding the pot, and that person can disappear.
- **Initia distribution leverage:** `.init` username + Privy social login means the addressable market includes non-crypto-native users (currently 99% of ROSCA participants).

### Weaknesses
- **No explicit competitor matrix in README.** We did the CrediKye comparison in `docs/reports/...`-style notes but never surfaced it for judges.
- **No GTM beyond "use it on testnet"** — README does not name a specific community / pilot / launch market.
- **No revenue model statement** — judges asked specifically about "real revenue and value capture" in the hackathon framing. We have a 1% platform fee per pot in the contract but README is silent.

**Section 7 self-score: 7/10.** Could be 9/10 with a "Markets & monetization" README block.

---

## 8. Originality vs known references

### Direct ROSCA reference: CrediKye (Creditcoin track, NOT Initia)
| Feature | CrediKye | Kitpot |
|---|---|---|
| Chain | Creditcoin testnet | Initia kitpot-2 rollup |
| InterwovenKit | ❌ (different chain) | ✅ |
| Auto-sign | ❌ | ✅ silent deposit |
| `.init` usernames | ❌ | ✅ honest registry-only |
| Interwoven Bridge | ❌ | ✅ Deposit + Withdraw buttons |
| Multi-token | ❌ single | ✅ USDC + USDe + extensible |
| Soulbound NFT badges | ✅ | ✅ + on-chain SVG (no IPFS) |
| Telegram Mini App | ✅ | ❌ (gap) |
| Pull-claim + keeper | ❌ (manual / bot reliant) | ✅ permissionless 0.1% keeper fee |
| On-chain late penalty | ❌ off-chain points only | ✅ collateral slash 5% |

### Direct Initia blueprint references: BlockForge (Move), MiniBank (EVM), MemoBoard (Wasm)
None overlap product domain. Closest is MiniBank (EVM bank with bridge button) — Kitpot inherits the `MsgCall` shape + bridge-modal UX from MiniBank but extends with full ROSCA business logic.

**Originality net:** Kitpot is the **only** Initia-native ROSCA in the hackathon (we searched DoraHacks BUIDL list). Score 8 / 10 instead of 10 because the underlying ROSCA primitive is centuries old and well-explored on other chains.

---

## 9. Risks & last-mile work

### Submission blockers (fix before 2026‑04‑26 07:00 UTC)
1. **Record demo video 1–3 min** — script lives in plan 19 §10. Must show: connect → auto-sign → silent deposit → claim pot.
2. **Update `.initia/submission.json`:**
   - `commit_sha` → final main HEAD
   - `demo_video_url` → YouTube/Loom link
   - `deployed_address` → `0x7526CE9959756Fb5fc5e4431999A2660eEd8cD86`
3. **Update README.md:**
   - Demo video link
   - "Markets & monetization" section (1% pot fee, 0.1% keeper fee, future Premium circles)
   - Competitor row vs CrediKye (1-line: "First Initia-native ROSCA with auto-sign + multi-token + permissionless keeper safety net")
4. **Push current local commits** (4 commits) — `git push origin main` so Vercel redeploys with the latest UX fixes (faucet sequential mint, claim-button gating, honest .init resolution).
5. **Submit on DoraHacks** — fill the 5 mandatory questions with the artifacts above.

### Soft polish (nice-to-have if time allows)
- Add a "Claim available!" toast/banner on `/dashboard` when the connected wallet is the recipient of any active circle past its deadline.
- Add `wallet_addEthereumChain` link on the `/about` page so judges can pre-add the chain to Brave / MetaMask before hitting Faucet.
- Brief CrediKye comparison block in README (already drafted in §8 of this report — copy across).

### Risks to highlight to judges (transparency wins points)
- kitpot-2 not registered in Initia chain registry yet → bridge modal + public scan return 404. Documented in UI + about page.
- 7-day dormant grace cannot be tested live in 60-second testnet cycles; covered by Foundry tests with time-warp.
- Auto-sign optimistic UI takes ~60 s to show "ON" because of single-validator block production; pending state in UI explains the wait.

---

## 10. Final scorecard with demo-video scenarios

| Scenario | Originality | Tech | UX | Demo | Market | **Total** |
|---|---|---|---|---|---|---|
| Submit as-is, no video | 17 | 27 | 13 | 9 | 6 | **72 / 100** |
| **Submit with demo video + README polish (TARGETED)** | **17** | **27** | **15** | **18** | **8** | **85 / 100** |
| Plus mobile mini-app + competitor matrix | 19 | 28 | 17 | 19 | 9 | 92 / 100 |

The ~85 target is reachable in the next 24h with the §9 blocker list.

---

## 11. Sources

- DoraHacks INITIATE detail page: <https://dorahacks.io/hackathon/initiate/detail>
- Initia hackathon docs: <https://docs.initia.xyz/hackathon/get-started>
- Plan history: `docs/plans/{18,19,20,21,22}-*.md`
- Local audit: 2026‑04‑25 (102 contract tests pass, `bun tsc --noEmit` clean, Vercel build clean)
- CrediKye reference: <https://dorahacks.io/buidl/40170>
- Live demo: <https://kitpot.vercel.app>
