# Kitpot — Demo Video Script

> Mengikuti template `script.md` milik Leticia. Narasi (text on screen / voiceover) ditulis **bahasa Inggris** karena akan dibacakan oleh ElevenLabs. Catatan editor ditulis **bahasa Indonesia**.
>
> Sumber materi: **`README.md`** + **`README_DORAHACKS.md`** (state per `kitpot-2` rollup, plan 22 redeploy).
>
> **Target durasi: 2:55 (hard ceiling 3:00).** Setiap scene di bawah punya budget waktu + budget kata yang sudah dihitung di 140 wpm.

## Overview untuk Editor

Halo. Sebelum mulai edit, ini context singkat tentang Kitpot supaya kamu paham apa yang lagi kita demo-kan.

### Apa itu Kitpot?

Kitpot adalah **arisan trustless di blockchain Initia**. Bayangkan grup arisan WA biasa — patungan tiap cycle, satu orang dapat pot, bergiliran sampai semua kebagian — tapi **bendaharanya diganti smart contract**. Tidak ada lagi satu orang yang pegang uang dan bisa kabur.

### Kenapa ini penting?

- Sekitar **300 juta orang di dunia** ikut arisan (nama lokalnya: arisan / chit fund / hui / tanda / tontine / paluwagan / susu / cundina). Di Indonesia saja perputaran arisan informal ditaksir **$50B+/tahun**.
- Failure mode-nya selalu sama selama 500 tahun: **ada satu orang yang harus pegang uang antara setor dan bagi**. Orang itu bisa hilang, salah hitung, atau pilih kasih.
- ROSCA on-chain di chain lain pernah ada (bahkan sudah ada yang menang Grand Prize hackathon lain) — tapi user harus **approve manual tiap bulan**. UX-nya rusak.
- **Kitpot menyelesaikan UX ini** dengan tiga fitur native Initia: **auto-signing**, **`.init` username**, **Interwoven Bridge** — plus **pull-claim + permissionless keeper safety net** yang menghilangkan kebutuhan bot babysitter.
- Setahu kami, **Kitpot adalah on-chain ROSCA primitive pertama di Initia.**

### "Ini bukan judi" (penting untuk audience non-crypto)

ROSCA sering disangka lottery atau chitfund scam. Kitpot **secara sengaja bukan keduanya**:
- Setiap anggota dapat pot **persis sekali** — urutan ditentukan saat join, bukan diundi
- **Tidak ada peluang acak, tidak ada lelang** di circle default
- Return guaranteed by construction: setor N×, terima 1× pot (minus 1% fee)
- Penalty late payment di-slash dari collateralmu sendiri — tidak ada edge yang tidak kelihatan di contract

Kalimat ini akan masuk Scene 3 sebagai disclaimer cepat.

### Istilah yang perlu kamu tahu

| Istilah | Arti Simpelnya |
|---|---|
| **Circle** | Grup arisan. Berisi 3–20 anggota yang setor sama besar tiap cycle. |
| **Cycle** | Satu putaran. Di dunia nyata 1 bulan; **di demo kita set 60 detik**. |
| **Pot** | Total uang yang dikumpulkan tiap cycle. Diberikan ke satu pemenang giliran. |
| **Collateral** | Jaminan yang dikunci di contract waktu join — di-slash kalau telat bayar. |
| **Auto-sign** | Fitur native Initia: approve sekali → semua tx di session itu sign sendiri tanpa popup. **Session-based, bukan server bot offline.** |
| **`.init` username** | Username on-chain Initia. Dipakai untuk display anggota — bukan address `0x…`. |
| **Interwoven Bridge** | Mekanisme resmi Initia untuk pindahkan aset antara Initia hub dan rollup. |
| **Pull-claim** | Pemenang cycle yang panggil `claimPot()` sendiri — pot tidak otomatis push. |
| **Keeper / `substituteClaim`** | Safety net: kalau pemenang nge-hang >7 hari, siapa pun bisa nge-trigger; pot tetap ke pemenang, caller dapat 0.1% fee. |
| **Trust tier** | Reputation level: `Unranked → Bronze → Silver → Gold → Diamond` — di-derive dari XP on-chain. |
| **Soulbound badge** | NFT yang **tidak bisa ditransfer**. Kitpot punya **12 jenis** (First Pot, Perfect Circle, Streak 3/10/25, Diamond, dll) dengan **SVG metadata on-chain** — tidak ada IPFS. |
| **Tier-gated circle** | Circle yang require minimum trust tier untuk join (set di `createCircle.minimumTier`). |

