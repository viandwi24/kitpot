# Kitpot Demo — Recording & Editing Workflow

> Companion document untuk [`demo-script.md`](./demo-script.md). Naskahnya sudah final di sana — file ini menjelaskan **urutan kerja**: generate VO → rekam visual → assemble di CapCut → ship.
>
> Naskah disesuaikan dengan **`README.md`** + **`README_DORAHACKS.md`** terbaru (chain `kitpot-2`, 102 tests, gamification eksplisit, "this is not gambling", pull-claim + keeper safety net).
>
> **Target durasi: 2:55 (hard ceiling 3:00).**

---

## TL;DR (alur 5 langkah)

```
1. Generate ElevenLabs VO dulu (per-scene MP3, 9 file)
2. Putar VO via speaker / earbuds sambil screen-record   ← trik paling penting
3. Drop VO + footage ke CapCut, sudah ~aligned otomatis
4. Add music, captions, text overlay, color grade
5. Export 1080p MP4 → upload YouTube unlisted → submit
```

Total waktu real: **1 hari kerja** kalau script & flow sudah final. Buffer 1 hari untuk revisi.

---

## Keputusan #1 — Bahasa apa untuk apa

| Layer | Bahasa | Alasan |
|---|---|---|
| **Voiceover final** | **English (US)** via ElevenLabs | Judge INITIATE = panel internasional. English adalah default submission DoraHacks. |
| **Captions on-screen** | **English** (burn-in) | Banyak judge nonton **mute** saat scrolling submission — captions wajib. |
| **Text overlay** (judul scene, label) | **English** | Konsisten dengan VO. |
| **Suara saat rekam screen** | **NONE / silent** | Jangan rekam suaramu sendiri. |

**Tidak direkomendasikan**: rekam pakai bahasamu sendiri lalu swap ke ElevenLabs. Tempo gerakan kursor dipengaruhi tempo bicara — kalau swap audio, gerakan jadi tidak sync.

---

## Keputusan #2 — VO dulu, baru rekam (counter-intuitive)

Kebanyakan orang rekam dulu, baru bikin VO. Itu salah untuk demo screencast karena:

1. Durasi VO **fixed** (TTS tidak bisa diregang panjang). Durasi visual **fleksibel** (clip bisa di-speedup, pause, dll).
2. Tx confirmation di blockchain timing-nya **non-deterministic** — kalau visual direkam dulu, kamu akan struggle pas-paskan VO ke action yang sudah selesai.
3. **Trick**: putar VO via speaker sambil rekam → kursormu otomatis ikut tempo VO. Hasilnya hampir 1:1 sync di CapCut, tinggal nudge ±200ms.

```
[1] ElevenLabs VO (per scene, MP3)
       ↓
[2] Putar VO Scene N via speaker → rekam aksi Scene N
       ↓
[3] CapCut: VO + screen recording ke timeline
       ↓
[4] Tambah text, music, transition, color
       ↓
[5] Export
```

---

## Step 1 — Generate ElevenLabs VO

### Voice pick

| Voice | Sifat | Cocok untuk |
|---|---|---|
| **Brian** (Pre-made) | Deep, calm, US narrator-grade | **Default rekomendasi** — fits Kitpot's calm tone |
| **Charlotte** (Pre-made) | Soft, UK English female | Alternatif kalau Brian terdengar terlalu "Wall Street" |

> Hindari "Adam" / "Antoni" — sales-y. Pakai **English (US)** explicit, jangan multilingual auto-detect.

### Setting per scene

Pakai **Eleven Multilingual v2** atau **Eleven Turbo v2**. Setting konsisten kecuali yang ditandai:

```
Stability:           55-70   (lihat tabel)
Similarity boost:    75
Style exaggeration:  0-30    (lihat tabel)
Speaker boost:       ON
```

