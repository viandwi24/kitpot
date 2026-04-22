# Execution Plan — Kitpot
> Solo · 7 hari · 19 Apr → 26 Apr 2026
> Track: Gaming & Consumer | Stack: Solidity + Foundry + Next.js 16 + InterwovenKit + Privy

---

## Prinsip Eksekusi

1. **Demo dulu, fitur kemudian** — setiap hari cek: "apakah ini bisa didemoin?"
2. **Round-robin untuk MVP** — jangan buang waktu di VRF/randomness, giliran cukup sequential
3. **cycle_duration = 60 detik untuk testnet** — contract harus bisa ini dari hari pertama
4. **Satu circle, 3 anggota** — minimal yang bisa didemoin, jangan over-engineer jumlah member
5. **Referensi Drip dan Leticia** — jangan mulai dari nol, copy pattern yang sudah terbukti

---

## Day 1 — Senin 20 Apr: Environment + Rollup

**Goal hari ini:** Rollup `kitpot-1` running, contract bisa di-deploy

### Tasks
- [ ] Install `weave` CLI
  ```bash
  # lihat docs.initia.xyz/hackathon untuk install instructions
  ```
- [ ] Init rollup EVM baru
  ```bash
  weave rollup start        # EVM node (RPC :8545, REST :1317)
  weave opinit start executor
  weave relayer start
  ```
- [ ] Init Foundry project
  ```bash
  forge init arisan-contracts
  cd arisan-contracts
  forge install OpenZeppelin/openzeppelin-contracts
  ```
- [ ] Buat skeleton `ArisanCircle.sol`
  ```solidity
  // State variables only, no logic yet
  struct Circle { ... }
  struct Member { ... }
  uint256 public cycleDuration; // KRITIS: configurable
  ```
- [ ] Deploy hello world contract ke kitpot-1 testnet — pastikan deploy pipeline jalan

**Selesai kalau:** `forge deploy` sukses ke kitpot-1, bisa lihat di Initia Scan

---

## Day 2 — Selasa 21 Apr: Core Contract Logic

**Goal hari ini:** Contract bisa createCircle, join, dan tarik iuran manual

### Tasks
- [ ] `createCircle(name, amount, slots, cycleDuration)` — creator jadi member pertama
- [ ] `joinCircle(circleId)` — max sampai `slots` penuh
- [ ] `deposit(circleId)` — anggota bayar iuran untuk cycle ini
- [ ] `distributePot(circleId)` — kirim pot ke pemenang giliran (round-robin)
- [ ] `cycle_duration` parameter — wajib bisa set ke 60 detik
- [ ] Foundry tests dasar:
  ```bash
  forge test -vv
  ```
- [ ] Deploy ke kitpot-1 testnet + catat contract address

**Selesai kalau:** `forge test` hijau semua, contract deployed, bisa interact via cast

---

## Day 3 — Rabu 22 Apr: Auto-Signing Integration

**Goal hari ini:** Auto-signing session setup di contract, referensi Drip

### Tasks
- [ ] Baca Drip's auto-signing pattern: `github.com/KamiliaNHayati/Drip` → `GhostRegistry.sol`
- [ ] Implementasi session authorization di contract:
  - User set session: "boleh tarik max X USDC, sampai timestamp Y, untuk circleId Z"
  - Contract validasi session sebelum `deposit()` auto
- [ ] Test auto-signing flow dengan 2 wallet di local
- [ ] `.init` username — cek cara resolve via Initia L1 view function
  ```
  SocialYield pakai: usernames::get_name_from_address() via Move view function
  ```
- [ ] Update tests

**Selesai kalau:** Bisa setup session 1x → contract tarik iuran otomatis tanpa approval popup

---

## Day 4 — Kamis 23 Apr: Frontend Core

**Goal hari ini:** Bisa login dan buat circle dari browser

### Tasks
- [ ] Init Next.js 16 project
  ```bash
  npx create-next-app@latest arisan-frontend --typescript --tailwind
  ```
- [ ] Install dependencies:
  ```bash
  npm install @initia/interwovenkit-react wagmi viem @privy-io/react-auth-sdk
  ```
- [ ] Setup InterwovenKit + Privy provider (copy dari Leticia/Drip pattern)
- [ ] Social login button (Google/email/Apple) — user bisa masuk tanpa wallet
- [ ] Form "Buat Circle": nama, nominal, jumlah slot, durasi
- [ ] Call `createCircle()` dari frontend → signed via InterwovenKit popup
- [ ] Halaman invite: ketik `budi.init` → resolve → kirim invite

**Selesai kalau:** Login → create circle → muncul di blockchain

---

## Day 5 — Jumat 24 Apr: Dashboard + Auto-Signing UI + Bridge

**Goal hari ini:** Full user flow dari join sampai dapat pot bisa didemoin

