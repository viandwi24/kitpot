# Changelog — Completed Changes Log

> Chronological record of every completed change. Newest on top.

---

## 2026-04-24 — Plan 18 §12: Post-audit gap fixes (G1–G3)

Migrated all remaining `useWriteContract` callsites to `useKitpotTx` (InterwovenKit `requestTxBlock`/`submitTxBlock`). Zero `useWriteContract` remaining in codebase.

### G1 — advanceCycle (HIGH)
Added `advanceCycle` to `use-kitpot-tx.ts`. Rewrote `advance-cycle-button.tsx` — removed wagmi write imports.
**Files:** `apps/web/src/hooks/use-kitpot-tx.ts`, `apps/web/src/components/circle/advance-cycle-button.tsx`

### G2 — claimDailyQuest (MEDIUM)
`claimDailyQuest()` in `KitpotReputation.sol` is user-triggered (external, no modifier) → migrated.
Added `claimDailyQuest` to `use-kitpot-tx.ts`. Removed `useClaimDailyQuest` export from `use-reputation.ts`. Updated `daily-quest-panel.tsx` and removed dead import from `dashboard/page.tsx`.
**Files:** `use-kitpot-tx.ts`, `use-reputation.ts`, `daily-quest-panel.tsx`, `dashboard/page.tsx`

### G3 — MockUSDC.mint (LOW)
Added `mintTestUSDC` to `use-kitpot-tx.ts`. Rewrote `use-bridge.ts` — removed wagmi write imports.
**Files:** `use-kitpot-tx.ts`, `use-bridge.ts`

---

## 2026-04-24 — Plan 18: Align to INITIATE Hackathon (code-only)

Executed 6 phases to fix 8 hallucinations/misalignments identified in the codebase audit. All changes are code-only — no builds, tests, or deployments run.

### Phase 1 — Provider fix (H6 + H7)
Rewrote `providers.tsx` with `customChain`, `customChains`, `defaultChainId`, `enableAutoSign`. Replaced dual local/testnet network system with single env-driven config. Deleted `network-switcher.tsx`.
**Files:** `providers.tsx`, `network.ts`, `contracts.ts`, `.env.example`, deleted `network-switcher.tsx`

### Phase 2 — Contract session removal (H1)
Removed custom Solidity session-key layer (struct, mapping, 3 events, 5 functions). Removed 8 session tests. Cleaned ABI.
**Files:** `KitpotCircle.sol`, `KitpotCircle.t.sol`, `KitpotCircle.ts` (ABI)

### Phase 3 — InterwovenKit tx hook (H5)
Created `use-kitpot-tx.ts` using `requestTxBlock`/`submitTxBlock` with `/minievm.evm.v1.MsgCall`. Rewrote all tx-sending components. Deleted `use-create-circle.ts`.
**Files:** created `use-kitpot-tx.ts`, rewrote `create-circle-form.tsx`, `join-form.tsx`, `deposit-button.tsx`, deleted `use-create-circle.ts`

### Phase 4 — Username cleanup (H3 + H4)
Deleted custom REST username client and fake-username modal. Replaced with native `useUsernameQuery` from InterwovenKit.
**Files:** deleted `username.ts`, `use-init-username.ts`, `username-setup-modal.tsx`, rewrote `init-username.tsx`, `connect-button.tsx`

### Phase 5 — Auto-sign replacement (H2)
Deleted custom auto-signing UI. Created `auto-sign-toggle.tsx` using native `autoSign.enable`/`disable`. Mounted in header.
**Files:** deleted `use-auto-signing.ts`, `auto-signing-setup.tsx`, `batch-deposit-trigger.tsx`, created `auto-sign-toggle.tsx`, updated `header.tsx`, `circles/[id]/page.tsx`

### Phase 6 — Submission + README (H8)
Overwrote `.initia/submission.json` with correct schema. Rewrote `README.md`.
**Files:** `.initia/submission.json`, `README.md`

**Deploy notes:** Contract must be redeployed (storage layout changed). New `.env.local` required (new env var names).

---

