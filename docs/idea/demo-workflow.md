# Kitpot Demo — Recording & Editing Workflow

> Companion document untuk [`demo-script.md`](./demo-script.md). Naskahnya sudah final di sana — file ini menjelaskan **urutan kerja**: generate VO → rekam visual → assemble di CapCut → ship.

---

## TL;DR (alur 5 langkah)

```
1. Generate ElevenLabs VO dulu (per-scene MP3, 9 file)
2. Putar VO via speaker / earbuds sambil screen-record   ← ini trik paling penting
3. Drop VO + footage ke CapCut, sudah ~aligned otomatis
4. Add music, captions, text overlay, color grade
5. Export 1080p MP4 → upload YouTube unlisted → submit
```

Total waktu real: 1 hari kerja kalau script & flow sudah final. Kalau revisi narasi ada banyak, 2 hari.

---

## Keputusan #1 — Bahasa apa untuk apa

| Layer | Bahasa | Alasan |
|---|---|---|
| **Voiceover final** | **English (US)** via ElevenLabs | Judge INITIATE = panel internasional. English adalah default submission DoraHacks. |
| **Captions on-screen** | **English** (burn-in) | Banyak judge nonton **mute** saat scrolling submission — captions wajib. |
| **Text overlay** (judul scene, label) | **English** | Konsisten dengan VO. |
| **Suara saat rekam screen** | **NONE / silent** | Jangan rekam suaramu — sulit di-sync dengan VO ElevenLabs nanti. Recorder cukup capture system audio (chime tx, dll) atau bahkan mute total. |
| **Kalau kepingin ada referensi tempo saat rekam** | **Putar VO ElevenLabs lewat speaker/earbuds** | VO masuk ke microphone secara halus — tidak masalah, akan ditimpa track terpisah di CapCut. Lebih sering dipakai di pacing reference. |

**Tidak direkomendasikan**: rekam pakai bahasamu sendiri (Indonesia atau English) lalu swap dengan ElevenLabs. Mouth-position di tangan tidak masalah karena kita tidak tampilkan wajah, tapi *tempo gerakan kursor* dipengaruhi tempo bicara — kalau swap audio, gerakan jadi terlalu cepat atau terlalu lambat.

---

## Keputusan #2 — VO dulu, baru rekam (counter-intuitive)

Kebanyakan orang rekam dulu, baru bikin VO. Itu salah untuk demo screencast karena:

1. Durasi VO **fixed** (TTS tidak bisa diregang panjang). Durasi visual **fleksibel** (clip bisa di-speedup, pause, dll).
2. Tx confirmation di blockchain timing-nya **non-deterministic** — kalau visual direkam dulu, kamu akan struggle pas-paskan VO ke action yang sudah selesai.
3. Trick yang sukses: **putar VO via speaker** sambil rekam → kursormu otomatis ikut tempo VO. Hasilnya hampir 1:1 sync di timeline CapCut, tinggal nudge ±200ms.

Urutannya jadi:
```
[1] ElevenLabs VO (per scene, MP3)
       ↓
[2] Putar VO Scene N via speaker → rekam aksi Scene N
       ↓
[3] CapCut: VO + screen recording masuk timeline, sudah aligned
       ↓
[4] Tambah text, music, transition, color
       ↓
[5] Export
```

---

## Step 1 — Generate ElevenLabs VO

### Voice pick

Test 2 voice ini, pilih yang paling cocok dengan rasa Kitpot (calm, trustworthy):

| Voice | Sifat | Cocok untuk |
|---|---|---|
| **Brian** (Pre-made library) | Deep, calm, US narrator-grade | **Default rekomendasi** — fits Kitpot's calm tone |
| **Charlotte** (Pre-made library) | Soft, UK English female | Alternatif kalau Brian terdengar terlalu "Wall Street" |

> Hindari voice "Adam" / "Antoni" untuk demo ini — mereka cenderung sales-y. Hindari juga voice multilingual auto-detect, gunakan **English (US)** explicit.

### Setting per scene

Pakai **Eleven Multilingual v2** atau **Eleven Turbo v2** (Turbo lebih murah, kualitas mirip untuk narator). Setting di bawah konsisten kecuali yang ditandai:

```
Stability:           55-65   (default 60; turunkan ke 50 untuk emotional, naikkan ke 70 untuk factual)
Similarity boost:    75
Style exaggeration:  10-25   (lihat per-scene di bawah)
Speaker boost:       ON
```