| Scene | Mood | Stability | Style exag |
|---|---|---|---|
| 1 — Hook | Dramatic, dengan pause | **50** | **30** |
| 2 — Problem | Empathetic | 55 | 20 |
| 3 — Solution | Confident, declarative | 60 | 15 |
| 4 — Native | Factual, crisp | 65 | 5 |
| 5 — Demo Create | Instructional | 65 | 5 |
| 6 — Demo Sign | Building anticipation | 60 | 15 |
| 7 — Demo Claim | Resolved, satisfied | 60 | 15 |
| 8 — Gamification | Enthusiastic-light | 60 | 15 |
| 9 — Closing | Warm, slower | 55 | 25 |

### Workflow generate

1. Buka ElevenLabs → **Speech Synthesis**
2. Pilih voice (Brian)
3. Per scene:
   - Set stability + style exaggeration sesuai tabel
   - Paste teks **persis** dari "Per-scene prompts" di bawah (sudah pre-format angka jadi kata)
   - Generate
   - Re-roll 1–2 kali kalau pronunciation aneh (biasanya angka & istilah teknis)
   - Download MP3, simpan: `scene-01-hook.mp3`, `scene-02-problem.mp3`, dst.
4. Total estimate: ~9 scenes × ~2k chars total ≈ 2.5k chars → muat di free tier kalau quota cukup, atau ~$3 di paid.

> **Pronunciation tips**: tulis angka panjang sebagai kata. Spell `kitpot-2` sebagai `kitpot two`. Spell `.init` sebagai `dot init`. Spell `99%` sebagai `ninety-nine percent`. Sudah pre-format begini di prompt di bawah.

### Per-scene prompts siap-paste

> Copy persis ini ke ElevenLabs. Word count + estimasi durasi sudah dihitung di 140 wpm. Total: **351 kata · ~2:30 raw VO** (sisa ~25 detik untuk pauses & transitions = 2:55 final).

#### Scene 1 — Hook (17 kata · ~12s dengan dramatic pause)
```
Three hundred million people. Five hundred years. One ritual. With one bug. Someone has to hold the money.
```

#### Scene 2 — Problem (26 kata · ~13s)
```
Today, every rotating savings circle still runs on a WhatsApp group, a spreadsheet, and one trusted person. That person can disappear. Trust does not scale.
```

#### Scene 3 — Solution (36 kata · ~15s)
```
Kitpot replaces the treasurer with a smart contract. Members deposit. The contract holds the pot, picks the recipient, slashes late payers. Everyone receives the pot exactly once. No lottery. No gambling. Just the ritual, made atomic.
```

#### Scene 4 — Native (38 kata · ~15s)
```
Three Initia-native primitives make this real. Auto-sign — approve once, every cycle signs silently. Dot init usernames — invite by name, not hex. And the Interwoven Bridge — assets flow into our own rollup. None of these exist natively anywhere else.
```

#### Scene 5 — Demo: Create (46 kata · ~21s)
```
We log in with Google — no seed phrase. The auto-faucet drops test tokens. We create a circle: three members, one hundred USDC each cycle, sixty seconds for demo. Every rule — penalty, grace period, member count — locked in the contract at creation.
```

#### Scene 6 — Demo: Auto-sign (41 kata · ~19s)
```
Members open the share link, deposit collateral, and join. The third seat fills. The circle goes Active. Now the magic — each member enables auto-sign. One popup. One signature. From here, every deposit signs silently. No more wallet popups.
```

#### Scene 7 — Demo: Claim + Keeper (67 kata · ~30s)
```
Each member deposits — silent, no popup. The pot fills to three hundred USDC. The cycle window elapses. The recipient claims. The contract atomically slashes non-payers, transfers ninety-nine percent of the pot, and advances. And there's a safety net — if the recipient goes dormant, anyone can substitute-claim after seven days. The pot still goes to the right wallet, the keeper earns a small fee.
```

#### Scene 8 — Gamification (44 kata · ~20s)
```
Every cycle builds on-chain reputation. Twelve soulbound badges. Five trust tiers — Bronze through Diamond. An XP system entirely authored by the contract. No backend hands out reputation. If you completed a perfect circle, the contract minted you the badge atomically.
```

