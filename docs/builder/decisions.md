# Decisions — Architecture Decision Records

> Non-obvious architectural and product decisions with context and consequences.

---

## ADR-007 — Remove NetworkSwitcher, single env-driven config

**Date:** 2026-04-24

**Context:** The old network system had a dual local/testnet switcher with localStorage overrides. With the move to Initia-native transaction flow (Cosmos RPC + REST required), the Anvil-based local network no longer works. All transactions must go through `requestTxBlock`/`submitTxBlock` which need a real Initia rollup (weave CLI or VPS).

**Decision:** Replace dual network system with single env-driven config. One set of env vars, no runtime switching. To switch networks, change `.env.local` and restart.

**Consequences:** Simpler codebase. No localStorage config drift. Users must use `weave rollup start` for local dev, not `anvil`.

---

## ADR-006 — All tx via requestTxBlock/submitTxBlock, no window.ethereum

**Date:** 2026-04-24

**Context:** DoraHacks INITIATE rules require "InterwovenKit for wallet connection and/or transaction handling." Using `window.ethereum` / `wagmi.writeContract` bypasses InterwovenKit and breaks auto-signing integration.

**Decision:** Route ALL write transactions through `requestTxBlock` (manual confirm) or `submitTxBlock` (auto-sign mode) with `/minievm.evm.v1.MsgCall` message type. Single hook `use-kitpot-tx.ts` wraps all contract calls.

**Consequences:** Satisfies eligibility. Auto-signing works natively. Cannot use `wagmi.useWriteContract` for core flows (deposit/create/join). Read-only wagmi hooks (useReadContract) are still fine.

---

## ADR-005 — Remove custom Solidity session layer, use native autoSign

**Date:** 2026-04-24

**Context:** The contract had a full homegrown session-key system (`authorizeSession`, `revokeSession`, `depositOnBehalf`, `batchDeposit`). This duplicates Initia's native auto-signing (Cosmos `x/authz` + `x/feegrant`), exposed via `InterwovenKitProvider.enableAutoSign` and `autoSign.enable(chainId)`.

**Decision:** Strip the custom session layer from `KitpotCircle.sol`. Use InterwovenKit's `autoSign` drawer. Each member enables auto-sign once; subsequent `deposit()` calls go via `submitTxBlock` silently.

**Consequences:**
- Contract is simpler (~90 fewer lines of Solidity)
- Requires contract redeployment (storage layout change)
- Auto-signing is real Cosmos-level authz+feegrant — exactly what judges look for
- Lost: batch deposit in single tx (now each member's deposit is individual). Acceptable for MVP.

---

## ADR-004 — Bridge UI removed, replaced with Faucet

**Date:** 2026-04-23

**Context:** The `/bridge` page had two sections: (1) "Interwoven Bridge" button that called `alert()` — a TODO placeholder, broken; (2) Testnet Faucet that mints MockUSDC — working. Neither Drip nor Leticia (both serious hackathon submissions) have bridge UI. Bridge requires OPinit bots running on VPS plus real token flow from L1 — too complex to reliably demo.

**Decision:** Remove the broken bridge card entirely. Rename the page and navbar item to "Faucet". Keep only the mint MockUSDC functionality.

**Consequences:**
- No broken button visible to judges
- Judges can get test tokens easily (friction-free demo)
- Interwoven Bridge is no longer listed as a feature — honest
- Does not hurt scoring: Drip and Leticia win without bridge; scoring favors working demo over broken feature UI
- If OPinit is confirmed running on VPS in future, can add `openBridge()` back (one line from InterwovenKit)

---

## ADR-003 — Bun monorepo with contracts outside workspaces

**Context:** Need to structure monorepo with both Next.js frontend and Foundry contracts.

**Decision:** Bun workspaces for `apps/*` only. `contracts/` sits at root but is NOT a Bun workspace — it uses Foundry's own toolchain (forge, anvil).

**Consequences:**
- Clean separation: `bun dev` for frontend, `forge test` for contracts
- No risk of Bun trying to manage Solidity dependencies
- `contracts/lib/` (Foundry's dependency folder) won't conflict with node_modules

---

## ADR-002 — Round-robin over VRF/commit-reveal for pot distribution order

**Context:** Need to determine which member gets the pot each cycle. VRF is not available built-in on Initia (confirmed via organizer Q&A). Commit-reveal adds complexity.

**Decision:** Use deterministic round-robin for MVP. Order is set at circle creation time.

**Consequences:**
- Simpler to implement and demo
- Predictable — members know exactly when their turn is
- Trade-off: no randomness, but for arisan this is actually the norm (many real-world arisans use fixed order)
- Can upgrade to commit-reveal in v2 if needed

---

## ADR-001 — Solidity + Foundry over Move for smart contracts

**Context:** Initia docs recommend Move for Gaming & Consumer track. We need to choose contract language for Kitpot.

**Decision:** Use Solidity 0.8.26 + Foundry + OpenZeppelin v5.

**Consequences:**
- Faster execution — team is familiar with Solidity, no Move learning curve
- Drip (auto-signing reference) is Solidity — can copy patterns directly
- Leticia, Hex Vault, Gam3Hub in the same hackathon use EVM + Gaming track — validates this is acceptable
- 30% Technical+Initia scoring can be fulfilled via InterwovenKit + rollup deploy, not contract language
- Trade-off: may miss bonus points if judges strongly prefer Move
