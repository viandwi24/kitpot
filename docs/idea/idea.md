# Idea #1 — Kitpot

> Track: **Gaming & Consumer**
> Status: Ready to Build
> Generated: 2026-04-19
> Last updated: 2026-04-19

---

## Satu Kalimat

Auto-signing membuat iuran arisan seotomatis tagihan Netflix — approve sekali, jalan sendiri 12 bulan, trustless, tanpa bendahara manusia.

---

## Core Hook (untuk judges dan deskripsi submission)

> **"Arisan 500 tahun, sekarang trustless di Initia — tanpa bendahara, tanpa WA reminder, tanpa perlu tahu blockchain."**

Arisan adalah praktik tabungan kelompok yang sudah ada di Indonesia, SEA, Afrika, dan India selama berabad-abad (ROSCA / Chit Fund / Hui / Tontine). Masalahnya selalu sama dan belum pernah diselesaikan dengan baik. Kitpot menyelesaikannya dengan memanfaatkan fitur-fitur native Initia yang tidak tersedia di chain lain.

**Kenapa ini adalah "wow moment" untuk judge Initia:**
- Auto-signing membuat iuran bulanan **benar-benar otomatis** — ini bukan promosi, ini fungsional
- `.init` username membuat koordinasi sosial **natural seperti chat**, bukan seperti crypto
- Social login membuat **siapa saja bisa join** tanpa perlu tahu blockchain atau setup wallet
- Interwoven Bridge menghubungkan **deposit dari Initia hub ke rollup kitpot-1** — bagian natural dari arsitektur rollup, bukan fitur tambahan

---

## Problem

Arisan (ROSCA) adalah cara menabung kelompok yang sudah ada selama ratusan tahun. Diperkirakan **300 juta+** orang berpartisipasi di seluruh dunia. Di Indonesia, ~60% rumah tangga pernah ikut arisan. Uang yang berputar di arisan informal Indonesia diestimasi **$50B+/tahun**.

Tapi masalahnya selalu sama dan belum pernah benar-benar diselesaikan:

1. **Bendahara bisa kabur** — uang dipegang satu orang, tidak ada jaminan, tidak ada enforcement
2. **Koordinasi manual melelahkan** — reminder WA tiap bulan, transfer manual, rekap Excel, konfirmasi satu-satu
3. **Anggota tidak disiplin** — tidak ada konsekuensi otomatis kalau telat bayar, hanya tekanan sosial
4. **Tidak ada bukti transparan** — kalau ada dispute, tidak ada catatan yang tidak bisa dimanipulasi
5. **Susah scale** — arisan 50 orang = koordinasi chaos, arisan diaspora beda negara = beda bank, beda timezone
6. **Tidak ada credit history** — bertahun-tahun ikut arisan tepat waktu tapi tidak ada record untuk akses kredit

Solusi existing semuanya gagal:
- WhatsApp group → tidak ada enforcement, bendahara masih bisa kabur
- Google Sheets → sama saja, tidak ada otomasi
- Web2 ROSCA apps → centralized, butuh KYC, tidak available semua negara, bisa tutup sewaktu-waktu
- On-chain ROSCA di chain lain → user harus approve manual tiap bulan → UX rusak → tidak ada yang pakai

---

## Solution

**Kitpot** — appchain khusus di Initia untuk savings circles trustless.

### User flow lengkap:

```
CREATOR:
1. Login via social login (Google / email / Apple — tidak perlu setup wallet sendiri)
2. Buat circle → set: nama, nominal iuran (misal 100 USDC/bulan),
                       jumlah slot (5-20 orang), durasi (6-12 bulan)
3. Undang anggota → ketik "budi.init", "siti.init" (bukan 0x...)
4. Share link join circle

ANGGOTA:
5. Klik link → login via social login → lihat detail circle
6. Setup auto-signing 1x: "boleh ambil 100 USDC/bulan dari dompetku, maks 12 bulan"
   → SELESAI. Tidak ada lagi yang perlu dilakukan setiap bulan.

OTOMATIS SETIAP BULAN (tidak ada yang perlu klik apa-apa):
7. Smart contract tarik iuran dari semua anggota via auto-signing
8. Contract pilih giliran pemenang (commit-reveal / round-robin)
9. Pot langsung masuk ke wallet pemenang
10. Dashboard update real-time: status bayar, giliran, reputasi

REPUTASI (on-chain, portable):
11. Bayar tepat waktu = reputation score naik
12. Score terikat ke .init username → bisa dibawa ke circle berikutnya
13. Score tinggi = unlock akses ke circle nilai lebih besar
```