### Tasks
- [ ] Circle dashboard:
  - List anggota + status bayar bulan ini
  - Siapa giliran dapat pot berikutnya
  - Timer countdown ke cycle berikutnya
  - History pot yang sudah jalan
- [ ] Auto-signing setup UI:
  - Tombol "Aktifkan Iuran Otomatis"
  - Tunjukkan: "Max 100 USDC/cycle, selama 12 cycle"
  - Satu kali approve → jalan otomatis
- [ ] Interwoven Bridge UI (nice-to-have, tapi usahakan):
  - Tombol "Top-up dari Initia" → arahkan ke bridge flow
- [ ] Deploy ke Vercel (staging)

**Selesai kalau:** Full flow bisa dijalani dari browser: login → join → auto-sign → lihat dashboard

---

## Day 6 — Sabtu 25 Apr: Demo Prep + Polish

**Goal hari ini:** Video 3 menit direkam, submission siap

### Tasks
- [ ] Setup 5 test wallet di testnet dengan balance USDC
- [ ] Set `cycle_duration = 60` di contract instance khusus demo
- [ ] Dry run demo flow 3x sampai mulus:
  1. Buka app → login Google (10 detik)
  2. Buat circle "Arisan Alumni" 3 slot, 100 USDC, 60 detik/cycle
  3. Undang `alice.init` dan `bob.init` via username
  4. Semua anggota setup auto-signing 1x
  5. Tunggu 60 detik → iuran masuk otomatis dari semua anggota
  6. Contract distribusi pot ke anggota pertama → 300 USDC masuk
  7. Tunjukkan dashboard: reputasi naik, history cycle on-chain
- [ ] Record video 3 menit (OBS / Loom / Quicktime)
- [ ] Upload video ke YouTube

**Selesai kalau:** Video tersimpan, link YouTube ada

---

## Day 7 — Minggu 26 Apr: Submission ⚠️ DEADLINE

**Goal hari ini:** Submit sebelum EOD

### Tasks
- [ ] Tulis README.md (copy struktur dari Leticia sebagai template)
- [ ] Buat `.initia/submission.json`:
  ```json
  {
    "chain_id": "kitpot-1",
    "contract_address": "0x...",
    "demo_url": "https://arisan.vercel.app",
    "video_url": "https://youtu.be/..."
  }
  ```
  Format exact: `docs.initia.xyz/hackathon/submission-requirements`
- [ ] Tulis deskripsi DoraHacks (target ≥ 5000 chars, lihat Leticia sebagai benchmark):
  - Problem (arisan pain points + angka nyata)
  - Solution (flow step by step)
  - Kenapa Initia (tabel fitur native)
  - Tech stack (sama persis tech-stack.md)
  - Market (130M+ arisan Indonesia)
  - Business model (1% pot fee)
- [ ] Final deploy Vercel production
- [ ] Submit di dorahacks.io/hackathon/initiate

---

## Contingency

| Risiko | Likelihood | Mitigasi |
|--------|-----------|---------|
| weave CLI sulit setup | Medium | Pakai evm-1 public testnet dulu (Chain ID 2124225178762456), deploy rollup Day 2 |
| Auto-signing API tidak intuitive | Medium | Alokasi Day 3 penuh, Drip repo sebagai blueprint |
| Demo crash saat record | Low | Record di localhost (bukan produksi), punya 2 take |
| Vercel deploy gagal | Low | Build locally dulu, debug environment vars |
| Deadline mepet | - | Day 6 buffer, Day 7 hanya submission — jangan coding fitur baru |

---

## Minimum Viable Demo (jika mepet waktu)

Kalau hari ke-5 belum selesai semua, prioritas ini yang **wajib ada** untuk demo 3 menit:
1. ✅ Social login (Google)
2. ✅ Buat circle
3. ✅ Join circle via `.init` username
4. ✅ Auto-signing setup 1x
5. ✅ Iuran otomatis masuk (even jika UI-nya sederhana)
6. ✅ Pot keluar ke pemenang

Yang boleh ditunda ke nice-to-have:
- ❌ Interwoven Bridge UI
- ❌ Reputation score
- ❌ Achievement badges
- ❌ Animation / polish UI

---

## Links Penting Selama Build

| Resource | URL |
|----------|-----|
| Hackathon docs | docs.initia.xyz/hackathon |
| Submission format | docs.initia.xyz/hackathon/submission-requirements |
| Drip repo (auto-signing ref) | github.com/KamiliaNHayati/Drip |
| Leticia repo (stack ref) | github.com/0xpochita/Leticia |
| Initia REST API | rest.initia.xyz |
| Initia Scan testnet | scan.testnet.initia.xyz/evm-1 |
| Discord organizer | discord.gg/initia |
| Telegram organizer | @jeff_initia |
