# Kitpot — Demo Video Script

> Mengikuti template `script.md` milik Leticia. Narasi (text on screen / voiceover) ditulis **bahasa Inggris** karena akan dibacakan oleh ElevenLabs. Catatan editor ditulis **bahasa Indonesia** karena editor = pemilik proyek (di-edit di CapCut).

## Overview untuk Editor

Halo. Sebelum mulai edit, ini context singkat tentang Kitpot supaya kamu paham apa yang lagi kita demo-kan.

### Apa itu Kitpot?

Kitpot adalah **arisan trustless di blockchain Initia**. Bayangkan grup arisan WA biasa — patungan tiap bulan, satu orang dapat pot, bergiliran sampai semua kebagian — tapi **bendaharanya diganti smart contract**. Tidak ada lagi satu orang yang pegang uang dan bisa kabur.

### Kenapa ini penting?

- Sekitar **300 juta orang di dunia** ikut arisan (nama lokalnya: arisan / chit fund / hui / tanda / tontine / paluwagan / susu / cundina). Di Indonesia saja perputaran arisan informal ditaksir **$50B+/tahun**.
- Failure mode-nya selalu sama selama 500 tahun: **ada satu orang yang harus pegang uang antara setor dan bagi**. Orang itu bisa hilang, salah hitung, atau pilih kasih.
- Web2 ROSCA app sudah pernah dicoba — tapi terpusat, butuh KYC, dan bisa tutup sewaktu-waktu.
- ROSCA on-chain di chain lain juga sudah ada (CrediKye di Creditcoin menang Grand Prize hackathon BUIDL CTC) — tapi user harus *approve manual* tiap bulan. UX-nya rusak.
- **Kitpot menyelesaikan UX ini** dengan tiga fitur native Initia yang tidak ada di chain lain: **auto-signing**, **`.init` username**, dan **Interwoven Bridge**.

Hasilnya: rasanya seperti tap-and-pay — dan setelah satu kali approve, deposit tiap cycle sign sendiri tanpa popup.

### Istilah yang perlu kamu tahu

| Istilah | Arti Simpelnya |
|---|---|
| **Circle** | Grup arisan. Berisi 3–20 anggota yang setor sama besar tiap cycle. |
| **Cycle** | Satu putaran. Di dunia nyata 1 bulan; **di demo kita set 60 detik** supaya bisa hidup di video. |
| **Pot** | Total uang yang dikumpulkan tiap cycle. Diberikan ke satu pemenang giliran. |
| **Collateral** | Jaminan yang dikunci di contract waktu join — di-slash kalau telat bayar. |
| **Auto-sign** | Fitur native Initia: approve sekali → semua tx di session itu sign sendiri tanpa popup. |
| **`.init` username** | Username on-chain Initia. Dipakai mention anggota seperti `@username` di IG, bukan address `0x...`. |
| **Interwoven Bridge** | Mekanisme resmi Initia untuk pindahkan aset antara Initia hub dan rollup. |
| **Pull-claim** | Pemenang cycle yang panggil `claimPot()` sendiri — pot tidak otomatis push. |
| **Keeper / `substituteClaim`** | Safety net: kalau pemenang nge-hang >7 hari, siapa pun bisa nge-trigger; pot tetap ke pemenang, caller dapat 0.1% fee. |
| **Smart Contract** | Program di blockchain yang jalankan aturan — di sini menggantikan bendahara. |
| **Soulbound badge** | NFT yang tidak bisa ditransfer — penanda achievement (tier Bronze → Diamond). |

### Alur cerita video ini

```
1. HOOK       → 500 tahun, 300 juta orang, satu masalah yang sama: bendahara
2. PROBLEM    → WA + transfer manual + satu orang pegang semua uang = ranjau
3. SOLUTION   → Kitpot: contract jadi bendahara, UX-nya seperti tap-pay
4. NATIVE     → 3 fitur Initia yang bikin ini mungkin: auto-sign, .init, bridge
5. DEMO 1     → Buat circle (60-detik cycle untuk demo)
6. DEMO 2     → Join + enable auto-sign
7. DEMO 3     → Deposit (silent, no popup) → cycle elapses → claim pot
8. ARCH       → 5 contracts, 102 tests, sendiri di rollup kitpot-2
9. CLOSING    → Logo + tagline + repo + INITIATE
```

### Vibe yang diinginkan

Pikirkan video demo seperti Stripe atau Linear product launch — **clean, calm, percaya diri, tidak hyper.** Biarkan produk yang bicara. Audience pertama adalah judge Initia yang sudah lihat ratusan demo crypto — yang menonjol adalah **kejernihan**, bukan efek.