Tidak ada bendahara. Tidak ada trust. Tidak ada yang perlu diingatkan. Smart contract yang jadi perantara.

---

## Kenapa HARUS di Initia (bukan chain lain)

Ini yang membuat Kitpot **tidak bisa direplikasi di chain lain dengan UX yang sama**:

| Kebutuhan Arisan | Fitur Initia | Chain Lain | Impact ke UX |
|-----------------|-------------|-----------|-------------|
| Iuran otomatis tiap bulan | **Auto-signing session** — approve 1x, berjalan sendiri | Harus approve manual setiap bulan | Tanpa ini: lebih buruk dari WA |
| Undang anggota by name | **`.init` username** — undang `budi.init` bukan `0x1a2b...` | Hanya wallet address panjang | Tanpa ini: terasa tidak natural untuk grup sosial |
| User tanpa crypto knowledge | **Social login** (Google / email / Apple) — tidak perlu install wallet | Wajib install MetaMask/wallet | Tanpa ini: hanya bisa untuk crypto-native |
| Deposit ke rollup kitpot-1 | **Interwoven Bridge** — pindahkan aset dari Initia hub ke rollup kitpot-1 | Tidak ada mekanisme standar | Ini memang diperlukan secara teknis karena kita deploy rollup sendiri — bukan fitur tambahan |
| History tidak bisa dimanipulasi | **Rollup dedicated** — semua tx on-chain satu tempat | Tercampur tx lain | Tanpa ini: tidak ada bukti transparan |
| Aplikasi tetap bisa cuan | **Revenue capture** — 1% pot fee masuk ke developer, tidak bocor ke L1 | Fee bocor ke L1 | Tanpa ini: tidak sustainable post-hackathon |

**Catatan penting tentang Interwoven Bridge:**
Ketika kamu deploy rollup sendiri (`kitpot-1`), aset user ada di **Initia hub/mainnet** — bukan langsung di rollupmu. Interwoven Bridge adalah mekanisme resmi Initia untuk **memindahkan aset dari hub ke rollup**. Ini bukan fitur yang ditambahkan untuk terlihat keren — ini adalah bagian wajib dari onboarding flow ketika punya rollup sendiri. Framing yang benar: bukan "bridge dari Ethereum", tapi "deposit ke rollupmu dari Initia ecosystem".

**Satu fitur yang paling krusial: Auto-signing**

Analoginya: kalau Netflix meminta kamu approve pembayaran manual tiap bulan, tidak ada yang mau subscribe. Auto-signing membuat "berlangganan arisan" sama mudahnya dengan berlangganan streaming service — satu kali setup, berjalan otomatis.

---

## Fitur MVP (untuk hackathon, 6-8 hari build)

### Must-have (demo tidak bisa tanpa ini)
- [ ] **Social login** via Google/Apple (Initia social login) — onboard user tanpa perlu setup wallet
- [ ] **Buat circle** — nama, nominal, jumlah slot, durasi, deskripsi
- [ ] **Undang anggota** via `.init` username — bukan address
- [ ] **Auto-signing setup** — approve session "X USDC/bulan, maks N bulan"
- [ ] **Smart contract iuran** — tarik otomatis dari semua anggota setiap cycle
- [ ] **Distribusi pot** — kirim ke pemenang giliran otomatis
- [ ] **Urutan giliran** — round-robin sederhana untuk MVP (tidak perlu VRF penuh)
- [ ] **Dashboard circle** — status bayar tiap anggota, giliran siap dapat, history

