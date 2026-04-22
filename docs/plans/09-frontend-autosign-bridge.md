# Plan 09 — Frontend: Auto-Signing UI & Interwoven Bridge

> Goal: User bisa setup auto-signing session 1x klik, dan deposit dari Initia hub ke kitpot-1 via Interwoven Bridge. Ini "wow moment" untuk demo.

---

## Scope

- Auto-signing setup UI (one-time approve: ERC20 allowance + session authorization)
- Auto-signing status display (active/expired/revoked)
- Revoke session UI
- Interwoven Bridge deposit UI (via InterwovenKit's `openBridge`)
- Integration ke circle dashboard

## Non-goals

- Backend keeper/cron untuk trigger batchDeposit (out of scope MVP — demo uses manual trigger)
- Tidak run app

---

## Auto-Signing Flow (User Perspective)

```
User join circle
  ↓
Dashboard shows: "Setup Iuran Otomatis"
  ↓
User klik "Aktifkan"
  ↓
Step 1: Approve USDC (ERC20 approve to contract, amount = contribution × totalCycles)
  ↓
Step 2: Authorize session (contract call: authorizeSession)
  ↓
Done! Dashboard shows: "✅ Iuran Otomatis Aktif — berlaku sampai [date]"
  ↓
Setiap cycle, siapapun bisa trigger batchDeposit() dan iuran user terdebit otomatis
```

---

## Components

### `apps/web/src/components/circle/auto-signing-setup.tsx`

Main component — shown on circle dashboard when user is member but hasn't setup auto-signing yet.

```
┌──────────────────────────────────────┐
│ 🔄 Iuran Otomatis                   │
│                                      │
│ Setup sekali, iuran masuk otomatis   │
│ setiap cycle tanpa perlu klik lagi.  │
│                                      │
│ Detail:                              │
│ • 100 USDC per cycle                 │
│ • Maksimal 5 cycle (500 USDC total)  │
│ • Berlaku sampai: 20 Jul 2026        │
│                                      │
│ [Aktifkan Iuran Otomatis]            │
└──────────────────────────────────────┘
```

**On click "Aktifkan":**

```tsx
// Step 1: ERC20 approve (one-time, total amount)
await writeContractAsync({
  address: CONTRACTS.mockUSDC,
  abi: MOCK_USDC_ABI,
  functionName: 'approve',
  args: [CONTRACTS.kitpotCircle, contributionAmount * BigInt(totalCycles)],
})

// Step 2: Authorize session
await writeContractAsync({
  address: CONTRACTS.kitpotCircle,
  abi: KITPOT_ABI,
  functionName: 'authorizeSession',
  args: [
    operatorAddress,    // bisa contract address sendiri atau designated keeper
    circleId,
    contributionAmount,
    expiryTimestamp,    // circle end time + buffer
  ],
})
```

### `apps/web/src/components/circle/auto-signing-status.tsx`

Shown when user already has active session:

```
┌──────────────────────────────────────┐
│ ✅ Iuran Otomatis Aktif              │
│                                      │
│ 100 USDC/cycle · Berlaku: 20 Jul '26 │
│ USDC allowance tersisa: 400 USDC     │
│                                      │
│ [Nonaktifkan]                        │
└──────────────────────────────────────┘
```

### `apps/web/src/components/circle/batch-deposit-trigger.tsx`

Button untuk trigger `batchDeposit()` — callable by anyone (termasuk circle members).

Untuk demo: salah satu user klik ini dan semua member yang sudah setup auto-signing langsung terdebit.

```
┌──────────────────────────────────────┐
│ Trigger Iuran Otomatis               │
│ 3/5 anggota sudah setup auto-sign    │
│ 2 masih manual                       │
│                                      │
│ [Tarik Iuran Semua ▶]               │
└──────────────────────────────────────┘
```

### `apps/web/src/components/bridge/bridge-deposit.tsx`

Interwoven Bridge integration — menggunakan InterwovenKit's built-in bridge modal.

```
┌──────────────────────────────────────┐
│ 💰 Top-up Saldo                      │
│                                      │
│ Saldo USDC di kitpot-1: 250 USDC    │
│                                      │
│ Punya USDC di Initia hub?           │
│ [Deposit via Bridge]                 │
│                                      │
│ Atau mint test USDC:                 │
│ [Mint 1000 USDC (Testnet)]           │
└──────────────────────────────────────┘
```

**Bridge button:**
```tsx
const { openBridge } = useInterwovenKit()

// Opens InterwovenKit's built-in bridge modal
// User deposits from Initia hub to kitpot-1 rollup
<Button onClick={() => openBridge()}>
  Deposit via Bridge
</Button>
```

**Mint button (testnet only):**
```tsx
writeContract({
  address: CONTRACTS.mockUSDC,
  abi: MOCK_USDC_ABI,
  functionName: 'mint',
  args: [userAddress, parseUnits('1000', 6)],
})
```

---

## Integration ke Dashboard

Update `apps/web/src/app/circles/[id]/page.tsx` dari Plan 08:

```tsx
// Tambahkan sections baru di dashboard:
<AutoSigningSetup circleId={circleId} />     {/* atau AutoSigningStatus jika sudah setup */}
<BatchDepositTrigger circleId={circleId} />
<BridgeDeposit />
```

---

## Hooks

### `apps/web/src/hooks/use-auto-signing.ts`

```tsx
export function useAutoSigning(circleId: bigint, userAddress: string) {
  // Reads:
  // - isSessionValid(member, operator, circleId)
  // - sessions(member, operator) → Session struct
  // - ERC20 allowance(member, contractAddress)
  //
  // Returns:
  // - hasSession: boolean
  // - sessionExpiry: number
  // - remainingAllowance: bigint
  // - setupAutoSigning: () => Promise (approve + authorize)
  // - revokeSession: () => Promise
}
```

### `apps/web/src/hooks/use-bridge.ts`

```tsx
export function useTokenBalance(tokenAddress: string, userAddress: string) {
  // Read ERC20 balanceOf
}
```

---

## Output files

```
apps/web/src/
├── components/
│   ├── circle/
│   │   ├── auto-signing-setup.tsx
│   │   ├── auto-signing-status.tsx
│   │   └── batch-deposit-trigger.tsx
│   └── bridge/
│       └── bridge-deposit.tsx
├── hooks/
│   ├── use-auto-signing.ts
│   └── use-bridge.ts
```

Update:
```
apps/web/src/app/circles/[id]/page.tsx  ← integrate auto-signing + bridge sections
```

---

## Dependencies

- **Blocked by:** Plan 04 (contract sessions), Plan 08 (dashboard)
- **Blocks:** Plan 10 (testing needs all UI ready)