Per-scene tuning:

| Scene | Mood | Stability | Style exag |
|---|---|---|---|
| 1 — Hook | Dramatic, slower | **50** | **30** |
| 2 — Problem | Empathetic | 55 | 20 |
| 3 — Solution | Confident | 60 | 15 |
| 4 — Native features | Factual, crisp | 65 | 5 |
| 5 — Demo: Create | Instructional | 65 | 5 |
| 6 — Demo: Auto-sign | Building anticipation | 60 | 15 |
| 7 — Demo: Claim | Resolved, satisfied | 60 | 15 |
| 8 — Tech | Factual, neutral | **70** | 0 |
| 9 — Closing | Warm, slower | 55 | 25 |

### Workflow generate

1. Buka ElevenLabs → **Speech Synthesis**
2. Pilih voice (Brian)
3. Per scene:
   - Set stability + style exaggeration sesuai tabel
   - Paste teks **persis** dari `demo-script.md` Scene N (bagian *Narration (ElevenLabs)*)
   - Generate
   - Dengar — kalau ada pronunciation aneh (biasanya angka: *"three hundred million"*, *"sixty-second cycle"*) — re-roll 1–2 kali
   - Download MP3, simpan dengan nama `scene-01-hook.mp3`, `scene-02-problem.mp3`, dst.
4. Total cost estimate: ~9 scenes × ~2k characters total ≈ 18k characters → ~$5 di paid tier, atau muat di free tier kalau quota masih cukup.

> **Tip pronunciation**: tulis angka panjang sebagai kata. *"300 million"* lebih sering keliru dibaca dari *"three hundred million"*. Spell `kitpot-2` sebagai `kitpot-two`. Spell `.init` sebagai `dot init`. Saya sudah pre-format begini di `demo-script.md`.

### Per-scene prompts siap-paste

> Copy persis ini ke ElevenLabs (sudah dengan kata-bukan-angka). Format angka diubah supaya TTS membacanya alami.

#### Scene 1 — Hook
```
Three hundred million people on this planet save money the same way. Every month, they pool cash into one pot, and one person takes their turn to keep it. It's been working for five hundred years. There's just one bug. Someone has to hold the money.
```

#### Scene 2 — Problem
```
Today, every rotating savings circle still runs on a WhatsApp group, a spreadsheet, and one trusted person. That person can disappear. They can miscount. They can play favorites. The whole structure rests on social trust — and social trust does not scale past your closest friends.
```

#### Scene 3 — Solution
```
Kitpot is the same savings circle — but the treasurer is a smart contract. Members deposit each cycle. The contract holds the pot. The contract picks the recipient. The contract slashes anyone who pays late. There is nothing to trust except the code, and the code is open.
```

#### Scene 4 — Native features
```
Kitpot uses three things you can only do on Initia. Auto-signing turns one approval into a whole session of silent transactions. Initia's dot init username registry lets you invite members by name, not by hex address. And the Interwoven Bridge connects assets from the Initia hub directly into our own rollup, kitpot two. None of these exist as a native primitive on any other chain.
```

#### Scene 5 — Demo: Create
```
We log in with Google — no seed phrase, no extension. The auto-faucet drops some test tokens. Then we create a circle. Three members, one hundred USDC each cycle, and for this demo we use a sixty-second cycle so you can watch a full month finish in a minute. Every parameter — penalty, grace period, member count — is configured at creation time and locked in the contract.
```

#### Scene 6 — Demo: Join + Auto-sign
```
Other members open the share link. Each one joins by depositing collateral — that's the safety net the contract uses to enforce on-time payments later. When the third seat is filled, the circle goes Active. Now the magic — every member enables auto-sign. One popup. One signature. From this point on, every deposit, every claim, every interaction this session signs silently. No more wallet popups.
```

#### Scene 7 — Demo: Deposit + Claim
```
Each member deposits. Notice the absence of popups — auto-sign is doing its job. The pot fills to three hundred USDC. The cycle window elapses. The recipient calls claim, and the contract atomically transfers the pot, slashes anyone who didn't pay, and advances to the next cycle. The recipient's reputation goes up. They earn an on-chain badge. None of this required a treasurer.
```