### Nice-to-have (jika masih ada waktu)
- [ ] **Reputation score** — naik kalau bayar tepat, turun kalau telat
- [ ] **Trust tier** — Bronze → Silver → Gold → Diamond, tampil di profil `.init`
- [ ] **Interwoven Bridge UI** — tombol "top-up dari chain lain" in-app
- [ ] **Achievement badge** — Soulbound NFT untuk milestone (first pot, streak 3 bulan, tepat waktu 12x)
- [ ] **Notifikasi** — email/push sebelum tanggal tarik
- [ ] **Public circle discovery** — browse circle publik untuk join
- [ ] **Circle lending** — pinjam dari kas circle sebelum giliran tiba (extend fitur)

---

## Tech Stack

> Stack ini divalidasi dari 2 submission DeFi serius di hackathon yang sama: **Drip** dan **Leticia**.

```
Frontend:       Next.js 16, React 19, TypeScript, Tailwind CSS 4
                — mobile-first karena target user pakai HP
                — sama persis dengan Leticia & Drip

Auth:           InterwovenKit + Privy (wallet connector)
                — Privy handle social login: Google / email / Apple
                — user tidak perlu tahu blockchain sama sekali
                — dipakai oleh Drip DAN Leticia di hackathon ini

Wallet SDK:     @initia/interwovenkit-react (wajib hackathon)

EVM libs:       wagmi + viem
                — standard EVM frontend integration
                — dipakai Leticia, compatible dengan Solidity contracts

Contracts:      ⭐ Solidity 0.8.26 + Foundry + OpenZeppelin v5
                — BUKAN Move, BUKAN CosmWasm
                — dipakai Drip (8 contracts, auto-signing proven) + Leticia
                — tooling familiar: Foundry (forge test, forge deploy)
                — OpenZeppelin: Ownable, ReentrancyGuard, Pausable, SafeERC20

Chain:          Deploy rollup sendiri via `weave` CLI
                — chain ID: "kitpot-1" (EVM rollup)
                — weave rollup start        → jalanin EVM node lokal
                — weave opinit start executor → submit batch ke Initia L1
                — weave relayer start       → IBC relayer untuk bridge
                — evm-1 testnet Chain ID: 2124225178762456

Auto-signing:   InterwovenKit's auto-signing (bukan library terpisah)
                — docs: docs.initia.xyz/hackathon
                — referensi: github.com/KamiliaNHayati/Drip
                  → GhostRegistry.sol pattern (operator hanya bisa call 1 function)

Randomness:     Round-robin deterministik untuk MVP
                — VRF TIDAK tersedia built-in di Initia (konfirmasi organizer Q&A)
                — commit-reveal lebih kompleks, tunda ke v2 jika ada waktu

Bridge:         Interwoven Bridge (InterwovenKit)
                — deposit dari Initia hub/mainnet ke rollup kitpot-1
                — architecturally required karena deploy rollup sendiri

Deploy app:     Vercel (semua submission hackathon pakai Vercel)

⚠️  PARAMETER KRITIS UNTUK DEMO:
    Tambahkan `cycle_duration` sebagai parameter configurable di contract
    — production: 2592000 detik (30 hari)
    — demo mode: 60-300 detik (1-5 menit)
    — tanpa ini, demo tidak bisa menunjukkan "iuran berjalan otomatis" secara live

Storage:        On-chain state di contract (tidak perlu off-chain DB untuk MVP)

Optional:       Email/push notification sebelum tanggal tarik
```

---

## Project Structure & Init

**Monorepo:** bun workspaces + Foundry (toolchain terpisah)

```
arisan/
├── package.json          ← root workspace
├── bun.lockb
├── .gitignore
├── apps/
│   └── web/             ← Next.js 16 (bun workspace)
│       ├── package.json
│       ├── next.config.ts
│       └── src/
│           ├── app/
│           ├── components/
│           └── lib/
└── contracts/           ← Foundry (bukan bun workspace)
    ├── foundry.toml
    ├── src/
    │   └── ArisanCircle.sol
    ├── test/
    │   └── ArisanCircle.t.sol
    └── script/
        └── Deploy.s.sol
```

