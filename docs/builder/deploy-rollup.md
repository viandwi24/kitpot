# Deploy Rollup kitpot-1 ke Initia Testnet

> Ikuti step ini secara urut. Setiap step ada output yang harus dicatat.
> Estimasi waktu: 20-40 menit (tergantung sync dan faucet)

---

## Prerequisites (sudah ✅)
- Weave CLI v0.3.9 terinstall
- Docker (OrbStack) running
- Foundry (`forge`, `cast`) terinstall

---

## Step 1 — Setup Gas Station

Gas Station adalah wallet khusus yang Weave pakai untuk fund bot-bot infrastruktur rollup.

```bash
weave gas-station setup
```

Saat prompt:
- Pilih **"Generate new mnemonic"** (jangan pakai wallet existing)
- Catat mnemonic 24 kata di tempat aman

Setelah selesai, catat dua address yang muncul:
```
Gas Station Address (init):      init1xxxx...
Gas Station Address (celestia):  celestia1xxxx...
```

---

## Step 2 — Fund Gas Station

Buka browser, pergi ke faucet:

**Initia faucet:** https://faucet.testnet.initia.xyz/

- Masukkan address `init1xxxx...` dari Step 1
- Request **INIT** tokens (minimal 10 INIT)
- Tunggu sampai confirmed (~30 detik)

Verifikasi balance sudah masuk:
```bash
weave gas-station show
```

Output yang diharapkan:
```
init address:      init1xxxx...   balance: 10.000000 INIT
celestia address:  celestia1xxx...
```

> Jika balance masih 0, tunggu 1-2 menit lalu cek lagi.

---

## Step 3 — Launch Rollup

```bash
weave rollup launch
```

Ikuti prompt interaktif:

| Prompt | Jawaban |
|--------|---------|
| Chain ID | `kitpot-1` |
| VM type | `evm` |
| Network | `testnet` (initiation-2) |
| DA layer | `celestia` (default) atau `initia` |
| Genesis balance | tekan Enter (pakai default) |

Weave akan:
1. Generate genesis block
2. Register rollup di Initia L1 testnet (initiation-2)
3. Start rollup node
4. Print **InitiaScan magic link**

**Catat output berikut:**
```
Chain ID (numeric):  _____________  ← ini NEXT_PUBLIC_TESTNET_CHAIN_ID
RPC URL:             _____________  ← ini NEXT_PUBLIC_TESTNET_RPC_URL
REST URL:            _____________
InitiaScan link:     _____________
```

> Biasanya RPC = `http://localhost:8545`, Chain ID numerik = angka panjang seperti `2124225178762456`

---

## Step 4 — Start OPinit Bots

```bash
weave opinit start executor
weave opinit start challenger
```

Verifikasi rollup berjalan:
```bash
curl http://localhost:8545 \
  -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

Output yang diharapkan: `{"result":"0x...","id":1,"jsonrpc":"2.0"}`

---

## Step 5 — Deploy Contracts

Dari root repo kitpot:

```bash
cd contracts

# Deploy semua contracts ke rollup
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key <PRIVATE_KEY_DEPLOYER>
```

> Private key deployer: gunakan wallet yang sudah punya ETH/INIT di rollup.
> Untuk fund deployer di rollup: transfer dari Gas Station atau mint via genesis.

Setelah deploy, catat semua contract addresses:
```
KitpotCircle:     0x____________________________
MockUSDC:         0x____________________________
KitpotReputation: 0x____________________________
KitpotAchievements: 0x__________________________
```

---

## Step 6 — Update .env.local

Edit file `apps/web/.env.local`, isi bagian TESTNET:

```env
NEXT_PUBLIC_TESTNET_RPC_URL=http://localhost:8545
NEXT_PUBLIC_TESTNET_CHAIN_ID=<chain_id_numerik_dari_step3>
NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS=<KitpotCircle_address>
NEXT_PUBLIC_TESTNET_USDC_ADDRESS=<MockUSDC_address>
NEXT_PUBLIC_TESTNET_REPUTATION_ADDRESS=<KitpotReputation_address>
NEXT_PUBLIC_TESTNET_ACHIEVEMENTS_ADDRESS=<KitpotAchievements_address>
```

---

## Step 7 — Update submission.json

Edit `.initia/submission.json`:

```json
{
  "chain_id": "kitpot-1",
  "contracts": {
    "KitpotCircle": "0x...",
    "KitpotReputation": "0x...",
    "KitpotAchievements": "0x...",
    "MockUSDC": "0x..."
  },
  "demo_url": "https://kitpot.vercel.app",
  "video_url": "https://youtu.be/TODO"
}
```

---

## Step 8 — Test di Web App

1. Buka http://localhost:3000
2. Klik **Testnet** di network switcher (kanan atas)
3. Connect wallet
4. Pastikan bisa: mint USDC, create circle, join circle

---

## Step 9 — Deploy ke Vercel

Set environment variables di Vercel dashboard (sama dengan `.env.local` bagian TESTNET):

```
NEXT_PUBLIC_TESTNET_RPC_URL        = <RPC rollup — perlu public URL jika deploy ke Vercel>
NEXT_PUBLIC_TESTNET_CHAIN_ID       = <chain id numerik>
NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS = <KitpotCircle>
NEXT_PUBLIC_TESTNET_USDC_ADDRESS   = <MockUSDC>
NEXT_PUBLIC_TESTNET_REPUTATION_ADDRESS = <KitpotReputation>
NEXT_PUBLIC_TESTNET_ACHIEVEMENTS_ADDRESS = <KitpotAchievements>
NEXT_PUBLIC_PRIVY_APP_ID           = cmoadvzfr003j0djugypzrdb7
# DEFAULT_NETWORK tidak perlu diset di Vercel (default sudah testnet)
```

> ⚠️ Jika rollup jalan di localhost, Vercel tidak bisa akses.
> Opsi: pakai **ngrok** untuk expose RPC publik sementara.
>
> ```bash
> ngrok http 8545
> ```
> Pakai URL ngrok (`https://xxxx.ngrok.io`) sebagai `NEXT_PUBLIC_TESTNET_RPC_URL` di Vercel.

---

## Checklist Setelah Semua Step

```
[ ] weave gas-station show — balance > 10 INIT
[ ] weave rollup launch — chain ID tercatat
[ ] curl eth_blockNumber — rollup responding
[ ] forge script deploy — 4 contract addresses tercatat
[ ] .env.local TESTNET section terisi semua
[ ] submission.json contracts terisi (bukan 0xTODO)
[ ] Web app bisa switch ke Testnet dan load data
[ ] Vercel deployed dengan env vars testnet
```

---

## Troubleshooting

**`weave rollup launch` gagal — "insufficient funds"**
→ Gas Station belum funded. Ulangi Step 2, tunggu faucet confirmed.

**`forge script` gagal — "insufficient balance"**
→ Deployer wallet belum ada ETH di rollup. Fund dulu via genesis atau transfer.

**RPC tidak respond setelah launch**
→ Cek Docker running, coba `weave rollup restart`

**Rollup sync lama**
→ Normal di testnet. Tunggu beberapa menit, cek log: `weave rollup log`
