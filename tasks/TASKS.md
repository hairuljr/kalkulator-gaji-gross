# TASKS — Tools Mencari Gaji Gross

Legenda status: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai

---

## FASE 1 — Fondasi

### [x] TASK-01 — Scaffold project & UI shell
**Tujuan:** Project Next.js + TS + Tailwind berjalan dengan layout halaman kosong.
- **Langkah:** `npx create-next-app@latest . --ts --tailwind --app --eslint`; bersihkan boilerplate; set `metadata` title "Tools Mencari Gaji Gross".
- **File:** `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tsconfig.json`.
- **Acceptance criteria:**
  - `npm run dev` tampil halaman tanpa error. ✅
  - Header + area form + area hasil (placeholder) terlihat. ✅
- **Depends on:** —
- **Catatan implementasi:** create-next-app tidak bisa scaffold ke folder non-kosong, jadi di-scaffold di `/tmp` lalu disalin. Font: Lexend + Source Sans 3 (dari skill UI UX Pro Max). Design tokens di `globals.css`. `.github/**` dikecualikan dari ESLint (file .cjs skill). `npm run lint` & `npm run build` lolos.

### [x] TASK-02 — Utilitas format Rupiah
**Tujuan:** Fungsi format & parse mata uang konsisten.
- **File:** `src/lib/format.ts`
- **Implementasi:** `formatRupiah(n)` → `"Rp1.234.567"` (locale `id-ID`, tanpa desimal); `parseRupiah(str)` → number (strip non-digit).
- **Acceptance criteria:** `formatRupiah(1234567) === "Rp1.234.567"`; `parseRupiah("Rp1.234.567") === 1234567`. ✅
- **Depends on:** TASK-01
- **Catatan implementasi:** Bonus `formatRupiahInput()` untuk format live saat mengetik (dipakai TASK-08). Nilai non-finite → `"Rp0"`; negatif → `"-Rp250.000"`. Diverifikasi via 12 skenario (semua lolos); `tsc --noEmit` & `eslint` bersih.

### [x] TASK-03 — Konstanta pajak & PTKP
**Tujuan:** Sentralisasi semua angka pajak di satu tempat.
- **File:** `src/lib/tax.ts`
- **Isi:** `JHT_RATE=0.02`, `JP_RATE=0.01`, `JP_WAGE_CAP`, `BPJS_KES_RATE=0.01`, `BPJS_KES_WAGE_CAP`, `BIAYA_JABATAN_RATE=0.05` + cap, `PTKP` map + `PTKP_OPTIONS`, `TAX_BRACKETS` array.
- **Acceptance criteria:** Semua nilai punya komentar sumber/tanggal; tidak ada angka pajak hardcode di komponen UI. ✅
- **Depends on:** TASK-01

### [x] TASK-04 — Verifikasi rate & aturan terbaru
**Tujuan:** Pastikan tarif, PTKP, dan batas upah (cap) BPJS/JP sesuai regulasi berlaku.
- **Langkah:** Cek tarif PPh 21 (UU HPP), PTKP (PMK terbaru), cap upah JP (mis. batas upah bulanan), cap upah BPJS Kesehatan, dan aturan JP untuk pegawai baru. Update `src/lib/tax.ts` bila berbeda dari asumsi mockup.
- **Acceptance criteria:** Setiap konstanta di `src/lib/tax.ts` punya komentar sumber (nama regulasi + tahun). ✅
- **Depends on:** TASK-03
- **Hasil verifikasi (2026-10-15):**
  - JHT 2% (karyawan), tanpa cap — PP 46/2015. ✅ sesuai mockup
  - JP 1% (karyawan), **cap Rp11.086.300** efektif Mar 2026 — SE BPJS TK No. B/1226/022026. ⚠️ cap BARU, mockup tidak menyebut
  - BPJS Kesehatan 1% (karyawan), **cap Rp12.000.000** — Perpres 64/2020. ⚠️ cap
  - Biaya jabatan 5%, cap Rp500.000/bln — PMK 250/PMK.03/2008
  - PTKP tidak berubah, masih PMK 101/PMK.010/2016 (dikonfirmasi pajakku.com & OnlinePajak)
  - Tarif progresif 5/15/25/30/35% — UU 7/2021 (UU HPP)
  - **Metodologi:** bulanan resmi pakai TER (PP 58/2023); tool pakai *disetahunkan* karena kebutuhan gross-up tahunan. Didokumentasikan di `tax.ts`.

---

## FASE 2 — Mesin Kalkulasi (logika inti)

### [x] TASK-05 — Mesin kalkulasi potongan (`calcDeductions`)
**Tujuan:** Diberi `gross` + `ptkp`, hitung semua potongan & THP.
- **File:** `src/lib/calculate.ts`
- **Implementasi:**
  - `calcPph21(gross, ptkp, opts?)` → PPh bulanan (disetahunkan: biaya jabatan + JHT + JP; PKP dibulatkan ke ribuan bawah; tarif progresif).
  - `calcDeductions(gross, {ptkp, jht, jp, bpjs})` → `{jht, jp, bpjs, pph21, total, thp, gross}`.