**Root `package.json`:**
```json
{
  "name": "arisan",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "bun --cwd apps/web dev",
    "build": "bun --cwd apps/web build",
    "test:contracts": "forge test --root contracts -vv"
  }
}
```

**Init commands (urutan):**
```bash
# 1. Root
mkdir arisan && cd arisan
bun init -y

# 2. Next.js
mkdir apps
bunx create-next-app@latest apps/web --typescript --tailwind --app --src-dir --no-git

# 3. Web dependencies
cd apps/web
bun add @initia/interwovenkit-react wagmi viem @privy-io/react-auth-sdk
cd ../..

# 4. Foundry contracts (toolchain sendiri, bukan bun)
forge init contracts --no-git
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
cd ..
```

**Catatan:**
- `contracts/` tidak masuk `workspaces` — Foundry pakai `forge`, bukan bun
- Untuk contracts: `cd contracts && forge test -vv`
- Untuk web: `bun dev` dari root (lewat workspace script)

---

## Demo Flow (video 3 menit — timestamp by timestamp)

**Narasi keseluruhan:** tunjukkan bahwa setelah setup awal, semuanya berjalan otomatis — tidak ada yang perlu klik apa-apa lagi.

```
0:00-0:10 — HOOK
  Narasi: "300 juta orang di seluruh dunia ikut arisan.
           Semuanya masih pakai WA group dan rekap Excel.
           Hari ini kita ubah itu."

0:10-0:25 — LOGIN TANPA WALLET
  → Buka arisan.init
  → Klik "Login" → pilih Google (atau email)
  → Langsung masuk (tidak ada install MetaMask, tidak ada seed phrase)
  Narasi: "Pengguna kita bukan crypto-native. Mereka orang biasa.
           Login cukup pakai akun yang sudah ada — tidak perlu tahu blockchain."

0:25-0:50 — BUAT CIRCLE
  → Klik "Buat Circle Baru"
  → Isi: nama "Arisan Alumni SMA", 5 anggota, 100 USDC/bulan, 5 bulan
  → Submit → circle terbentuk di rollup kitpot-1
  Narasi: "Circle terbentuk on-chain. Semua aturan dikunci di smart contract."

0:50-1:10 — UNDANG ANGGOTA VIA .INIT
  → Ketik: budi.init, siti.init, andi.init, dewi.init
  → Klik "Kirim Undangan"
  → Anggota terlihat di daftar dengan nama .init mereka
  Narasi: "Undang teman pakai username .init — bukan address panjang.
           Sama seperti mention di Instagram."

1:10-1:30 — SETUP AUTO-SIGNING (satu kali seumur circle)
  → Klik "Aktifkan Auto-Iuran"
  → Pop-up: "Izinkan Kitpot tarik 100 USDC/bulan dari walletmu,
             maks 5 bulan?"
  → Klik "Setuju"
  Narasi: "Ini satu-satunya approval yang diperlukan.
           Setelah ini, kamu tidak perlu klik apa-apa lagi
           selama 5 bulan ke depan."

1:30-1:50 — SIMULASI CYCLE 1 (SEMUANYA OTOMATIS)
  ⚠️  PENTING: gunakan cycle_duration = 1 menit untuk demo (bukan 1 bulan)
  → Tunggu ~60 detik (atau fast-forward dengan keterangan di video)
  → Dashboard: "Cycle 1 berjalan..."
  → Status 5 anggota: berubah dari ⏳ ke ✅ satu per satu
  → Total terkumpul: 500 USDC
  → Smart contract round-robin → "Pemenang cycle ini: budi.init"
  → 500 USDC langsung masuk ke budi.init
  Narasi: "Tidak ada yang klik apapun. Tidak ada WA reminder.
           Iuran masuk otomatis, pot keluar otomatis.
           Di dunia nyata ini berjalan tiap bulan — di sini kita demo dalam 1 menit."

1:50-2:10 — DASHBOARD & REPUTASI
  → Tampilkan dashboard circle: siapa sudah dapat, siapa belum, bulan berapa
  → Tampilkan profil budi.init: reputasi naik ke Silver (3 bulan tepat waktu)
  Narasi: "Semua history transparan. Tidak bisa dimanipulasi.
           Reputasi terikat ke username .init — dibawa ke circle berikutnya."

2:10-2:30 — INTERWOVEN BRIDGE (deposit ke rollup)
  → Tampilkan flow: user punya USDC di Initia hub/mainnet
  → Klik "Deposit ke Circle" → otomatis pakai Interwoven Bridge
  → USDC pindah dari Initia hub ke rollup kitpot-1
  Narasi: "Karena kita punya rollup sendiri (kitpot-1), user perlu deposit
           dari Initia hub ke rollup kita. Interwoven Bridge membuat ini seamless —
           satu klik, tidak perlu tahu ada dua chain yang terlibat."

2:30-2:45 — REVENUE MODEL (untuk judges yang perhatiin)
  → Tampilkan: "Platform fee: 1% per pot"
  → Kalau circle 5 orang × 100 USDC = 500 USDC pot → 5 USDC fee per bulan
  → Narasi: "Fee langsung ke developer. Tidak bocor ke L1.
             Ini yang Initia maksud dengan revenue-first."

2:45-3:00 — CLOSING
  Narasi: "Arisan sudah ada 500 tahun.
           Hari ini pertama kalinya bisa berjalan tanpa bendahara,
           tanpa WA reminder, dan tanpa perlu tahu blockchain.
           Kitpot — di Initia."
```

