/**
 * Status mapping constants for various data types
 * Used across the application for consistent status display
 */

export const STATUS_SAMBUNG_MAP: Record<number, { text: string; color: any }> =
  {
    2: { text: "Pindah Sambung", color: "yellow" },
    1: { text: "Sambung", color: "green" },
    0: { text: "Tidak Sambung", color: "gray" },
  };

export const STATUS_PERNIKAHAN_MAP: Record<
  string,
  { text: string; color: any }
> = {
  true: { text: "Sudah Menikah", color: "teal" },
  false: { text: "Belum Menikah", color: "gray" },
};

export const JENIS_DATA_MAP: Record<string, { text: string; color: any }> = {
  mumi: { text: "Muda/i", color: "slate" },
  remaja: { text: "Remaja", color: "orange" },
  praremaja: { text: "Pra Remaja", color: "violet" },
  caberawit: { text: "Caberawit", color: "red" },
};

export const GENDER_MAP: Record<string, { text: string; color: any }> = {
  "LAKI-LAKI": { text: "Laki-Laki", color: "indigo" },
  PEREMPUAN: { text: "Perempuan", color: "pink" },
};

export const STATUS_USERS_MAP: Record<string, { text: string; color: any }> = {
  "-1": { text: "Banned", color: "red" },
  1: { text: "Aktif", color: "green" },
  0: { text: "Tidak Aktif", color: "gray" },
};

export const STATUS_TEMPAT_SAMBUNG_MAP: Record<
  string,
  { text: string; color: any }
> = {
  true: { text: "Aktif", color: "green" },
  false: { text: "Tidak Aktif", color: "red" },
};

/**
 * Resolve status value to display text and color
 * @param map - Status mapping object
 * @param value - The value to resolve
 * @param fallback - Fallback value if not found
 * @returns Object with text and color properties
 */
export const resolveStatus = <
  T extends Record<string | number, { text: string; color: any }>,
>(
  map: T,
  value: string | number | boolean,
  fallback = { text: "-", color: "gray" },
) => {
  return map[String(value)] ?? fallback;
};