#### Scene 8 — Tech
```
Under the hood: five contracts, one hundred and two tests passing, deployed on our own Initia EVM rollup. Auto-signing is wired through Cosmos authz and feegrant. The protocol is multi-token — any ERC twenty can be a circle. And there's a permissionless keeper: if the recipient ever goes dormant, anyone can unstick the circle, the pot still goes to the right person, and the keeper earns a small fee for the work.
```

#### Scene 9 — Closing
```
Three hundred million people. Five hundred years. One ritual. Now it runs on Initia, with the treasurer replaced by code. Try it at kitpot dot vercel dot app. Thank you.
```

---

## Step 2 — Persiapan rekaman (sebelum tekan record)

### Hardware & tools

| Tool | Pilihan | Catatan |
|---|---|---|
| Screen recorder | **CleanShot X** (paid, Mac) atau **OBS Studio** (free, semua OS) | Hindari Loom — kompresi terlalu agresif untuk submission |
| Resolusi | **1920×1080** atau **2560×1440** | Jangan 4K, ukuran file kelewatan |
| FPS | **60 fps** | Smooth scroll & cursor lebih enak ditonton |
| Cursor highlight | CleanShot bawaan, atau **Mousecape** (Mac), atau OBS plugin | Highlight kuning/pink lembut, jangan giant |
| Audio | **System audio only** (untuk chime tx) atau **mute** | Mute paling aman |

### Browser prep

```
[ ] Buka Chrome / Brave dengan profile baru (atau Incognito)
[ ] Set zoom 100%, font default
[ ] Sembunyikan bookmark bar (Cmd+Shift+B)
[ ] Tutup semua tab lain
[ ] Disable extension yang bisa popup (Grammarly, password manager, dll)
[ ] Toggle dark mode di OS (Mac: System Settings → Appearance → Dark)
[ ] Test resolusi: zoom-out 90% bila tampilan Kitpot terlalu sempit di 1080p
```

### Wallet prep (3 wallet)

Demo butuh 3 anggota. Cara paling rapi:

```
Wallet A (creator)  →  Chrome profile "Demo A" + akun Google A
Wallet B (member)   →  Chrome profile "Demo B" + akun Google B
Wallet C (member)   →  Chrome profile "Demo C" + akun Google C
```

Setiap profile login Privy via Google → auto-faucet drop GAS + USDC + USDe. Pastikan ketiganya juga punya **GAS di Initia L1** (initiation-2) untuk authz signing — ambil dari `https://faucet.testnet.initia.xyz`.

### Pre-flight test (WAJIB sebelum rekam final)

Lakukan **dry-run penuh tanpa merekam** sekali untuk memastikan flow jalan:

```
[ ] Wallet A: Connect → faucet drop OK → Create Circle (60s cycle, 3 member, 100 USDC)
[ ] Wallet B: Open share link → Join → collateral lock OK
[ ] Wallet C: Open share link → Join → status circle flips Forming → Active
[ ] Wallet B: Toggle Auto-sign → Privy popup → confirm → toggle nyala
[ ] Wallet B: Deposit → SILENT (no popup) ← ini yang harus di-verify!
[ ] Wait 60 detik → Wallet A claim → 297 USDC mendarat
[ ] Reputation page Wallet A: tier progress visible, badge muncul
```

Kalau salah satu step gagal — jangan rekam dulu. Lebih baik delay 1 jam fix bug daripada rekam ulang dari nol.

---

## Step 3 — Recording session

### Method: VO playback while recording

```
1. Buka folder MP3 ElevenLabs
2. Putar `scene-01-hook.mp3` lewat speaker / earbuds
3. Mulai screen recorder (background)
4. Lakukan aksi sesuai naskah Scene 1 (atau diam-diam tampilkan visual kalau Scene 1 = pure animation)
5. Stop recorder ketika VO selesai
6. Save file: `recording-scene-01.mov` (atau MP4)
7. Repeat untuk Scene 2, 3, dst
```

Beberapa scene tidak butuh screen recording sama sekali (Scene 1 Hook, Scene 4 Native features, Scene 8 Tech, Scene 9 Closing) — ini akan di-handle dengan motion graphics / text animation di CapCut. Skip dan lanjut ke scene berikutnya.

### Yang butuh screen recording

| Scene | Apa yang direkam | Wallet aktif |
|---|---|---|
| 5 — Create | Connect → Faucet drop → Create form → submit | A |
| 6 — Join + Auto-sign | Wallet B & C join → Wallet B toggle auto-sign | B (focus) |
| 7 — Deposit + Claim | Wallet B deposit silent → countdown → Wallet A claim → reputation page | B → A |

