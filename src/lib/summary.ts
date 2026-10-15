/**
 * Ringkasan hasil untuk disalin ke offering letter / catatan HR.
 * Fungsi murni agar mudah diuji.
 */

import type { GrossResult } from "./calculate";
import { formatRupiah } from "./format";
import { PTKP, type PtkpStatus } from "./tax";

/**
 * Susun ringkasan teks (plain text) dari hasil kalkulasi.
 *
 * @example
 * buildOfferSummary(result, "TK/0");
 * // "Ringkasan Penawaran Gaji (Gross)\n..."
 */
export function buildOfferSummary(
  result: GrossResult,
  ptkp: PtkpStatus,
): string {
  const lines = [
    "Ringkasan Penawaran Gaji (Gross)",
    "--------------------------------",
    `Status PTKP      : ${ptkp} (${formatRupiah(PTKP[ptkp])}/tahun)`,
    `Gross Salary     : ${formatRupiah(result.gross)}`,
    "",
    "Potongan karyawan (bulanan):",
    `- JHT (2%)        : ${formatRupiah(result.jht)}`,
    `- JP (1%)         : ${formatRupiah(result.jp)}`,
    `- BPJS Kesehatan  : ${formatRupiah(result.bpjs)}`,
    `- PPh 21          : ${formatRupiah(result.pph21)}`,
    `Total potongan    : ${formatRupiah(result.total)}`,
    "",
    `Take Home Pay     : ${formatRupiah(result.thp)}`,
    "",
    "Estimasi indikatif. Tarif pajak & batas upah mengikuti regulasi yang berlaku.",
  ];
  return lines.join("\n");
}