### Alur cerita video ini (9 scene, total 2:55)

```
1. HOOK         (0:00–0:12)  →  300M / 500 tahun / 1 bug: bendahara
2. PROBLEM      (0:12–0:25)  →  WA + Excel + 1 orang dipercaya = ranjau
3. SOLUTION     (0:25–0:40)  →  Smart contract jadi bendahara · "ini bukan judi"
4. NATIVE       (0:40–0:55)  →  3 primitives Initia + safety net pull-claim
5. DEMO Create  (0:55–1:18)  →  Login Google → create circle (60-detik cycle)
6. DEMO Sign    (1:18–1:42)  →  Members join + enable auto-sign (one popup, done)
7. DEMO Claim   (1:42–2:15)  →  Deposit silent → pot fills → claim → keeper net
8. GAMIFICATION (2:15–2:35)  →  12 badges + 5 tiers + XP, semua on-chain
9. CLOSING      (2:35–2:55)  →  Logo + tagline + URL + INITIATE
```

### Vibe yang diinginkan

Calm, percaya diri, **tidak hyper**. Stripe / Linear product launch — bukan crypto influencer pump video. Audience pertama adalah judge Initia yang sudah lihat ratusan demo crypto — yang menonjol adalah **kejernihan**, bukan efek.

---

## Info Teknis untuk Editor

- **Durasi target**: 2:55, hard ceiling 3:00 (DoraHacks recommends ≤3 min).
- **Tone**: Profesional + hangat. *We ported a 500-year-old ritual* — bukan *yet another DeFi*.
- **Voiceover**: ElevenLabs, voice "Brian" (English US, calm narrator). Charlotte (UK female) sebagai backup.
- **Music**: Lo-fi minimal / ambient pad. Volume rendah; naik sedikit di transisi Hook → Problem dan di Closing.
- **Font on-screen**: Sans-serif clean (Inter / Geist / SF Pro). Hindari serif & display font.
- **Color grade**: Konsisten dark mode (UI Kitpot memang dark) — jangan over-saturate.
- **Pacing**: Min 2 detik per text card. Saat tx confirmation tampil, speed-up 2× atau cut langsung ke result. **Tidak boleh** ada loading spinner > 1.5 detik di hasil akhir.
- **Transisi**: Fade / smooth cut. Hindari wipe, zoom-burst, glitch.
- **Captions**: Burn subtitle bahasa Inggris di bagian narasi (judge sering nonton mute).
- **Aspect ratio**: 16:9, 1080p minimum.

---

## Scene Breakdown

> Format setiap scene: **Visual** (apa yang muncul), **Narration** (yang dibacakan ElevenLabs — sumber fakta sudah disesuaikan dengan README terbaru), **Text overlay** (yang muncul di layar), **Catatan editor** (instruksi praktis). Setiap scene mencantumkan **target durasi** dan **word count** untuk verifikasi 140 wpm.

---

### SCENE 1 — Hook (0:00 – 0:12)

> Target: 12 detik · 17 kata · ~85 wpm dengan dramatic pause

**Visual**: Background dark dengan subtle gradient. Kinetic typography — kalimat muncul satu per satu, fade in/out cepat.

**Narration (ElevenLabs)**:
> "Three hundred million people. Five hundred years. One ritual. With one bug. Someone has to hold the money."

**Text overlay** (muncul bertahap, 2 detik per baris):
```
300,000,000 people.
500 years.
1 ritual.
1 bug.
"Someone has to hold the money."
```

**Lalu transisi**: Logo Kitpot fade-in.
```
[Logo Kitpot]
The savings circle, with the treasurer replaced by code.
```

