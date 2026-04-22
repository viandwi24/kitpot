# References — Kitpot

> Daftar referensi proyek serupa dan potensi pemenang yang menjadi dasar ide dan validasi Kitpot.
> Sumber: `data/dorahack/buidl-ctc/index.md` + reverse-engineer dari 33 submissions INITIATE

---

## Reference Winner

### CrediKye — BUIDL CTC Hackathon 2026

- **Hasil:** Grand Prize ($15k prize pool, 76 submissions)
- **Pattern:** On-chain ROSCA savings circle dengan gamification dan reputation system
- **DoraHacks submission:** https://dorahacks.io/buidl/40170
- **Hackathon page:** https://dorahacks.io/hackathon/buidl-ctc
- **Winners page:** https://dorahacks.io/hackathon/buidl-ctc/winner
- **Live app:** https://credi-kye-web.vercel.app
- **Source data lokal:** `data/dorahack/buidl-ctc/index.md`

**Tech stack mereka:**
- Next.js 14 + Solidity
- Grammy Telegram Bot (Telegram Mini App)
- Soulbound NFT badges
- Reputation system + trust tiers

**Yang mereka punya:**
- Telegram Mini App
- Reputation system (trust tiers)
- Soulbound NFT untuk milestone

**Yang mereka TIDAK punya (jadi differensiator Kitpot):**
- Auto-signing (user harus approve manual tiap bulan)
- `.init` username (pakai wallet address)
- Interwoven Bridge (tidak ada cross-chain deposit)
- Social login (wajib Telegram)

**Kesimpulan:** Pattern on-chain ROSCA terbukti bisa menang Grand Prize dari 76 submissions. Kitpot punya semua yang CrediKye punya plus fitur-fitur native Initia yang membuat UX jauh lebih baik.

---

## Reference Dari Hackathon Yang Sama (INITIATE)

Dipakai sebagai benchmark teknis, validasi stack, dan blueprint implementasi.

### Drip

- **GitHub:** https://github.com/KamiliaNHayati/Drip
- **Track:** DeFi (bukan Gaming, tapi relevan secara teknis)
- **Yang dipelajari:** Auto-signing pattern, Privy + InterwovenKit integration, Solidity on EVM rollup
- **Relevansi:** Satu-satunya proyek di INITIATE yang sudah proven pakai auto-signing — jadi blueprint langsung untuk `KitpotCircle.sol` dan session key flow
- **Key file:** `GhostRegistry.sol` — pattern operator restriction (operator hanya bisa call 1 function)
- **Prioritas:** **Paling kritis** — wajib baca sebelum nulis contract auto-signing

### Leticia

- **GitHub:** https://github.com/0xpochita/Leticia
- **Track:** Gaming & Consumer (track yang sama)
- **Yang dipelajari:** Stack reference — identik dengan Kitpot
- **Stack mereka:** Next.js 16 + React 19 + Solidity + Bun + Tailwind CSS 4
- **Relevansi:** Validasi bahwa EVM (Solidity) valid di Gaming & Consumer track, bukan hanya Move
- **Prioritas:** Tinggi — pakai sebagai template README dan submission description

### initcred

- **GitHub:** https://github.com/kingskuan/initcred-0410
- **Yang dipelajari:** REST API queries ke `rest.initia.xyz`, Next.js setup pattern
- **Relevansi:** Referensi query on-chain data tanpa SDK

### iusd-pay

- **GitHub:** https://github.com/ocean2fly/iusd-pay
- **Yang dipelajari:** InterwovenKit + Interwoven Bridge integration, React 19 + PWA setup
- **Relevansi:** Cara implementasi bridge flow dari Initia hub ke rollup

---

## Competitive Landscape — INITIATE Gaming & Consumer Track

10 submissions total di track ini. Analisis posisi Kitpot:

| Proyek | Demo? | Angle | Kekuatan | Kelemahan vs Kitpot |
|--------|:---:|-------|----------|----------------------|
| Initia Brawlers | ✅ | PvP autobattler, Move | Desc 10k, game nyata | Game murni, tidak ada social finance |
| Arcade Chess Arena | ✅ | Skill-based games | Desc 10k, live demo | Generic, fitur Initia native tidak sekuat Kitpot |
| Stream-Pay | ✅ | Creator micropayment | Pakai auto-signing | Niche creator economy, bukan mass market |
| initiaLink | ✅ | Link-in-bio | Pakai `.init` | Identity tool, tidak ada group coordination |
| Gam3Hub | ✅ | Multi-game platform | Demo ada | Terlalu broad, tidak fokus |
| Hex Vault | ❌ | Roguelike + wallet | Konsep kreatif | **Tidak ada live demo** |
| Hunch | ❌ | Fast betting markets | — | **Tidak ada live demo** |
| Carnage of Gods | ❌ | Mythological PvP | — | **Tidak ada live demo, desc 533 chars** |
| Impulsive Markets | ❌ | Prediction markets | — | **Tidak ada live demo** |
| InitBet | ❌ | GameFi | — | **Tidak ada live demo, desc 281 chars** |
| **Kitpot** | **target ✅** | **Social savings** | **3 native features, mass market** | Belum build |

**Celah utama:** 5 dari 10 submissions tidak punya live demo → 20% skor Demo langsung tersedia.

**Pesaing nyata:** Initia Brawlers dan Arcade Chess Arena — keduanya kuat teknis dan punya demo. Tapi keduanya game murni, Kitpot masuk sebagai social consumer app → tidak head-to-head langsung.

---

## Penggunaan Fitur Native Initia — Seluruh 33 Submissions

| Proyek | Auto-signing | `.init` | Interwoven Bridge | Angle |
|--------|:---:|:---:|:---:|-------|
| Drip | ✅ | — | — | Yield farming — auto-compound |
| Initpay | — | — | ✅ | B2B payroll |
| Stream-Pay | kemungkinan ✅ | — | — | Creator micropayment |
| initiaLink | — | ✅ | — | Link-in-bio |
| **Kitpot** | **✅** | **✅** | **✅** | **Social savings — satu-satunya yang pakai ketiga fitur** |

**Gap unik Kitpot:** satu-satunya dari 33 submissions yang kombinasikan auto-signing + `.init` + Interwoven Bridge untuk social group finance.

---

## Source URLs — INITIATE Hackathon

| Resource | URL |
|----------|-----|
| Hackathon page | https://dorahacks.io/hackathon/initiate/detail |
| All submissions (33) | https://dorahacks.io/hackathon/initiate/buidl |
| Hackathon docs | https://docs.initia.xyz/hackathon |
| InterwovenKit docs | https://docs.initia.xyz/interwovenkit |
| Submission requirements | https://docs.initia.xyz/hackathon/submission-requirements |
| Privy dashboard | https://dashboard.privy.io |
| Initia REST API | https://rest.initia.xyz |
| Initia Scan testnet | https://scan.testnet.initia.xyz/evm-1 |
| Discord Initia | https://discord.gg/initia |
