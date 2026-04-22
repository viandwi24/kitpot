# Kitpot Technical Reference — INITIATE Hackathon
> Untuk developer yang belum pernah pakai Initia sebelumnya.
> Sources: official hackathon docs + reverse-engineered dari 33 live submissions + browser research 2026-04-20

---

## ⚠️ Catatan Penting: EVM vs Move

**Initia docs merekomendasikan Move untuk Gaming & Consumer track.**
Kita tetap pakai EVM (Solidity) karena:
1. Leticia, Hex Vault, Gam3Hub di INITIATE yang sama pakai EVM + Gaming track → valid
2. Drip (reference utama auto-signing) = Solidity
3. Kita familiar Solidity → execution speed lebih penting dari following recommendation
4. Judging rubric 30% Technical+Initia = bisa dipenuhi lewat InterwovenKit + rollup deploy

---

## Setup Monorepo — Bun Workspaces

**Bun version required:** 1.0+ (uses `bun.lock`, bukan `bun.lockb`)

### Init commands (urutan eksak):

```bash
mkdir kitpot && cd kitpot

# 1. Init root workspace
bun init -y

# 2. Edit package.json root — tambah workspaces
# (lihat struktur di bawah)

# 3. Buat Next.js app
mkdir apps
bunx create-next-app@latest apps/web --typescript --tailwind --app --src-dir --no-git

# 4. Install frontend deps dari root
cd apps/web
bun add @initia/interwovenkit-react wagmi viem@2.x @tanstack/react-query
bun add @privy-io/react-auth@latest
cd ../..

# 5. Init Foundry untuk contracts (BUKAN bun workspace)
forge init contracts --no-git
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
cd ..
```

### Root `package.json`:

```json
{
  "name": "kitpot",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "bun --cwd apps/web dev",
    "build": "bun --cwd apps/web build",
    "test:contracts": "forge test --root contracts -vv"
  }
}
```

> **PENTING:** `contracts/` TIDAK masuk workspaces karena Foundry pakai toolchain sendiri (forge, anvil). Hanya `apps/*` yang di-manage Bun.

### Struktur direktori final:

```
kitpot/
├── package.json          ← root workspace (Bun)
├── bun.lock              ← Bun v1+ pakai bun.lock (bukan bun.lockb)
├── apps/
│   └── web/              ← Next.js 16 (Bun workspace)
│       ├── package.json
│       ├── src/
│       │   ├── app/
│       │   └── components/
│       └── ...
├── contracts/            ← Foundry (BUKAN Bun workspace)
│   ├── foundry.toml
│   ├── src/
│   │   └── KitpotCircle.sol
│   ├── test/
│   └── lib/
│       └── openzeppelin-contracts/
└── .initia/
    └── submission.json
```

---

## Next.js 16 Setup

**Install command:**
```bash
bunx create-next-app@latest apps/web --typescript --tailwind --app --src-dir --no-git
```

Flags yang dipilih saat prompt:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Turbopack (default dev bundler): Yes
- Import alias: No (pakai default `@/*`)

**Node.js required:** 20.9+ (Next.js 16 requirement)

**Dev server:**
```bash
bun --cwd apps/web dev
# atau dari dalam apps/web:
bun dev
```

---

## shadcn/ui — Monorepo Setup

```bash
# Dari root monorepo
bunx shadcn@latest init -t next --monorepo

# Add komponen (jalankan dari root, specify path ke app)
bunx shadcn@latest add button -c apps/web
bunx shadcn@latest add card -c apps/web
bunx shadcn@latest add dialog -c apps/web
bunx shadcn@latest add badge -c apps/web
```

> Flag `-c apps/web` = target spesifik app dalam monorepo.

---

## wagmi v3 + viem + TanStack Query

**Install:**
```bash
bun add wagmi viem@2.x @tanstack/react-query
```

