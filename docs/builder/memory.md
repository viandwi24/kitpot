# Memory — Persistent Conventions & Gotchas

> Accumulated project knowledge that applies across ALL sessions. Read at EVERY session start.

---

## `contracts/` is NOT a Bun workspace

Foundry has its own toolchain (forge, anvil, cast). Never run `bun add` inside `contracts/`. Dependencies go through `forge install`. Only `apps/*` are Bun workspaces.

## `cycle_duration` MUST be a configurable contract parameter

Production: 2592000 seconds (30 days). Demo/testnet: 60 seconds. If this is hardcoded, the demo cannot show "automatic monthly contributions" live in 3 minutes. This is the single most critical parameter for the hackathon demo.

## InterwovenKit wraps wagmi — no separate WagmiProvider needed

When using `InterwovenKitProvider`, it already includes wagmi setup. Adding a separate `WagmiProvider` causes double-provider issues.

## Auto-signing reference: Drip's GhostRegistry.sol pattern

The operator (contract) can ONLY call one specific function. Session limits: max amount per cycle, total cap, expiry timestamp. Study `github.com/KamiliaNHayati/Drip` before implementing auto-signing.

## `.init` username resolution uses Move view function on L1

Pattern from SocialYield: `usernames::get_name_from_address()` via Move view function on Initia L1. This is a cross-layer call — rollup contract reads from L1.

## Bun uses `bun.lock` (not `bun.lockb`) in v1+

Older docs reference `bun.lockb` (binary lockfile). Bun 1.x switched to text-based `bun.lock`.

## Interwoven Bridge framing: "deposit to rollup", NOT "bridge from Ethereum"

Since we deploy our own rollup (`kitpot-1`), user assets are on Initia hub/mainnet. Interwoven Bridge moves assets from hub to our rollup. This is architecturally required, not an optional feature.

## EVM public testnet Chain ID: 2124225178762456

For `evm-1` testnet. Our rollup `kitpot-1` Chain ID is determined after `weave init`.

## Hackathon submission requires `.initia/submission.json`

Must contain: chain_id, contract_address, demo_url, video_url. Check exact format at `docs.initia.xyz/hackathon/submission-requirements`.
