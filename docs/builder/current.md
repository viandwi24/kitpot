# Current — Active Work & Context Recovery

> Read this file FIRST at every session start. It tells you exactly where to resume.

---

## Phase (2026-04-23) — Infra + Demo Polish [ACTIVE]

All contract and frontend features built and deployed. Focus now is demo readiness and VPS deployment.

### What is LIVE (deployed on kitpot-2 testnet)

**Contracts on kitpot-2 (Chain ID: 64146729809684):**
- `KitpotCircle`: `0xecb3a0F9381FDA494C3891337103260503411621`
- `KitpotReputation`: `0xf10267F194f8E09F9f2aa8Fc435e7A2Dac58172a`
- `KitpotAchievements`: `0xC421652EC7efBad98dDF42646055e531a28f61Ea`
- `MockUSDC`: `0xe5e7064B389a5d4ACE1d93b3C5E36bF27b4274Fa`

**Frontend (Vercel):** https://kitpot.vercel.app (currently points to localhost RPC, needs VPS update)

**Infrastructure (`infra/dokploy/`):**
- `Dockerfile` — single image: minitiad + opinitd, works for arm64 and amd64
- `entrypoint.sh` — starts minitiad, waits for EVM RPC, optionally starts OPinit bots
- `docker-compose.yml` — local Mac M1/M2 testing only
- `.env.example` — all required env vars documented
- Tested locally: minitiad produces blocks, OPinit executor submitting batches

### What is PENDING (blockers for submission)

| Item | Status | Notes |
|------|--------|-------|
| VPS deployment | ❌ Not done | rsync ~/.minitia → VPS, deploy via Dokploy |
| Public RPC domain | ❌ Not done | Traefik domain → port 8545 |
| Vercel env update | ❌ Not done | `NEXT_PUBLIC_TESTNET_RPC_URL` → VPS domain, `NEXT_PUBLIC_DEFAULT_NETWORK=testnet` |
| Demo video | ❌ Not done | `video_url` in submission.json still TODO |
| DoraHacks description | ❌ Not done | Target 8k+ chars |

### Next actions (in order)
1. Deploy VPS → get public RPC domain
2. Update Vercel env → redeploy
3. Record demo video
4. Write DoraHacks description
5. Submit

---

## Phase (2026-04-23) — Feature Audit [DONE]

Compared Kitpot vs Leticia and Drip. Key findings:

- **Bridge/Interwoven Bridge**: NOT implemented. Renamed `/bridge` page to Faucet (mint MockUSDC only). Neither Drip nor Leticia have bridge UI. Bridge is NOT a scoring differentiator — removed broken bridge button that showed `alert()`.
- **Auto-signing**: UI exists (`/circles/[id]` → auto-sign setup). Not verified working on testnet yet.
- **MockUSDC faucet**: Works. Judge can mint USDC directly from `/bridge` (Faucet) page.

---

## Phase (2026-04-21–23) — All Features Built [DONE]

### Plans executed
| Plan | Title | Status |
|------|-------|--------|
| 01-09 | Core contracts + frontend | DONE |
| 10 | Reputation & Trust Score | DONE |
| 11 | Soulbound Achievement NFTs | DONE |
| 12 | Late Payment & Collateral | DONE |
| 13 | Public Circle Discovery | DONE |
| 14 | Comprehensive Tests | DONE |
| 15 | Submission Polish (README, submission.json) | DONE |
| 16 | Gamification expansion | DONE |

### Key files
- `contracts/src/KitpotCircle.sol` — core contract
- `contracts/src/KitpotReputation.sol` — reputation + XP
- `contracts/src/KitpotAchievements.sol` — soulbound NFT badges
- `apps/web/src/app/circles/[id]/page.tsx` — circle dashboard
- `apps/web/src/app/discover/page.tsx` — public circle discovery
- `apps/web/src/app/leaderboard/page.tsx` — leaderboard
- `apps/web/src/app/bridge/page.tsx` — faucet (mint MockUSDC only, no bridge)
- `apps/web/src/components/layout/header.tsx` — nav: Discover, Leaderboard, Faucet, Dashboard, Circles, Badges
- `infra/dokploy/Dockerfile` — VPS deployment image
