# Tools Mencari Gaji Gross

Kalkulator satu-halaman untuk HRD: **dari Take Home Pay (THP) yang diminta kandidat,
hitung berapa gaji GROSS yang perlu dicantumkan di offering letter**, setelah
memperhitungkan JHT, JP, BPJS Kesehatan, dan PPh 21.

> Kandidat meminta THP sebesar nominal tertentu. Berapa gaji gross yang perlu
> dicantumkan dalam penawaran kerja? Tools ini membantu HRD memperoleh estimasi
> gaji kotor setelah memperhitungkan JHT, JP, BPJS, dan PPh 21.

## Catatan untuk AI Agent / kontributor

Baca [`AGENTS.md`](AGENTS.md) — berisi peta kode, kontrak modul, aturan domain yang
tidak boleh dilanggar, serta konvensi & gotcha teknis.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
```

Perintah lain:

```bash
npm test         # unit test (Vitest)
npm run lint     # ESLint
npm run build    # production build
```

## Fitur

- Input THP dengan format Rupiah live + validasi inline.
- Dropdown status PTKP (TK/0 … K/3).
- Toggle komponen potongan: JHT, JP, BPJS Kesehatan.
- Kartu hasil: Gross Salary + rincian potongan + total + THP.
- Tombol **Salin ringkasan** untuk ditempel ke offering letter.

## Cara kerja perhitungan

Karena PPh 21 bersifat non-linear, gross dicari dengan **binary search** sampai
THP hasil ≈ target (toleransi ≤ Rp100, dibulatkan ke atas ke Rp100).

PPh 21 dihitung dengan metode **disetahunkan** (annualized):

```
bruto setahun   = gross × 12
biaya jabatan   = min(bruto × 5%, Rp6.000.000)
pengurang       = biaya jabatan + (JHT × 12) + (JP × 12)
neto            = bruto − pengurang
PKP             = max(0, neto − PTKP), dibulatkan ke bawah ke ribuan
PPh setahun     = tarif progresif UU HPP
PPh bulanan     = PPh setahun ÷ 12
```

Tarif & batas upah (terverifikasi 2026-10-15, lihat komentar sumber di
`src/lib/tax.ts`):

| Komponen | Tarif karyawan | Cap upah | Sumber |
|---|---|---|---|
| JHT | 2% | — | PP 46/2015 |
| JP | 1% | Rp11.086.300 (Mar 2026) | PP 45/2015 + SE BPJS TK B/1226/022026 |
| BPJS Kesehatan | 1% | Rp12.000.000 | Perpres 64/2020 |
| Biaya jabatan | 5% | Rp500.000/bln | PMK 250/PMK.03/2008 |
| PPh 21 | 5/15/25/30/35% | — | UU 7/2021 (UU HPP) |

> **Catatan:** hanya JHT & JP yang menjadi pengurang PPh 21; BPJS Kesehatan bukan
> pengurang. Pemotongan bulanan resmi kini memakai TER (PP 58/2023), tetapi tool
> ini sengaja memakai perhitungan disetahunkan karena kebutuhan gross-up. Lihat
> `TAX_METHOD` di `src/lib/tax.ts`.

⚠️ **Estimasi bersifat indikatif.** Tarif dapat berubah — perbarui
`src/lib/tax.ts` bila ada regulasi baru.

## Struktur

```
src/
  app/            layout, page (server shell), globals.css (design tokens)
  components/     Calculator, CalculatorForm, CurrencyInput, ResultCard, CopyButton
  lib/            tax, calculate, format, validate, summary (+ *.test.ts)
tasks/TASKS.md    rencana & status pekerjaan
PLAN.md           rencana teknis lengkap
```

## Skill pengembangan (UI/UX Pro Max)

Proyek ini memakai skill **UI UX Pro Max** untuk panduan desain UI.
Ikuti petunjuk instalasi di repo resminya — bebas pilih AI tool yang Anda pakai:

<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

Folder hasil instalasi (`.github/prompts/`) **tidak di-commit** karena merupakan
dependensi pihak ketiga.

Panduan utama yang dipatuhi: label terlihat, error inline `aria-describedby`,
toggle `<button aria-pressed>`, feedback sukses + auto-dismiss, target sentuh ≥44px,
dan angka finansial memakai `tabular-nums`.
