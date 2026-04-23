# Memory — Persistent Conventions & Gotchas

> Accumulated project knowledge that applies across ALL sessions. Read at EVERY session start.

---

## Chain is kitpot-2, NOT kitpot-1

Old docs and idea.md reference `kitpot-1`. The actual deployed rollup is **kitpot-2**.
- Chain ID: `64146729809684`
- Bridge ID: `1883`
- L1: `initiation-2` (Initia testnet)
- All contract addresses, RPC URLs, and chain config references should use kitpot-2.

## Deployed contract addresses (kitpot-2 testnet)

```
KitpotCircle:      0xecb3a0F9381FDA494C3891337103260503411621
KitpotReputation:  0xf10267F194f8E09F9f2aa8Fc435e7A2Dac58172a
KitpotAchievements: 0xC421652EC7efBad98dDF42646055e531a28f61Ea
MockUSDC:          0xe5e7064B389a5d4ACE1d93b3C5E36bF27b4274Fa
```

## Bridge / Interwoven Bridge is NOT implemented

The `/bridge` page has been intentionally replaced with a **Faucet** (mint MockUSDC only).
- Neither Drip nor Leticia (both serious hackathon submissions) have bridge UI
- Bridge requires OPinit running on VPS — too complex for demo reliability
- Judges use MockUSDC faucet to get tokens, then join circles
- Do NOT add back a bridge button unless OPinit is confirmed running and bridge is fully tested
- Navbar label: "Faucet" (href: `/bridge`)

## Token strategy: MockUSDC with public mint

MockUSDC is deployed at the address above. Anyone can call `mint(address, amount)` — no ownership check. This is intentional for testnet demo. Judges mint from the Faucet page.

## `contracts/` is NOT a Bun workspace

Foundry has its own toolchain (forge, anvil, cast). Never run `bun add` inside `contracts/`. Dependencies go through `forge install`. Only `apps/*` are Bun workspaces.

## `cycle_duration` MUST be configurable

Production: 2592000 seconds (30 days). Demo/testnet: 60 seconds. If hardcoded, the demo cannot show "automatic monthly contributions" live. This is the single most critical parameter for the hackathon demo.

## InterwovenKit wraps wagmi — no separate WagmiProvider needed

When using `InterwovenKitProvider`, it already includes wagmi setup. Adding a separate `WagmiProvider` causes double-provider issues.

## Auto-signing reference: Drip's GhostRegistry.sol pattern

The operator (contract) can ONLY call one specific function. Session limits: max amount per cycle, total cap, expiry timestamp. Study `github.com/KamiliaNHayati/Drip` before implementing auto-signing. **Auto-signing UI exists in frontend but has not been verified working on kitpot-2 testnet.**

## `.init` username resolution uses Move view function on L1

`usernames::get_name_from_address()` via Move view function on Initia L1. Cross-layer call — rollup frontend reads from L1 REST API.

## Bun uses `bun.lock` (not `bun.lockb`) in v1+

Older docs reference `bun.lockb` (binary lockfile). Bun 1.x switched to text-based `bun.lock`.

## Hackathon submission requires `.initia/submission.json`

Must contain: chain_id, contracts, demo_url, video_url. File exists at `.initia/submission.json`. `video_url` still TODO.

## Docker infra: `RUN_OPINIT=false` for demo

OPinit bots (executor + challenger) are set up in the Dockerfile but not required for demo — contracts and frontend work without them. Set `RUN_OPINIT=false` in VPS `.env` for reliable demo node. Only enable if bridge flow needs to be demonstrated.

## VPS deployment: arm64 on Mac, amd64 on VPS

`docker-compose.yml` in `infra/dokploy/` has `platform: linux/arm64` for local Mac M1 testing. Remove that line when deploying to VPS (standard amd64).
