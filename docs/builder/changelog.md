# Changelog — Completed Changes Log

> Chronological record of every completed change. Newest on top.

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
