# Kitpot vs Official Blueprints — Alignment Audit

> **Created:** 2026-04-25
> **Sources:** `docs/examples/blueprint-{1,2,3}.md` + live Kitpot code
> **Purpose:** Identify gaps where Kitpot's implementation can be tightened to match the patterns shown in official INITIATE example projects.

---

## Summary table

| Gap | Blueprint | Kitpot status | Priority | Est. fix |
|---|---|---|---|---|
| G1. `permissions` array missing in `autoSign.enable` | 1 (BlockForge) | ❌ Not passed | HIGH | 2 min |
| G2. Tx pattern: use `requestTxSync({autoSign, feeDenom})` vs split `submitTxBlock` | 1 (BlockForge) | ❌ Uses split pattern | MEDIUM | 15 min (refactor) |
| G3. `openBridge` without `srcChainId` / `srcDenom` | 2 (MiniBank) | ❌ No params | LOW | 2 min |
| G4. Circle member username uses stale stored string, not `useUsernameQuery` | 3 (MemoBoard) | ❌ Static `member.initUsername` | MEDIUM | 10 min |
| G5. Auto-sign error recovery missing | 1 (BlockForge) | ❌ No try/catch for "authorization not found" | LOW | 5 min |

Total fix effort if all applied: **~35 minutes**. All are non-architectural tweaks.

---

## Gap G1 — Auto-sign permissions scope

### Current Kitpot code (`apps/web/src/components/layout/auto-sign-toggle.tsx`)
```tsx
async function toggle() {
  if (enabled) await autoSign.disable(CHAIN_ID);
  else await autoSign.enable(CHAIN_ID);
}
```

### Blueprint pattern (BlockForge)
```tsx
await autoSign.enable(CHAIN_ID, {
  permissions: ["/initia.move.v1.MsgExecute"],
});
```

### Required fix
Kitpot is EVM, so the permission typeUrl is `/minievm.evm.v1.MsgCall`:

```tsx
async function toggle() {
  if (enabled) await autoSign.disable(CHAIN_ID);
  else await autoSign.enable(CHAIN_ID, {
    permissions: ["/minievm.evm.v1.MsgCall"],
  });
}
```

### Why it matters
Without explicit `permissions`, the granted authz scope defaults to whatever InterwovenKit SDK chooses. For the hackathon **Technical Execution & Initia Integration (30%)** rubric, scoring favors implementations that show correct use of the native API surface. Passing `permissions` matches the official pattern.

---

## Gap G2 — Tx submission pattern

### Current Kitpot code (`apps/web/src/hooks/use-kitpot-tx.ts`)
```tsx
const AUTO_SIGN_FEE = {
  amount: [{ denom: net.nativeSymbol, amount: "0" }],
  gas: "500000",
};

async function send(messages) {
  const isAuto = autoSign?.isEnabledByChain[CHAIN_ID] ?? false;
  if (isAuto) {
    return await submitTxBlock({ chainId: CHAIN_ID, messages, fee: AUTO_SIGN_FEE });
  }
  return await requestTxBlock({ chainId: CHAIN_ID, messages });
}
```

Two paths, manual fee object, distinct methods.

### Blueprint pattern (BlockForge)
```tsx
await requestTxSync({
  chainId: CHAIN_ID,
  autoSign: isAutoSignEnabled,
  feeDenom: isAutoSignEnabled ? NATIVE_DENOM : undefined,
  messages,
});
```

One method (`requestTxSync` here, but `requestTxBlock` accepts the same flags). InterwovenKit routes through the auto-sign path internally when `autoSign: true` is passed.

### Required fix (Kitpot version)
```tsx
async function send(messages) {
  const isAuto = autoSign?.isEnabledByChain[CHAIN_ID] ?? false;
  return await requestTxBlock({
    chainId: CHAIN_ID,
    messages,
    autoSign: isAuto,
    feeDenom: isAuto ? net.nativeSymbol : undefined,
  });
}
```

