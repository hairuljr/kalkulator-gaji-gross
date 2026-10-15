# AGENTS.md — Panduan untuk AI Agent & sesi baru

Dokumen ini adalah **pintu masuk** bagi AI agent atau sesi baru yang mengerjakan
repo ini. Baca bagian "Mulai Cepat" lalu rujuk bagian relevan sebelum mengubah kode.

> Terakhir diperbarui: 2026-10-15 · Semua 12 task (TASK-01…TASK-12) **selesai**.

---

## 1. Mulai Cepat

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 36 unit test (Vitest)
npm run lint     # ESLint
npm run build    # production build
```

Nama package: `kalkulator-gaji-gross`. Untuk versi Node/npm yang didukung,
lihat `engines` (bila ada) atau runner CI di `.github/workflows/ci.yml`
(saat ini Node 22).

**Aturan emas sebelum commit:** wajib lolos `npm test` **dan** `npm run lint`
(keduanya juga dijalankan CI di `.github/workflows/ci.yml`).

---

## 2. Apa produk ini

Kalkulator satu-halaman untuk **HRD**: dari **Take Home Pay (THP)** yang diminta
kandidat, hitung **gaji GROSS** yang perlu dicantumkan di *offering letter*,
setelah memperhitungkan **JHT, JP, BPJS Kesehatan, dan PPh 21**.

Arahnya **terbalik** (reverse): bukan gross → THP, melainkan **THP → gross**.
Ini sumber kerumitan utama: PPh 21 non-linear, sehingga gross dicari dengan
**binary search**.

Tanpa backend. Semua logika adalah **fungsi murni** di `src/lib/`.

---

## 3. Peta kode

```
src/
  app/
    layout.tsx       Root layout: metadata + font (Lexend & Source Sans 3)
    page.tsx         Shell server (header) → render <Calculator />
    globals.css      Design tokens (CSS vars) + @theme inline
  components/
    Calculator.tsx       "use client" — PEMEGANG STATE (thp, ptkp, toggles)
    CalculatorForm.tsx   Form: CurrencyInput + select PTKP + toggle
    CurrencyInput.tsx    Input Rupiah dengan format live + error inline
    ResultCard.tsx       Kartu gross + breakdown + THP (menerima result & ptkp)
    CopyButton.tsx       Salin ringkasan ke clipboard + feedback
  lib/                   ← FUNGSI MURNI, tidak ada React/DOM di sini
    tax.ts           Konstanta pajak/iuran + sumber regulasi (satu-satunya sumber angka)
    calculate.ts     calcPph21, calcDeductions, findGross
    format.ts        formatRupiah, parseRupiah, formatRupiahInput
    validate.ts      validateThp, isThpComputable
    summary.ts       buildOfferSummary (teks ringkasan offering letter)
    *.test.ts        Satu file test per modul
