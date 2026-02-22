import { useState, useEffect } from "react";
import type { PindahSambungHistory } from "@/services/pindahSambungService";
import { axiosServices } from "@/services/axios";
import { handleApiError } from "@/utils/errorUtils";
import { Select } from "@/components/global";
import { THEME_COLORS } from "@/config/theme";

interface Option {
  value: string | number;
  label: string;
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string) {
  if (status === "pending")
    return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
  if (status === "approved")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
  if (status === "rejected")
    return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700";
  if (status === "reverted")
    return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
  return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  data: PindahSambungHistory | null;
  loading?: boolean;
}

export function HistoryModal({
  open,
  onClose,
  data,
  loading,
}: HistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto ${THEME_COLORS.background.card} ${THEME_COLORS.border.default} border`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
        >
          <div className={`text-base font-bold ${THEME_COLORS.text.primary}`}>
            History Pindah Sambung
          </div>
          <button
            className={`rounded-xl p-2 shrink-0 ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.background}`}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-10">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-300 mx-auto" />
              <p className={`text-sm ${THEME_COLORS.text.muted}`}>
                Loading history...
              </p>
            </div>
          ) : !data ? (
            <div className="text-center py-10">
              <p className={`text-sm ${THEME_COLORS.text.muted}`}>
                No data available
              </p>
            </div>
          ) : (
            <>
              {/* Peserta Info */}
              <div
                className={`rounded-2xl p-4 border ${THEME_COLORS.background.tableHeader} ${THEME_COLORS.border.default}`}
              >
                <div
                  className={`text-lg font-bold ${THEME_COLORS.text.primary}`}
                >
                  {data.peserta.nama_lengkap}
                </div>
                <div className={`mt-1 text-sm ${THEME_COLORS.text.muted}`}>
                  {data.peserta.kode_cari_data}
                </div>
                <div className={`mt-3 text-sm ${THEME_COLORS.text.secondary}`}>
                  Lokasi Sekarang:{" "}
                  <span className="font-semibold">
                    {data.peserta.lokasi_sekarang.daerah} &gt;{" "}
                    {data.peserta.lokasi_sekarang.desa} &gt;{" "}
                    {data.peserta.lokasi_sekarang.kelompok}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <div
                    className={`rounded-xl px-3 py-2 border ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
                  >
                    <div className={`text-xs ${THEME_COLORS.text.muted}`}>
                      Total Pindah
                    </div>
                    <div
                      className={`text-lg font-bold ${THEME_COLORS.text.primary}`}
                    >
                      {data.total_pindah}
                    </div>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 border ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
                  >
                    <div className={`text-xs ${THEME_COLORS.text.muted}`}>
                      Pending Requests
                    </div>
                    <div
                      className={`text-lg font-bold ${THEME_COLORS.text.primary}`}
                    >
                      {data.pending_requests}
                    </div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="mt-5">
                <div
                  className={`text-sm font-bold mb-3 ${THEME_COLORS.text.primary}`}
                >
                  History ({data.history.length})
                </div>

                {data.history.length === 0 ? (
                  <div
                    className={`rounded-2xl p-8 text-center border ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
                  >
                    <p className={`text-sm ${THEME_COLORS.text.muted}`}>
                      Belum ada history pindah sambung
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.history.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-4 border ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
                                  statusBadgeClass(item.status),
                                )}
                              >
                                {item.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {formatDate(item.created_at)}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <div
                                  className={`text-xs ${THEME_COLORS.text.muted}`}
                                >
                                  From
                                </div>
                                <div
                                  className={`text-sm font-medium ${THEME_COLORS.text.primary}`}
                                >
                                  {item.lokasi_asal.formatted}
                                </div>
                              </div>
                              <div>
                                <div
                                  className={`text-xs ${THEME_COLORS.text.muted}`}
                                >
                                  To
                                </div>
                                <div
                                  className={`text-sm font-medium ${THEME_COLORS.text.primary}`}
                                >
                                  {item.lokasi_tujuan.formatted}
                                </div>
                              </div>
                            </div>

                            <div
                              className={`mt-2 text-sm ${THEME_COLORS.text.secondary}`}
                            >
                              <span className="font-semibold">Alasan:</span>{" "}
                              {item.alasan_pindah}
                            </div>

                            {item.keterangan_reject && (
                              <div className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                                <span className="font-semibold">
                                  Keterangan:
                                </span>{" "}
                                {item.keterangan_reject}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div
          className={`sticky bottom-0 px-5 py-4 border-t ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
        >
          <button
            onClick={onClose}
            className={`w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition border ${THEME_COLORS.background.card} ${THEME_COLORS.text.secondary} ${THEME_COLORS.border.default} ${THEME_COLORS.hover.background}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  loading?: boolean;
  variant?: "success" | "danger" | "warning";
}

export function ActionModal({
  open,
  onClose,
  onSubmit,
  title,
  label,
  placeholder,
  submitLabel,
  loading,
  variant = "success",
}: ActionModalProps) {
  const [value, setValue] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };

  const buttonClass = {
    success:
      "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
    danger:
      "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
    warning:
      "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-xl border ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
      >
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${THEME_COLORS.border.default}`}
        >
          <div className={`text-base font-bold ${THEME_COLORS.text.primary}`}>
            {title}
          </div>
          <button
            className={`rounded-xl p-2 ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.background}`}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <label className={`text-sm font-semibold ${THEME_COLORS.text.label}`}>
            {label}
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={`mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500`}
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={onClose}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition border ${THEME_COLORS.background.card} ${THEME_COLORS.text.secondary} ${THEME_COLORS.border.default} ${THEME_COLORS.hover.background}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || loading}
              className={cn(
                "flex-1 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed",
                buttonClass[variant],
              )}
            >
              {loading ? "Loading..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    kode_cari_data: string;
    ke_daerah_id?: number;
    ke_desa_id?: number;
    ke_kelompok_id?: number;
    ke_daerah_nama?: string;
    ke_desa_nama?: string;
    ke_kelompok_nama?: string;
    alasan_pindah: string;
  }) => void;
  loading?: boolean;
  fetchDataPeserta?: Option[];
}