---

## Mapping ke Scoring INITIATE (100 pts)

| Kriteria | Bobot | Kitpot punya apa | Estimasi skor |
|---------|------|-----------------------|:---:|
| **Technical Execution & Initia Integration** | 30% | Auto-signing ✅ + `.init` username ✅ + Interwoven Bridge ✅ + Social login ✅ + Deploy rollup ✅ + InterwovenKit ✅ — **6 fitur, bukan minimum 1** | Tinggi |
| **Originality & Track Fit** | 20% | Satu-satunya arisan/ROSCA di 33 submissions ✅ · Gaming & Consumer = fit sempurna untuk "real humans, real interfaces" ✅ · Organizer bilang "unique ideas encouraged" ✅ | Tinggi |
| **Product Value & UX** | 20% | Social login = non-crypto user bisa pakai ✅ · Auto-signing = UX semudah Netflix ✅ · `.init` = invite natural seperti mention IG ✅ | Tinggi |
| **Working Demo & Completeness** | 20% | Live demo end-to-end ✅ · 11 dari 33 submissions tidak punya live demo → celah langsung | Tinggi (jika demo berjalan) |
| **Market Understanding** | 10% | 300M+ ROSCA participants · $50B+/tahun di Indonesia · diaspora angle spesifik · revenue model jelas | Medium-Tinggi |

**Total estimasi: kompetitif untuk top 3 di Gaming & Consumer track**

---

## Differensiasi vs CrediKye (Reference Winner)

CrediKye menang Grand Prize ($15k, 76 submissions) di BUIDL CTC 2026 dengan pattern yang sama — on-chain ROSCA di Creditcoin.

| Aspek | CrediKye (Grand Prize) | Kitpot | Keunggulan |
|-------|----------------------|-------------|-----------|
| Cara bayar iuran | Approve manual tiap bulan | **Auto-signing: approve 1x, 12 bulan otomatis** | UX 10x lebih baik |
| Cara onboard user | Telegram required | **Social login Google/Apple** | Accessible untuk non-crypto |
| Cara undang anggota | Wallet address | **`.init` username** | Natural, sosial |
| Cross-chain deposit | Tidak ada | **Interwoven Bridge** | Diaspora bisa join |
| Revenue model | Tidak disebutkan | **1% pot fee** | Sustainable |
| Catatan reputasi | Soulbound NFT | `.init` reputation score | Portable antar circle |

