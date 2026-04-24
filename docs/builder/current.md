# Current — Active Work & Context Recovery

> Read this file FIRST at every session start. It tells you exactly where to resume.

---

## HANDOFF — Plan 18 fully code-complete (2026-04-24)

All phases (1–6) and all post-audit gaps (G1–G3) are resolved. **Zero `useWriteContract` remaining in the codebase.** All transactions route through `useKitpotTx` → `requestTxBlock`/`submitTxBlock` with `/minievm.evm.v1.MsgCall`.

### What the user needs to do now (R1–R7):

1. **R1 — Start local rollup:** `weave rollup start -d`
2. **R2 — Confirm gas denom:** `minitiad query bank total --node http://localhost:26657` — if not `GAS`, update `NEXT_PUBLIC_KITPOT_NATIVE_SYMBOL` in `.env.local`
3. **R3 — Redeploy contracts** (session layer removed, new storage layout):
   ```bash
   cd contracts
   forge test -vv
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
   ```
4. **R4 — Fill `.env.local`** from `.env.example`, set contract addresses from deploy output
5. **R5 — Smoke test:** `bun dev` → connect wallet → create circle → join → deposit → toggle auto-sign → advanceCycle
6. **R6 — Record demo video** (1–3 min, script in plan §10)
7. **R7 — Final commit + fill `.initia/submission.json`:**
   - `commit_sha` ← `git rev-parse HEAD`
   - `deployed_address` ← KitpotCircle address from R3
   - `demo_video_url` ← YouTube/Loom link from R6

### Audit results (all clean):
- `grep useWriteContract apps/web/src` → **ZERO matches**
- `grep authorizeSession|revokeSession|... contracts/src apps/web/src` → **ZERO matches**
- `grep useInitUsername|getUsername|... apps/web/src` → **ZERO matches**
- `grep window.ethereum|createWalletClient|... apps/web/src` → **ZERO matches**
- `grep use-create-circle|use-auto-signing|use-init-username apps/web/src` → **ZERO matches**

---

## Post-audit gaps resolved (2026-04-24)

### G1 — advanceCycle migrated to useKitpotTx [DONE]
- Added `advanceCycle` method to `apps/web/src/hooks/use-kitpot-tx.ts`
- Rewrote `apps/web/src/components/circle/advance-cycle-button.tsx` — removed `useWriteContract`/`useWaitForTransactionReceipt`

### G2 — claimDailyQuest migrated to useKitpotTx [DONE]
- `KitpotReputation.claimDailyQuest()` is user-triggered (external, no modifier) → must migrate
- Added `claimDailyQuest` method to `use-kitpot-tx.ts`
- Removed `useClaimDailyQuest` from `use-reputation.ts`
- Updated `daily-quest-panel.tsx` to use `useKitpotTx().claimDailyQuest`
- Removed dead `useClaimDailyQuest` import from `dashboard/page.tsx`

### G3 — MockUSDC.mint migrated to useKitpotTx [DONE]
- Added `mintTestUSDC` method to `use-kitpot-tx.ts`
- Rewrote `use-bridge.ts` — removed `useWriteContract`/`useWaitForTransactionReceipt`

---

## Phase (2026-04-24) — Plan 18: Align to Hackathon [DONE — code only]

(see changelog for full details)