export function RequestModal({
  open,
  onClose,
  onSubmit,
  loading,
  fetchDataPeserta,
}: RequestModalProps) {
  const [kodeCariData, setKodeCariData] = useState("");
  const [alasanPindah, setAlasanPindah] = useState("");
  const [isRegistered, setIsRegistered] = useState(true); // true = terdaftar (pakai ID), false = tidak terdaftar (pakai nama)

  // For registered locations (using ID)
  const [daerahOptions, setDaerahOptions] = useState<Option[]>([]);
  const [desaOptions, setDesaOptions] = useState<Option[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<Option[]>([]);

  const [selectedDaerah, setSelectedDaerah] = useState<number | "">("");
  const [selectedDesa, setSelectedDesa] = useState<number | "">("");
  const [selectedKelompok, setSelectedKelompok] = useState<number | "">("");

  // For unregistered locations (using nama)
  const [daerahNama, setDaerahNama] = useState("");
  const [desaNama, setDesaNama] = useState("");
  const [kelompokNama, setKelompokNama] = useState("");

  const [loadingDaerah, setLoadingDaerah] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [loadingKelompok, setLoadingKelompok] = useState(false);

  // Load daerah options on mount only if registered mode
  useEffect(() => {
    if (open && isRegistered) {
      loadDaerah();
    }
  }, [open, isRegistered]);

  // Load desa when daerah changes
  useEffect(() => {
    if (selectedDaerah) {
      loadDesa(selectedDaerah);
      setSelectedDesa("");
      setSelectedKelompok("");
      setDesaOptions([]);
      setKelompokOptions([]);
    }
  }, [selectedDaerah]);

  // Load kelompok when desa changes
  useEffect(() => {
    if (selectedDesa) {
      loadKelompok(selectedDesa);
      setSelectedKelompok("");
      setKelompokOptions([]);
    }
  }, [selectedDesa]);

  const loadDaerah = async () => {
    setLoadingDaerah(true);
    try {
      const response = await axiosServices().get("/api/v1/daerah/all");
      const rawData =
        response?.data?.data_tempat_sambung || response?.data?.data || [];
      setDaerahOptions(
        rawData.map((item: any) => ({
          value: item.id,
          label: item.nama_daerah,
        })),
      );
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setLoadingDaerah(false);
    }
  };

  const loadDesa = async (daerahId: number) => {
    setLoadingDesa(true);
    try {
      const response = await axiosServices().get(
        `/api/v1/desa/check?daerah_id=${daerahId}`,
      );
      const rawData =
        response?.data?.data_tempat_sambung || response?.data?.data || [];
      setDesaOptions(
        rawData.map((item: any) => ({
          value: item.id,
          label: item.nama_desa,
        })),
      );
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setLoadingDesa(false);
    }
  };

  const loadKelompok = async (desaId: number) => {
    setLoadingKelompok(true);
    try {
      const response = await axiosServices().get(
        `/api/v1/kelompok/check?desa_id=${desaId}`,
      );
      const rawData =
        response?.data?.data_tempat_sambung || response?.data?.data || [];
      setKelompokOptions(
        rawData.map((item: any) => ({
          value: item.id,
          label: item.nama_kelompok,
        })),
      );
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setLoadingKelompok(false);
    }
  };

  const handleSubmit = () => {
    if (!kodeCariData.trim() || !alasanPindah.trim()) {
      alert("Mohon lengkapi Kode Cari Data dan Alasan Pindah");
      return;
    }

    if (isRegistered) {
      // Validate registered location (using ID)
      if (!selectedDaerah || !selectedDesa || !selectedKelompok) {
        alert("Mohon lengkapi semua field lokasi tujuan");
        return;
      }

      onSubmit({
        kode_cari_data: kodeCariData.trim(),
        ke_daerah_id: selectedDaerah as number,
        ke_desa_id: selectedDesa as number,
        ke_kelompok_id: selectedKelompok as number,
        alasan_pindah: alasanPindah.trim(),
      });
    } else {
      // Validate unregistered location (using nama)
      if (!daerahNama.trim() || !desaNama.trim() || !kelompokNama.trim()) {
        alert("Mohon lengkapi semua field lokasi tujuan");
        return;
      }

      onSubmit({
        kode_cari_data: kodeCariData.trim(),
        ke_daerah_nama: daerahNama.trim(),
        ke_desa_nama: desaNama.trim(),
        ke_kelompok_nama: kelompokNama.trim(),
        alasan_pindah: alasanPindah.trim(),
      });
    }
  };

  const handleClose = () => {
    setKodeCariData("");
    setAlasanPindah("");
    setIsRegistered(true);
    setSelectedDaerah("");
    setSelectedDesa("");
    setSelectedKelompok("");
    setDaerahNama("");
    setDesaNama("");
    setKelompokNama("");
    setDaerahOptions([]);
    setDesaOptions([]);
    setKelompokOptions([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto border ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
        >
          <div>
            <div className={`text-base font-bold ${THEME_COLORS.text.primary}`}>
              Request Pindah Sambung
            </div>
            <div className={`mt-0.5 text-xs ${THEME_COLORS.text.muted}`}>
              Ajukan perpindahan peserta ke lokasi baru
            </div>
          </div>
          <button
            className={`rounded-xl p-2 shrink-0 ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.background}`}
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Kode Cari Data */}
          <div>
            <label
              className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
            >
              Kode Cari Data Peserta{" "}
              <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>

            <Select
              options={fetchDataPeserta}
              value={fetchDataPeserta?.find(
                (option: any) => String(option.value) === kodeCariData,
              )}
              onChange={(selected: any) => {
                setKodeCariData(selected ? String(selected.value) : "");
              }}
              placeholder="Kode Cari Data Peserta"
              className="w-full text-xs"
              isClearable
            />
            <p className={`mt-1.5 text-xs ${THEME_COLORS.text.muted}`}>
              Atau masukkan kode cari data peserta yang akan dipindahkan
            </p>
          </div>

          {/* Mode Selection */}
          <div
            className={`rounded-2xl p-4 border ${THEME_COLORS.background.tableHeader} ${THEME_COLORS.border.default}`}
          >
            <div
              className={`text-sm font-semibold mb-3 ${THEME_COLORS.text.primary}`}
            >
              Tipe Lokasi Tujuan
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRegistered(true)}
                className={cn(
                  "flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition border-2",
                  isRegistered
                    ? `${THEME_COLORS.active.background} ${THEME_COLORS.active.text} ${THEME_COLORS.active.text}`
                    : `${THEME_COLORS.background.card} ${THEME_COLORS.text.secondary} ${THEME_COLORS.border.default} hover:border-gray-300 dark:hover:border-gray-600`,
                )}
              >
                <div className="font-bold">Tempat Terdaftar</div>
                <div className="text-xs mt-1 opacity-90">
                  Pilih dari daftar yang sudah ada
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsRegistered(false)}
                className={cn(
                  "flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition border-2",
                  !isRegistered
                    ? `${THEME_COLORS.active.background} ${THEME_COLORS.active.text} ${THEME_COLORS.active.text}`
                    : `${THEME_COLORS.background.card} ${THEME_COLORS.text.secondary} ${THEME_COLORS.border.default} hover:border-gray-300 dark:hover:border-gray-600`,
                )}
              >
                <div className="font-bold">Tempat Tidak Terdaftar</div>
                <div className="text-xs mt-1 opacity-90">
                  Input manual nama lokasi baru
                </div>
              </button>
            </div>
          </div>

          {/* Lokasi Tujuan Section */}
          <div
            className={`rounded-2xl p-4 border ${THEME_COLORS.background.tableHeader} ${THEME_COLORS.border.default}`}
          >
            <div
              className={`text-sm font-bold mb-3 ${THEME_COLORS.text.primary}`}
            >
              Lokasi Tujuan {isRegistered ? "(Terdaftar)" : "(Tidak Terdaftar)"}
            </div>

            <div className="space-y-4">
              {isRegistered ? (
                // Registered Location Form (using ID)
                <>
                  {/* Daerah */}
                  <div>
                    <label
                      className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
                    >
                      Daerah{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        *
                      </span>
                    </label>
                    <select
                      value={selectedDaerah}
                      onChange={(e) =>
                        setSelectedDaerah(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      disabled={loadingDaerah}
                      className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500`}
                    >
                      <option value="">
                        {loadingDaerah ? "Loading..." : "Pilih Daerah"}
                      </option>
                      {daerahOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Desa */}
                  <div>
                    <label
                      className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
                    >
                      Desa{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        *
                      </span>
                    </label>
                    <select
                      value={selectedDesa}
                      onChange={(e) =>
                        setSelectedDesa(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      disabled={!selectedDaerah || loadingDesa}
                      className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500`}
                    >
                      <option value="">
                        {loadingDesa
                          ? "Loading..."
                          : !selectedDaerah
                            ? "Pilih daerah terlebih dahulu"
                            : "Pilih Desa"}
                      </option>
                      {desaOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kelompok */}
                  <div>
                    <label
                      className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
                    >
                      Kelompok{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        *
                      </span>
                    </label>
                    <select
                      value={selectedKelompok}
                      onChange={(e) =>
                        setSelectedKelompok(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      disabled={!selectedDesa || loadingKelompok}
                      className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500`}
                    >
                      <option value="">
                        {loadingKelompok
                          ? "Loading..."
                          : !selectedDesa
                            ? "Pilih desa terlebih dahulu"
                            : "Pilih Kelompok"}
                      </option>
                      {kelompokOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                // Unregistered Location Form (using Nama)
                <>
                  {/* Daerah Nama */}
                  <div>
                    <label
                      className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
                    >
                      Nama Daerah{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={daerahNama}
                      onChange={(e) => setDaerahNama(e.target.value)}
                      placeholder="Contoh: Daerah Baru"
                      className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400`}
                    />
                  </div>

                  {/* Desa Nama */}
                  <div>
                    <label
                      className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
                    >
                      Nama Desa{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={desaNama}
                      onChange={(e) => setDesaNama(e.target.value)}
                      placeholder="Contoh: Desa XYZ"
                      className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400`}
                    />
                  </div>

                  {/* Kelompok Nama */}
                  <div>
                    <label
                      className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
                    >
                      Nama Kelompok{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={kelompokNama}
                      onChange={(e) => setKelompokNama(e.target.value)}
                      placeholder="Contoh: Kelompok ABC"
                      className={`mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alasan Pindah */}
          <div>
            <label
              className={`text-sm font-semibold ${THEME_COLORS.text.label}`}
            >
              Alasan Pindah{" "}
              <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <textarea
              value={alasanPindah}
              onChange={(e) => setAlasanPindah(e.target.value)}
              placeholder="Jelaskan alasan perpindahan peserta..."
              rows={4}
              className={`mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400`}
            />
          </div>
        </div>

        <div
          className={`sticky bottom-0 px-5 py-4 border-t ${THEME_COLORS.background.card} ${THEME_COLORS.border.default}`}
        >
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed border ${THEME_COLORS.background.card} ${THEME_COLORS.text.secondary} ${THEME_COLORS.border.default} ${THEME_COLORS.hover.background}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                !kodeCariData.trim() ||
                !alasanPindah.trim() ||
                (isRegistered
                  ? !selectedDaerah || !selectedDesa || !selectedKelompok
                  : !daerahNama.trim() ||
                    !desaNama.trim() ||
                    !kelompokNama.trim())
              }
              className="flex-1 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