#### Scene 9 — Closing (36 kata · ~16s)
```
Three hundred million people. Five hundred years. One ritual. Now it runs on Initia — with the treasurer replaced by code. The first on-chain savings circle on Initia. Try it at kitpot dot vercel dot app.
```

> **Verifikasi durasi**: dengarkan total VO di ElevenLabs preview, jumlahkan. Kalau total raw > 2:35, perlu re-roll Scene 7 (paling panjang) dengan stability lebih tinggi (cenderung baca lebih cepat). Target: **raw VO total 2:30 ± 5 detik**.

---

## Step 2 — Persiapan rekaman (sebelum tekan record)

### Hardware & tools

| Tool | Pilihan | Catatan |
|---|---|---|
| Screen recorder | **CleanShot X** (Mac, paid) atau **OBS Studio** (free) | Hindari Loom — kompresi terlalu agresif |
| Resolusi | **1920×1080** atau **2560×1440** | Jangan 4K, ukuran file kelewatan |
| FPS | **60 fps** | Smooth scroll & cursor |
| Cursor highlight | CleanShot bawaan / **Mousecape** (Mac) / OBS plugin | Highlight kuning/pink lembut, jangan giant |
| Audio | **System audio only** (chime tx) atau **mute** | Mute paling aman |

### Browser prep

```
[ ] Chrome / Brave dengan profile baru (atau Incognito)
[ ] Set zoom 100%, font default
[ ] Sembunyikan bookmark bar (Cmd+Shift+B)
[ ] Tutup semua tab lain
[ ] Disable extension yang bisa popup (Grammarly, password manager)
[ ] Toggle dark mode di OS
[ ] Test resolusi: zoom-out 90% bila Kitpot terlalu sempit di 1080p
```

### Wallet prep (3 wallet)

```
Wallet A (creator)  →  Chrome profile "Demo A" + akun Google A
Wallet B (member)   →  Chrome profile "Demo B" + akun Google B
Wallet C (member)   →  Chrome profile "Demo C" + akun Google C
```

Setiap profile login Privy via Google → auto-faucet drop GAS + USDC + USDe. Pastikan ketiganya juga punya **GAS di Initia L1** (initiation-2) untuk authz signing — ambil dari `https://faucet.testnet.initia.xyz`.

### Pre-flight test (WAJIB sebelum rekam final)

Lakukan **dry-run penuh tanpa merekam** sekali untuk verifikasi flow:

```
[ ] Wallet A: Connect → faucet drop OK → Create Circle (60s cycle, 3 member, 100 USDC)
[ ] Wallet B: Open share link → Join → collateral lock OK
[ ] Wallet C: Open share link → Join → status circle flips Forming → Active
[ ] Wallet B: Toggle Auto-sign → Privy popup → confirm → toggle nyala
[ ] Wallet B: Deposit → SILENT (no popup)  ← verify ini!
[ ] Wallet C: Deposit → SILENT
[ ] Wallet A: Deposit → SILENT
[ ] Wait 60 detik → Wallet A claim → 297 USDC mendarat (300 − 1% fee)
[ ] Reputation page Wallet A: tier progress visible, badge "First Pot" muncul
```

Kalau salah satu step gagal — **jangan rekam dulu**. Lebih baik delay 1 jam fix bug daripada rekam ulang dari nol.

> **Kalau auto-sign gagal sign silently**: itu biasanya karena GAS di L1 habis (authz grant butuh L1 signing). Top-up dari `faucet.testnet.initia.xyz` dulu, baru retry.

---

## Step 3 — Recording session

### Method: VO playback while recording

```
1. Buka folder MP3 ElevenLabs
2. Putar `scene-05-demo-create.mp3` lewat speaker / earbuds
3. Mulai screen recorder (background)
4. Lakukan aksi sesuai naskah Scene 5 sambil ikuti tempo VO
5. Stop recorder ketika VO selesai
6. Save file: `recording-scene-05.mov`
7. Repeat untuk Scene 6 dan Scene 7
```