**Setup dasar:**
```tsx
import { createConfig, http, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
})

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* app */}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

> **Untuk Kitpot:** wagmi di-wrap oleh InterwovenKit — tidak perlu setup manual WagmiProvider terpisah kalau sudah pakai InterwovenKitProvider.

---

## @initia/interwovenkit-react

**Install:**
```bash
bun add @initia/interwovenkit-react wagmi viem @tanstack/react-query
```

**Provider setup:**
```tsx
import { InterwovenKitProvider, initiaPrivyWalletConnector } from '@initia/interwovenkit-react'
import { createConfig, http } from 'wagmi'

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],          // diganti dengan Initia chain config
  transports: { [mainnet.id]: http() },
})

// Untuk testnet:
<InterwovenKitProvider {...TESTNET} wagmiConfig={wagmiConfig}>
  {children}
</InterwovenKitProvider>

// Untuk custom rollup (kitpot-1):
<InterwovenKitProvider defaultChainId="kitpot-1">
  {children}
</InterwovenKitProvider>
```

**Hook utama:**
```tsx
import { useInterwovenKit } from '@initia/interwovenkit-react'

function MyComponent() {
  const {
    address,
    username,       // .init username
    openConnect,    // buka wallet connect modal
    openWallet,     // buka wallet info modal
    openBridge,     // buka Interwoven Bridge modal
    requestTxBlock, // request transaksi + tunggu konfirmasi
  } = useInterwovenKit()
}
```

**Docs resmi:** `docs.initia.xyz/interwovenkit`

---

## Privy — Social Login

**Install:**
```bash
bun add @privy-io/react-auth@latest
```

**Setup:**
```tsx
import { PrivyProvider } from '@privy-io/react-auth'