- **Acceptance criteria:** Fungsi murni (pure), tanpa efek samping; menangani gross = 0 dan <= PTKP (PPh = 0). ✅
- **Depends on:** TASK-02, TASK-03
- **Catatan implementasi:**
  - Cap JP (11.086.300) & BPJS Kesehatan (12.000.000) diterapkan; JHT tanpa cap.
  - Hanya JHT & JP jadi pengurang PPh 21; BPJS Kesehatan BUKAN pengurang (aturan pajak).
  - `Number.isFinite` guard → NaN/Infinity aman (return 0).
  - Vitest dipasang (TASK-07 dipercepat). `vitest.config.mts` pakai `resolve.tsconfigPaths: true` (native, tanpa plugin).
  - 9 test lulus termasuk nilai terhitung manual (12jt/TK/0 → PPh 497.363, THP 11.031.774).

### [x] TASK-06 — Solver gross (`findGross`)
**Tujuan:** Reverse: THP → Gross via binary search.
- **File:** `src/lib/calculate.ts`
- **Implementasi:** Binary search (lihat PLAN §3.3); upper bound `THP*3`; toleransi < Rp1; hasil dibulatkan ke atas ke Rp100 terdekat.
- **Acceptance criteria:** `findGross(x).thp ≈ x` (|selisih| ≤ Rp100) untuk sampel acak; konvergen < 60 iterasi; terima toggle potongan. ✅
- **Depends on:** TASK-05
- **Catatan implementasi:**
  - Invarian `thp(low) < target ≤ thp(high)`; loop `while (high - low > 1)` → konvergen ≤ ~45 iterasi.
  - Gross dibulatkan ke ATAS ke Rp100 → THP final selalu ≥ target, selisih ≤ Rp100 (terbukti di test).
  - Hasil nyata (TK/0, all on): THP 5jt→gross 5.224.300; THP 10jt→10.742.800; THP 15jt→16.763.800.
  - 15 test lulus (6 test findGross: round-trip 12 target, 4 status PTKP, 3 variasi toggle, invariant ≥ target, konsistensi dgn calcDeductions).

### [x] TASK-07 — Unit test mesin kalkulasi
**Tujuan:** Kunci kebenaran logika pajak & solver.
- **File:** `src/lib/calculate.test.ts`, `src/lib/format.test.ts` (vitest).
- **Acceptance criteria:**
  - Uji `calcPph21` per lapisan tarif + batas PTKP. ✅ (lapisan 5% & 15% + batas PTKP)
  - Uji `findGross`: `|thp - target| ≤ 100` untuk ≥ 10 nilai target. ✅ (12 target)
  - `npm test` hijau. ✅ (27 test, 2 file)
- **Depends on:** TASK-05, TASK-06
- **Catatan implementasi:** Total 27 test. `calculate.test.ts`: 9 kasus manual + invarian + 6 solver. `format.test.ts`: 11 test. Nilai harapan dihitung manual (bukan snapshot) agar regresi pajak langsung ketahuan.

---

## FASE 3 — UI & Integrasi

### [x] TASK-08 — Form input & komponen UI
**Tujuan:** UI input sesuai mockup.
- **File:** `src/components/CalculatorForm.tsx`, `src/components/CurrencyInput.tsx`, `src/components/Calculator.tsx`
- **Implementasi:** Input THP (format Rupiah live), dropdown PTKP (TK/0…K/3), toggle JHT/JP/BPJS; state dikelola di komponen client `Calculator`.
- **Acceptance criteria:** Semua input mengubah state; angka terformat saat mengetik; aksesibel (label + `aria`). ✅
- **Depends on:** TASK-01, TASK-02
- **Catatan implementasi:**
  - **Skill UI UX Pro Max dipakai** (wajib untuk UI). Panduan diterapkan:
    - Setiap input punya label terlihat (bukan placeholder-only) — severity High.
    - Error inline via `aria-describedby` + `aria-invalid`.
    - Toggle = `<button aria-pressed>` (BUKAN div clickable) — severity **Critical**.
    - Visible focus ring, `cursor-pointer`, transisi 150-200ms, target sentuh ≥44px (h-11).
  - Arsitektur: `page.tsx` (server) → `<Calculator />` (client, holder state) → `CalculatorForm` + `CurrencyInput`.
  - Verifikasi browser: ketik `10000000` → tampil `Rp10.000.000`, gross 10.742.800 (cocok test).
  - Toggle BPJS off → gross turun ke 10.612.500. PTKP K/3 → gross 10.499.200. Semua benar.
  - `tsc` ✅ · `eslint` ✅ · `npm test` 27/27 ✅.

