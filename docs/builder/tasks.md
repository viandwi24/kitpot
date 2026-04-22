# Tasks — Backlog & Done

---

## Backlog

### Day 1 — Environment + Rollup (target: 2026-04-20)
- [ ] Install `weave` CLI and init rollup `kitpot-1` (EVM)
- [ ] Init Bun monorepo (root package.json with workspaces)
- [ ] Init Foundry project (`contracts/`)
- [ ] Install OpenZeppelin v5
- [ ] Create skeleton `KitpotCircle.sol` (state variables, `cycleDuration` param)
- [ ] Deploy hello-world contract to kitpot-1 testnet

### Day 2 — Core Contract Logic (target: 2026-04-21)
- [ ] `createCircle()` — name, amount, slots, cycleDuration
- [ ] `joinCircle()` — max slots enforcement
- [ ] `deposit()` — iuran collection per cycle
- [ ] `distributePot()` — round-robin pot distribution
- [ ] Foundry tests for all core functions
- [ ] Deploy to kitpot-1 testnet

### Day 3 — Auto-Signing Integration (target: 2026-04-22)
- [ ] Study Drip's auto-signing pattern (GhostRegistry.sol)
- [ ] Implement session authorization in contract
- [ ] Test auto-signing flow with 2 wallets locally
- [ ] `.init` username resolution

### Day 4 — Frontend Core (target: 2026-04-23)
- [ ] Init Next.js 16 app (`apps/web/`)
- [ ] Setup InterwovenKit + Privy providers
- [ ] Social login (Google/email/Apple)
- [ ] Create circle form + submit to contract
- [ ] Invite via `.init` username UI

### Day 5 — Dashboard + Auto-Signing UI + Bridge (target: 2026-04-24)
- [ ] Circle dashboard (members, payment status, turn order, history)
- [ ] Auto-signing setup UI (one-time approve)
- [ ] Interwoven Bridge UI (deposit from Initia hub to kitpot-1) — nice-to-have
- [ ] Deploy to Vercel staging

### Day 6 — Demo Prep (target: 2026-04-25)
- [ ] Setup 5 test wallets with faucet funds
- [ ] Configure `cycleDuration = 60s` for demo
- [ ] Dry-run demo flow 3x
- [ ] Record 3-min demo video
- [ ] Upload to YouTube

### Day 7 — Submission (target: 2026-04-26) DEADLINE
- [ ] Write README.md
- [ ] Create `.initia/submission.json`
- [ ] Write DoraHacks description (target >= 8k chars)
- [ ] Final Vercel production deploy
- [ ] Submit on dorahacks.io/hackathon/initiate

---

## Done

- [x] Setup automated docs infrastructure (CLAUDE.md, docs/builder/, .claude/commands/) — 2026-04-20