tasks/TASKS.md      Rencana lengkap + status per task
PLAN.md             Rencana teknis detail (rumus, arsitektur)
tools-gaji.jpeg     Mockup referensi UI
```

**Alur state:** `page.tsx` (server) → `Calculator` (client, holder state) →
`CalculatorForm` + `ResultCard` → `CopyButton`.

---

## 4. Kontrak modul `src/lib/`

Gunakan yang sudah ada; jangan menulis ulang.

| Modul | Ekspor utama | Catatan |
|---|---|---|
| `tax.ts` | `JHT_RATE`, `JP_RATE`, `JP_WAGE_CAP`, `BPJS_KES_RATE`, `BPJS_KES_WAGE_CAP`, `BIAYA_JABATAN_*`, `PTKP`, `PtkpStatus`, `PTKP_OPTIONS`, `TAX_BRACKETS`, `PKP_ROUNDING`, `GROSS_ROUNDING`, `TAX_METHOD` | Semua angka pajak **hanya** di sini |
| `calculate.ts` | `calcPph21`, `calcDeductions`, `findGross`, `MAX_ITERATIONS` + tipe `DeductionOptions`, `DeductionResult`, `GrossResult` | Murni, aman untuk nilai 0/NaN |
| `format.ts` | `formatRupiah`, `parseRupiah`, `formatRupiahInput` | Locale `id-ID`, tanpa desimal |
| `validate.ts` | `validateThp`, `isThpComputable`, `MIN_THP`, `MAX_THP` | `thp === 0` **bukan** error (empty state) |
| `summary.ts` | `buildOfferSummary(result, ptkp)` | Plain text untuk clipboard |

---

## 5. Aturan domain yang TIDAK BOLEH dilanggar

1. **Jangan hardcode angka pajak** di komponen atau `calculate.ts`.
   Semua harus impor dari `src/lib/tax.ts`.
2. **Hanya JHT & JP yang menjadi pengurang PPh 21.**
   BPJS Kesehatan **bukan** pengurang pajak (ini aturan pajak, bukan preferensi).
3. **Cap upah:**
   - JHT 2% → **tanpa cap**
   - JP 1% → cap **Rp11.086.300** (efektif Maret 2026)
   - BPJS Kesehatan 1% → cap **Rp12.000.000**
4. **PKP dibulatkan ke BAWAH ke ribuan** (`PKP_ROUNDING`), bukan ke atas.
5. **Metode PPh 21 = disetahunkan (annualized), BUKAN TER.**
   Lihat komentar `TAX_METHOD` di `tax.ts` sebelum mengubah ini.
   Pemotongan bulanan resmi memakai TER (PP 58/2023), tetapi gross-up butuh
   angka setahun. **Jangan "benahi" ini tanpa membaca komentar tersebut.**
6. **`findGross` membulatkan gross ke ATAS ke Rp100**, sehingga THP hasil
   selalu ≥ target dengan selisih ≤ Rp100. Ini disengaja.

---

## 6. Konvensi & gotcha teknis

- **Path alias:** `@/*` → `./src/*` (lihat `tsconfig.json`).
- **Vitest config:** `vitest.config.mts`, memakai `resolve.tsconfigPaths: true`
  (native Vite). **Jangan** tambahkan plugin `vite-tsconfig-paths`.
  `@types/node` harus ≥ 22 (Vitest 5 menuntut ini).
- **Jangan cek cepat dengan `node file.ts`** — Node ESM butuh ekstensi eksplisit,
  jadi impor `"../lib/tax"` akan gagal. Pakai `npm test` (Vitest).
- **React 19 / ESLint:** dilarang `setState` langsung di dalam `useEffect`.
  `CurrencyInput` memakai pola "adjust state during render" untuk sinkronisasi
  nilai dari parent — pertahankan pola itu.
- **Test nilai harapan dihitung MANUAL** (bukan snapshot). Kalau tarif berubah,
  test akan gagal — itu **fitur**, bukan bug. Jangan "perbaiki" dengan menyalin
  output aktual mentah-mentah.
- **Tailwind v4:** token warna didefinisikan sebagai CSS variable di
  `globals.css` + dipetakan lewat `@theme inline` (mis. `bg-surface`,
  `text-muted-foreground`). Lihat file itu sebelum menambah warna baru.

---

## 7. Skill UI/UX (wajib untuk pekerjaan UI)

Untuk **setiap** tugas yang menyentuh UI, gunakan skill **UI UX Pro Max**:

```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py "<query>" \
  --domain style|typography|chart|ux|icons
```

Folder hasil instalasi (`.github/prompts/`) **di-gitignore** (dependensi pihak
ketiga). Bila belum terpasang, ikuti petunjuk instalasi di repo resmi:
<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

Panduan yang sudah diterapkan dan harus tetap dipatuhi:

- Setiap input punya **label terlihat** (bukan placeholder saja).
- Error **inline** via `aria-describedby` + `aria-invalid`.
- Toggle/chip = `<button aria-pressed>` — **bukan** `<div>` yang bisa diklik
  (severity Critical).
- Aksi sukses butuh feedback + auto-dismiss ~2,5 dtk; `aria-live="polite"` untuk
  screen reader.
- Visible focus ring, `cursor-pointer`, transisi 150–300 ms, target sentuh ≥ 44px.
- Angka finansial: pemisah ribuan + `tabular-nums`.

**Tema:** light, clean fintech, aksen biru (`#2563EB`) — **sesuai mockup**
`tools-gaji.jpeg`. Catatan: skill pernah menyarankan tema "Neumorphism"
dark/orange; **itu ditolak** karena bertentangan dengan mockup dan berisiko
aksesibilitas. Jangan mengubah ke tema gelap tanpa instruksi eksplisit.

---

## 8. Git, remote & CI

**Repo ini publik** — jadi jangan cantumkan apa pun yang bersifat lokal/pribadi
(path mesin, konfigurasi SSH/key, kredensial, atau URL internal) ke dalam kode,
dokumentasi, maupun pesan commit. Semua yang ada di repo harus relevan bagi
siapa pun yang meng-clone-nya.

- **Branch utama:** `main`. Remote `origin` merujuk ke repo GitHub ini
  (lihat `git remote -v` di mesin Anda — bisa SSH atau HTTPS, terserah kontributor).
- **CI:** `.github/workflows/ci.yml` berjalan otomatis pada push/PR ke `main`
  (Node 22 · `npm ci` · lint → test → build).

Alur kerja:

```bash
git status                 # selalu cek dulu
git switch -c nama-cabang  # kerjakan perubahan baru di cabang tersendiri
git add -A
git commit -m "..."
npm test && npm run lint   # wajib lolos sebelum push
git push
```

Buka PR ke `main`; CI harus hijau sebelum merge.

## 9. Status & referensi

- **Status task:** lihat `tasks/TASKS.md` — TASK-01…TASK-12 semuanya `[x]`.
- **Detail rumus & arsitektur:** lihat `PLAN.md`.
- **Ringkasan tarif + sumber regulasi:** lihat komentar di `src/lib/tax.ts`.

### Batasan yang perlu diketahui (jujur)

- Hasil **belum** divalidasi langsung terhadap kalkulator resmi DJP.
  QA (TASK-12) memakai 7 kasus dengan implementasi pembanding **independen**
  berbasis regulasi yang sama — semuanya cocok. Sebelum dipakai untuk
  keputusan nyata, disarankan spot-check ke kalkulator pajak resmi.
- Tarif & cap bisa berubah. Bila ada regulasi baru: **ubah `src/lib/tax.ts`**,
  perbarui komentar sumber + tanggal, lalu jalankan test (yang gagal akan
  memberi tahu dampaknya).
- Tool ini mengasumsikan **pegawai tetap bulanan** dengan skema potongan standar.
  Tidak menangani: THR, bonus, lembur, pegawai tidak tetap, PPh 21 final,
  atau tunjangan-tunjangan khusus.