---

## Info Teknis untuk Editor

- **Durasi target**: 2:30 – 3:00 (idealnya **2:45**)
- **Tone**: Professional tapi hangat — *we ported a 500-year-old ritual*, bukan *yet another DeFi*
- **Voiceover**: ElevenLabs, suara English natural (rekomendasi: "Brian" / "Adam" / "Bella" — tone calm narrator). Hindari suara terlalu hype-y.
- **Music**: Lo-fi minimal / ambient pad. Volume **rendah** di background. Naik sedikit di transisi Hook → Problem dan di Closing.
- **Font on-screen**: Sans-serif clean (Inter / Geist / SF Pro). Hindari serif & display font.
- **Color grade**: Konsisten dark mode (UI Kitpot memang dark) — biarkan accent warna asli web yang tampil. Jangan over-saturate.
- **Pacing**: Beri minimum **2 detik per text card**. Saat tampil tx confirmation, jangan tunggu loading lama — speed-up 2× atau cut langsung ke result.
- **Transisi**: Fade / smooth cut. Hindari wipe, zoom-burst, glitch effect.
- **Captions**: Burn subtitle bahasa Inggris di bagian narasi (judge sering nonton mute).
- **Aspect ratio**: 16:9, 1080p minimum.

---

## Scene Breakdown

> Format: setiap scene punya **Visual** (apa yang muncul), **Narration** (yang dibacakan ElevenLabs), **Text overlay** (yang muncul di layar — bisa identik dengan narration atau ringkasan), dan **Catatan editor** (instruksi praktis).

---

### SCENE 1 — Hook (0:00 – 0:15)

**Visual**: Background dark dengan subtle gradient. Kinetic typography — kalimat muncul satu per satu, fade in/out cepat.

**Narration (ElevenLabs)**:
> "Three hundred million people on this planet save money the same way. Every month, they pool cash into one pot, and one person takes their turn to keep it. It's been working for five hundred years. There's just one bug. Someone has to hold the money."

**Text overlay** (muncul bertahap, 2 detik per baris):
```
300,000,000 people.
50 billion dollars a year.
500 years of one ritual.
And one bug.
"Someone has to hold the money."
```

**Lalu transisi**: Logo Kitpot muncul di tengah dengan tagline.

```
[Logo Kitpot]
The savings circle, with the treasurer replaced by code.
```

> **Catatan editor**: Hook ini adalah hook utama — judge biasanya skip kalau 5 detik pertama lemah. Pakai pause 1 detik di kalimat *"And one bug."* — itu beat-nya. Logo masuk lewat fade halus, jangan zoom-in.

---

### SCENE 2 — Problem Statement (0:15 – 0:30)

**Visual**: Mockup screenshot WhatsApp group arisan + foto rekap Excel + ikon transfer bank — disusun sebagai collage yang berputar pelan. Lalu satu kotak besar di tengah dengan foto avatar dan caption "Treasurer".

**Narration (ElevenLabs)**:
> "Today, every rotating savings circle still runs on a WhatsApp group, a spreadsheet, and one trusted person. That person can disappear. They can miscount. They can play favorites. The whole structure rests on social trust — and social trust does not scale past your closest friends."

**Text overlay**:
```
WhatsApp + Excel + one trusted person.
The treasurer can disappear.
The treasurer can miscount.
Trust does not scale.
```

> **Catatan editor**: Saat narasi *"That person can disappear"* — fade out avatar treasurer jadi kotak kosong. Visual yang sederhana ini *menjelaskan satu kalimat thesis* lebih baik dari diagram apa pun.

---

### SCENE 3 — Solution Introduction (0:30 – 0:50)

**Visual**: Smooth transition ke landing page Kitpot di kitpot.vercel.app. Scroll perlahan dari hero section. Highlight headline.

**Narration (ElevenLabs)**:
> "Kitpot is the same savings circle — but the treasurer is a smart contract. Members deposit each cycle. The contract holds the pot. The contract picks the recipient. The contract slashes anyone who pays late. There is nothing to trust except the code, and the code is open."

**Text overlay**:
```
The treasurer → a smart contract.
Deposits, payouts, late penalties — all on-chain.
Nothing to trust but the code.
```

**Kemudian** tampilkan tiga pilar utama (gunakan card style yang muncul satu per satu):

```
1.  Smart-contract treasurer — no human can disappear with the pot
2.  Auto-sign — set it once, every cycle pays itself silently
3.  On-chain reputation — pay on time, build a portable trust score
```

