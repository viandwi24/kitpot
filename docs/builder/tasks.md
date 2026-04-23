# Tasks — Backlog & Done

---

## Backlog (remaining before submission deadline: 2026-04-26)

### Critical path
- [ ] Deploy Docker container to VPS via Dokploy (amd64, `RUN_OPINIT=false` for demo)
- [ ] rsync `~/.minitia` from Mac to VPS
- [ ] Configure Traefik domain → port 8545 (public RPC)
- [ ] Update Vercel env vars: `NEXT_PUBLIC_TESTNET_RPC_URL`, `NEXT_PUBLIC_DEFAULT_NETWORK=testnet`
- [ ] Redeploy Vercel after env update
- [ ] Verify live: `curl https://rpc.domain/` returns block number
- [ ] Record demo video (3 min, narasi audio) — upload to YouTube
- [ ] Update `video_url` in `.initia/submission.json`
- [ ] Write DoraHacks submission description (target 8k+ chars)
- [ ] Submit at dorahacks.io/hackathon/initiate before 2026-04-26

### Nice-to-have (only if time permits)
- [ ] Verify auto-signing actually works end-to-end on kitpot-2 testnet
- [ ] Setup 5 test wallets with minted MockUSDC for demo

---

## Done

### Infra (2026-04-23)
- [x] Create `infra/dokploy/Dockerfile` — single image, minitiad + opinitd, arm64+amd64
- [x] Create `infra/dokploy/entrypoint.sh` — start minitiad, wait for RPC, optional OPinit bots
- [x] Create `infra/dokploy/docker-compose.yml` — local Mac M1 testing
- [x] Create `infra/dokploy/.env.example` — all env vars documented
- [x] Test Docker locally: minitiad producing blocks, OPinit bots running

### Frontend polish (2026-04-23)
- [x] Fix TypeScript build error in `network-switcher.tsx`
- [x] Rename "Bridge" → "Faucet" in navbar
- [x] Replace broken bridge page (alert popup) with clean faucet-only page

### Submission assets (2026-04-23)
- [x] Write `README.md` (technical, comprehensive)
- [x] Write `README_DORAHACK.md` (submission-ready)
- [x] Populate `.initia/submission.json` with deployed contract addresses

### Features — Gamification (2026-04-22–23)
- [x] `KitpotReputation.sol` — XP, streaks, trust tiers (Bronze/Silver/Gold/Diamond)
- [x] `KitpotAchievements.sol` — Soulbound NFT badges
- [x] Frontend: leaderboard page
- [x] Frontend: achievements/badges page
- [x] Frontend: user profile page (`/u/[address]`)
- [x] Frontend: level badge + streak flame in navbar

### Features — Core (2026-04-20–22)
- [x] `KitpotCircle.sol` — create, join, deposit, distribute, auto-signing sessions, platform fee
- [x] `MockUSDC.sol` — testnet ERC20, anyone can mint
- [x] `SetupDemo.s.sol` — demo setup script
- [x] Comprehensive Foundry tests (30+ tests)
- [x] Frontend: create circle form
- [x] Frontend: join circle page
- [x] Frontend: circle dashboard (cycle status, turn order, payment status)
- [x] Frontend: public circle discovery
- [x] Frontend: auto-signing setup UI
- [x] Frontend: .init username invite
- [x] Frontend: testnet faucet (mint MockUSDC)
- [x] Deploy all contracts to kitpot-2 testnet

### Infrastructure (2026-04-20)
- [x] Setup automated docs infrastructure (CLAUDE.md, docs/builder/)
