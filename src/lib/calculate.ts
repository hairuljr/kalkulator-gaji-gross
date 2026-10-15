/**
 * Mesin kalkulasi — Tools Mencari Gaji Gross
 *
 * Semua fungsi MURNI (pure): tidak menyentuh DOM, state, tanggal, atau I/O.
 * Semua angka pajak berasal dari `./tax` (jangan hardcode di sini).
 */

import {
  BPJS_KES_RATE,
  BPJS_KES_WAGE_CAP,
  BIAYA_JABATAN_CAP_YEARLY,
  BIAYA_JABATAN_RATE,
  GROSS_ROUNDING,
  JHT_RATE,
  JP_RATE,
  JP_WAGE_CAP,
  PKP_ROUNDING,
  PTKP,
  TAX_BRACKETS,
  type PtkpStatus,
} from "./tax";

/** Opsi komponen potongan yang aktif (dari toggle UI). */
export interface DeductionOptions {
  ptkp: PtkpStatus;
  jht: boolean;
  jp: boolean;
  bpjs: boolean;
}

/** Hasil lengkap kalkulasi (semua nominal BULANAN, dalam rupiah bulat). */
export interface DeductionResult {
  /** Gaji bruto bulanan. */
  gross: number;
  /** Potongan JHT bulanan (porsi karyawan). */
  jht: number;
  /** Potongan JP bulanan (porsi karyawan). */
  jp: number;
  /** Potongan BPJS Kesehatan bulanan (porsi karyawan). */
  bpjs: number;
  /** PPh 21 bulanan (estimasi: PPh setahun / 12). */
  pph21: number;
  /** Total seluruh potongan bulanan. */
  total: number;
  /** Take Home Pay bulanan = gross - total. */
  thp: number;
}

/** Bulatkan ke rupiah terdekat. */
function round(value: number): number {
  return Math.round(value);
}

/**
 * Hitung tarif progresif PPh 21 atas Penghasilan Kena Pajak (PKP) setahun.
 * Lapisan mengikuti UU HPP (lihat TAX_BRACKETS).
 */
function progressiveTax(pkp: number): number {
  if (pkp <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of TAX_BRACKETS) {
    if (pkp <= lower) break;
    const upper = upTo ?? Number.POSITIVE_INFINITY;
    const taxableInBracket = Math.min(pkp, upper) - lower;
    tax += taxableInBracket * rate;
    lower = upper;
  }
  return tax;
}

/**
 * Hitung PPh 21 BULANAN atas gaji bruto bulanan dengan metode DISETAHUNKAN.
 *
 * Rumus setahun:
 *   bruto         = gross × 12
 *   biaya jabatan = min(bruto × 5%, Rp6.000.000)
 *   pengurang     = biaya jabatan + JHT × 12 + JP × 12
 *   neto          = bruto − pengurang
 *   PKP           = max(0, neto − PTKP), dibulatkan ke BAWAH ke ribuan
 *   PPh setahun   = tarif progresif(PKP)
 *   PPh bulanan   = PPh setahun ÷ 12
 *
 * Catatan: hanya iuran JHT & JP yang menjadi pengurang; BPJS Kesehatan BUKAN
 * pengurang PPh 21. Lihat TAX_METHOD di `./tax` untuk alasan metode disetahunkan.
 *
 * @param gross  Gaji bruto bulanan (rupiah).
 * @param ptkp   Nominal PTKP setahun (rupiah).
 * @param opts   Nominal JHT & JP bulanan yang benar-benar dipotong (untuk
 *               memperhitungkan toggle). Default: dihitung dari `gross`.
 */
export function calcPph21(
  gross: number,
  ptkp: number,
  opts?: { jht?: number; jp?: number },
): number {
  if (!Number.isFinite(gross) || gross <= 0) return 0;

  const jhtMonthly = opts?.jht ?? round(gross * JHT_RATE);
  const jpMonthly = opts?.jp ?? round(Math.min(gross, JP_WAGE_CAP) * JP_RATE);

  const brutoSetahun = gross * 12;
  const biayaJabatan = Math.min(
    brutoSetahun * BIAYA_JABATAN_RATE,
    BIAYA_JABATAN_CAP_YEARLY,
  );

  const pengurang = biayaJabatan + jhtMonthly * 12 + jpMonthly * 12;
  const netoSetahun = brutoSetahun - pengurang;

  const pkpRaw = Math.max(0, netoSetahun - ptkp);
  const pkp = Math.floor(pkpRaw / PKP_ROUNDING) * PKP_ROUNDING;

  const pphSetahun = progressiveTax(pkp);
  return round(pphSetahun / 12);
}