### Tips selama rekam

- **Jangan kelewat cepat** — kursor yang lambat & deliberate lebih enak ditonton dari kursor yang panik. Lambatkan ke ~80% kecepatan natural.
- **Hover sebentar** sebelum klik (0.5 detik) — viewer perlu *tahu* kamu mau klik apa.
- **Zoom-in via OS** kalau detail penting (Mac: Ctrl + scroll). Atau biarkan zoom dilakukan di CapCut.
- **Speed-up tx waiting** dilakukan di edit, bukan saat rekam. Saat rekam, biarkan loading natural — nanti di-cut/speedup.
- **Rekam ulang kalau salah klik** — lebih cepat ulang 1 take daripada masking di edit.

---

## Step 4 — CapCut editing

### Project setup

```
New project → 16:9 → 1080p → 30 fps (atau 60 fps kalau footage 60fps)
```

### Timeline organization (5 track)

```
Track 5  ▌Text & titles (overlay teks Scene 1, 4, 8, 9)
Track 4  ▌Captions / subtitle
Track 3  ▌Music background
Track 2  ▌Voiceover ElevenLabs (semua MP3 disusun urut)
Track 1  ▌Screen recording / motion graphics
```

### Step-by-step edit

**1. Drop semua VO MP3 ke Track 2, urut Scene 1 → 9.** Geser supaya saling menyambung tanpa gap (atau beri jeda 200–300ms antar scene untuk breathing room).

**2. Drop screen recording ke Track 1 sesuai scene yang membutuhkan.**

   - Scene 5, 6, 7: footage screen recording masuk
   - Scene 1, 2, 3, 4, 8, 9: tidak ada footage — pakai background gradient + text animation

**3. Speedup transaction wait clips.**

   - Pilih clip → Speed → 2x atau 3x untuk bagian loading spinner
   - Untuk countdown 60-detik di Scene 7 — speedup ke 8x atau cut ke jump (timestamp visible "55s" → "5s")

**4. Add cursor highlight** kalau belum ada di rekaman:

   - CapCut Effects → search "spotlight" atau "circle highlight"
   - Track cursor manual (CapCut tidak auto-track cursor; kalau perlu auto, gunakan Descript atau ScreenStudio sebagai pre-processor)
   - Alternatif: pre-record dengan CleanShot yang cursor highlight bawaan, lebih simpel.

**5. Add text overlay (Track 5).**

   - Untuk scene tanpa footage: text adalah focal point. Pakai font **Inter** atau **Geist** Bold.
   - Animation: **Fade In** masuk, **Fade Out** keluar. Hindari "typewriter" / "bounce" — terlalu hyper.
   - Posisi: center untuk title cards, lower-third untuk caption-style.
   - Stagger muncul (timing 0.5–1 detik antar baris) untuk text bertingkat di Hook.

**6. Generate captions otomatis (Track 4).**

   - CapCut bawaan: **Text → Auto Captions → English**. Akurasi >95% untuk ElevenLabs voice.
   - Edit manual untuk angka & istilah teknis (`USDC`, `kitpot-2`, `.init`).
   - Style: white text + black drop shadow, posisi bottom 15%, font medium.

**7. Music background (Track 3).**

   - Sumber royalty-free yang aman:
     - YouTube Audio Library (filter: ambient / cinematic / inspirational)
     - Epidemic Sound (paid tapi paling aman dari claim)
     - Lo-fi creator dengan license commercial-OK (cek deskripsi mereka)
   - Volume: turunkan ke **−18 dB sampai −22 dB** (jauh di bawah VO yang 0 dB)
   - **Sidechain ducking**: di CapCut, pakai **Audio → Effects → Voice Enhance** di VO + **Volume keyframe** di music untuk drop -3 dB saat VO bicara
   - Fade in di awal (1 detik), fade out di akhir (2 detik)

**8. Color grade.**

   - Demo Kitpot sudah dark mode → tidak banyak perlu di-grade
   - Apply **LUT preset → "Cinematic" / "Clean Tech"** kalau available
   - Slight contrast +5, saturation +5
   - Hindari over-saturate atau filter berlebihan

