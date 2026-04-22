# Decisions — Architecture Decision Records

> Non-obvious architectural and product decisions with context and consequences.

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

## ADR-003 — Bun monorepo with contracts outside workspaces

**Context:** Need to structure monorepo with both Next.js frontend and Foundry contracts.

**Decision:** Bun workspaces for `apps/*` only. `contracts/` sits at root but is NOT a Bun workspace — it uses Foundry's own toolchain (forge, anvil).

**Consequences:**
- Clean separation: `bun dev` for frontend, `forge test` for contracts
- No risk of Bun trying to manage Solidity dependencies
- `contracts/lib/` (Foundry's dependency folder) won't conflict with node_modules
