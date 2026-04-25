# Plan 20 — Bridge Withdraw Button + Multi-Token Circles

> **Created:** 2026‑04‑25
> **Parent:** Plan 18 (§13), Plan 19 (§12) — hackathon alignment & judge-POV work already shipped.
> **Goal:** strengthen the Interwoven Bridge narrative to official-blueprint quality and unlock multi-token circles so Kitpot visibly matches (and exceeds) the Leticia reference bar.
> **Deadline:** 2026‑04‑27 00:00 UTC (INITIATE submission).
> **Primary source:** <https://docs.initia.xyz/hackathon/examples/evm-bank> (MiniBank).
> **Secondary:** `docs/examples/blueprint-2.md`, `docs/examples/kitpot-vs-blueprints.md`, `refs/ltcia/`.

---

## 1. Why this plan exists

### 1.1 What the Initia docs actually say

Direct quotes from <https://docs.initia.xyz/hackathon/examples/evm-bank>:

- **Bridge can be non-functional locally and still score:** *"You can still add bridge functionality now. In your hackathon submission, explain the user flow (for example: bridge INIT or other assets from L1 to your appchain, then deposit them in MiniBank) and why this matters (faster onboarding, easier liquidity access, and immediate utility in your app)."*
- **Why our modal shows "No available assets":** *"The Interwoven UI only resolves registered chain IDs, so your local appchain and token may not appear during local testing."* — `kitpot-2` is not yet in the Initia chain registry, so the InterwovenKit modal queries L1 balances and finds nothing because the user's fresh wallet has no `uinit` on `initiation-2` yet. **This is documented expected behavior.**
- **Native `msg.value` vs ERC20 tradeoff, verbatim:** *"Native token deposits use `msg.value` (direct Ether-style transfers), not ERC20 wrappers — appropriate for this basic piggy bank pattern but limiting for multi-asset scenarios."* — Kitpot is explicitly a multi-asset scenario (different circles can use different stablecoins), so ERC20 is the correct pattern per docs.
- **"Meaningful" bar:** *"integrate actual wallet connection via InterwovenKit, implement real balance queries via JSON-RPC `eth_call`, and expose bridge entry points to demonstrate ecosystem awareness — not just UI placeholders."* — Kitpot already meets all three.

### 1.2 What the Leticia reference actually ships

Audit of `refs/ltcia/` (2026‑04‑25):

| Feature | Leticia | Kitpot (current) |
|---|---|---|
| InterwovenKit wallet connect | ✅ | ✅ |
| Auto-signing (`enableAutoSign`, `submitTxBlock`) | ❌ zero matches | ✅ |
| `.init` usernames (`useUsernameQuery`) | ❌ zero matches | ✅ |
| Interwoven Bridge (`openDeposit`/`openBridge`/`openWithdraw`) | ❌ zero matches | ⚠️ deposit only |
| Multi-token ERC20 circles | ✅ 3 mock tokens (INIT/sINIT/USDe) | ❌ only MockUSDC |

Kitpot already surpasses Leticia on three dimensions. The one gap is **multi-token**, and the bridge narrative is currently one-directional (deposit only). This plan closes both in one stroke.

### 1.3 What we explicitly are **not** doing (and why)

Rejected alternatives — keep this list so future sessions do not re-litigate:

| Option | Why rejected |
|---|---|
| Deploy a `WINIT` wrapper contract for native `uinit` | Not the official Initia pattern. MiniBank blueprint uses native `msg.value` directly. WINIT is a DeFi convention from Ethereum (Uniswap, WETH) that Initia docs do not prescribe. Adds contract complexity and tests for zero scoring gain. |
| Refactor `KitpotCircle` to accept native `uinit` via `payable` (MiniBank-style) | Official docs acknowledge native is *"limiting for multi-asset scenarios"*. Kitpot is multi-asset by design. Refactor is high-risk (~2–3 h plus test/redeploy) against <48 h deadline. |
| Bridge a real asset (e.g., Noble USDC) end-to-end | Requires chain registry changes outside our control and live IBC paths the testnet does not expose to a side rollup like `kitpot-2`. Docs sanction the "no available assets" locally; narrative is sufficient. |

---

## 2. Scope (coding only — no deploy/test in this plan)

This plan covers **code changes only**. Testing, build verification, contract deploy, data seeding, and Vercel redeploy are **deferred** and gated on explicit user confirmation once all code lands.

### 2.1 In scope