> **Catatan editor**: Pause 1 detik di kalimat *"With one bug."* — itu beat-nya. Logo masuk lewat fade halus, jangan zoom-in. Hook ini **menentukan** apakah viewer lanjut nonton atau skip — kalau test ke teman 5 detik dan dia bilang "boring", **revisi sebelum lanjut**.

---

### SCENE 2 — Problem Statement (0:12 – 0:25)

> Target: 13 detik · 26 kata

**Visual**: Mockup screenshot WhatsApp group arisan + foto rekap Excel + ikon transfer bank (collage 3-detik). Lalu satu kotak di tengah dengan avatar dan caption "Treasurer". Avatar fade out jadi kotak kosong saat narasi *"can disappear"*.

**Narration (ElevenLabs)**:
> "Today, every rotating savings circle still runs on a WhatsApp group, a spreadsheet, and one trusted person. That person can disappear. Trust does not scale."

**Text overlay**:
```
WhatsApp + Excel + one trusted person.
The treasurer can disappear.
Trust does not scale.
```

> **Catatan editor**: Saat narasi *"That person can disappear"* — fade out avatar treasurer. Visual sederhana ini menjelaskan thesis lebih baik dari diagram apa pun. **Jangan tambah panah merah / X / efek dramatis** — biarkan kosongnya frame yang berbicara.

---

### SCENE 3 — Solution Introduction (0:25 – 0:40)

> Target: 15 detik · 36 kata. **Termasuk disclaimer "ini bukan judi" dalam 1 kalimat.**

**Visual**: Smooth transition ke landing page Kitpot di kitpot.vercel.app. Highlight headline. Lalu tampilkan tiga bullet besar.

**Narration (ElevenLabs)**:
> "Kitpot replaces the treasurer with a smart contract. Members deposit. The contract holds the pot, picks the recipient, slashes late payers. Everyone receives the pot exactly once. No lottery. No gambling. Just the ritual, made atomic."

**Text overlay**:
```
The treasurer → a smart contract.
Deposit · hold · pay · slash — all on-chain.
Everyone wins exactly once.
Not a lottery. Not gambling. Just atomic.
```

> **Catatan editor**: Kalimat *"No lottery. No gambling."* penting karena ROSCA sering disangka chitfund scam — bilang ini sekali di awal supaya judge yakin produk ini legit. Highlight kata "exactly once" dengan accent color. Pause panjang sebelum *"No lottery"* untuk emphasis.

---

### SCENE 4 — Three Native Primitives + Safety Net (0:40 – 0:55)

> Target: 15 detik · 38 kata

**Visual**: Diagram horizontal 4 ikon sejajar — wallet/lightning, "@", bridge, lifebuoy/keeper — dengan label di bawah. Logo Initia kecil di pojok kanan atas.

**Narration (ElevenLabs)**:
> "Three Initia-native primitives make this real. Auto-sign — approve once, every cycle signs silently. Dot init usernames — invite by name, not hex. And the Interwoven Bridge — assets flow into our own rollup. None of these exist natively anywhere else."

**Text overlay** (muncul bertahap):
```
Auto-sign         →  approve once, sign silently for the rest of the session
.init usernames   →  invite "alice.init", not "0x1a2b…"
Interwoven Bridge →  assets flow into the kitpot-2 rollup natively
+ pull-claim safety net →  the pot can never get stuck (more in Scene 7)
```

> **Catatan editor**: 4 ikon, satu per satu fade-in. **Pull-claim safety net** disebut tapi belum dijelaskan — itu di-tease di sini, di-resolve di Scene 7. Ini membuat viewer tetap nonton.

---

### SCENE 5 — Live Demo: Create a Circle (0:55 – 1:18)

> Target: 23 detik · 46 kata. **Scene live recording pertama.**

**Visual**: Screen recording dark mode browser. Buka `kitpot.vercel.app`.

**Langkah yang direkam**:
1. Klik **Connect Wallet** → Privy popup → pilih Google login
2. Auto-faucet drops GAS + 5,000 USDC + 5,000 USDe — toast confirmation muncul
3. Klik **Create Circle**
4. Isi form: Name = "Demo Circle", Token = USDC, Members = 3, Contribution = 100 USDC, **Cycle = 60 seconds** (zoom-in ke field ini), Late Penalty = 5%
5. Klik **Create** → Privy sign popup → confirm → circle muncul di dashboard

