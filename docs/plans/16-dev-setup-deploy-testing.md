# Plan 16 — Dev Environment, Rollup Deploy & End-to-End Testing

> **⚠️ MANUAL CONFIRMATION REQUIRED — Do NOT execute without user confirmation.**
> This is the FINAL plan. Only execute after Plans 01-15 are all completed.

> Goal: Setup rollup kitpot-1, compile & deploy ALL contracts (KitpotCircle, KitpotReputation, KitpotAchievements, MockUSDC), run frontend, and test ALL flows end-to-end.

---

## Scope

- Install & setup Weave CLI
- Init & start rollup `kitpot-1`
- `forge build` — compile semua contracts
- `forge test` — run semua tests
- Deploy contracts ke kitpot-1
- Run `bun dev` — start frontend
- ABI sync (copy compiled ABI ke frontend)
- End-to-end testing semua flows
- Fix bugs yang ditemukan
- Vercel deploy (staging)

## Non-goals

- Writing new features (hanya fix bugs)
- Demo recording (itu manual)
- Submission (itu manual)

---

## Phase 1: Rollup Setup

### Install Weave CLI

```bash
curl -sSL https://weave.initia.xyz/install.sh | bash
```

Prerequisites: Go 1.23.4+, Docker

### Init rollup

```bash
weave init
# Interactive prompts:
# - Rollup name: kitpot-1
# - VM type: EVM
# - Genesis balance: sesuai prompt
```

### Start rollup

```bash
weave rollup start -d
weave opinit start executor -d
weave relayer start -d
```

### Verify

```bash
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

Catat Chain ID dari rollup → update `.env`.

---

## Phase 2: Contract Compile & Test

### Build

```bash
cd contracts
forge build
```

Fix any compilation errors dari Plan 02-04.

### Test

```bash
forge test -vv
```

Fix any failing tests dari Plan 05.

### ABI Sync

Setelah `forge build`, copy ABI ke frontend:

```bash
# Extract ABI from compiled output
# contracts/out/KitpotCircle.sol/KitpotCircle.json → apps/web/src/lib/abi/KitpotCircle.ts
# contracts/out/MockUSDC.sol/MockUSDC.json → apps/web/src/lib/abi/MockUSDC.ts
```

Script atau manual copy — replace placeholder ABIs dari Plan 05.

---

## Phase 3: Deploy Contracts

### Setup .env

```env
PRIVATE_KEY=<deployer private key from weave>
KITPOT_RPC_URL=http://localhost:8545
```

### Deploy

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
```

Catat addresses:
- MockUSDC: `0x...`
- KitpotCircle: `0x...`

Update frontend `.env`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_KITPOT_RPC_URL=http://localhost:8545
NEXT_PUBLIC_KITPOT_CHAIN_ID=<from weave>
```

### Setup demo data (optional)

```bash
forge script script/SetupDemo.s.sol --rpc-url $KITPOT_RPC_URL --broadcast
```

---

## Phase 4: Frontend Dev

### Start dev server

```bash
bun dev  # dari root, runs apps/web
```

### Setup Privy

1. Go to `dashboard.privy.io`
2. Create app
3. Get `appId` and `clientId`
4. Update `.env`:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=...
   NEXT_PUBLIC_PRIVY_CLIENT_ID=...
   ```

---

## Phase 5: E2E Testing Checklist

Test setiap flow dari browser:

### Flow 1: Login
- [ ] Buka app → klik Login → Google social login → masuk
- [ ] Header menampilkan .init username atau address
- [ ] Disconnect → kembali ke state logged out

### Flow 2: Create Circle
- [ ] Login → /circles/new
- [ ] Isi form → submit → tx sukses
- [ ] Redirect ke /circles/[id]
- [ ] Circle muncul di /circles (my circles)

### Flow 3: Join Circle
- [ ] Buka /join/[id] dari browser lain / wallet lain
- [ ] Login → isi .init username → Join → tx sukses
- [ ] Member muncul di dashboard

### Flow 4: Manual Deposit
- [ ] Mint USDC (testnet)
- [ ] Klik "Bayar Iuran" → approve USDC → deposit → tx sukses
- [ ] Payment status berubah ke ✅

### Flow 5: Auto-Signing
- [ ] Klik "Aktifkan Iuran Otomatis" → approve + authorize → tx sukses
- [ ] Status berubah ke "✅ Aktif"
- [ ] Klik "Tarik Iuran Semua" (batchDeposit) → semua auto-sign members terdebit
- [ ] Payment status update real-time

### Flow 6: Pot Distribution
- [ ] Semua member sudah bayar + cycle time elapsed
- [ ] Klik "Distribute Pot" → tx sukses
- [ ] Recipient menerima USDC (cek balance)
- [ ] Cycle advances, dashboard update

### Flow 7: Bridge (nice-to-have)
- [ ] Klik "Deposit via Bridge" → InterwovenKit bridge modal opens
- [ ] (Actual bridge test depends on Initia testnet availability)

### Flow 8: Full Cycle Demo
- [ ] Create circle (5 members, 60s cycle)
- [ ] All join + setup auto-signing
- [ ] Wait 60s → trigger batch deposit → distribute pot
- [ ] Repeat for cycle 2
- [ ] Verify dashboard shows correct state throughout

---

## Phase 6: Vercel Deploy

```bash
cd apps/web
vercel
```

Update environment variables di Vercel dashboard:
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_PRIVY_CLIENT_ID`
- `NEXT_PUBLIC_KITPOT_RPC_URL` (public testnet URL, not localhost)
- `NEXT_PUBLIC_KITPOT_CHAIN_ID`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_USDC_ADDRESS`

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `forge build` fails | Check Solidity version in foundry.toml, check import paths |
| Provider errors in Next.js | Ensure providers are client components (`"use client"`) |
| wagmi hooks fail | Check chain config matches rollup Chain ID |
| Privy login doesn't work | Check appId/clientId, check allowed domains in Privy dashboard |
| Contract call reverts | Check contract address in .env, check ABI matches deployed |
| Bridge modal empty | May need Initia testnet to be running, fallback to mock |

---

## Dependencies

- **Blocked by:** Plan 01-09 (ALL code must be written first)
- **Blocks:** nothing (this is the final plan)
