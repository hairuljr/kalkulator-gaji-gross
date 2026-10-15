# PLAN — Tools Mencari Gaji Gross

## 1. Ringkasan Fitur (Feature Summary)

**Masalah:** Kandidat meminta Take Home Pay (THP) sebesar nominal tertentu. HRD perlu tahu berapa **gaji gross** yang harus dicantumkan di offering letter, setelah memperhitungkan potongan JHT, JP, BPJS Kesehatan, dan PPh 21.

**Solusi:** Halaman kalkulator satu-layar ("Tools Mencari Gaji Gross") yang:
1. Menerima input **THP yang diinginkan** (dan opsi: status PTKP, kepesertaan BPJS/JHT/JP).
2. Melakukan **perhitungan mundur (reverse calculation)** dari THP → Gross.
3. Menampilkan rincian potongan (JHT, JP, BPJS, PPh 21) dan gross yang disarankan.
4. Menyediakan ringkasan yang bisa disalin ke offering letter.

**Konteks produk:** Ini adalah **single-page calculator**, bukan dashboard HRD penuh. Fokus pada satu alur: input THP → output gross + breakdown.

---

## 2. Referensi Desain (UI Mockup)

Mockup: `tools-gaji.jpeg` — layout yang harus diikuti:
- **Header/Title:** "Tools Mencari Gaji Gross"
- **Subtitle/deskripsi:** penjelasan singkat bahwa tool menghitung estimasi gaji kotor setelah JHT, JP, BPJS, dan PPh 21.
- **Panel Input:** field nominal THP (input mata uang Rupiah), dropdown/opsi **Status PTKP** (TK/0 … K/3), toggle kepesertaan (JHT, JP, BPJS Kesehatan).
- **Panel Hasil:** kartu besar menampilkan **Gross Salary** (highlight), lalu **breakdown potongan**:
  - JHT (2%)
  - JP (1%)
  - BPJS Kesehatan (1%)
  - PPh 21 (progresif)
  - Total potongan
- **Tombol aksi:** "Hitung" dan "Salin ringkasan".
- **Format angka:** gaya Rupiah `Rp1.234.567`.

> Catatan: Mockup menunjukkan rate JHT 2%, JP 1%, BPJS Kesehatan 1%. Rate & batas upah (cap) **wajib diverifikasi** sebelum rilis (lihat TASK-04).

---

## 3. Aturan Perhitungan (Calculation Rules)

Perhitungan **mundur**: cari `Gross` sehingga `Gross - TotalPotongan(Gross) = THP`.

### 3.1 Potongan berupa % dari gross (tanpa cap, disederhanakan)
- **JHT (Jaminan Hari Tua):** 2% × Gross
- **JP (Jaminan Pensiun):** 1% × Gross
- **BPJS Kesehatan:** 1% × Gross (ada batas atas upah — verifikasi)
- **PPh 21:** tarif progresif atas **Penghasilan Kena Pajak (PKP)** tahunan.

### 3.2 PPh 21 (metode disederhanakan untuk tool)
Basis yang dipakai pada kalkulator adalah **PPh 21 bulanan metode tahunan (annualized)**:
1. `Bruto tahunan = Gross × 12 (+ tunjangan tetap, jika ada)`
2. `Pengurang = Biaya Jabatan (5%, max Rp500.000/bln → Rp6.000.000/thn) + JHT pegawai + JP pegawai`
3. `Penghasilan Neto = Bruto tahunan − Pengurang`
4. `PKP = Penghasilan Neto − PTKP` (dibulatkan ke bawah ke ribuan)
5. `PPh tahunan = Σ tarif progresif × lapisan PKP`
6. `PPh bulanan = PPh tahunan ÷ 12`

**Tarif progresif (UU HPP 2021 – verifikasi):**

| Lapisan PKP (tahunan)            | Tarif |
|----------------------------------|-------|
| 0 – 60.000.000                   | 5%    |
| > 60.000.000 – 250.000.000       | 15%   |
| > 250.000.000 – 500.000.000      | 25%   |
| > 500.000.000 – 5.000.000.000    | 30%   |
| > 5.000.000.000                  | 35%   |

**PTKP (tahunan) – verifikasi:**

| Status | PTKP       |
|--------|------------|
| TK/0   | 54.000.000 |
| K/0    | 58.500.000 |
| K/1    | 63.000.000 |
| K/2    | 67.500.000 |
| K/3    | 72.000.000 |

### 3.3 Algoritma solver (karena PPh 21 non-linear → tidak ada rumus tertutup)
Gunakan **binary search / iterasi**:
```
low = THP; high = THP * 3  (upper bound aman)
ulang sampai |Gross - Potongan(Gross) - THP| < 1 (rupiah):
  mid = (low + high) / 2
  if (mid - TotalPotongan(mid)) < THP: low = mid
  else: high = mid
return pembulatan ke atas ke Rp100 terdekat (bulatkan ke atas agar THP tercapai)
```
Bungkus dalam fungsi murni `findGross(targetTHP, ptkpStatus): ResultObject` agar mudah diuji.

---

## 4. Arsitektur & Struktur File

Teknologi target: **Next.js (App Router) + TypeScript + Tailwind CSS** (single-page), tanpa backend.

```
tools-gaji/
├─ app/
│  ├─ page.tsx              # Halaman utama (calculator)
│  ├─ layout.tsx            # Root layout + metadata
│  └─ globals.css           # Tailwind
├─ components/
│  ├─ CalculatorForm.tsx    # Input THP + PTKP + toggle
│  ├─ ResultCard.tsx        # Gross highlight + breakdown
│  └─ CurrencyInput.tsx     # Input Rupiah terformat
├─ lib/
│  ├─ tax.ts                # Konstanta tarif, PTKP, cap
│  ├─ calculate.ts          # calcDeductions() + findGross()
│  └─ format.ts             # formatRupiah(), parseRupiah()
├─ lib/calculate.test.ts    # Unit test (vitest)
├─ package.json
├─ tsconfig.json
└─ tailwind.config.ts
```

**Prinsip:** semua logika pajak di `lib/` sebagai **fungsi murni** (pure functions) — mudah diuji, bebas dari UI.

---

## 5. Task Breakdown (ringkas — detail di tasks/)

| ID      | Judul                                   | Fase |
|---------|-----------------------------------------|------|
| TASK-01 | Scaffold project & UI shell             | 1    |
| TASK-02 | Utilitas format Rupiah                  | 1    |
| TASK-03 | Konstanta pajak & PTKP                  | 1    |
| TASK-04 | Verifikasi rate & aturan terbaru        | 1    |
| TASK-05 | Mesin kalkulasi potongan (calcDeductions) | 2  |
| TASK-06 | Solver gross (findGross, binary search) | 2    |
| TASK-07 | Unit test mesin kalkulasi               | 2    |
| TASK-08 | Form input & komponen UI                | 3    |
| TASK-09 | Result card & breakdown UI              | 3    |
| TASK-10 | Tombol salin ringkasan offering letter  | 3    |
| TASK-11 | Resume/loading state & validasi input   | 3    |
| TASK-12 | QA akhir: kasus uji manual & polish     | 4    |

Detail tiap task (acceptance criteria + file yang disentuh) ada di `tasks/TASKS.md`.