**Narration (ElevenLabs)**:
> "We log in with Google — no seed phrase. The auto-faucet drops test tokens. We create a circle: three members, one hundred USDC each cycle, sixty seconds for demo. Every rule — penalty, grace period, member count — locked in the contract at creation."

**Text overlay** (sub-text kecil, jangan menutupi UI):
```
Login with Google. No seed phrase.
Cycle = 60 seconds  ← demo speed
Cycle = 30 days     ← real circles
Every rule locked at creation.
```

> **Catatan editor**: Zoom-in ke field **Cycle Duration** saat user ketik `60` — itu *the* parameter yang membuat demo bisa hidup. Cursor highlight pakai lingkaran kecil; jangan giant cursor. Speed-up 2× saat menunggu tx confirmation.

---

### SCENE 6 — Live Demo: Join + Auto-Sign (1:18 – 1:42)

> Target: 24 detik · 41 kata. **Scene paling "wow".**

**Visual**: Buka tab kedua (atau split-screen) → buka share link `/join/<id>`.

**Langkah yang direkam**:
1. Member 2 klik share link → halaman Join — circle detail (token, contribution, members 1/3 filled)
2. Klik **Join Circle** → Privy popup → confirm collateral deposit (1× contribution)
3. Member 3 join → seat ke-3 terisi → status circle flips **Forming → Active**
4. Highlight di header: **"Auto-sign: OFF"** → klik toggle → satu Privy popup (sign authz + feegrant) → confirm → **"Auto-sign: ON"**

**Narration (ElevenLabs)**:
> "Members open the share link, deposit collateral, and join. The third seat fills. The circle goes Active. Now the magic — each member enables auto-sign. One popup. One signature. From here, every deposit signs silently. No more wallet popups."

**Text overlay**:
```
Open share link → join → collateral deposited.
Last seat filled → circle Active.
[Toggle: Auto-sign OFF → ON]
One popup. Zero popups after.
```

> **Catatan editor**: Saat toggle Auto-sign nyala, beri text overlay besar: **"approve once → sign silently"** — hold 2 detik. Side-by-side comparison kalau muat: **"Other chains: 1 popup × every cycle"** vs **"Kitpot: 1 popup × 1 session"**.

---

### SCENE 7 — Live Demo: Deposit, Claim, & Keeper Safety Net (1:42 – 2:15)

> Target: 33 detik · 67 kata. **Scene paling padat — perlu kompresi & jump-cut.**

**Visual**: Tetap di tab member. Dashboard circle — countdown timer ke deadline cycle 0.

**Langkah yang direkam**:
1. Klik **Deposit** — **tidak ada popup** (auto-sign aktif). Status berubah ke ✅ Paid. Ulangi member 2 dan 3.
2. Total pot terakumulasi: **300 USDC**
3. Countdown elapses (jump-cut atau speed-up 8×)
4. Recipient cycle 0 (member 1) klik **Claim Pot** — tx silent, **297 USDC** mendarat
5. Dashboard advance ke Cycle 1
6. **Motion graphics overlay** untuk segmen keeper (bukan recording — text-based): tampilkan diagram "If recipient dormant >7 days → anyone calls substituteClaim() → pot to recipient · 0.1% to keeper"

**Narration (ElevenLabs)**:
> "Each member deposits — silent, no popup. The pot fills to three hundred USDC. The cycle window elapses. The recipient claims. The contract atomically slashes non-payers, transfers ninety-nine percent of the pot, and advances. And there's a safety net — if the recipient goes dormant, anyone can substitute-claim after seven days. The pot still goes to the right wallet, the keeper earns a small fee."

**Text overlay**:
```
Deposit × 3   →  no popup, no popup, no popup.
Pot = 300 USDC
Cycle elapses → claimPot()
99% to recipient · 1% platform fee
```
Lalu segmen keeper:
```
Recipient dormant > 7 days?
→ substituteClaim()  (anyone can call)
   pot still goes to recipient · keeper earns 0.1%
The pot can never get stuck.
```