### [x] TASK-09 — Result card & breakdown UI
**Tujuan:** Tampilkan gross + rincian potongan sesuai mockup.
- **File:** `src/components/ResultCard.tsx`
- **Implementasi:** Kartu besar "Gross Salary" + daftar JHT, JP, BPJS, PPh 21, total potongan, THP. Highlight warna untuk gross.
- **Acceptance criteria:** Breakdown jumlah = total; layout responsif; cocok dengan mockup. ✅
- **Depends on:** TASK-06, TASK-08
- **Catatan implementasi:**
  - **Skill UI UX Pro Max dipakai:** Number Formatting (pemisah ribuan), `tabular-nums` untuk alignment angka, `<dl>` semantik untuk breakdown, empty state ramah.
  - Verifikasi browser (THP 10jt): JHT 214.856 + JP 107.428 + BPJS 107.428 + PPh 313.075 = 742.787 = Total potongan ✅; 10.742.800 − 742.787 = 10.000.013 ✅.
  - Empty state: ikon + pesan saat THP belum diisi (bagian TASK-11).
  - `tsc` ✅ · `eslint` ✅ · `npm test` 27/27 ✅.

### [x] TASK-10 — Tombol salin ringkasan offering letter
**Tujuan:** Salin ringkasan hasil ke clipboard.
- **File:** `src/components/CopyButton.tsx`, `src/lib/summary.ts`
- **Implementasi:** `navigator.clipboard.writeText(...)` merangkum: PTKP, Gross, tiap potongan, THP. Toast/feedback "Tersalin".
- **Acceptance criteria:** Konten tersalin benar; ada feedback visual; gagal-aman bila clipboard diblokir. ✅
- **Depends on:** TASK-09
- **Catatan implementasi:**
  - **Skill UI UX Pro Max dipakai:** Success Feedback (tombol → "Tersalin!" + centang), Toast auto-dismiss 2,5 dtk, `aria-live="polite"` untuk screen reader.
  - Gagal-aman: bila Clipboard API diblokir → fallback `execCommand('copy')` → bila tetap gagal tampil "Gagal menyalin" (tidak crash).
  - `buildOfferSummary()` fungsi murni + diuji (2 test).
  - Verifikasi browser: klik → tombol "Tersalin!" & clipboard berisi ringkasan lengkap yang benar, lalu auto-revert.
  - `tsc` ✅ · `eslint` ✅ · `npm test` 29/29 ✅.

### [x] TASK-11 — Loading/resume state & validasi input
**Tujuan:** UX aman: tanpa input, input 0, sangat besar.
- **File:** `src/lib/validate.ts` (+ wiring di `Calculator.tsx`, `CalculatorForm.tsx`, `CurrencyInput.tsx`)
- **Acceptance criteria:** Hasil kosong bila THP belum diisi; pesan validasi untuk nilai tak valid; tidak crash pada nilai ekstrem. ✅
- **Depends on:** TASK-08, TASK-09
- **Catatan implementasi:**
  - **Skill UI UX Pro Max dipakai:** inline error via `aria-describedby` + `aria-invalid` (severity High), empty state jelas.
  - `validateThp()`: 0 = belum diisi (bukan error); < Rp100.000 & > Rp1 M = error; non-finite = error.
  - `isThpComputable()`: hanya hitung bila dalam rentang wajar → cegah crash pada nilai ekstrem.
  - Verifikasi browser: input 50.000 → field `invalid` + pesan "Nilai terlalu kecil…"; input 10jt → error hilang & hasil muncul.
  - `tsc` ✅ · `eslint` ✅ · `npm test` 36/36 ✅.

---

## FASE 4 — QA

### [x] TASK-12 — QA akhir: kasus uji manual & polish
**Tujuan:** Verifikasi menyeluruh sebelum rilis.
- **Langkah:** Uji beberapa profil THP × PTKP terhadap kalkulator pajak resmi/DJP; polish spacing/tipografi; cek build (`npm run build`) & lint.
- **Acceptance criteria:** ≥ 5 kasus cocok dengan perhitungan pembanding (toleransi wajar); `npm run build` & `npm run lint` bersih. ✅
- **Depends on:** TASK-07, TASK-09, TASK-11
- **Hasil QA (2026-10-15):**
  - **7 kasus pembanding** dihitung dengan implementasi independen (rumus ditulis ulang dari regulasi) — SEMUA COCOK:
    5jt/TK0=5.000 · 8jt/TK0=143.000 · 10jt/TK0=235.000 · 12jt/TK0=497.363 · 15jt/K2=769.613 · 20jt/K0=1.617.113 · 25jt/K3=2.183.363
  - **Responsif:** tanpa horizontal overflow di 375/768/1024/1440 px (diuji di browser).
  - **Build:** `npm run build` ✅ (static prerender, 4 route). `npm run lint` ✅. `npm test` 36/36 ✅.
  - End-to-end di browser: input → hasil → salin → validasi semuanya berfungsi.

---

## Grafik Ketergantungan
```
TASK-01 ─┬─ TASK-02 ─┬─ TASK-05 ─┬─ TASK-06 ─┬─ TASK-09 ─┬─ TASK-10
         │           │           │           │           └─ TASK-11
         ├─ TASK-03 ─┴─ TASK-04  │           └─ TASK-07 ─┐
         └─ TASK-08 ─────────────┴────────────────────────┴─ TASK-12
```