Delete `AUTO_SIGN_FEE` constant and the `submitTxBlock` import.

### Why it matters
- Simpler code path, single source of truth.
- Matches docs idiom exactly — judges reading the code see the canonical usage.
- Avoids bugs around `fee: StdFee` shape (which we hit during plan 18 execution).

### Gotcha
`requestTxBlock` with `autoSign: true` differs from `submitTxBlock` in return type — confirm by reading the InterwovenKit hook ref page (plan 18 §2.1). Test in dev before pushing prod.

---

## Gap G3 — Bridge modal pre-selection

### Current Kitpot code (`apps/web/src/app/bridge/page.tsx`)
```tsx
<Button onClick={() => openBridge()}>Open Bridge</Button>
```

### Blueprint pattern (MiniBank)
```tsx
openBridge({
  srcChainId: "initiation-2",
  srcDenom: "uinit",
});
```

### Required fix
```tsx
<Button
  onClick={() =>
    openBridge({
      srcChainId: "initiation-2",
      srcDenom: "uinit",
    })
  }
>
  Open Bridge
</Button>
```

Or cleaner: use `openDeposit` to express intent explicitly:

```tsx
const { openDeposit } = useInterwovenKit();
<Button
  onClick={() =>
    openDeposit({
      denoms: ["uinit"],
      chainId: "initiation-2",
    })
  }
>
  Deposit from Initia L1
</Button>
```

### Why it matters
- Pre-selected source = user clicks 2 times less
- `openDeposit` makes the intent ("assets in") explicit, matches docs' recommendation
- Demo video smoother — one click goes to prefilled modal

---

## Gap G4 — Username resolution in circle member list

### Current Kitpot code
**`apps/web/src/components/circle/turn-order.tsx:42`**
```tsx
{member.initUsername || member.addr.slice(0, 10) + "..."}
```

**`apps/web/src/components/circle/payment-status.tsx:29`**
```tsx
{member.initUsername || member.addr.slice(0, 10) + "..."}
```

Both render the `initUsername` string that was passed at `joinCircle(id, initUsername)` time — a **stored snapshot** on-chain, not a live lookup.

### Blueprint pattern (MemoBoard)
```tsx
function MessageRow({ message }) {
  const { data: senderUsername } = useUsernameQuery(message.sender);
  return <span>{senderUsername ? senderUsername : truncate(message.sender)}</span>;
}
```

Per-row live resolution. If sender later claims/renames a `.init` handle, UI updates next load.

### Required fix
Kitpot already has the wrapper component `apps/web/src/components/username/init-username.tsx`:

```tsx
export function InitUsername({ address, fallback, className }) {
  const { data: username } = useUsernameQuery(address);
  if (username) return <span className={className}>{username}</span>;
  return <span className={className}>{fallback ?? truncateAddress(address)}</span>;
}
```

Just **use it** in the two broken rows:

```tsx
// turn-order.tsx
<InitUsername
  address={member.addr}
  fallback={member.initUsername || undefined}
  className="..."
/>

// payment-status.tsx — same pattern
<InitUsername address={member.addr} fallback={member.initUsername || undefined} />
```

The `fallback` prop keeps backward-compat: if a user joined a circle before claiming `.init`, the stored `initUsername` is their self-typed string (e.g. "pochita.init" or even just their address), which is used as a last-resort display.

### Why it matters
- **This is literally the native feature `.init` showcase** — rubric criterion says "Initia-native functionality integrated in a meaningful way".
- Currently `member.initUsername` string stored on-chain is whatever user typed at join — might be "0x3338..." text (not even an `.init`). Live query fixes this to show REAL registered username.
- Users who claim `.init` after joining won't have UI update without this.

---

## Gap G5 — Auto-sign error recovery

### Current Kitpot code
```tsx
if (enabled) await autoSign.disable(CHAIN_ID);
else await autoSign.enable(CHAIN_ID);
```