> **Catatan editor**: Scene paling penting — pertahankan ≤33 detik. Speed-up countdown jadi 8× atau jump-cut langsung ke "00:00". Saat **297 USDC** mendarat — beri **subtle flash + sound chime** kecil. Itu beat emosional. Segmen keeper bisa text-only (motion graphics di CapCut), tidak perlu rekam. Perhatikan: kontrak transfer 99% → 297 dari 300, **bukan 300** — narasi sudah benar.

---

### SCENE 8 — Gamification (Reputation, Tiers, Badges) (2:15 – 2:35)

> Target: 20 detik · 44 kata. **Scene non-recording — motion graphics.**

**Visual**: Animated text card. Tampilkan:
1. Tier ladder: `Unranked → Bronze → Silver → Gold → Diamond` (animasi naik step-by-step)
2. Sub-card kecil: badge gallery (12 badge soulbound) — mock SVG, scroll horizontal pelan
3. XP table mini: `Join +20 · On-time +10 · Pot +100 · Perfect Circle +200`

**Narration (ElevenLabs)**:
> "Every cycle builds on-chain reputation. Twelve soulbound badges. Five trust tiers — Bronze through Diamond. An XP system entirely authored by the contract. No backend hands out reputation. If you completed a perfect circle, the contract minted you the badge atomically."

**Text overlay**:
```
12 soulbound badges  ·  on-chain SVG, no IPFS
5 trust tiers        ·  Unranked → Diamond
XP system            ·  authored by KitpotCircle.sol

High-value circles can require minimumTier
```

> **Catatan editor**: Scene ini menjawab "kenapa user balik lagi" untuk track Gaming & Consumer. Highlight kata **"on-chain SVG, no IPFS"** — judge teknis akan notice. Kalau ada waktu, screenshot 3-4 badge SVG asli dari kontrak (`KitpotAchievements.sol`) untuk visual authenticity.

---

### SCENE 9 — Closing (2:35 – 2:55)

> Target: 20 detik · 36 kata

**Visual**: Logo Kitpot di tengah, dark background dengan subtle gradient warna brand.

**Text muncul bertahap**:
```
Kitpot
The 500-year-old savings circle, on Initia.
The first on-chain ROSCA primitive on Initia.
```

**Lalu**:
```
Built for INITIATE — The Initia Hackathon
Track: Gaming & Consumer
```

**Terakhir** — link / QR sejajar:
```
Live demo  →  kitpot.vercel.app
Source     →  github.com/viandwi24/kitpot
Live status →  kitpot.vercel.app/about
```

**Narration (ElevenLabs)**:
> "Three hundred million people. Five hundred years. One ritual. Now it runs on Initia — with the treasurer replaced by code. The first on-chain savings circle on Initia. Try it at kitpot dot vercel dot app."

> **Catatan editor**: Closing tenang — logo fade-in, text fade-in di bawahnya, hold 3 detik di frame terakhir sebelum fade-out music. **Link kitpot.vercel.app harus jelas terbaca** — judge sering scroll-back ke frame terakhir untuk catat URL. Jangan tambah CTA berlebihan.

---

## Total Durasi & Verifikasi

| Scene | Window | Durasi | Words | Cumulative |
|---|---|---|---|---|
| 1. Hook | 0:00–0:12 | 12s | 17 | 0:12 |
| 2. Problem | 0:12–0:25 | 13s | 26 | 0:25 |
| 3. Solution | 0:25–0:40 | 15s | 36 | 0:40 |
| 4. Native | 0:40–0:55 | 15s | 38 | 0:55 |
| 5. Demo Create | 0:55–1:18 | 23s | 46 | 1:18 |
| 6. Demo Sign | 1:18–1:42 | 24s | 41 | 1:42 |
| 7. Demo Claim+Keeper | 1:42–2:15 | 33s | 67 | 2:15 |
| 8. Gamification | 2:15–2:35 | 20s | 44 | 2:35 |
| 9. Closing | 2:35–2:55 | 20s | 36 | 2:55 |
| **Total** | — | **2:55** | **351** | **2:55** |

5 detik buffer ke 3:00 hard ceiling. Kalau ElevenLabs membaca lebih lambat dari 140 wpm, scene 1/4/8/9 yang paling fleksibel untuk dipotong — pure motion graphics, tidak terikat ke screen recording.