**9. Add transitions antar scene.**

   - **Fade to black** (0.3 detik) antar scene besar (Scene 1→2, 4→5, 7→8, 8→9)
   - **Smooth cut** (no transition) antar sub-scene di dalam demo (5→6→7)
   - Hindari wipe, zoom-burst, glitch.

**10. Add intro & outro buffer.**

   - 0.5 detik black di awal (sebelum Scene 1) — menghindari abrupt start
   - 1 detik black di akhir (setelah Scene 9 fade out)

### Audio mix akhir

```
Voiceover (Track 2):  0 dB peak, normalize to -3 dB
Music (Track 3):     -18 dB ambient, ducks to -21 dB during VO
Sound effects:       -10 dB (cycle elapse chime, USDC landing chime)
Captions:            no audio
```

Pakai meter VU di CapCut untuk verify, atau export ke headphone untuk listening test.

### Export settings

```
Resolution:  1920 × 1080
Frame rate:  matches source (30 atau 60)
Encoder:     H.264
Bitrate:     8–12 Mbps (recommended) atau Higher Quality preset
Audio:       AAC, 192 kbps, stereo, 48 kHz
Format:      MP4
Filename:    kitpot-demo-v1.mp4
```

---

## Step 5 — QA & ship

### Pre-publish checklist

```
[ ] Total durasi 2:30 – 3:00 ✅
[ ] Hook 5 detik pertama menarik (test: tunjukkan ke teman, tanya "lanjut nonton?")
[ ] Captions burned-in & cocok dengan VO (zero typo)
[ ] Music tidak mengalahkan VO (test di earphone & speaker)
[ ] Tidak ada notification numpang nongol
[ ] Wallet address / private key tidak terbaca di mana pun
[ ] Logo Kitpot & link kitpot.vercel.app jelas terbaca di Closing
[ ] Tidak ada watermark CapCut bawaan (kalau pakai free version, upgrade ke pro untuk export tanpa watermark — atau pakai DaVinci Resolve free)
```

### Upload

```
1. YouTube → Upload video → Visibility: Unlisted
   ├─ Title: "Kitpot — INITIATE Demo"
   ├─ Description: copy ringkasan dari README.md (3–5 baris)
   ├─ Tags: kitpot, initia, hackathon, defi, rosca, savings
   └─ Thumbnail: screenshot Scene 9 closing (logo + tagline)

2. Loom backup (optional) — upload sebagai cadangan kalau YouTube takedown

3. Update .initia/submission.json:
   "demo_video_url": "https://youtu.be/<id>"

4. Update README.md baris "Demo video":
   | **Demo video** | <https://youtu.be/<id>> |

5. Commit + push.
```

---

## Common pitfalls (sudah kena di submission lain)

| Pitfall | Cara hindari |
|---|---|
| **Audio clipping** (VO terdengar pecah) | Normalize VO ke −3 dB peak, jangan biarkan 0 dB merah |
| **Captions delay** dari VO | Auto-caption CapCut kadang offset 200–500ms — manual nudge per segment |
| **Tx loading spinner terlalu lama** | Speedup 4× atau jump-cut, jangan biarkan viewer melongo |
| **URL bar terbaca sensitif** (preview di share link) | Crop top 60px, atau hide URL bar via fullscreen browser |
| **Wallet address terlihat di header** | Crop atau blur — minimal blur partial address |
| **Music copyright claim di YouTube** | Pakai music dari YouTube Audio Library (auto-clear) |
| **Resolusi salah** (4:5 atau 9:16 portrait) | Lock aspect ratio 16:9 di CapCut sejak awal |
| **Logo overlay menutup UI penting** | Pojok kanan bawah, opacity 50% kalau perlu |
| **Hook kelewat lambat** (3 detik baru ada teks) | Frame pertama harus sudah ada movement — text fade-in dari frame 1 |

---

## Estimated time budget

| Phase | Waktu |
|---|---|
| Generate ElevenLabs VO (9 scene + revisi) | 1–2 jam |
| Pre-flight test (3 wallet, dry-run) | 1 jam |
| Screen recording (3 scene utama) | 1–2 jam (termasuk re-take) |
| CapCut assembly (timeline, sync, text) | 2–3 jam |
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
| Demo flow berubah (UI Kitpot di-update) | Sangat mahal — re-record screen + re-time |

Karena re-record paling mahal, **lock UI Kitpot** sebelum mulai rekam. Jangan deploy contract baru atau mengubah halaman dashboard sampai video selesai upload.