No try/catch.

### Blueprint pattern (BlockForge)
```tsx
if (isEnabled) {
  try {
    await autoSign.disable(CHAIN_ID);
  } catch (err) {
    if (String(err?.message).includes("authorization not found")) {
      // Defensive re-enable → then clean disable
      await autoSign.enable(CHAIN_ID, { permissions: ["/initia.move.v1.MsgExecute"] });
      await autoSign.disable(CHAIN_ID);
    }
  }
}
```

### Required fix (Kitpot)
```tsx
async function toggle() {
  if (enabled) {
    try {
      await autoSign.disable(CHAIN_ID);
    } catch (err) {
      if (String((err as Error)?.message).includes("authorization not found")) {
        await autoSign.enable(CHAIN_ID, { permissions: ["/minievm.evm.v1.MsgCall"] });
        await autoSign.disable(CHAIN_ID);
      }
      // Else: let error propagate or show toast
    }
  } else {
    await autoSign.enable(CHAIN_ID, { permissions: ["/minievm.evm.v1.MsgCall"] });
  }
}
```

### Why it matters
InterwovenKit's auto-sign state can desync between client cache and L1 chain state (e.g. grant expired on-chain but client thinks still active). User toggles "off" → disable tx fails with "authorization not found". Without recovery, user is stuck. Blueprint pattern is canonical self-heal.

---

## Ready-to-apply patch summary

Three files touched, five gaps closed:

1. **`apps/web/src/components/layout/auto-sign-toggle.tsx`**
   - Add `permissions: ["/minievm.evm.v1.MsgCall"]` to `enable()` call (G1)
   - Wrap `disable()` in try/catch with re-enable recovery (G5)

2. **`apps/web/src/hooks/use-kitpot-tx.ts`**
   - Replace `submitTxBlock + requestTxBlock` split with single `requestTxBlock({ autoSign, feeDenom })` path (G2)
   - Delete `AUTO_SIGN_FEE` constant (no longer needed)

3. **`apps/web/src/app/bridge/page.tsx`**
   - Pass `srcChainId: "initiation-2"`, `srcDenom: "uinit"` to `openBridge` (G3)
   - (Optional) swap to `openDeposit` for clearer intent

4. **`apps/web/src/components/circle/turn-order.tsx`**
   - Import `InitUsername` and replace `{member.initUsername || ...}` one-liner (G4)

5. **`apps/web/src/components/circle/payment-status.tsx`**
   - Same as turn-order.tsx (G4)

All changes are ≤ 10 LOC each. No contract changes needed (G4 works with existing `Member.initUsername` as fallback).

## Post-fix alignment matrix

| Native feature | Blueprint | Kitpot after fixes |
|---|---|---|
| Auto-signing | BlockForge (Blueprint 1) | ✅ Full alignment — permissions, requestTxBlock(autoSign:true), error recovery |
| Interwoven Bridge | MiniBank (Blueprint 2) | ✅ Full alignment — openBridge/openDeposit with pre-filled params |
| Initia Usernames | MemoBoard (Blueprint 3) | ✅ Full alignment — useUsernameQuery live resolution per row |

After these 5 gaps are closed, Kitpot implementation matches all three official blueprint patterns across all three native features. Expected scoring impact: **+3 to +5 points on Technical Execution & Initia Integration (30%)** criterion, pushing estimated total from ~85/100 to ~88-90/100.

## Recommended order

1. G1 (2 min) — permissions scope, easy win, improves scoring language immediately
2. G4 (10 min) — username live resolution, biggest UX uplift, directly showcases native feature
3. G3 (2 min) — bridge pre-fill, tiny UX polish for demo
4. G5 (5 min) — error recovery, defensive, invisible but good engineering
5. G2 (15 min) — tx pattern refactor, biggest LOC change but biggest code simplification

Do them as one commit: `chore(native-align): match auto-sign/bridge/username patterns to official blueprints`.

---

## Execution result (2026-04-25)