/**
 * Hitung seluruh potongan & THP dari gaji bruto bulanan.
 *
 * Fungsi murni. Menangani `gross = 0` (semua nol) dan `gross` rendah
 * (PPh 21 = 0 bila penghasilan neto ≤ PTKP).
 */
export function calcDeductions(
  gross: number,
  options: DeductionOptions,
): DeductionResult {
  const safeGross = Number.isFinite(gross) && gross > 0 ? gross : 0;

  const jht = options.jht ? round(safeGross * JHT_RATE) : 0;
  const jp = options.jp
    ? round(Math.min(safeGross, JP_WAGE_CAP) * JP_RATE)
    : 0;
  const bpjs = options.bpjs
    ? round(Math.min(safeGross, BPJS_KES_WAGE_CAP) * BPJS_KES_RATE)
    : 0;

  const pph21 = calcPph21(safeGross, PTKP[options.ptkp], { jht, jp });

  const total = jht + jp + bpjs + pph21;
  const thp = safeGross - total;

  return { gross: safeGross, jht, jp, bpjs, pph21, total, thp };
}

/* -------------------------------------------------------------------------- */
/* Solver: THP (target) → Gross                                                */
/* -------------------------------------------------------------------------- */

/** Hasil solver: `gross` final + rincian potongan pada gross tersebut. */
export interface GrossResult extends DeductionResult {
  /** Target THP yang diminta (dibulatkan ke rupiah). */
  targetThp: number;
  /** Selisih thp aktual - target (idealnya 0; toleransi ≤ Rp100). */
  difference: number;
}

/** Maksimum iterasi binary search (aman; konvergen jauh lebih cepat). */
export const MAX_ITERATIONS = 60;

/**
 * Cari gaji bruto bulanan yang menghasilkan THP ≈ `targetThp`.
 *
 * THP adalah fungsi MONOTON NAIK terhadap gross, sehingga binary search valid
 * meski PPh 21 non-linear. Algoritma:
 *   1. Rentang awal: low = 0, high = targetThp × 3 (gross selalu > THP).
 *   2. Persempit sampai selisih thp - target < Rp1 atau iterasi habis.
 *   3. Bulatkan hasil ke ATAS ke Rp100 terdekat (kebijakan tampilan).
 *   4. Hitung ulang rincian pada gross final yang sudah dibulatkan.
 *
 * Karena pembulatan ke atas, THP final bisa sedikit ≥ target; selisih dijaga
 * ≤ Rp100 selama pembulatan tidak "melewati" lebih dari satu langkah.
 *
 * @param targetThp THP bulanan yang diinginkan (rupiah).
 * @param options   Status PTKP + toggle komponen potongan.
 */
export function findGross(
  targetThp: number,
  options: DeductionOptions,
): GrossResult {
  const target =
    Number.isFinite(targetThp) && targetThp > 0 ? Math.round(targetThp) : 0;

  if (target === 0) {
    const zero = calcDeductions(0, options);
    return { ...zero, targetThp: 0, difference: 0 };
  }

  let low = 0;
  // Batas atas aman: THP tidak pernah melebihi gross, dan total potongan < 100%
  // dari gross, jadi gross pasti < target × 3.
  let high = target * 3;

  // Invarian: thp(low) < target <= thp(high). Persempit sampai interval ≤ Rp1.
  let iterations = 0;
  while (high - low > 1 && iterations < MAX_ITERATIONS) {
    const mid = (low + high) / 2;
    const { thp } = calcDeductions(mid, options);
    if (thp < target) {
      low = mid;
    } else {
      high = mid;
    }
    iterations++;
  }

  // Bulatkan ke atas ke Rp100 terdekat agar gross "cantik" untuk offering letter.
  const roundedGross = Math.ceil(high / GROSS_ROUNDING) * GROSS_ROUNDING;

  const result = calcDeductions(roundedGross, options);
  return {
    ...result,
    targetThp: target,
    difference: result.thp - target,
  };
}
