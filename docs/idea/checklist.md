# Checklist Penilaian Mandiri — Kitpot × INITIATE

> Self-assessment sebelum submit. Status diupdate per 2026-04-23.
> ✅ = Done | ❌ = Belum / Missing | ⚠️ = Partial / Perlu fix | 🔴 = CRITICAL (disqualifier risk)

---

## 0. Eligibility — Syarat Wajib (Disqualifier jika tidak dipenuhi)

- ✅ Project dibangun selama periode hackathon
- 🔴 **Deployed sebagai Initia appchain / rollup sendiri** — saat ini masih di Anvil lokal (chainId 31337). Perlu deploy ke Initia testnet `kitpot-1` sebelum submit
- ✅ **`@initia/interwovenkit-react` TERINTEGRASI** — `InterwovenKitProvider` aktif, `openConnect`/`openWallet`/`openBridge` semua berjalan
- ✅ Mengimplementasikan ≥ 1 fitur Initia-native:
  - ✅ InterwovenKit wallet connect — social login (Google, email, X) + native wallets
  - ✅ Interwoven Bridge — `openBridge()` terhubung ke tombol "Deposit via Bridge"
  - ✅ `.init` Usernames — resolve via Initia REST API + tampil di ConnectButton
- ✅ `.initia/submission.json` ada (tapi URL masih TODO — perlu diisi sebelum submit)
- ✅ `README.md` ada dan readable
- ❌ Demo video — URL masih `https://youtu.be/TODO`
- ✅ Track: Gaming & Consumer

---

## 1. Technical Execution & Initia Integration — 30 poin

### Appchain / Rollup
- ❌ Rollup `kitpot-1` belum di-deploy ke testnet — saat ini hanya Anvil lokal
- ❌ Chain ID yang bisa diverifikasi oleh judge belum ada
- ❌ RPC endpoint publik belum ada
- ❌ Smart contract belum di-deploy di rollup Initia (masih di 0x addresses lokal)

### Smart Contract
- ✅ `KitpotCircle.sol` ter-deploy dan berfungsi (lokal)
- ✅ `KitpotReputation.sol` — XP, tier, streak berjalan
- ✅ `KitpotAchievements.sol` — soulbound NFT achievements
- ✅ `createCircle()` berjalan — nama, nominal, slot, durasi configurable
- ✅ `joinCircle()` berjalan — sampai batas slot, deposit collateral
- ✅ Iuran collection berjalan — `depositContribution()`
- ✅ Distribusi pot berjalan — round-robin ke pemenang giliran
- ✅ `cycle_duration` adalah parameter configurable (60s demo, 300s, 2592000s)
- ✅ Foundry tests: **85 passed, 0 failed**

### Auto-signing / Session UX ⭐
- ✅ `AutoSigningSetup` component ada dan berfungsi
- ✅ Session key — user approve sekali, iuran berjalan otomatis
- ✅ Batas session: max amount per cycle + expiry timestamp
- ✅ `useAutoSigning` hook + contract session validation
- ✅ Seamless UX: single-button approve+create, approve+join (tidak perlu 2 klik manual)

### `.init` Username ⭐
- ✅ `lib/initia/username.ts` — query Initia REST API `rest.initia.xyz`
- ✅ `InitUsername` component — tampilkan `nama.init` atau truncated address
- ✅ `useInitUsername` dan `useResolveUsername` hooks berjalan
- ✅ Dashboard member list tampil dengan `.init` names
- ✅ Leaderboard tampil dengan `.init` names
- ✅ ConnectButton menampilkan `username.init` setelah connect
- ⚠️ Di lokal devnet, resolve selalu fallback ke address (API hanya kerja di testnet/mainnet)

### Interwoven Bridge ⭐
- ✅ Bridge page ada di `/bridge`
- ✅ USDC balance tampil
- ✅ Mint test USDC (untuk lokal devnet) berfungsi
- ✅ "Deposit via Bridge" tombol terhubung ke `openBridge()` dari InterwovenKit
- ✅ Real Interwoven Bridge modal akan muncul saat tombol diklik