### Yang butuh screen recording

Hanya **3 scene** yang butuh actual screen recording. Sisanya motion graphics di CapCut.

| Scene | Apa yang direkam | Wallet aktif |
|---|---|---|
| 5 — Create | Connect → Faucet drop → Create form → submit | A |
| 6 — Join + Auto-sign | Wallet B & C join → Wallet B toggle auto-sign | B (focus) |
| 7 — Deposit + Claim (sebagian) | Deposit silent × 3 → countdown → Wallet A claim → 297 USDC mendarat | B → A |

> **Scene 7 keeper segment** (substituteClaim) **tidak perlu direkam** — ini ditampilkan sebagai motion graphics text overlay di CapCut. Demo realtime butuh tunggu 7 hari di kontrak — tidak feasible. Pakai diagram + text saja, jujur dan cukup.

### Yang TIDAK perlu screen recording

Scene 1, 2, 3, 4, 8, 9 — semuanya pure motion graphics di CapCut.

### Tips selama rekam

- **Jangan kelewat cepat** — kursor lambat & deliberate lebih enak ditonton.
- **Hover sebentar** sebelum klik (0.5 detik) — viewer perlu *tahu* kamu mau klik apa.
- **Zoom-in via OS** kalau detail penting (Mac: Ctrl + scroll). Atau zoom di CapCut.
- **Speed-up tx waiting** dilakukan di edit, bukan saat rekam.
- **Rekam ulang kalau salah klik** — lebih cepat ulang 1 take daripada masking di edit.

---

## Step 4 — CapCut editing

### Project setup

```
New project → 16:9 → 1080p → 30 fps (atau 60 fps kalau footage 60fps)
```

### Timeline organization (5 track)

```
Track 5  ▌Text & titles (overlay teks Scene 1, 4, 8, 9 + scene labels)
Track 4  ▌Captions / subtitle
Track 3  ▌Music background
Track 2  ▌Voiceover ElevenLabs (semua MP3 disusun urut)
Track 1  ▌Screen recording / motion graphics
```

### Step-by-step edit

**1. Drop semua VO MP3 ke Track 2, urut Scene 1 → 9.** Geser supaya saling menyambung dengan **gap 200–300ms antar scene** untuk breathing room. **Verifikasi total durasi panel timeline = 2:55 ± 5s.** Kalau lebih dari 3:00, kompres gap atau re-roll scene yang paling panjang dengan stability +10.

**2. Drop screen recording ke Track 1.** Hanya untuk Scene 5, 6, 7. Untuk scene lain, biarkan kosong dulu — nanti diisi motion graphics.

**3. Speedup transaction wait clips.**
   - Pilih clip → Speed → 2× atau 3× untuk loading spinner
   - Untuk countdown 60-detik di Scene 7 — **speedup 8×** atau **jump-cut** dari "55s" → "5s" (lebih bersih)

**4. Add cursor highlight** kalau belum ada di rekaman.
   - CapCut Effects → search "spotlight" / "circle highlight"
   - Atau pre-record dengan CleanShot yang cursor highlight bawaan

**5. Add text overlay (Track 5) — terutama scene non-recording.**
   - Font: **Inter** atau **Geist** Bold
   - Animation: **Fade In** masuk, **Fade Out** keluar. Hindari "typewriter" / "bounce" — terlalu hyper.
   - Posisi: center untuk title cards, lower-third untuk caption-style
   - Stagger muncul (timing 0.5–1 detik antar baris) untuk text bertingkat di Hook

**6. Generate captions otomatis (Track 4).**
   - CapCut bawaan: **Text → Auto Captions → English**. Akurasi >95% untuk ElevenLabs.
   - Edit manual untuk angka & istilah teknis: `USDC`, `kitpot-2`, `.init`, `99%`
   - Style: white text + black drop shadow, posisi bottom 15%, font medium

