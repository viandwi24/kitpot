# Plan 06 — Frontend: App Shell, Providers & Auth

> Goal: App shell dengan layout, routing, provider stack (InterwovenKit + Privy + TanStack Query), dan social login flow. User bisa login dan lihat halaman utama.

---

## Scope

- App layout (header, navigation, main content area)
- Provider stack setup (InterwovenKit, Privy, QueryClient)
- Wallet/chain config untuk kitpot-1
- Social login (Google/email/Apple) via Privy
- Connected state UI (show address, .init username, disconnect)
- Route structure

## Non-goals

- Circle creation form (Plan 07)
- Dashboard (Plan 08)
- Auto-signing UI (Plan 09)
- Tidak run `bun dev`

---

## Route Structure

```
/                    → Landing page + login CTA
/circles             → List circles user sudah join
/circles/[id]        → Circle detail + dashboard (Plan 08)
/circles/new         → Create circle form (Plan 07)
```

## Provider Stack

```tsx
// apps/web/src/app/providers.tsx

// Order matters:
// QueryClientProvider (outermost — TanStack Query)
//   └── PrivyProvider (Privy social login)
//       └── InterwovenKitProvider (wallet + chain, wraps wagmi internally)
//           └── {children}
```

### InterwovenKit config

```tsx
import { InterwovenKitProvider } from '@initia/interwovenkit-react'

// Chain config untuk kitpot-1 rollup
const kitpotChain = {
  id: Number(process.env.NEXT_PUBLIC_KITPOT_CHAIN_ID),
  name: 'Kitpot',
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_KITPOT_RPC_URL!] },
  },
  // ... chain details TBD setelah rollup deploy
}
```

### Privy config

```tsx
import { PrivyProvider } from '@privy-io/react-auth'

const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  clientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!,
  config: {
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets',
      },
    },
  },
}
```

## Layout Components

### `apps/web/src/app/layout.tsx`

Root layout: providers + header + main.

### `apps/web/src/components/layout/header.tsx`

- Logo "Kitpot"
- Nav links: Home, My Circles, Create
- Connect/Login button (kanan)
  - Not connected → "Login" → trigger Privy social login
  - Connected → show `.init` username atau truncated address + disconnect

### `apps/web/src/components/layout/connect-button.tsx`

Wrapper around InterwovenKit's `openConnect`:
- Menggunakan `useInterwovenKit()` hook
- States: disconnected, connecting, connected
- Connected: show `username` (`.init`) atau `address` truncated

### `apps/web/src/app/page.tsx`

Landing page:
- Hero: "Arisan Tanpa Bendahara" + subtitle
- CTA: "Mulai Sekarang" → login jika belum, atau redirect ke /circles
- 3 value props: Otomatis, Transparan, Tanpa Trust

## Shared Utilities

### `apps/web/src/lib/contracts.ts`

Contract addresses & config:

```tsx
export const CONTRACTS = {
  kitpotCircle: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  mockUSDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
} as const
```

### `apps/web/src/lib/wagmi.ts`

wagmi hooks wrapper — pre-configured with contract ABIs:

```tsx
import { useReadContract, useWriteContract } from 'wagmi'
import { KITPOT_ABI } from './abi/KitpotCircle'

// Reusable hooks for common contract reads
export function useCircle(circleId: bigint) { ... }
export function useCircleMembers(circleId: bigint) { ... }
```

---

## Output files

```
apps/web/src/
├── app/
│   ├── layout.tsx              ← root layout with providers
│   ├── page.tsx                ← landing page
│   ├── providers.tsx           ← provider stack
│   ├── circles/
│   │   ├── page.tsx            ← placeholder: my circles list
│   │   ├── new/
│   │   │   └── page.tsx        ← placeholder for Plan 07
│   │   └── [id]/
│   │       └── page.tsx        ← placeholder for Plan 08
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   └── connect-button.tsx
│   └── ui/                     ← shadcn (from Plan 01)
├── lib/
│   ├── contracts.ts
│   ├── wagmi.ts
│   ├── utils.ts                ← shadcn cn helper (from Plan 01)
│   └── abi/
│       ├── KitpotCircle.ts     ← placeholder ABI (from Plan 05)
│       └── MockUSDC.ts         ← placeholder ABI (from Plan 05)
```

---

## Dependencies

- **Blocked by:** Plan 01 (needs Next.js app), Plan 05 (needs ABI placeholders)
- **Blocks:** Plan 07, 08, 09