## 2026-04-23 — Docs sync: full state update

Updated all builder docs to reflect actual current state. Fixed stale references to kitpot-1 (now kitpot-2), documented bridge removal decision, marked all completed tasks, updated pending items.

**Files:** `docs/builder/current.md`, `docs/builder/tasks.md`, `docs/builder/memory.md`, `docs/builder/decisions.md`, `docs/builder/changelog.md`

---

## 2026-04-23 — Bridge page replaced with Faucet

Removed broken "Interwoven Bridge" button (was calling `alert()` — TODO placeholder). Replaced `/bridge` page with clean Faucet-only UI (mint MockUSDC). Renamed navbar label from "Bridge" → "Faucet". Decision documented in ADR-004.

**Files:** `apps/web/src/app/bridge/page.tsx`, `apps/web/src/components/layout/header.tsx`

---

## 2026-04-23 — Docker infra for VPS deployment

Created complete Docker setup for running kitpot-2 rollup node on VPS. Single image handles minitiad node + OPinit bots (executor + challenger). Tested locally on Mac M1.

Key fixes applied during testing:
- Fixed arm64 architecture mismatch (Mac M1 vs amd64 default)
- Fixed OPinit key registration: bridge_executor must be under L2 chain ID (kitpot-2), not L1
- Fixed oracle relay error: set `oracle_bridge_executor: ""` to disable (no grant needed for ROSCA)

**Files:** `infra/dokploy/Dockerfile`, `infra/dokploy/entrypoint.sh`, `infra/dokploy/docker-compose.yml`, `infra/dokploy/.env.example`

---

## 2026-04-23 — TypeScript build error fix

Fixed type error in `network-switcher.tsx`: `onChange` callbacks in fields array typed as `(v: string) => void`, hex address setters cast with `as \`0x${string}\`` inside the callback.

**Files:** `apps/web/src/components/layout/network-switcher.tsx`

---

## 2026-04-22–23 — Gamification expansion (Plan 17)

Added XP multipliers, streak bonuses, level progression, and achievement display to leaderboard and profile pages.

**Files:** `docs/plans/17-gamification-expansion.md`, multiple frontend files

---

## 2026-04-22 — Submission assets (Plan 15)

Created README.md (technical), README_DORAHACK.md (submission-ready), and populated `.initia/submission.json` with deployed contract addresses. Demo URL: https://kitpot.vercel.app. Video URL still TODO.

**Files:** `README.md`, `README_DORAHACK.md`, `.initia/submission.json`

---

## 2026-04-21–22 — All features built and deployed (Plans 10-16)

Deployed all contracts to kitpot-2 testnet. Full frontend live on Vercel.

**Contracts deployed:**
- KitpotCircle: `0xecb3a0F9381FDA494C3891337103260503411621`
- KitpotReputation: `0xf10267F194f8E09F9f2aa8Fc435e7A2Dac58172a`
- KitpotAchievements: `0xC421652EC7efBad98dDF42646055e531a28f61Ea`
- MockUSDC: `0xe5e7064B389a5d4ACE1d93b3C5E36bF27b4274Fa`

**Frontend pages:** landing, discover, leaderboard, dashboard, circles, circle detail, badges, profile, faucet, create circle, join circle

---

## 2026-04-21 — Gap coverage plans executed (Plans 10-14)

Built reputation system, soulbound achievement NFTs, late payment handling, public circle discovery, and comprehensive test suite.

**Key files:** `contracts/src/KitpotReputation.sol`, `contracts/src/KitpotAchievements.sol`, `contracts/test/KitpotReputation.t.sol`, `contracts/test/KitpotCircle.t.sol`

---

## 2026-04-20 — Implementation plans created (Plans 01-09)

Created 10 detailed implementation plans. Plans 01-09 executed (core contracts + frontend written).

**Files:** `docs/plans/01-*.md` through `docs/plans/10-*.md`

---

## 2026-04-20 — Automated docs infrastructure setup

Established AI builder docs system.

**Files:** `CLAUDE.md`, `docs/builder/*`, `.claude/commands/docs-update.md`
