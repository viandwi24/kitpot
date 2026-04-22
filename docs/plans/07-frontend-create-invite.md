# Plan 07 — Frontend: Circle Creation & Invite Flow

> Goal: User bisa create circle dari browser dan invite anggota via .init username. Contract call terintegrasi.

---

## Scope

- Create circle form (nama, nominal, jumlah slot, durasi)
- Contract call `createCircle()` via wagmi
- Success state → redirect ke circle page
- Invite flow: input .init username, resolve, add to circle
- Join circle page (dari invite link)
- My circles list page

## Non-goals

- Dashboard/detail circle (Plan 08)
- Auto-signing UI (Plan 09)
- Tidak run app

---

## Pages & Components

### 1. `/circles/new` — Create Circle Form

```
┌─────────────────────────────────┐
│ Buat Circle Baru                │
│                                 │
│ Nama circle:    [Arisan Alumni] │
│ Token:          [USDC ▼]        │
│ Iuran/cycle:    [100] USDC      │
│ Jumlah anggota: [5]             │
│ Durasi cycle:   [Demo 60s ▼]    │
│   ↳ preset: 60s / 5min / 30 hari│
│                                 │
│ [Buat Circle]                   │
└─────────────────────────────────┘
```

**Components:**
- `apps/web/src/app/circles/new/page.tsx` — page
- `apps/web/src/components/circle/create-circle-form.tsx` — form component

**Contract call:**
```tsx
const { writeContract } = useWriteContract()

writeContract({
  address: CONTRACTS.kitpotCircle,
  abi: KITPOT_ABI,
  functionName: 'createCircle',
  args: [name, tokenAddress, contributionAmount, maxMembers, cycleDuration],
})
```

**After success:** redirect ke `/circles/[id]` dengan circle ID dari event log.

### 2. `/circles/[id]/invite` — Invite Members

```
┌────────────────────────────────────┐
│ Undang Anggota — Arisan Alumni     │
│ 1/5 anggota                       │
│                                    │
│ Ketik .init username:              │
│ [budi.init                       ] │
│ [+ Tambah]                         │
│                                    │
│ Anggota saat ini:                  │
│ ✅ kamu.init (creator)             │
│ ⏳ budi.init (pending invite)      │
│                                    │
│ — atau —                           │
│ Share link: kitpot.app/join/[id]   │
│ [Copy Link]                        │
└────────────────────────────────────┘
```

**Note tentang .init username resolution:**
- `.init` username di-resolve via Initia L1 Move view function
- Untuk MVP: input .init username → store as display name, actual join tetap via wallet address
- User share link → recipient buka link → login → call `joinCircle()`

### 3. `/join/[id]` — Join Circle (dari link)

```
┌────────────────────────────────────┐
│ Join Circle                        │
│                                    │
│ Arisan Alumni                      │
│ 100 USDC / cycle × 5 anggota      │
│ Cycle duration: 60 detik (demo)    │
│ Anggota: 2/5                       │
│                                    │
│ .init username kamu:               │
│ [siti.init                       ] │
│                                    │
│ [Join Circle]                      │
└────────────────────────────────────┘
```

**Contract call:**
```tsx
writeContract({
  address: CONTRACTS.kitpotCircle,
  abi: KITPOT_ABI,
  functionName: 'joinCircle',
  args: [circleId, initUsername],
})
```

### 4. `/circles` — My Circles List

```
┌────────────────────────────────────┐
│ My Circles                         │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Arisan Alumni         Active │   │
│ │ 100 USDC × 5 · Cycle 2/5    │   │
│ │ Giliranmu: Cycle 3           │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Tabungan Keluarga   Forming  │   │
│ │ 50 USDC × 3 · 1/3 joined    │   │
│ └──────────────────────────────┘   │
│                                    │
│ [+ Buat Circle Baru]              │
└────────────────────────────────────┘
```

**Data fetching:** Read contract via wagmi `useReadContract`:
- `getCircleCount()` → iterate circles
- Filter: only circles where user is member (`isMember(circleId, address)`)

---

## Hooks

### `apps/web/src/hooks/use-circles.ts`

```tsx
// Fetch all circles user is member of
export function useMyCircles(address: string) { ... }

// Fetch single circle detail
export function useCircleDetail(circleId: bigint) { ... }

// Create circle mutation
export function useCreateCircle() { ... }

// Join circle mutation
export function useJoinCircle() { ... }
```

---

## Output files

```
apps/web/src/
├── app/
│   ├── circles/
│   │   ├── page.tsx                    ← my circles list
│   │   ├── new/
│   │   │   └── page.tsx                ← create circle page
│   │   └── [id]/
│   │       ├── page.tsx                ← placeholder (Plan 08)
│   │       └── invite/
│   │           └── page.tsx            ← invite members
│   ├── join/
│   │   └── [id]/
│   │       └── page.tsx                ← join circle from link
├── components/
│   └── circle/
│       ├── create-circle-form.tsx
│       ├── circle-card.tsx             ← card for list view
│       ├── invite-form.tsx
│       └── join-form.tsx
├── hooks/
│   ├── use-circles.ts
│   └── use-create-circle.ts
```

---

## Dependencies

- **Blocked by:** Plan 05 (needs ABI), Plan 06 (needs providers + layout)
- **Blocks:** Plan 08 (dashboard needs circle pages)