**Kesimpulan:** CrediKye membuktikan pattern ini bisa menang Grand Prize. Versi Initia punya semua yang mereka punya, plus fitur-fitur yang hanya tersedia di Initia.

---

## Differensiasi vs Submissions INITIATE Lainnya

### Posisi di Gaming & Consumer track (track yang kita masuki, 10 submissions)

| Proyek | Demo? | Angle | Kekuatan | Kelemahan vs Kitpot |
|--------|:---:|-------|----------|--------------------------|
| Initia Brawlers | ✅ | PvP autobattler, Move | Desc 10k, game nyata, Move contracts | Game murni, tidak ada social finance |
| Arcade Chess Arena | ✅ | Skill-based games | Desc 10k, live demo | Generic, tidak pakai fitur Initia native secara kuat |
| Stream-Pay | ✅ | Creator micropayment | Pakai auto-signing | Niche creator economy, bukan mass market |
| initiaLink | ✅ | Link-in-bio | Pakai `.init` | Identity tool, tidak ada group coordination |
| Gam3Hub | ✅ | Multi-game platform | Demo ada | Terlalu broad, tidak fokus |
| Hex Vault | ❌ | Roguelike + wallet | Konsep kreatif | **Tidak ada live demo** |
| Hunch | ❌ | Fast betting markets | — | **Tidak ada live demo** |
| Carnage of Gods | ❌ | Mythological PvP | — | **Tidak ada live demo, desc 533 chars** |
| Impulsive Markets | ❌ | Prediction markets | — | **Tidak ada live demo** |
| InitBet | ❌ | GameFi | — | **Tidak ada live demo, desc 281 chars** |
| **Kitpot** | **target ✅** | **Social savings** | **3 native features, mass market** | **Belum ada** |

**Pesaing nyata:** Initia Brawlers dan Arcade Chess Arena — keduanya kuat teknis dan punya demo. Tapi keduanya game murni. Judge akan melihat Kitpot sebagai *kategori berbeda* — social consumer app vs game — sehingga tidak head-to-head langsung.

**Celah paling jelas:** 5 dari 10 submissions di track ini tidak punya live demo → 20% skor Demo langsung tersedia bagi yang demonya jalan.

### Dari seluruh 33 submissions — penggunaan fitur native Initia

| Proyek | Auto-signing | `.init` | Interwoven Bridge | Angle |
|--------|:---:|:---:|:---:|-------|
| **Drip** | ✅ | — | — | Yield farming (DeFi) — auto-signing untuk auto-compound |
| **Initpay** | — | — | ✅ | B2B payroll — bridge untuk multi-chain payroll |
| **Stream-Pay** | kemungkinan ✅ | — | — | Creator micropayment |
| **initiaLink** | — | ✅ | — | Link-in-bio |
| **Kitpot** | ✅ | ✅ | ✅ | **Social savings — satu-satunya yang pakai ketiga fitur** |

**Gap unik Kitpot:** satu-satunya proyek yang mengombinasikan auto-signing + `.init` + Interwoven Bridge untuk **social group finance**. Tidak ada satu pun dari 33 submissions yang menyentuh angle ini.

---

## Alignment dengan Narasi Initia

Initia mempromosikan diri dengan tiga value prop utama. Kitpot menjawab ketiganya secara konkret — bukan sekadar klaim:

| Initia pitch | Bagaimana Kitpot menjawab | Bukti konkret |
|---|---|---|
| "Revenue-first — keep your fees" | 1% pot fee masuk langsung ke developer, tidak bocor ke L1 | Setiap pot yang keluar, 1% ke app wallet |
| "Distribution across ecosystems" | Interwoven Bridge memungkinkan deposit dari Initia hub ke rollup kitpot-1 secara seamless | User tidak perlu tahu ada dua layer yang terlibat |
| "Focus on app, chain runs in background" | User login Google, undang teman, setup sekali — tidak pernah lihat transaction hash atau wallet address | Social login + auto-signing = chain invisible |