**7. Music background (Track 3).**
   - Sumber royalty-free: **YouTube Audio Library** (cari ambient / cinematic / inspirational), **Epidemic Sound** (paid, paling aman)
   - Volume: turunkan ke **−18 dB sampai −22 dB**
   - **Sidechain ducking**: drop −3 dB saat VO bicara
   - Fade in 1 detik di awal, fade out 2 detik di akhir

**8. Color grade.**
   - Kitpot sudah dark mode → tidak banyak perlu di-grade
   - Slight contrast +5, saturation +5
   - Hindari over-saturate atau filter berlebihan

**9. Add transitions antar scene.**
   - **Fade to black** (0.3 detik) antar scene besar (1→2, 4→5, 7→8, 8→9)
   - **Smooth cut** (no transition) antar sub-scene di dalam demo (5→6→7)
   - Hindari wipe, zoom-burst, glitch

**10. Add intro & outro buffer.**
   - 0.5 detik black di awal (sebelum Scene 1)
   - 1 detik black di akhir (setelah Scene 9 fade out)

### Special — Scene 8 motion graphics (gamification)

Karena Scene 8 dihandle sebagai motion graphics (no recording), siapkan asset di CapCut:

```
Asset 1 — Tier ladder (animasi 5 step):
   Unranked → Bronze → Silver → Gold → Diamond
   Setiap step muncul sequential, 0.5 detik per step
   Highlight Diamond di akhir (glow effect)

Asset 2 — Badge gallery (12 soulbound badges):
   Mock 12 ikon SVG sederhana (gold star / streak flame / circle / dll)
   Susun grid 4×3, fade-in semua bersamaan
   Atau scroll horizontal pelan kalau muat di frame

Asset 3 — XP table (text-only):
   Join +20  ·  On-time +10  ·  Pot +100  ·  Perfect Circle +200
   Tampilkan sebagai 4 chip horizontal
```

> Kalau punya akses ke kontrak `KitpotAchievements.sol`, screenshot 3-4 SVG asli dari `tokenURI()` untuk authenticity. Itu **on-chain SVG** yang menjadi value-prop teknis Scene 8.

### Audio mix akhir

```
Voiceover (Track 2):  0 dB peak, normalize to -3 dB
Music (Track 3):     -18 dB ambient, ducks to -21 dB during VO
Sound effects:       -10 dB (cycle elapse chime, USDC landing chime di Scene 7)
Captions:            no audio
```

### Export settings

```
Resolution:  1920 × 1080
Frame rate:  matches source (30 atau 60)
Encoder:     H.264
Bitrate:     8–12 Mbps (recommended)
Audio:       AAC, 192 kbps, stereo, 48 kHz
Format:      MP4
Filename:    kitpot-demo-v1.mp4
```

---

## Step 5 — QA & ship

### Pre-publish checklist

```
[ ] Total durasi 2:50 – 3:00 ✅ (DoraHacks recommends ≤3 min)
[ ] Hook 5 detik pertama menarik (test: tunjukkan ke teman, tanya "lanjut nonton?")
[ ] Captions burned-in & cocok dengan VO (zero typo)
[ ] Music tidak mengalahkan VO (test di earphone & speaker)
[ ] Tidak ada notification numpang nongol
[ ] Wallet address / private key tidak terbaca
[ ] Logo Kitpot & kitpot.vercel.app jelas terbaca di Closing
[ ] Tidak ada watermark CapCut bawaan (upgrade Pro atau pakai DaVinci Resolve free)
[ ] Chain ID disebut "kitpot-2" — bukan "kitpot-1" (cross-check semua text overlay)
[ ] Test count "102 tests" konsisten dengan README — bukan "30" dari doc lama
[ ] Klaim "first on-chain ROSCA on Initia" cocok dengan competitive landscape README
```

### Upload