> **Catatan editor**: Saat list 3 pilar muncul — cards slide in dari kanan, satu per satu, 1 detik jeda antar card. Highlight kata "silently" di pilar 2 (warna accent) — itu hook scene berikutnya.

---

### SCENE 4 — Three Initia-Native Features (0:50 – 1:10)

**Visual**: Diagram horizontal sederhana. Tiga ikon sejajar — wallet/lightning, "@" symbol, bridge — dengan label di bawah masing-masing.

**Narration (ElevenLabs)**:
> "Kitpot uses three things you can only do on Initia. Auto-signing turns one approval into a whole session of silent transactions. Initia's `dot init` username registry lets you invite members by name, not by hex address. And the Interwoven Bridge connects assets from the Initia hub directly into our own rollup, kitpot-two. None of these exist as a native primitive on any other chain."

**Text overlay** (muncul bertahap):
```
Auto-sign      →  approve once, sign silently for the rest of the session
.init usernames →  invite "alice.init", not "0x1a2b…"
Interwoven Bridge → assets flow into the kitpot-2 rollup natively
```

**Beri sub-text kecil di bawah**:
```
Three Initia-native primitives, integrated meaningfully — not bolted on.
```

> **Catatan editor**: Diagram boleh super sederhana — text + ikon, no fancy animation. Yang penting viewer paham bahwa **kombinasi 3 fitur ini hanya bisa di Initia**. Letakkan logo Initia kecil di pojok kanan atas saat scene ini tampil.

---

### SCENE 5 — Live Demo: Create a Circle (1:10 – 1:30)

**Visual**: Screen recording browser — clean, dark mode. Buka `kitpot.vercel.app`.

**Langkah yang direkam**:
1. Klik **Connect Wallet** → Privy popup → pilih Google login
2. Auto-faucet drops GAS + 5,000 USDC + 5,000 USDe — toast confirmation muncul
3. Klik **Create Circle**
4. Isi form: Name = "Demo Circle", Token = USDC, Members = 3, Contribution = 100 USDC, **Cycle = 60 seconds** (zoom in ke field ini), Late Penalty = 5%
5. Klik **Create** → Privy sign popup → confirm → circle muncul di dashboard

**Narration (ElevenLabs)**:
> "We log in with Google — no seed phrase, no extension. The auto-faucet drops some test tokens. Then we create a circle. Three members, one hundred USDC each cycle, and for this demo we use a sixty-second cycle so you can watch a full month finish in a minute. Every parameter — penalty, grace period, member count — is configured at creation time and locked in the contract."

**Text overlay**:
```
Login with Google. No seed phrase.
Cycle = 60 seconds  ← demo speed
Cycle = 30 days     ← real circles
Every rule locked at creation.
```

> **Catatan editor**: Zoom in ke field **Cycle Duration** saat user ketik `60`. Itu *the* parameter yang membuat demo bisa live. Cursor highlight pakai lingkaran kecil; jangan giant cursor. Speed-up 2× saat menunggu tx confirmation.

---

### SCENE 6 — Live Demo: Join + Auto-Sign (1:30 – 1:55)

**Visual**: Tab kedua dibuka → buka share link `/join/<id>`. Tampilkan dua sisi (split-screen) — kiri creator, kanan member.

**Langkah yang direkam**:
1. Member 2 klik share link → halaman Join terbuka — tampilkan circle detail (token, contribution, members 1/3 filled)
2. Klik **Join Circle** → Privy popup → confirm collateral deposit (1× contribution)
3. Member 3 sama — saat seat ke-3 terisi, status circle flips **Forming → Active**, cycle 0 mulai
4. Highlight di header: **"Auto-sign: OFF"** → klik toggle → satu Privy popup muncul (sign authz + feegrant) → confirm → toggle jadi **"Auto-sign: ON"**

**Narration (ElevenLabs)**:
> "Other members open the share link. Each one joins by depositing collateral — that's the safety net the contract uses to enforce on-time payments later. When the third seat is filled, the circle goes Active. Now the magic — every member enables auto-sign. One popup. One signature. From this point on, every deposit, every claim, every interaction this session signs silently. No more wallet popups."

**Text overlay**:
```
Open share link → join → collateral deposited.
Last seat filled → circle Active.
[Toggle: Auto-sign OFF → ON]
One popup. Zero popups after.
```

> **Catatan editor**: Ini scene paling **wow**. Saat toggle Auto-sign nyala, beri text overlay besar: **"approve once → sign silently"** — hold 2 detik. Kalau memungkinkan, side-by-side comparison: **"On other chains: 1 popup × 12 cycles"** vs **"Kitpot: 1 popup × 1"**.

---