1. **Withdraw bridge button** — second InterwovenKit bridge entry point (`openWithdraw`) surfaced on the faucet/bridge page so the narrative is bidirectional.
2. **Second mock ERC20** — `MockUSDe.sol` (Ethena-style stablecoin, 6 decimals to mirror MockUSDC shape). Deployed alongside MockUSDC. Naming mirrors Leticia's convention for ecosystem familiarity.
3. **Multi-token create-circle** — token picker (USDC / USDe) in the create-circle form. `useKitpotTx.createCircle` already passes `paymentToken` by-address to the on-chain `createCircle`; UI just needs to let the user choose.
4. **Multi-token faucet** — second mint row for MockUSDe, both balances visible.
5. **Multi-token dashboard / discover display** — surfaces token symbol per circle (read on-chain from `paymentToken`).
6. **Plan docs** — this file plus updates to plan 18 §13 and plan 19 §12 when execution completes.

### 2.2 Out of scope (do not touch)

- `KitpotCircle.sol`, `KitpotReputation.sol`, `KitpotAchievements.sol` — no ABI changes.
- `MockUSDC.sol` — do not modify; stays deployed.
- Auto-sign flow, username flow, existing circle flow — all untouched.
- Deployment scripts, env files, CI — deferred to post-code user step.

### 2.3 Deferred (do after coding confirmation)

- `forge test` pass.
- `bun run build` green.
- `forge script script/Deploy.s.sol` re-run (only if the user wants fresh deploy; MockUSDe can be deployed incrementally with a new one-shot script).
- `.deployed.json` update with new MockUSDe address.
- `.env` / Vercel env vars for `NEXT_PUBLIC_USDE_ADDRESS`.
- Seed one demo USDe circle via `scripts/test/create-circle.ts` (parametrize by token).
- Manual Chrome QA of the two bridge buttons.
- Update `.initia/submission.json` if addresses change.

---

## 3. File-by-file change set

Ordered by dependency. All paths absolute from repo root `/Users/solpochi/Projects/self/kitpot`.

### 3.1 Contracts — new token only

**Create** `contracts/src/MockUSDe.sol`
- Copy `contracts/src/MockUSDC.sol` byte-for-byte, rename:
  - Contract name `MockUSDC` → `MockUSDe`
  - Constructor `ERC20("Mock USDC", "USDC")` → `ERC20("Mock USDe", "USDe")`
  - NatSpec comment reflects USDe (Ethena-style stablecoin).