### InterwovenKit ✅ (was 🔴)
- ✅ `@initia/interwovenkit-react` terinstall dan aktif
- ✅ `InterwovenKitProvider` aktif di `providers.tsx` dengan `TESTNET` config
- ✅ `useInterwovenKit()` dipakai di `ConnectButton`, `BridgeDeposit`
- ✅ `openConnect` / `openWallet` berjalan dengan wallet modal yang proper
- ✅ Social login via Privy tersedia (Google, Email/Socials, X)
- ✅ Styled wallet drawer dengan dark theme

**Estimasi skor: ~24 / 30** (naik dari 18 — InterwovenKit sudah berjalan, tapi rollup belum deploy)

---

## 2. Originality & Track Fit — 20 poin

### Keunikan Ide
- ✅ ROSCA/arisan angle belum ada di submissions lain
- ✅ Bukan head-to-head dengan Gaming & Consumer submissions yang ada
- ✅ Kombinasi auto-signing + `.init` + Bridge untuk social finance = unik
- ✅ Bisa jawab "kenapa tidak bisa di chain lain": auto-signing + social login

### Track Fit — Gaming & Consumer
- ✅ Angle jelas: real humans, real interfaces
- ✅ Target user spesifik: komunitas diaspora + arisan informal
- ✅ Problem nyata manusia biasa (bendahara kabur, WA manual, transfer antar bank)

### Narasi
- ✅ Hook: "300 juta orang masih arisan via WA group. Kitpot ubah itu."
- ✅ README landing section kuat
- ✅ Tidak pakai jargon blockchain di surface

**Estimasi skor: 16 / 20**

---

## 3. Product Value & UX — 20 poin

### Onboarding
- ✅ Social login (Google / email / X) tersedia via InterwovenKit + Privy
- ✅ User BISA connect tanpa wallet extension (via email/social)
- ✅ Brave Wallet, Keplr, Leap, Rabby, Phantom semua terdeteksi
- ✅ ConnectButton menampilkan `.init` username setelah connect

### Core Flow End-to-End
- ✅ Buat circle → berhasil on-chain
- ✅ Invite anggota → join via form
- ✅ Auto-signing setup → 1x approve → iuran otomatis
- ✅ Pot keluar ke pemenang giliran
- ✅ Dashboard: status bayar, giliran, history cycle
- ✅ Discover page untuk circle publik
- ✅ Leaderboard dengan reputasi

### UX Quality
- ✅ Single-button approve + create (tidak perlu klik 2x lagi)
- ✅ Single-button approve + join (seamless)
- ✅ Loading state jelas saat transaksi on-chain
- ✅ Error state readable (bukan raw error)
- ✅ Timer countdown cycle berikutnya
- ✅ Skeleton loading di circle detail, discover, leaderboard
- ✅ Status anggota: sudah bayar / belum
- ⚠️ Mobile layout belum ditest

### "Improved by Initia" Test
- ✅ Auto-signing membuat UX tidak bisa direplikasi di Ethereum
- ✅ InterwovenKit social login — user non-crypto bisa masuk
- ✅ `.init` username — identitas on-chain tanpa address mentah
- ✅ Bridge modal — top-up dari chain lain langsung dari app

**Estimasi skor: 17 / 20** (naik dari 14 — social login & InterwovenKit sudah berjalan)

---

## 4. Working Demo & Completeness — 20 poin

### Demo Video
- ❌ Video belum ada — `https://youtu.be/TODO`
- ❌ Checklist konten video belum dijalankan

### README.md
- ✅ Deskripsi produk jelas
- ✅ Problem yang diselesaikan
- ✅ User flow singkat
- ✅ Tech stack disebutkan
- ⚠️ Link demo video masih TODO
- ⚠️ Contract address masih placeholder (belum di rollup Initia)
- ⚠️ Live app URL `kitpot.vercel.app` belum aktif

