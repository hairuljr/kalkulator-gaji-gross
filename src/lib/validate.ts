/**
 * Validasi input untuk Tools Mencari Gaji Gross.
 * Fungsi murni agar mudah diuji dan dipakai bersama UI.
 */

/** THP minimum yang dianggap masuk akal (Rp100.000). */
export const MIN_THP = 100_000;

/** THP maksimum yang dianggap wajar (Rp1.000.000.000 / bulan). */
export const MAX_THP = 1_000_000_000;

/**
 * Validasi nilai Take Home Pay.
 * @returns pesan error, atau `null` bila valid / belum diisi.
 */
export function validateThp(thp: number): string | null {
  if (!Number.isFinite(thp)) {
    return "Masukkan angka yang valid.";
  }
  // Belum diisi → bukan error (hanya empty state).
  if (thp === 0) return null;
  if (thp < 0) {
    return "Take Home Pay tidak boleh negatif.";
  }
  if (thp < MIN_THP) {
    return "Nilai terlalu kecil. Masukkan minimal Rp100.000.";
  }
  if (thp > MAX_THP) {
    return "Nilai terlalu besar. Maksimal Rp1.000.000.000.";
  }
  return null;
}

/** Apakah THP sudah cukup untuk dihitung. */
export function isThpComputable(thp: number): boolean {
  return Number.isFinite(thp) && thp >= MIN_THP && thp <= MAX_THP;
}