- Keep `decimals()` at `6` so `USDC_DECIMALS = 6` constant continues to work across both tokens (simpler UI math; Ethena's real USDe is 18 decimals but our mock is testnet-only and we optimize for code reuse). Record this deviation in §5.

**Create** `contracts/script/DeployMockUSDe.s.sol`
- Single-purpose script that deploys only `MockUSDe`, logs the address in the same `=== DEPLOYMENT COMPLETE ===` style as `Deploy.s.sol`, and emits the env-var line for the frontend (`NEXT_PUBLIC_USDE_ADDRESS=...`).
- **Do not touch** existing `Deploy.s.sol` so fresh-env runs still work.

### 3.2 ABI + config — add USDe plumbing

**Create** `apps/web/src/lib/abi/MockUSDe.ts`
- Mirror `MockUSDC.ts` (same ABI; different filename is intentional so grep-ability per token is clean).

**Edit** `apps/web/src/lib/network.ts`
- Extend `NetworkConfig.contracts` with `mockUSDe: \`0x${string}\``.
- Read `NEXT_PUBLIC_USDE_ADDRESS` with `"0x"` fallback (same pattern as existing addresses).

**Edit** `apps/web/src/lib/contracts.ts`
- Add `USDE_DECIMALS = 6` constant next to `USDC_DECIMALS`.
- Add a new exported `PAYMENT_TOKENS` map so UI can loop over supported tokens without branching:
  ```ts
  export const PAYMENT_TOKENS = [
    { symbol: "USDC", address: CONTRACTS.mockUSDC, decimals: USDC_DECIMALS, name: "Mock USDC" },
    { symbol: "USDe", address: CONTRACTS.mockUSDe, decimals: USDE_DECIMALS, name: "Mock USDe" },
  ] as const;
  export type PaymentToken = (typeof PAYMENT_TOKENS)[number];
  ```

### 3.3 `useKitpotTx` — generalize mint/approve per token

**Edit** `apps/web/src/hooks/use-kitpot-tx.ts`
- Change signatures so existing USDC calls keep working by default but can target any ERC20:
  - `approveUSDC(spender, amount?)` → `approveToken(tokenAddress, spender, amount?)`. Keep a thin wrapper `approveUSDC` that delegates with `CONTRACTS.mockUSDC` so existing callers don't break.
  - `mintTestUSDC(to, amount)` → `mintToken(tokenAddress, to, amount)`. Keep the old `mintTestUSDC` wrapper for same reason.
- No changes needed to `createCircle` — it already accepts `paymentToken` implicitly via `CONTRACTS.mockUSDC`; we'll add that parameter in §3.4.

### 3.4 Create-circle form — token picker

**Edit** `apps/web/src/hooks/use-kitpot-tx.ts` (continued)
- Update the `createCircle` helper signature to accept an explicit `paymentToken: \`0x${string}\`` instead of hardcoding `CONTRACTS.mockUSDC`. Default argument value = `CONTRACTS.mockUSDC` so any existing caller that does not pass the token still works.

**Edit** `apps/web/src/components/circle/create-circle-form.tsx`
- Add a `PaymentToken` state, default to `PAYMENT_TOKENS[0]` (USDC).
- Insert a segmented button group above the "Contribution per Cycle" input:
  ```
  Payment Token:  [USDC ●]  [USDe ○]
  ```
- Replace hardcoded `CONTRACTS.mockUSDC` references with `paymentToken.address` for:
  - `useReadContract` allowance read.
  - `approveUSDC(...)` → `approveToken(paymentToken.address, CONTRACTS.kitpotCircle)`.
  - `createCircle({..., paymentToken: paymentToken.address})` — requires §3.3 change.
- Replace hardcoded "USDC" labels in the summary card with `paymentToken.symbol`.
- Keep `USDC_DECIMALS` assumption because both mocks are 6 decimals; add a TODO comment noting that if a future token has different decimals the form must read `paymentToken.decimals`.

**Edit** `apps/web/src/hooks/use-create-circle.ts` (if it exists — verify)
- If it also hardcodes the token, adjust identically.

### 3.5 Faucet / bridge page — two mint rows + withdraw button

**Edit** `apps/web/src/app/bridge/page.tsx`
- Keep existing `useTokenBalance(CONTRACTS.mockUSDC)` and mint row, but render it inside a `PAYMENT_TOKENS.map(...)` loop so USDe renders automatically.
- For each token, show `Your Balance: <n> <symbol>` + its own `Mint X <symbol>` button bound to `mintToken(token.address, address, parseUnits(amount, token.decimals))`.
- Split the current "Bridge GAS from Initia L1" card into a section with **two** buttons side-by-side (stacked on narrow viewports):

  ```
  ┌──────────────────────────────────────────────┐
  │ Interwoven Bridge                            │
  │ Native GAS (uinit) flows between Initia L1   │
  │ and kitpot-2. Bridge in if auto-faucet runs  │
  │ out; bridge out to move funds back to L1.    │
  │                                              │
  │  [ Deposit from L1 → ]  [ Withdraw to L1 → ] │
  └──────────────────────────────────────────────┘
  ```

- Wire `Deposit from L1` to the existing `openDeposit({ denoms: ["uinit"], chainId: "initiation-2" })`.
- Wire `Withdraw to L1` to `openWithdraw({ denoms: ["uinit"], chainId: net.cosmosChainId })` where `net.cosmosChainId` comes from `getNetworkConfig()`.
- Update subtitle/copy to the user-flow narrative the Initia docs explicitly ask for: *"Bridge INIT between Initia L1 (`initiation-2`) and kitpot-2. This demonstrates how Kitpot plugs into the Interwoven Stack for faster onboarding and easier liquidity access."*
- Note in the card description: *"If the bridge modal shows 'No available assets', your wallet has no `uinit` on the source chain yet — documented limitation of the Interwoven UI when chain IDs are not in the public registry."* (Quote from official docs; prevents judge confusion.)

### 3.6 Circle lists / discover — show token symbol

**Edit** `apps/web/src/hooks/use-circles.ts`
- `CircleData` already has `paymentToken: \`0x${string}\`` (confirm by reading the file). If not, extend it and make sure the on-chain read includes `paymentToken`.
- Add a derived `tokenSymbol: string` field to the shape returned to UI: look up `paymentToken` in `PAYMENT_TOKENS`, default to `"TOKEN"` if unknown.

**Edit** `apps/web/src/app/discover/page.tsx` and `apps/web/src/app/dashboard/page.tsx`
- Replace hardcoded "USDC" in circle row strings with `circle.tokenSymbol`.
- Do the same in any per-circle detail page where the contribution unit appears (`apps/web/src/app/circles/[id]/page.tsx`, `deposit-button.tsx`, `turn-order.tsx`, `payment-status.tsx`).
- Use grep (`grep -rn '\bUSDC\b' apps/web/src`) to find all hits; the UI must not hardcode "USDC" anywhere downstream.

### 3.7 No-op verification points (leave a comment in code)

- Reputation and achievements contracts do not care about the token, so no changes there.
- Join/deposit flows read `paymentToken` from on-chain circle state, so they already work for any ERC20.

---

## 4. Execution order (strict)

Follow this order so the app compiles at every step.

1. 3.1 Contracts — new `MockUSDe.sol` + its deploy script.
2. 3.2 Config — ABI + network.ts + contracts.ts + `PAYMENT_TOKENS` map. (App still builds even if `mockUSDe` address is `"0x"`.)
3. 3.3 `useKitpotTx` — generalize helpers. Keep old names as thin wrappers so nothing else breaks yet.
4. 3.4 Create-circle form — token picker + wire new helper.
5. 3.5 Faucet page — two mint rows + bidirectional bridge card.
6. 3.6 Dashboard / discover / detail — token symbol surfacing.
7. Run `tsc --noEmit` locally to make sure everything compiles. **Do not** run tests, build, or deploy — stop and await user confirmation.

---

## 5. Decisions & caveats (for the next session to inherit)

- **MockUSDe uses 6 decimals** (not Ethena's real 18) so the existing `USDC_DECIMALS` math works unchanged across both mocks. Document this in `MockUSDe.sol` NatSpec. If judges query the ABI they will see 6 decimals; this is honest for a testnet mock.
- **Token picker uses a segmented button, not a `<select>`** to stay consistent with the existing cycle-duration picker in the same form.
- **`PAYMENT_TOKENS` is a static tuple**, not fetched from chain. If we add a third token later, add it to the array — no chain registry needed.
- **`openWithdraw` source chain = `net.cosmosChainId`** (not the EVM chain id). InterwovenKit uses Cosmos chain IDs for its modals; passing the EVM number will produce a silent modal.
- **We are NOT adding a "Bridge" navbar entry.** All bridge entry points live on `/bridge` (previously `/faucet`) — keep the single page simple so judges don't hunt.
- **Copy must reuse the exact phrase** from Initia hackathon docs: *"bridge INIT or other assets from L1 to your appchain"*. This makes it obvious to judges that we followed their official guidance.

---

## 6. Success criteria (coding phase only)

Coding is complete when all of the following are true — **verified by reading the diff, not by running the app**:

- `MockUSDe.sol` and `DeployMockUSDe.s.sol` exist and compile-check under Foundry conventions.
- `apps/web/src/lib/abi/MockUSDe.ts` exists.
- `NetworkConfig.contracts` includes `mockUSDe`.
- `PAYMENT_TOKENS` exported from `contracts.ts`.
- `useKitpotTx` exposes `approveToken` and `mintToken` (existing `approveUSDC` / `mintTestUSDC` remain as wrappers).
- `createCircle` in `useKitpotTx` accepts `paymentToken` parameter (default retained).
- Create-circle form has a USDC/USDe picker and wires the right address downstream.
- Faucet page shows two mint rows + two bridge buttons (Deposit + Withdraw).
- `grep -rn '\bUSDC\b' apps/web/src` returns only legitimate remaining hits (constants, default labels, ABI filename) — no hardcoded "USDC" in circle-display strings.
- `bun tsc --noEmit` passes cleanly.
- No test run, no build, no deploy, no env change.

Once all the above are satisfied, pause and tell the user. The user will drive test / build / deploy / seed steps manually.

---

## 7. Post-code checklist (do NOT run during code phase)

Reference for the user to drive after confirmation:

1. `cd contracts && forge test -vv` — should stay green.
2. Deploy `MockUSDe`:
   ```bash
   cd contracts
   forge script script/DeployMockUSDe.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
   ```
3. Record address → `scripts/test/.deployed.json` and Vercel env `NEXT_PUBLIC_USDE_ADDRESS`.
4. `bun run build` in `apps/web` — verify production build.
5. Commit + push; Vercel redeploys.
6. Chrome QA: mint USDe, create a USDe circle, verify discover + dashboard show correct symbol, click Deposit + Withdraw buttons, confirm modals open (both will likely show "No available assets" locally — documented expected).
7. Update `docs/plans/18-align-hackathon.md` §13 and `docs/plans/19-testings-as-judges-pov.md` §12 with the completion log.
8. Draft README.md at repo root per plan 19 §10.

---

## 8. References

- Official Initia docs: <https://docs.initia.xyz/hackathon/examples/evm-bank>
- Blueprint 2 (MiniBank) summary: `docs/examples/blueprint-2.md`
- Blueprint gap analysis: `docs/examples/kitpot-vs-blueprints.md`
- Leticia reference: `refs/ltcia/`
- Prior plans: `docs/plans/18-align-hackathon.md`, `docs/plans/19-testings-as-judges-pov.md`