### SCENE 7 — Live Demo: Deposit, Cycle Elapses, Claim Pot (1:55 – 2:20)

**Visual**: Tetap di tab member. Tampilkan dashboard circle — countdown timer ke deadline cycle 0.

**Langkah yang direkam**:
1. Klik **Deposit** — **tidak ada popup** (auto-sign aktif). Status berubah ke ✅ Paid. Ulangi untuk member 2 dan 3.
2. Tampilkan total pot terakumulasi: **300 USDC**
3. Countdown sampai 0 — cycle window elapses
4. Recipient cycle 0 (member 1) klik **Claim Pot** — tx silent, **297 USDC** masuk ke wallet recipient (1% platform fee dipotong)
5. Dashboard advance ke Cycle 1, recipient berikutnya disorot
6. Cut ke profile page — tampilkan **Tier: Bronze → progressing toward Silver**, plus soulbound badge "First Pot"

**Narration (ElevenLabs)**:
> "Each member deposits. Notice the absence of popups — auto-sign is doing its job. The pot fills to three hundred USDC. The cycle window elapses. The recipient calls claim, and the contract atomically transfers the pot, slashes anyone who didn't pay, and advances to the next cycle. The recipient's reputation goes up. They earn an on-chain badge. None of this required a treasurer."

**Text overlay**:
```
Deposit × 3   →  no popup, no popup, no popup.
Pot = 300 USDC
Cycle elapses → claimPot()
99% to recipient · 1% platform fee
+ soulbound badge "First Pot"
+ tier progress: Bronze → Silver
```

> **Catatan editor**: Scene ini paling padat — pertahankan **2:30 menit total**, jadi kompres jeda menunggu tx. Speed up countdown timer jadi 2× atau pakai jump cut. Ketika "297 USDC" landing di wallet recipient — beri **subtle flash + sound effect** kecil (coin / chime). Itu beat emosional.

---

### SCENE 8 — Tech & Architecture (2:20 – 2:35)

**Visual**: Static text card / simple diagram. Atau gunakan diagram Mermaid dari README (bisa screenshot dari `/about` page).

**Tampilkan tech stack ringkas**:
```
5 Solidity contracts · 102 tests passing
Own Initia EVM rollup · kitpot-2
Auto-sign via x/authz + x/feegrant
Pull-claim model + permissionless keeper safety net
Multi-token: USDC, USDe, any ERC20
```

**Lalu flow sederhana**:
```
Member deposits  →  Contract holds pot  →  Recipient claims
                    ↑                         ↑
              auto-sign signs            keeper safety net
              every cycle silently       if recipient dormant >7 days
```

**Narration (ElevenLabs)**:
> "Under the hood: five contracts, one hundred and two tests passing, deployed on our own Initia EVM rollup. Auto-signing is wired through Cosmos authz and feegrant. The protocol is multi-token — any ERC20 can be a circle. And there's a permissionless keeper: if the recipient ever goes dormant, anyone can unstick the circle, the pot still goes to the right person, and the keeper earns a small fee for the work."

**Text overlay** (kecil di bawah diagram):
```
Built honestly. Deployed live. Nothing trusted.
```

> **Catatan editor**: Scene ini untuk *technical judges* yang scrutinize. Singkat (15 detik). Hindari diagram yang terlalu rumit — `5 contracts · 102 tests · permissionless keeper` sudah berbicara cukup keras.

---

### SCENE 9 — Closing (2:35 – 2:50)

**Visual**: Logo Kitpot di tengah, dark background dengan subtle gradient warna brand.

**Text muncul bertahap**:
```
Kitpot
The 500-year-old savings circle, on Initia.
```

**Lalu**:
```
Built for INITIATE — The Initia Hackathon
Track: Gaming & Consumer
```

**Terakhir** — dua link / QR sejajar:
```
Live demo  →  kitpot.vercel.app
Source     →  github.com/viandwi24/kitpot
```

**Narration (ElevenLabs)**:
> "Three hundred million people. Five hundred years. One ritual. Now it runs on Initia, with the treasurer replaced by code. Try it at kitpot dot vercel dot app. Thank you."

> **Catatan editor**: Closing tenang — logo fade in, text fade in di bawahnya, hold 3 detik di frame terakhir sebelum fade-out music. Jangan tambah CTA berlebihan. Yang penting: **link ke kitpot.vercel.app jelas terbaca**, judge sering scroll-back ke frame terakhir untuk catat URL.

---

## Checklist untuk Perekaman Screen

Sebelum mulai rekam, pastikan:

- [ ] Browser bersih: tutup tab lain, sembunyikan bookmark bar (`Cmd+Shift+B` di Chrome)
- [ ] **Dark mode ON** di Kitpot (ini default — UI memang didesain untuk dark)
- [ ] Wallet **belum** pernah connect ke kitpot.vercel.app sebelumnya — supaya viewer lihat *Connect → Privy → Google* fresh, dan auto-faucet drop benar-benar tampil
- [ ] Resolusi rekam minimal **1920×1080**, FPS 60 kalau bisa (smooth scroll)
- [ ] Pakai screen recorder smooth: **OBS / ScreenFlow / CleanShot X**. Hindari Loom kalau mau kualitas tinggi.
- [ ] **Cursor highlight** ON (CleanShot punya bawaan; di OBS pakai mouse-highlight plugin)
- [ ] **Hide URL bar saat tidak relevan** — atau crop di edit
- [ ] **Demo mode**: pastikan saat create circle, set `cycleDuration = 60` (60 detik). Tanpa ini Scene 7 tidak bisa hidup.
- [ ] **Test full run sekali sebelum rekam final** — termasuk auto-sign popup (kadang gagal di first try, lakukan dry-run dulu)
- [ ] Siapkan **3 wallet berbeda** (3 browser profile / 3 incognito + 3 akun Google) untuk creator + 2 member
- [ ] Faucet on-chain L1 (untuk gas signing authz di Initia L1) — pastikan ketiga wallet sudah punya GAS
- [ ] **Matikan notification system** (Slack, Mail, dll) — jangan sampai notif numpang nongol di rekaman

## Checklist untuk Editor

- [ ] Total durasi **2:30 – 3:00** (idealnya 2:45)
- [ ] **Hook 5 detik pertama** menarik perhatian — kalau viewer skip di sini, sisanya percuma
- [ ] **Subtitle bahasa Inggris** burned-in di setiap scene yang ada narasi
- [ ] Semua **text on-screen** mudah dibaca: ukuran cukup besar, kontras tinggi terhadap dark background
- [ ] **Tidak ada typo** di overlay (cross-check dengan dokumen ini)
- [ ] **Music** tetap di background — voiceover ElevenLabs harus jelas terdengar (rule of thumb: musik −18dB, VO 0dB)
- [ ] **Speed-up bagian menunggu** transaction (jangan biarkan viewer lihat loading spinner > 1.5 detik)
- [ ] **Transisi** smooth — tidak ada wipe / zoom-burst / glitch
- [ ] **Color grading** konsisten — dark mode dari awal sampai akhir
- [ ] Cek **hak musik** — pakai royalty-free (YouTube Audio Library, Epidemic Sound, atau lo-fi creator open license)
- [ ] **Watermark** Kitpot logo kecil di pojok kanan bawah (opsional, judge biasa OK tanpa)
- [ ] **Export**: MP4 H.264, 1080p, bitrate 8–12 Mbps, audio AAC 192kbps stereo
- [ ] **Filename**: `kitpot-demo-v1.mp4` (incremental kalau ada revisi: v2, v3, …)
- [ ] **Upload**: YouTube unlisted + Loom backup. Embed YouTube link di `.initia/submission.json` (`demo_video_url`)

---

## Catatan Voiceover ElevenLabs

- Pakai voice **English (US)** — pilih voice yang calm, narrator-grade. Hindari voice yang energetic / promo-style.
- **Stability**: 50–60 (natural tapi konsisten)
- **Similarity**: 70–80
- **Style exaggeration**: rendah (10–25)
- **Speaker boost**: ON
- Generate per-scene (9 file terpisah) — lebih mudah sync di CapCut daripada satu file panjang
- Setelah generate, dengarkan setiap line dan re-roll yang terdengar artificial — biasanya kalimat dengan angka (`300 million`, `500 years`) butuh 2–3 percobaan supaya alami

---

## Catatan ke Penulis Naskah Berikutnya (kalau direvisi)

- **Jangan over-claim** — lihat bagian "What's intentionally NOT shipped" di README. Demo harus jujur tentang scope:
  - Auto-sign sifatnya **session-based** (bukan server bot offline)
  - Bridge UI live tapi `kitpot-2` belum di-register di chain registry resmi Initia (pasangan asetnya jadi belum tampil di modal)
  - Belum ada Telegram mini-app, belum mainnet, belum diaudit
- Kalau judge minta deeper dive teknis, arahkan ke **`/about` Program Overview page** — di sana sudah ada disclaimers + status real-time.
- Naskah ini menargetkan **3 menit**. Kalau diminta versi pendek (60 detik untuk Twitter), pakai Scene 1 + Scene 6 + Scene 9 — itu inti story arc-nya.