---

## Checklist untuk Perekaman Screen

- [ ] Browser bersih: tutup tab lain, sembunyikan bookmark bar (`Cmd+Shift+B`)
- [ ] **Dark mode ON** di Kitpot (default — UI memang didesain untuk dark)
- [ ] Wallet **belum** pernah connect ke kitpot.vercel.app — supaya viewer lihat *Connect → Privy → Google* fresh + auto-faucet drop
- [ ] Resolusi rekam minimal **1920×1080**, FPS **60** (smooth scroll)
- [ ] Pakai screen recorder smooth: **CleanShot X / OBS / ScreenFlow**. Hindari Loom kalau mau kualitas tinggi.
- [ ] Cursor highlight ON
- [ ] Hide URL bar / blur address private — atau crop di edit
- [ ] **Demo mode**: saat create circle, set `cycleDuration = 60`. Tanpa ini Scene 7 tidak bisa hidup.
- [ ] **Test full run sekali sebelum rekam final** — termasuk auto-sign popup (kadang gagal di first try)
- [ ] **3 wallet berbeda** (3 browser profile + 3 akun Google) untuk creator + 2 member
- [ ] Faucet on-chain L1 — pastikan ketiga wallet sudah punya GAS untuk authz signing
- [ ] Matikan notification system (Slack, Mail, dll)

## Checklist untuk Editor

- [ ] **Total durasi 2:50 – 3:00** ← hard ceiling, DoraHacks recommends ≤3 min
- [ ] **Hook 5 detik pertama** menarik (test: tunjukkan ke teman, tanya "lanjut nonton?")
- [ ] **Captions bahasa Inggris** burned-in di setiap scene
- [ ] Semua text on-screen mudah dibaca: ukuran besar, kontras tinggi
- [ ] **Tidak ada typo** — cross-check dengan dokumen ini
- [ ] Music tetap di background — voiceover ElevenLabs harus jelas (musik −18 dB, VO 0 dB)
- [ ] **Speed-up bagian menunggu** transaction (jangan biarkan loading > 1.5 detik)
- [ ] Transisi smooth — tidak ada wipe / zoom-burst / glitch
- [ ] Color grading konsisten dark dari awal sampai akhir
- [ ] Pakai musik royalty-free (YouTube Audio Library, Epidemic Sound)
- [ ] Export 1080p MP4 H.264 8–12 Mbps · audio AAC 192 kbps stereo 48 kHz
- [ ] Filename: `kitpot-demo-v1.mp4` (versi: v2, v3, …)
- [ ] Upload YouTube unlisted + Loom backup. Embed YouTube link di `.initia/submission.json` (`demo_video_url`)

---

## Catatan ke Penulis Naskah Berikutnya (kalau direvisi)

- **Jangan over-claim** — lihat bagian "What's intentionally NOT shipped" di README:
  - Auto-sign sifatnya **session-based** (bukan server bot offline) — sudah disebut di Scene 4 melalui implication, jangan janjikan "auto-pay while you sleep"
  - Bridge UI live tapi `kitpot-2` belum di-register di chain registry resmi Initia (modal tampil "no available assets" untuk wallet baru) — jangan klaim "bridge sudah carry asset"
  - Belum ada Telegram mini-app, belum mainnet, belum diaudit
- Kalau judge minta deeper dive teknis, arahkan ke **`/about` Program Overview page** (`kitpot.vercel.app/about`) — di sana ada disclaimers + status real-time, plus link verify `cast code` ke RPC publik.
- Naskah ini menargetkan **2:55**. Versi pendek 60 detik (Twitter cut): pakai Scene 1 + 6 (auto-sign moment) + 9 (closing).
- **Kalau timing meleset**: Scene 8 (gamification) paling aman dipotong ke 12-15 detik — drop XP table, biarkan tier ladder + badge gallery saja.
- Test count **102 tests** (per README terbaru — jangan pakai angka 30 dari `docs/submission-description.md` yang stale).
- Chain ID **`kitpot-2`** (jangan pakai `kitpot-1`).