Applied the 5 gaps with the following outcome:

| Gap | Status | Notes |
|---|---|---|
| G1 — `permissions` in `autoSign.enable()` | ❌ **REJECTED by SDK type check** | `EnableAutoSignOptions` in @initia/interwovenkit-react@2.8.0 does NOT accept `permissions`. TypeScript error: `Object literal may only specify known properties`. Reverted. Plan 18 §2.2 had already flagged this as docs/skill-file discrepancy vs actual SDK. Permissions should be declared via provider `enableAutoSign` prop (already set: `{ "kitpot-2": ["/minievm.evm.v1.MsgCall"] }` in `providers.tsx`). |
| G2 — unify to `requestTxBlock({autoSign, feeDenom})` | ❌ **REJECTED by SDK type check** | `TxRequest` type does NOT have `autoSign` property in @2.8.0. TypeScript error: `Object literal may only specify known properties, and 'autoSign' does not exist in type 'TxRequest'`. Kept original split: `submitTxBlock(fee)` for auto-sign path, `requestTxBlock` for drawer path. BlockForge blueprint pattern is from different SDK version. |
| G3 — `openDeposit({denoms, chainId})` for bridge | ✅ **APPLIED** | Switched from `openBridge()` (no params) to `openDeposit({ denoms: ["uinit"], chainId: "initiation-2" })`. Modal now pre-filled for L1 → kitpot-2 flow. |
| G4 — `<InitUsername />` in circle member list | ✅ **APPLIED** | Both `turn-order.tsx` and `payment-status.tsx` now render `<InitUsername address={member.addr} fallback={member.initUsername} />` instead of static `{member.initUsername || addr.slice(0,10)}`. Live resolution via `useUsernameQuery` per row — the canonical `.init` showcase pattern from MemoBoard. |
| G5 — error recovery in auto-sign toggle | ✅ **APPLIED** | Wrapped `disable()` in try/catch. On "authorization not found", re-enable + disable to reset state. Without permissions arg (SDK constraint). |

### Type check verdict after all fixes

```
$ bunx tsc --noEmit
exit: 0
$ bun run build
✓ Compiled successfully
```

All changes pass TypeScript + Next.js production build.

### UX clarification added

Faucet page (`/bridge`) now distinguishes:
- **USDC** (MockUSDC) — mint via public faucet button. This is what circles use for contributions.
- **GAS** (native kitpot-2) — bridged via Interwoven Bridge from Initia L1 (`uinit`). Used for tx fees. Most connects are auto-funded by `/api/gas-faucet` route, so Bridge is backup for run-outs.

### Remaining alignment status

| Native feature | Blueprint ref | Kitpot status post-fixes |
|---|---|---|
| Auto-signing | BlockForge (Blueprint 1) | **Partial** — we match the intent (native authz+feegrant via InterwovenKit) but API surface differs because of SDK version. Permissions declared in provider prop (plan 18 §2.4 confirmed working). |
| Interwoven Bridge | MiniBank (Blueprint 2) | ✅ Full alignment — `openDeposit` with pre-filled params. |
| Initia Usernames | MemoBoard (Blueprint 3) | ✅ Full alignment — `useUsernameQuery` live resolution per row via `<InitUsername />` wrapper. |

### Takeaway for future AI sessions

If you reopen blueprint patterns vs Kitpot code, **DO NOT re-apply G1 or G2** unless SDK version bumps. Current type definitions in @initia/interwovenkit-react@2.8.0 don't support those options. Verify with `bunx tsc --noEmit` before assuming blueprint-exact match is possible.

The Kitpot approach (split `submitTxBlock` + `requestTxBlock`, permissions via provider prop) is **semantically equivalent** to BlockForge's `requestTxSync({autoSign, feeDenom})` pattern — both produce the same on-chain result (silent tx via session wallet + authz + feegrant). Only the API ergonomics differ, and the SDK type check is the source of truth for our version.