### `.initia/submission.json`
- ✅ File ada di path yang benar
- ❌ `contracts` masih `0xTODO`
- ❌ `demo_url` masih `https://kitpot.vercel.app` (belum deploy)
- ❌ `video_url` masih `https://youtu.be/TODO`

### Live Demo
- ❌ App belum di-deploy ke Vercel
- ❌ URL live belum aktif

**Estimasi skor: 10 / 20** (logic jalan lokal, tapi semua URL masih TODO)

---

## 5. Market Understanding — 10 poin

- ✅ Target user spesifik: diaspora Indonesia (350,000+ WNI di Singapura)
- ✅ Angka nyata: 300M+ ROSCA participants
- ✅ Pain point diaspora lebih akut: timezone, bank, trust
- ✅ Competitive landscape: WA group, Google Sheets, Web2 ROSCA apps
- ✅ Revenue model: 1% pot fee per cycle
- ✅ Go-to-market yang masuk akal: komunitas diaspora online

**Estimasi skor: 8 / 10**

---

## Ringkasan Skor Estimasi Sekarang

| Kriteria | Bobot | Sebelum (04-23 pagi) | Sekarang (04-23 malam) | Target |
|----------|:-----:|:--------------------:|:----------------------:|:------:|
| Technical Execution & Initia Integration | 30% | ~18 / 30 | ~24 / 30 | 26+ / 30 |
| Originality & Track Fit | 20% | 16 / 20 | 16 / 20 | 17+ / 20 |
| Product Value & UX | 20% | 14 / 20 | 17 / 20 | 18+ / 20 |
| Working Demo & Completeness | 20% | 10 / 20 | 10 / 20 | 18+ / 20 |
| Market Understanding | 10% | 8 / 10 | 8 / 10 | 9 / 10 |
| **Total** | **100%** | **~66 / 100** | **~75 / 100** | **88+ / 100** |

**Yang fix hari ini: +9 poin** (InterwovenKit, social login, bridge modal, seamless UX)

---

## 🔴 Critical Path — 3 Hari Tersisa (Deadline: 26 Apr 2026)

### P0 — Disqualifier Risk
1. ~~**Integrasikan InterwovenKit**~~ — ✅ DONE
2. **Deploy ke Initia testnet** — judge HARUS bisa verifikasi chain ID
   - Deploy rollup `kitpot-1` via Weave CLI
   - Deploy kontrak ke rollup (bukan Anvil lokal)
   - Update `.env.local` dan `submission.json` dengan address real

### P1 — Skor Signifikan (+13 poin jika semua selesai)
3. **Demo video** — syarat wajib + scoring
   - 1–3 menit, narasi jelas
   - Tunjukkan full flow: connect (social login) → create → invite → auto-sign → pot keluar
   - Sebut eksplisit: auto-signing, `.init`, InterwovenKit bridge

4. **Deploy ke Vercel** — live URL aktif
   - `NEXT_PUBLIC_*` env vars pointing ke testnet contract
   - URL masuk ke `submission.json` dan README

5. **Update `submission.json`** dengan semua URL dan contract address real

### P2 — Skor Tambahan
6. **Test mobile layout**
7. **DoraHacks description** — target ≥ 8.000 chars, struktur lengkap

---

## Quick Check — 5 Menit Sebelum Submit

```
[ ] .initia/submission.json: semua field terisi (bukan TODO)
[ ] README.md: demo video + live app + contract address aktif
[ ] Demo video: link aktif, 1-3 menit, narasi ada
[ ] Live app URL: bisa dibuka tanpa setup lokal
[ ] Contract address: di rollup kitpot-1 (bukan 0xTODO / Anvil)
[✅] InterwovenKit: terintegrasi dan berjalan
[✅] Forge tests: semua pass (saat ini 85/85)
[ ] DoraHacks description: ≥ 5000 chars
[✅] Track: Gaming & Consumer dipilih
[ ] Semua URL tidak 404
```