export default function App({ children }) {
  return (
    <PrivyProvider
      appId="your-privy-app-id"
      clientId="your-app-client-id"
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
```

**Cara dapat appId:** daftar di dashboard.privy.io

**Integrasi dengan InterwovenKit:**
- `initiaPrivyWalletConnector` sudah handle koneksi Privy ke InterwovenKit
- User login Google/email → Privy generate embedded wallet → InterwovenKit pakai wallet itu

**Reference implementasi lengkap:** `github.com/KamiliaNHayati/Drip`

---

## npm Packages Summary

| Package | Purpose | Install |
|---------|---------|---------|
| `@initia/interwovenkit-react` | **REQUIRED** — wallet + tx signing + auto-signing | `bun add @initia/interwovenkit-react` |
| `@privy-io/react-auth` | Social login (Google/email/Apple) | `bun add @privy-io/react-auth@latest` |
| `wagmi` | EVM wallet hooks (di-wrap InterwovenKit) | `bun add wagmi` |
| `viem` | EVM utilities | `bun add viem@2.x` |
| `@tanstack/react-query` | Data fetching state management | `bun add @tanstack/react-query` |

---

## Smart Contract Stack

### Solidity 0.8.26 + Foundry + OpenZeppelin v5 ✅ PILIHAN KITA

```bash
# Prerequisite
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Init project
forge init contracts --no-git
cd contracts
forge install OpenZeppelin/openzeppelin-contracts

# Test
forge test -vv

# Deploy ke kitpot-1
forge script script/Deploy.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
```

**Deploy target:**
- `KitpotCircle.sol` — logic iuran, deposit, pot distribution, auto-signing session

**EVM Chain ID testnet kitpot-1:** dikonfirmasi saat rollup deploy (bukan hardcoded)

---

## Weave CLI — Deploy Rollup kitpot-1

**Install weave:**
```bash
curl -sSL https://weave.initia.xyz/install.sh | bash
```

**Prerequisites:**
- Go 1.23.4+
- Docker (untuk executor + relayer)

**Setup rollup pertama kali (SATU KALI):**
```bash
weave init    # interactive setup — isi semua prompt
              # nama rollup: kitpot-1
              # VM type: EVM
              # genesis balance: 1000000000000000000000000
```

**Start rollup (setiap restart):**
```bash
weave rollup start -d          # start EVM node (background)
weave opinit start executor -d # start OPinit executor (background)
weave relayer start -d         # start relayer (background)
```

**Verify jalan:**
```bash
# RPC endpoint
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'

# REST endpoint
curl http://localhost:1317/cosmos/bank/v1beta1/balances/<address>
```

**Initia L1 testnet:** `initiation-2` (connect lewat weave init)

---

## REST API

**Base URL:** `https://rest.initia.xyz`

**Endpoint yang relevan untuk Kitpot:**

```
GET /cosmos/bank/v1beta1/balances/{address}
→ Cek saldo wallet user

GET /cosmos/tx/v1beta1/txs?events=...
→ Query history transaksi

GET /initia/mstaking/v1/delegations/{address}
→ Cek staking (untuk reputasi)
```

---

## Network Details

| Item | Value |
|------|-------|
| Initia L1 testnet | `initiation-2` |
| EVM public testnet | `evm-1` |
| EVM public testnet Chain ID | `2124225178762456` |
| Rollup kita | `kitpot-1` (deploy sendiri) |
| REST API | `rest.initia.xyz` |
| Explorer | `scan.testnet.initia.xyz` |

---

## Submission Requirements

Repo harus berisi:

```
.initia/
  submission.json
README.md
demo video (1-3 menit)
```

**Format submission.json:**
```json
{
  "chain_id": "kitpot-1",
  "contract_address": "0x...",
  "demo_url": "https://kitpot.vercel.app",
  "video_url": "https://youtu.be/..."
}
```

Format exact: `docs.initia.xyz/hackathon/submission-requirements`

---

## Links

| Resource | URL |
|----------|-----|
| Hackathon docs | `docs.initia.xyz/hackathon` |
| InterwovenKit docs | `docs.initia.xyz/interwovenkit` |
| Submission requirements | `docs.initia.xyz/hackathon/submission-requirements` |
| Hackathon page (DoraHacks) | `dorahacks.io/hackathon/initiate/detail` |
| Privy dashboard | `dashboard.privy.io` |
| Discord | `discord.gg/initia` |

---

## Reference Repos (Dari Hackathon Yang Sama)

| Repo | Yang Bisa Dipelajari |
|------|---------------------|
| `github.com/KamiliaNHayati/Drip` | Auto-signing, Privy + InterwovenKit, Solidity on EVM, full provider setup |
| `github.com/0xpochita/Leticia` | Stack identical kita: Next.js 16, React 19, Solidity, Bun, Tailwind CSS 4 |
| `github.com/kingskuan/initcred-0410` | REST API queries, Next.js setup |
| `github.com/ocean2fly/iusd-pay` | InterwovenKit + Bridge integration, React 19 + PWA |

**Paling penting untuk Kitpot:**
1. **Leticia** — stack reference (identical ke kita)
2. **Drip** — auto-signing + Privy blueprint

---

## Tech Stack Final Kitpot

```
Runtime:      Bun 1.x
Monorepo:     Bun workspaces (apps/*)
Frontend:     Next.js 16 + React 19 + TypeScript
Styling:      Tailwind CSS 4 + shadcn/ui
Wallet:       @initia/interwovenkit-react
Social login: Privy (@privy-io/react-auth)
EVM hooks:    wagmi + viem + @tanstack/react-query
Contracts:    Solidity 0.8.26 + Foundry + OpenZeppelin v5
Rollup:       kitpot-1 via Weave CLI
Auto-signing: InterwovenKit built-in (bukan library terpisah)
REST data:    rest.initia.xyz
Deploy app:   Vercel
```

---

## ⚠️ Hal Kritis Yang Sering Diabaikan

1. **`cycle_duration` parameter** — HARUS configurable di contract
   - Demo/testnet: `60` (detik)
   - Production: `2592000` (30 hari)

2. **Auto-signing session limits** — set di awal join:
   - Max amount per cycle (contoh: 100 USDC)
   - Total cap (contoh: 1200 USDC / 12 bulan)
   - Expiry timestamp

3. **`.initia/submission.json`** — harus ada, format exact

4. **Chain ID rollup** — didapat setelah `weave init` selesai

5. **Interwoven Bridge** — cara user deposit dari Initia hub ke kitpot-1. BUKAN bridge dari Ethereum. Wajib ada untuk user bisa masukkan asset ke circle.

6. **`contracts/` bukan Bun workspace** — forge punya toolchain sendiri, jangan `bun add` ke sana
