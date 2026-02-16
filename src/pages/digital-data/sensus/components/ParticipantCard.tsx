import type { Participant } from "@/pages/digital-data/sensus/types/Participant";
import { useState } from "react";

interface Props {
  data: Participant;
}

export const STATUS_SAMBUNG_MAP: Record<number, { text: string; color: any }> =
  {
    2: { text: "Pindah Sambung", color: "yellow" },
    1: { text: "Sambung", color: "green" },
    0: { text: "Tidak Sambung", color: "red" },
  };

export const STATUS_PERNIKAHAN_MAP: Record<
  string,
  { text: string; color: any }
> = {
  true: { text: "Sudah Menikah", color: "blue" },
  false: { text: "Belum Menikah", color: "gray" },
};

export const STATUS_ATLET_MAP: Record<string, { text: string; color: any }> = {
  true: { text: "Atlet ASAD", color: "green" },
  false: { text: "Non Atlet", color: "gray" },
};

export const JENIS_DATA: Record<string, { text: string; color: any }> = {
  SENSUS: { text: "Sensus", color: "yellow" },
  mumi: { text: "Muda/i", color: "green" },
  remaja: { text: "Remaja", color: "blue" },
  praremaja: { text: "Pra Remaja", color: "violet" },
  caberawit: { text: "Caberawit", color: "red" },
};

export const GENDER: Record<string, { text: string; color: any }> = {
  "LAKI-LAKI": { text: "Laki - Laki", color: "red" },
  PEREMPUAN: { text: "Perempuan", color: "pink" },
};

const resolveStatus = <
  T extends Record<string | number, { text: string; color: any }>,
>(
  map: T,
  value: string | number | boolean,
  fallback = { text: "-", color: "gray" },
) => {
  return map[String(value)] ?? fallback;
};

const StatusBadge = ({
  label,
  color = "gray",
}: {
  label: string;
  color?: "green" | "blue" | "red" | "yellow" | "gray" | "pink";
}) => {
  const colors = {
    green:
      "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700",
    red: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700",
    gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700",
  };

  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-medium rounded-lg border ${colors[color]}`}
    >
      {label}
    </span>
  );
};

const ParticipantCard = ({ data }: Props) => {
  const [open, setOpen] = useState(false);

  const statusSambung = resolveStatus(STATUS_SAMBUNG_MAP, data.status_sambung);

  const statusPernikahan = resolveStatus(
    STATUS_PERNIKAHAN_MAP,
    data.status_pernikahan,
  );

  const jenisData = resolveStatus(JENIS_DATA, data.jenis_data);
  const typeGender = resolveStatus(GENDER, data.jenis_kelamin);

  const statusAtlet = resolveStatus(STATUS_ATLET_MAP, data.status_atlet_asad);

  // Definisi Aksi yang Berbeda-beda
  const actions = [
    { label: "Detail", icon: "pi-eye", type: "VIEW" },
    { label: "Edit", icon: "pi-pencil", type: "EDIT" },
    { label: "Riwayat", icon: "pi-history", type: "HISTORY" },
    { label: "Cetak", icon: "pi-print", type: "PRINT" },
    { label: "Point", icon: "pi-wallet", type: "TRANSFER_POINT" },
    { label: "Hapus", icon: "pi-trash", type: "DELETE", danger: true },
  ];

  const handleActionClick = (type: string) => {
    setOpen(false);
    alert(`Action: ${type} for ${data.nama_lengkap}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 relative">
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={data.img_url}
          alt={data.nama_lengkap}
          className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
        />

        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            {data.nama_lengkap}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.kode_cari_data}
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300">
            {data.nm_pekerjaan} / {data.umur}
          </p>
        </div>

        {/* Action Menu */}
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          ⋮
        </button>
      </div>

      {/* Content */}
      <div className="mt-3 space-y-3 text-xs text-gray-600 dark:text-gray-400">
        {/* Location */}
        <div className="flex items-center gap-2">
          <i className="pi pi-map-marker text-gray-400 dark:text-gray-500 text-xs" />
          <span>
            {data.nm_kelompok}, {data.nm_desa}, {data.nm_daerah}
          </span>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          <StatusBadge label={statusAtlet.text} color={statusAtlet.color} />

          <StatusBadge
            label={statusPernikahan.text}
            color={statusPernikahan.color}
          />

          <StatusBadge label={statusSambung.text} color={statusSambung.color} />
          <StatusBadge label={jenisData.text} color={jenisData.color} />
          <StatusBadge label={typeGender.text} color={typeGender.color} />
        </div>
      </div>

      {/* Dropdown Actions */}
      {open && (
        <div className="absolute top-12 right-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg text-sm w-40 z-10">
          {actions.map((action) => (
            <button
              key={action.type}
              onClick={() => handleActionClick(action.type)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors
                ${action.danger ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400"}
              `}
            >
              <i className={`pi ${action.icon} text-[10px]`} />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantCard;