**Kenapa ini penting untuk scoring:** judges dari Initia Labs akan memberi nilai lebih ke proyek yang **mendemonstrasikan value proposition Initia itu sendiri**, bukan sekadar deploy di atas chain. Kitpot adalah showcase sempurna dari ketiga value prop Initia sekaligus.

---

## Build Order (urutan yang direkomendasikan)

Bangun dalam urutan ini untuk memastikan demo bisa jalan sedini mungkin:

```
Fase 1 — Core contract (prioritas tertinggi):
  1. Smart contract circle (buat, join, state management)
  2. Tambahkan cycle_duration sebagai parameter (KRITIS untuk demo)
  3. Iuran collection + pot distribution (round-robin)
  4. Deploy ke testnet rollup kitpot-1

Fase 2 — Auto-signing integration:
  5. Integrasi Initia Session Key API
  6. Test: approve 1x → cycle berjalan otomatis
  7. Referensi: repo Drip (github.com/KamiliaNHayati/Drip)

Fase 3 — Frontend minimum viable:
  8. Social login (Google/email)
  9. Halaman buat circle + undang via .init
  10. Dashboard: status anggota, giliran, history

Fase 4 — Interwoven Bridge:
  11. UI deposit dari Initia hub ke kitpot-1
  12. Test end-to-end deposit flow

Fase 5 — Demo prep:
  13. Siapkan 5 test wallet dengan faucet funds
  14. Konfigurasi cycle_duration = 1 menit untuk demo
  15. Record demo video
  16. Tulis submission description 8k+ chars
  17. Siapkan .initia/submission.json dan README.md

Stop setelah Fase 3 jika waktu menipis — demo end-to-end lebih penting dari fitur lengkap.
```

---

## Market Understanding

**Ukuran market global:**
- **300 juta+** orang berpartisipasi ROSCA di seluruh dunia (World Bank)
- Dikenal sebagai: Arisan (Indonesia), Chit Fund (India/Pakistan), Hui (China/Taiwan), Tontine (Afrika Barat/Karibia), Paluwagan (Filipina), Susus (Afrika)
- Total volume ROSCA global diestimasi **$1-6T/tahun** (informal, tidak ter-record)

**Ukuran market Indonesia:**
- ~60% rumah tangga pernah ikut arisan (survei Bank Indonesia)
- Volume arisan informal Indonesia: estimasi **$50B+/tahun**
- Kebanyakan masih via WA group + transfer manual bank

**Target user pertama (go-to-market):**
Komunitas diaspora Indonesia di luar negeri (Singapura, Malaysia, Belanda, Australia, Amerika) yang masih arisan tapi:
- Koordinasi susah karena beda timezone
- Transfer susah karena beda bank/negara
- Trust lebih susah karena tidak bisa tatap muka

**Mengapa ini realistic:**
- Di Singapura saja ada 350,000+ WNI
- Komunitas ini sudah digital-savvy, sudah biasa app-based payment
- Pain point diaspora lebih akut daripada di Indonesia → willingness to try lebih tinggi

---

## Competitive Landscape

| Solusi existing | Kelemahan utama | Bagaimana Kitpot unggul |
|----------------|----------------|------------------------------|
| WhatsApp group arisan | Bendahara bisa kabur, koordinasi manual, tidak ada enforcement | Trustless, otomatis, on-chain |
| Google Sheets + transfer bank | Manual, tidak ada enforcement, beda bank = ribet | Auto-signing, cross-chain via Interwoven Bridge |
| Web2 ROSCA apps (esusu, lemfi) | Centralized, butuh KYC, tidak available semua negara | Permissionless, no KYC, global |
| ROSCA di chain lain (Ethereum, dll) | Manual approve tiap bulan = UX rusak | Auto-signing Initia = truly automated |
| CrediKye (Creditcoin) | Telegram required, manual approve, no bridge | Social login, auto-signing, Interwoven Bridge |

**Tidak ada competitor langsung di Initia atau ekosistem Cosmos/Initia.**

---

## Reference Winner

