export type FilterType = "checkbox" | "radio" | "range" | "toggle" | "select";

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterField {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[]; // Digunakan untuk checkbox, radio, dan select
  min?: number; // Untuk range
  max?: number; // Untuk range
  isMulti?: boolean; // Khusus tipe 'select': true jika bisa pilih banyak
}

export interface FilterValue {
  [key: string]: any;
}
