# Current — Active Work & Context Recovery

> Read this file FIRST at every session start. It tells you exactly where to resume.

---

## Phase (2026-04-21) — Plans 10-14 Executed, Plan 15 In Progress [ACTIVE]

All gap coverage plans executed. Renumbered plans so dev setup is last (Plan 16).

### Plan Order (final)
| Plan | Title | Status |
|------|-------|--------|
| 01-09 | Core contracts + frontend | DONE |
| 10 | Reputation & Trust Score | DONE |
| 11 | Soulbound Achievement NFTs | DONE |
| 12 | Late Payment & Collateral | DONE |
| 13 | Public Circle Discovery | DONE |
| 14 | Comprehensive Tests (30 tests) | DONE |
| 15 | Submission Polish | IN PROGRESS |
| 16 | Dev Setup, Deploy & E2E Testing | **MANUAL CONFIRM** |

### Next up
- Execute Plan 15 (README, submission.json, DoraHacks description)
- Then STOP and confirm before Plan 16

---

## Phase (2026-04-21) — Gap Analysis [DONE]

Analyzed codebase against hackathon scoring criteria and CrediKye (Grand Prize winner). Created plans 10-15 to close all gaps.

### Plans Created

| Plan | Title | Impact | Status |
|------|-------|--------|--------|
| 11 | Reputation & Trust Score System | CRITICAL — biggest scoring differentiator | Planned |
| 12 | Soulbound Achievement NFTs | HIGH — judges love on-chain credentials | Planned |
| 13 | Late Payment Handling & Collateral | HIGH — solves real-world #1 pain point | Planned |
| 14 | Public Circle Discovery | MEDIUM — makes app feel complete | Planned |
| 15 | Comprehensive Test Suite (~55 tests) | HIGH — shows rigor, judges read tests | Planned |
| 16 | Submission Polish & Documentation | CRITICAL — README, description, video | Planned |

### Execution Order

```
Plan 11 (Reputation) → Plan 12 (NFTs) → Plan 13 (Penalties) → Plan 14 (Discovery)
    ↓
Plan 15 (Tests) — after all feature contracts exist
    ↓
Plan 10 (Dev Setup & Deploy) — compile, test, deploy everything
    ↓
Plan 16 (Submission) — README, video, DoraHacks description
```

### Next up
- Execute Plan 11 (Reputation contract + frontend)
- Then 12 → 13 → 14 → 15 → 10 → 16

---

## Phase (2026-04-20) — Plans 01-09 Executed [DONE] — Awaiting Plan 10 Confirmation

All code written for Plans 01-09. **Plan 10 (Dev Setup, Deploy & E2E Testing) requires manual confirmation before executing.**

### What was built

**Contracts (`contracts/src/`):**
- `KitpotCircle.sol` — full contract: circle CRUD, payments, round-robin distribution, auto-signing sessions, platform fee (Plan 02-04 combined)
- `MockUSDC.sol` — testnet ERC20 token, 6 decimals, anyone can mint

**Contract tooling (`contracts/script/`, `contracts/test/`):**
- `Deploy.s.sol` — deploy MockUSDC + KitpotCircle
- `SetupDemo.s.sol` — mint USDC, create demo circle, approve
- `KitpotCircle.t.sol` — comprehensive tests (create, join, deposit, advance, sessions, lifecycle)

**Frontend (`apps/web/src/`):**
- Provider stack: wagmi + TanStack Query (Privy + InterwovenKit ready via TODO comments)
- Layout: header with logo, nav, connect button
- Landing page with value props
- Create circle form with cycle duration presets
- Join circle page (from invite link)
- My circles list (reads all circles, filters by membership)
- Circle dashboard: current cycle, countdown timer, payment status, turn order, history
- Deposit button with ERC20 approve flow
- Advance cycle button
- Auto-signing setup (approve USDC + authorize session)
- Batch deposit trigger
- Bridge deposit + testnet mint button
- Invite form with shareable link

**ABI (`apps/web/src/lib/abi/`):**
- `KitpotCircle.ts` — full ABI matching contract (placeholder, replace after forge build)
- `MockUSDC.ts` — ERC20 + mint ABI

### Key files
- `contracts/src/KitpotCircle.sol` — the core contract
- `apps/web/src/app/circles/[id]/page.tsx` — circle dashboard (main page)
- `apps/web/src/app/providers.tsx` — provider stack
- `apps/web/src/hooks/` — all wagmi hooks

### Next up
- **WAITING FOR USER CONFIRMATION** to execute Plan 10
- Plan 10: install toolchain (bun, forge), rollup setup, compile, test, deploy, run frontend, E2E testing

---

## Phase (2026-04-20) — Project Bootstrap & Docs Infrastructure [DONE]

Set up the automated docs system (CLAUDE.md + docs/builder/ + .claude/commands/) so all future AI sessions have persistent context.

### What was done
- Created `CLAUDE.md` with engineering standards, tech stack rules, project context map, and automated docs protocol
- Created `docs/builder/` with 5 living memory files (current.md, tasks.md, changelog.md, decisions.md, memory.md)
- Created `.claude/commands/docs-update.md` slash command
