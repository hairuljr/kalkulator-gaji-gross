/**
 * Utilitas format & parse mata uang Rupiah.
 *
 * Semua fungsi murni (pure): tidak mengubah argumen, tidak menyentuh DOM/state.
 * Dipakai bersama oleh komponen UI (TASK-08/09) dan mesin kalkulasi.
 */

/** Formatter tunggal (dibuat sekali) agar hasil konsisten & cepat. */
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/**
 * Format angka menjadi string Rupiah tanpa desimal.
 *
 * @example
 * formatRupiah(1234567)      // "Rp1.234.567"
 * formatRupiah(0)            // "Rp0"
 * formatRupiah(1500.7)       // "Rp1.501" (dibulatkan ke bilangan bulat terdekat)
 * formatRupiah(-250000)      // "-Rp250.000"
 */
export function formatRupiah(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  const sign = safe < 0 ? "-" : "";
  return `${sign}Rp${rupiahFormatter.format(Math.abs(safe))}`;
}

/**
 * Ambil hanya digit dari sebuah string, lalu ubah menjadi number.
 * Aman untuk input pengguna yang mengandung "Rp", titik, spasi, atau karakter lain.
 *
 * @example
 * parseRupiah("Rp1.234.567") // 1234567
 * parseRupiah("1.234.567")   // 1234567
 * parseRupiah("abc")         // 0
 * parseRupiah("")            // 0
 */
export function parseRupiah(input: string): number {
  if (!input) return 0;
  const digits = input.replace(/\D/g, "");
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format string input pengguna secara live sambil mengetik.
 * Mengembalikan string Rupiah (tanpa "Rp" ganda), atau "" bila kosong.
 *
 * @example
 * formatRupiahInput("1234567") // "Rp1.234.567"
 * formatRupiahInput("Rp1.234.567") // "Rp1.234.567"
 * formatRupiahInput("")        // ""
 */
export function formatRupiahInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  // Buang leading zero agar "007" -> 7, tapi "0" tetap "0".
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return formatRupiah(Number.parseInt(normalized, 10));
}
