# Plan 08 — Frontend: Circle Dashboard & Detail View

> Goal: Dashboard lengkap per circle — status anggota, payment tracking, giliran, history, countdown timer.

---

## Scope

- Circle detail page (`/circles/[id]`)
- Member list + payment status per cycle
- Turn order visualization (siapa dapat pot kapan)
- Cycle countdown timer
- Payment history
- Deposit button (manual, sebelum auto-signing di Plan 09)
- Advance cycle button (trigger pot distribution)

## Non-goals

- Auto-signing UI (Plan 09)
- Bridge UI (Plan 09)
- Tidak run app

---

## Page Layout: `/circles/[id]`

```
┌──────────────────────────────────────────────┐
│ Arisan Alumni                        [Active] │
│ 100 USDC/cycle · 5 anggota · Cycle 2/5       │
│                                               │
│ ┌─── Cycle Saat Ini ─────────────────────┐   │
│ │ Cycle 2 of 5                           │   │
│ │ Penerima pot: siti.init                │   │
│ │ Total pot: 500 USDC (- 5 USDC fee)    │   │
│ │ ⏱ Sisa waktu: 00:42                   │   │
│ │                                        │   │
│ │ [Bayar Iuran 100 USDC]  ← jika belum  │   │
│ │ [Distribute Pot] ← jika semua bayar   │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ ┌─── Status Pembayaran ──────────────────┐   │
│ │ kamu.init    ✅ Sudah bayar            │   │
│ │ budi.init    ✅ Sudah bayar            │   │
│ │ siti.init    ⏳ Belum bayar            │   │
│ │ andi.init    ✅ Sudah bayar            │   │
│ │ dewi.init    ⏳ Belum bayar            │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ ┌─── Urutan Giliran ─────────────────────┐   │
│ │ Cycle 1: kamu.init  ✅ Received 495    │   │
│ │ Cycle 2: siti.init  ◀ Current          │   │
│ │ Cycle 3: budi.init  ⏳ Upcoming        │   │
│ │ Cycle 4: andi.init  ⏳ Upcoming        │   │
│ │ Cycle 5: dewi.init  ⏳ Upcoming        │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ ┌─── History ────────────────────────────┐   │
│ │ Cycle 1 · kamu.init · 495 USDC · ✅   │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## Components

### `apps/web/src/app/circles/[id]/page.tsx`

Main page — fetch circle data, render sections.

### `apps/web/src/components/circle/circle-header.tsx`

Circle name, status badge, basic stats (member count, cycle count, contribution amount).

### `apps/web/src/components/circle/current-cycle.tsx`

- Current cycle number
- Recipient name (.init)
- Total pot amount (contribution × members)
- Fee amount
- Countdown timer (real-time, `useEffect` interval)
- Action buttons:
  - "Bayar Iuran" → if user hasn't paid current cycle
  - "Distribute Pot" → if all members paid AND cycle time elapsed

### `apps/web/src/components/circle/payment-status.tsx`

List semua member + status bayar current cycle. Data dari `getCyclePaymentStatus(circleId)`.

### `apps/web/src/components/circle/turn-order.tsx`

Visual timeline: semua cycle, siapa penerimanya, status (received / current / upcoming).

### `apps/web/src/components/circle/circle-history.tsx`

List completed cycles: cycle number, recipient, amount received, timestamp.

### `apps/web/src/components/circle/deposit-button.tsx`

Two-step:
1. Check ERC20 allowance → if insufficient, prompt `approve()` first
2. Call `deposit(circleId)`

```tsx
// Step 1: approve USDC
writeContract({
  address: CONTRACTS.mockUSDC,
  abi: MOCK_USDC_ABI,
  functionName: 'approve',
  args: [CONTRACTS.kitpotCircle, amount],
})

// Step 2: deposit
writeContract({
  address: CONTRACTS.kitpotCircle,
  abi: KITPOT_ABI,
  functionName: 'deposit',
  args: [circleId],
})
```

### `apps/web/src/components/circle/advance-cycle-button.tsx`

Call `advanceCycle(circleId)`. Enabled only when:
- All members have paid (`allMembersPaid`)
- Cycle time has elapsed
- Circle status is Active

---

## Hooks

### `apps/web/src/hooks/use-circle-dashboard.ts`

```tsx
export function useCircleDashboard(circleId: bigint) {
  // Combines multiple contract reads:
  // - getCircle(circleId)
  // - getMembers(circleId)
  // - getCyclePaymentStatus(circleId)
  // - getCurrentCycleInfo(circleId)
  // Returns unified dashboard state
}
```

### `apps/web/src/hooks/use-countdown.ts`

```tsx
// Real-time countdown to cycle end
export function useCountdown(targetTimestamp: number) {
  // Returns: { hours, minutes, seconds, isExpired }
}
```

---

## Output files

```
apps/web/src/
├── app/
│   └── circles/
│       └── [id]/
│           └── page.tsx                     ← circle dashboard page
├── components/
│   └── circle/
│       ├── circle-header.tsx
│       ├── current-cycle.tsx
│       ├── payment-status.tsx
│       ├── turn-order.tsx
│       ├── circle-history.tsx
│       ├── deposit-button.tsx
│       └── advance-cycle-button.tsx
├── hooks/
│   ├── use-circle-dashboard.ts
│   └── use-countdown.ts
```

---

## Dependencies

- **Blocked by:** Plan 06 (providers), Plan 07 (circle pages structure)
- **Blocks:** Plan 09 (auto-signing UI goes on this dashboard)
