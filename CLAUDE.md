# Kitpot — AI Builder Instructions

> Trustless rotating savings circles (arisan) on Initia.
> Hackathon: INITIATE | Track: Gaming & Consumer | Deadline: 26 Apr 2026

---

## Engineering Standards

Follow these rules for EVERY change:

1. **Never ship half-baked features** — end-to-end: contract, frontend, wired into running system
2. **No orphaned code** — every created file must be imported and used somewhere
3. **Config over hardcode** — external dependencies (RPC URLs, chain IDs, contract addresses) get env vars or UI config
4. **Verify integration** — after implementing, verify imports exist and data flows end-to-end
5. **Demo-first** — every change should bring us closer to a working demo; if it can't be demoed, deprioritize it
6. **`cycle_duration` must be configurable** — hardcoding 30 days will break demo (use 60s for testnet)

---

## Tech Stack Rules

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | **Bun 1.x** | NOT Node/npm/yarn |
| Monorepo | Bun workspaces (`apps/*`) | `contracts/` is NOT a Bun workspace |
| Frontend | Next.js 16, React 19, TypeScript | App Router, `src/` dir |
| Styling | Tailwind CSS 4 + shadcn/ui | |
| Wallet | `@initia/interwovenkit-react` | Wraps wagmi — no separate WagmiProvider needed |
| Social login | Privy (`@privy-io/react-auth`) | Google/email/Apple |
| EVM hooks | wagmi + viem 2.x + @tanstack/react-query | |
| Contracts | Solidity 0.8.26 + Foundry + OpenZeppelin v5 | NOT Move, NOT CosmWasm |
| Rollup | `kitpot-1` via Weave CLI (EVM) | |
| Auto-signing | InterwovenKit built-in | Reference: Drip repo |
| Deploy app | Vercel | |

### TypeScript rules
- No `any` — use proper types
- No dynamic `import()` in type signatures
- Prefer `interface` over `type` for object shapes

### Contract rules
- Always use `forge test -vv` before deploying
- OpenZeppelin v5: ReentrancyGuard, SafeERC20, Ownable, Pausable
- `contracts/` uses Foundry toolchain — never `bun add` inside it

### Deploy rules — ALWAYS use `scripts/sync-deploy.sh`

**NEVER run `forge script script/Deploy.s.sol --broadcast` directly.** Doing so leaves the frontend env vars (Vercel + `apps/web/.env.local` + `scripts/test/config.ts` + `scripts/test/.deployed.json`) pointing at orphaned/dead contract addresses and silently breaks `/dashboard`, `/leaderboard`, `/discover`, faucet balances, and reputation queries — without any compile-time error.

The contract redeploy + full env sync flow MUST go through:

```bash
export PRIVATE_KEY=0x<operator-key>
./scripts/sync-deploy.sh             # core 4 contracts only
DEPLOY_MOCK_USDE=1 ./scripts/sync-deploy.sh   # also redeploy MockUSDe
```

This script:
1. Runs `forge script Deploy.s.sol --broadcast` and parses new addresses.
2. Updates `apps/web/.env.local`, `scripts/test/.deployed.json`, and the testnet block in `scripts/test/config.ts`.
3. Syncs Vercel env vars via `vercel env` CLI if installed/linked, otherwise prints a paste-ready block.
4. Reminds you to redeploy Vercel without build cache.

WARNING: redeploying contracts WIPES on-chain state (existing circles, NFT badges, reputation entries lost). Don't redeploy unless you genuinely want a clean slate. To verify whether a redeploy is needed, run `cast call <contract> "ownerOf(uint256)" 0 --rpc-url <rpc>` first — if it returns data, the contract is alive and you should just update env vars to match.

---

## Project Context Map

Read the relevant docs BEFORE making changes in that area:

| File | Purpose | When to read |
|------|---------|--------------|
| `docs/idea/idea.md` | Product spec, problem, solution, demo flow | Before any product decision |
| `docs/idea/execution-plan.md` | 7-day build plan (Day 1-7) | Before planning work |
| `docs/idea/tech-stack.md` | Deep tech reference, setup commands, API details | Before any technical implementation |
| `docs/builder/current.md` | What is actively being worked on right now | **Every session start** |
| `docs/builder/tasks.md` | Backlog and planned work | When looking for next task |
| `docs/builder/memory.md` | Persistent context, conventions, gotchas | **Every session start** |
| `docs/builder/decisions.md` | Architectural and product decisions log | Before making architecture choices |
| `docs/builder/changelog.md` | History of completed changes | When reviewing what was done |

---

## Automated Docs Protocol

### WHEN to update docs

Update docs as part of every task — not as an afterthought. Specifically:

#### `docs/builder/current.md` — update:
- Before starting any task (set context)
- When switching focus
- When hitting a blocker
- When making a temporary decision
- After finishing something (mark done, set next)

#### `docs/builder/tasks.md` — update:
- When user requests something deferred
- When you discover follow-up work during implementation
- When a task is completed (mark done with date)

#### `docs/builder/changelog.md` — update:
- After every completed change (not deferred — done)
- Include: what changed, why, files touched, deploy notes

#### `docs/builder/decisions.md` — update:
- When a library or pattern is chosen over an alternative
- When a tradeoff is accepted consciously
- When a design boundary is established

#### `docs/builder/memory.md` — update:
- When a convention specific to this codebase is discovered
- When a non-obvious behavior or gotcha is found
- When user clarifies something that should always be remembered

### HOW to update docs

1. **Read before write** — always read current state before updating
2. **Self-contained entries** — each entry can be understood in isolation
3. **Reverse chronological** — newest on top in current.md and changelog.md
4. **Include WHY** — not just what, but why the decision/change was made
5. **Include file paths** — so future sessions can navigate directly
6. **Never overwrite** — append/prepend, don't replace existing entries

---

## Project Structure

```
kitpot/
├── CLAUDE.md                    ← this file (always loaded)
├── docs/
│   ├── idea/                    ← product spec, plan, tech reference
│   │   ├── idea.md
│   │   ├── execution-plan.md
│   │   └── tech-stack.md
│   ├── builder/                 ← AI builder working memory (5 files)
│   │   ├── current.md           ←   active work + context recovery
│   │   ├── tasks.md             ←   backlog + done list
│   │   ├── changelog.md         ←   completed changes log
│   │   ├── decisions.md         ←   Architecture Decision Records
│   │   └── memory.md            ←   persistent conventions, gotchas
│   └── automated-docs-setup.md  ← reference: how this system works
├── apps/
│   └── web/                     ← Next.js 16 (Bun workspace)
├── contracts/                   ← Foundry (NOT a Bun workspace)
├── .claude/
│   └── commands/
│       └── docs-update.md       ← slash command: force full docs sync
└── .initia/
    └── submission.json
```

---

## Key References

| Resource | Location |
|----------|----------|
| Drip repo (auto-signing ref) | `github.com/KamiliaNHayati/Drip` |
| Leticia repo (stack ref) | `github.com/0xpochita/Leticia` |
| Hackathon docs | `docs.initia.xyz/hackathon` |
| InterwovenKit docs | `docs.initia.xyz/interwovenkit` |
| Initia Scan testnet | `scan.testnet.initia.xyz` |