**CrediKye** — BUIDL CTC Hackathon 2026
- **Hasil:** Grand Prize ($15k prize pool, 76 submissions)
- **Source data:** `data/dorahack/buidl-ctc/index.md`
- **Pattern:** On-chain ROSCA savings circle dengan gamification dan reputation system
- **Live app:** https://credi-kye-web.vercel.app
- **Tech mereka:** Next.js 14 + Solidity + Grammy Telegram Bot + Soulbound NFT badges
- **Yang mereka punya:** Telegram Mini App, reputation system, trust tiers, soulbound NFT
- **Yang mereka TIDAK punya:** Auto-signing (manual approve bulanan), `.init` username, Interwoven Bridge, social login
- **Kesimpulan:** Pattern ini terbukti bisa menang Grand Prize dari 76 submissions. Versi Initia punya semua kelebihan CrediKye plus fitur-fitur native yang membuat UX jauh lebih baik.

---

## Risiko & Mitigasi

| Risiko | Level | Mitigasi |
|--------|:---:|---------|
| Demo tidak bisa tunjukkan "monthly cycle" secara live | **KRITIS** | Wajib tambahkan `cycle_duration` sebagai parameter di contract (bukan hardcode 30 hari). Set ke 1-5 menit untuk demo. Tanpa ini demo tidak bisa live. |
| Auto-signing API belum familiar | Tinggi | Cek repo Drip (`github.com/KamiliaNHayati/Drip`) — proyek di hackathon ini sendiri sudah pakai auto-signing. Jadikan referensi implementasi langsung. |
| VRF tidak tersedia built-in | Sudah konfirmasi | Pakai **round-robin deterministik** untuk MVP (lebih simpel dari commit-reveal, lebih reliable untuk demo). Commit-reveal bisa ditambah di v2. |
| Contract language learning curve | Rendah | Pakai **Solidity 0.8.26 + Foundry** — divalidasi Drip dan Leticia di hackathon ini. Tooling familiar, banyak contoh tersedia, OpenZeppelin siap pakai. |
| Demo butuh 5 wallet berbeda | Medium | Siapkan 5 test wallet + faucet testnet **sebelum mulai build**. Jangan tinggalkan ini ke hari terakhir. |
| Anggota tidak semua punya USDC | Medium | Testnet: mint mock USDC. Mainnet: support INIT token sebagai alternatif. |
| Interwoven Bridge diframing salah | Medium | Framing yang benar: "deposit dari Initia hub ke rollup kitpot-1" — bukan "bridge dari Ethereum". Ini bagian natural dari pakai rollup sendiri. |
| Scope creep | Tinggi | Build urutan: contract dulu → auto-signing → frontend dashboard → .init → bridge. Stop setelah demo end-to-end jalan. Nice-to-have hanya setelah semua must-have solid. |

---

## Catatan untuk Submission

**Track:** Gaming & Consumer (bukan DeFi — angle sosial/consumer, bukan keuangan teknis)

**Fitur Initia yang wajib di-highlight di submission description:**
1. Auto-signing / Session UX — cara utama iuran berjalan otomatis
2. `.init` username — cara undang dan identifikasi anggota
3. Interwoven Bridge — cross-chain deposit
4. Social login — onboard non-crypto users
5. Deploy rollup sendiri (kitpot-1)
6. InterwovenKit (required)

**Target panjang deskripsi submission:** 8.000-12.000 karakter
- Median submissions: ~2.3k (tipis)
- Top submissions: 10k-17k
- Target: setidaknya 8k dengan mapping problem → solution → kenapa Initia jelas

**Required files:**
- `.initia/submission.json` — wajib, cek docs untuk exact format
- `README.md` — human-readable summary
- Demo video 1-3 menit — wajib, disarankan narasi audio

**Kalimat pembuka submission description yang disarankan:**
> "300 million people worldwide participate in rotating savings circles (ROSCA/Arisan). Every single one of them still does it through WhatsApp groups, manual bank transfers, and a single trusted person who could disappear with everyone's money. Kitpot changes this — the first trustless rotating savings circle on Initia, where monthly contributions happen automatically via auto-signing, members are invited by .init username, and the pot is distributed by smart contract."
