/**
 * Konstanta pajak & iuran — Tools Mencari Gaji Gross
 *
 * SEMUA angka pajak/iuran HARUS berasal dari file ini. Jangan hardcode angka
 * di komponen UI atau di lib/calculate.ts.
 *
 * Setiap konstanta diberi komentar sumber regulasi + tanggal verifikasi.
 * Terakhir diverifikasi: 2026-10-15 (lihat TASK-04).
 */

/* -------------------------------------------------------------------------- */
/* 1. Iuran BPJS / Jaminan Sosial (porsi KARYAWAN)                            */
/* -------------------------------------------------------------------------- */

/**
 * Jaminan Hari Tua (JHT) — porsi karyawan 2%.
 * Tidak ada batas upah (cap): dihitung dari seluruh upah bruto.
 * Sumber: PP No. 46 Tahun 2015 (iuran JHT 5,7%: 3,7% pemberi kerja + 2% pekerja).
 */
export const JHT_RATE = 0.02;

/**
 * Jaminan Pensiun (JP) — porsi karyawan 1%.
 * Sumber tarif: PP No. 45 Tahun 2015 (iuran 3%: 2% pemberi kerja + 1% pekerja).
 */
export const JP_RATE = 0.01;

/**
 * Batas upah maksimal untuk perhitungan iuran JP.
 * Berlaku efektif Maret 2026 (naik dari Rp10.042.360 / Rp10.547.400).
 * Sumber: Surat Edaran BPJS Ketenagakerjaan No. B/1226/022026.
 */
export const JP_WAGE_CAP = 11_086_300;

/**
 * BPJS Kesehatan — porsi karyawan 1% (dari total 5%).
 * Sumber: Perpres No. 64 Tahun 2020 (iuran 5%: 4% pemberi kerja + 1% pekerja).
 */
export const BPJS_KES_RATE = 0.01;

/**
 * Batas atas upah untuk perhitungan iuran BPJS Kesehatan (Rp12.000.000).
 * Sumber: Perpres No. 64 Tahun 2020, Pasal 32.
 */
export const BPJS_KES_WAGE_CAP = 12_000_000;

/* -------------------------------------------------------------------------- */
/* 2. Biaya Jabatan (pengurang penghasilan bruto)                             */
/* -------------------------------------------------------------------------- */

/**
 * Biaya jabatan 5% dari penghasilan bruto, maksimal Rp500.000/bulan
 * (Rp6.000.000/tahun).
 * Sumber: PMK No. 250/PMK.03/2008.
 */
export const BIAYA_JABATAN_RATE = 0.05;
export const BIAYA_JABATAN_CAP_MONTHLY = 500_000;
export const BIAYA_JABATAN_CAP_YEARLY = 6_000_000;

/* -------------------------------------------------------------------------- */
/* 3. PTKP (Penghasilan Tidak Kena Pajak) — per tahun                         */
/* -------------------------------------------------------------------------- */

/**
 * PTKP per tahun menurut status. Nilai dasar Rp54.000.000 untuk TK/0,
 * tambahan Rp4.500.000 untuk status kawin dan tiap tanggungan (maks. 3).
 * Sumber: PMK No. 101/PMK.010/2016 (masih berlaku s.d. tahun pajak 2026,
 * dikonfirmasi 2026-10-15).
 */
export const PTKP = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
} as const;

/** Kode status PTKP yang didukung (dipakai dropdown TASK-08). */
export type PtkpStatus = keyof typeof PTKP;

/** Daftar status PTKP untuk kebutuhan UI (urutan tampil). */
export const PTKP_OPTIONS: { value: PtkpStatus; label: string }[] = [
  { value: "TK/0", label: "TK/0 — Tidak kawin, 0 tanggungan" },
  { value: "TK/1", label: "TK/1 — Tidak kawin, 1 tanggungan" },
  { value: "TK/2", label: "TK/2 — Tidak kawin, 2 tanggungan" },
  { value: "TK/3", label: "TK/3 — Tidak kawin, 3 tanggungan" },
  { value: "K/0", label: "K/0 — Kawin, 0 tanggungan" },
  { value: "K/1", label: "K/1 — Kawin, 1 tanggungan" },
  { value: "K/2", label: "K/2 — Kawin, 2 tanggungan" },
  { value: "K/3", label: "K/3 — Kawin, 3 tanggungan" },
];

/* -------------------------------------------------------------------------- */
/* 4. Tarif Progresif PPh 21 (setahun)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Lapisan tarif progresif PPh orang pribadi.
 * `upTo` = batas atas lapisan (inklusif); `null` = lapisan terakhir (tak terbatas).
 * Sumber: UU No. 7 Tahun 2021 (UU HPP), Pasal 17.
 */
export const TAX_BRACKETS: { upTo: number | null; rate: number }[] = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.3 },
  { upTo: null, rate: 0.35 },
];

/* -------------------------------------------------------------------------- */
/* 5. Aturan pembulatan                                                       */
/* -------------------------------------------------------------------------- */

/**
 * PKP (Penghasilan Kena Pajak) dibulatkan ke bawah ke ribuan terdekat.
 * Sumber: UU PPh Pasal 17 ayat (4).
 */
export const PKP_ROUNDING = 1_000;

/** Pembulatan hasil akhir gross ke atas ke Rp100 terdekat (kebijakan tampilan). */
export const GROSS_ROUNDING = 100;

/* -------------------------------------------------------------------------- */
/* 6. Catatan metodologi: TER vs perhitungan disetahunkan                      */
/* -------------------------------------------------------------------------- */

/**
 * Sejak 2024, pemotongan PPh 21 BULANAN oleh pemberi kerja memakai Tarif
 * Efektif Rata-rata (TER) — PP No. 58 Tahun 2023 & PMK No. 168/PMK.03/2023.
 *
 * Tool ini SENGAJA memakai pendekatan *disetahunkan* (annualized), bukan TER:
 * - Untuk keperluan GROSS-UP (THP → gross), yang relevan adalah total PPh 21
 *   setahun, bukan tarif bulanan per bulan berjalan.
 * - TER adalah mekanisme pemotongan bulanan yang bila dijumlahkan setahun
 *   menghasilkan PPh setahun yang sama (dengan penyesuaian di masa pajak
 *   terakhir). Jadi angka gross tahunan tetap konsisten.
 * - PPh 21 bulanan yang ditampilkan = PPh setahun ÷ 12 (estimasi rata).
 *
 * Bila di masa depan ingin menampilkan potongan per bulan sesuai TER persis,
 * tambahkan tabel TER terpisah; JANGAN ubah mesin gross-up tahunan.
 */
export const TAX_METHOD = "annualized" as const;