```
1. YouTube → Upload video → Visibility: Unlisted
   ├─ Title: "Kitpot — INITIATE Demo (Trustless Savings Circles on Initia)"
   ├─ Description: copy ringkasan Overview dari README_DORAHACKS.md
   ├─ Tags: kitpot, initia, hackathon, rosca, arisan, savings, defi
   └─ Thumbnail: screenshot Scene 9 closing (logo + tagline)

2. Loom backup (optional) — upload sebagai cadangan

3. Update .initia/submission.json:
   "demo_video_url": "https://youtu.be/<id>"

4. Update README.md baris "Demo video":
   | **Demo video** | <https://youtu.be/<id>> |

5. Update README_DORAHACKS.md baris "Demo video":
   | Demo video | <https://youtu.be/<id>> |

6. Commit + push.
```

---

## Common pitfalls

| Pitfall | Cara hindari |
|---|---|
| **Total durasi > 3:00** | Hard ceiling DoraHacks. Kalau lewat 3:00 — potong Scene 8 dulu (paling fleksibel), lalu Scene 4. |
| **Audio clipping** (VO pecah) | Normalize VO ke −3 dB peak |
| **Captions delay** dari VO | Auto-caption CapCut kadang offset 200–500ms — manual nudge per segment |
| **Tx loading spinner terlalu lama** | Speedup 4× atau jump-cut |
| **URL bar terbaca sensitif** | Crop top 60px, atau hide URL bar via fullscreen browser |
| **Wallet address terlihat di header** | Crop atau blur partial address |
| **Music copyright claim di YouTube** | Pakai music dari YouTube Audio Library (auto-clear) |
| **Resolusi salah** (4:5 atau 9:16 portrait) | Lock 16:9 di CapCut sejak awal |
| **Hook kelewat lambat** (3 detik baru ada teks) | Frame pertama harus sudah ada movement |
| **Klaim auto-sign over-promised** | Jangan bilang "auto-pay while you sleep" — auto-sign session-based, kalau tab ditutup session selesai. README explicit tentang ini. |
| **Klaim bridge over-promised** | Jangan bilang "bridge sudah carry asset". Modal opens, tapi `kitpot-2` belum di registry resmi. |
| **Pakai chain ID lama** | Cross-check semua text overlay: **kitpot-2**, bukan kitpot-1. |

---

## Estimated time budget

| Phase | Waktu |
|---|---|
| Generate ElevenLabs VO (9 scene + revisi) | 1–2 jam |
| Pre-flight test (3 wallet, dry-run) | 1 jam |
| Screen recording (3 scene utama) | 1–2 jam (termasuk re-take) |
| CapCut assembly (timeline, sync, text) | 2–3 jam |
| Motion graphics Scene 8 (gamification) | 30–45 menit |
| Color grade + music + captions | 1 jam |
| QA + revisi + export | 1 jam |
| Upload + submission update | 30 menit |
| **Total** | **~1 hari kerja efektif** |

Realistic: kalau mulai pagi, video bisa upload sore yang sama. Buffer 1 hari untuk revisi feedback.

---

## Kalau revisi: yang bisa diganti dengan murah

| Yang ingin diubah | Cost untuk revisi |
|---|---|
| Text overlay typo / kalimat | Murah — edit langsung di CapCut text layer |
| Music kurang cocok | Murah — swap track di Track 3 |
| Pacing terlalu cepat di Scene X | Murah — speed adjustment di clip itu saja |
| Voice ElevenLabs salah pronunciation | Sedang — re-generate scene MP3, replace di Track 2 |
| Naskah salah / mau ganti angle | Mahal — re-generate seluruh VO + re-time |
| Demo flow berubah (UI Kitpot di-update) | **Sangat mahal** — re-record screen + re-time |
| Kontrak redeploy (chain ID berubah) | **Sangat mahal** — semua text overlay perlu cek ulang, re-record kalau address ditampilkan |

Karena re-record paling mahal, **lock UI Kitpot dan kontrak deploy** sebelum mulai rekam. Jangan deploy contract baru atau mengubah halaman dashboard sampai video selesai upload.
