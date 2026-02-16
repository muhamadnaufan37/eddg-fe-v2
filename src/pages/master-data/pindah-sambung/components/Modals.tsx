import { useState, useEffect } from "react";
import type { PindahSambungHistory } from "@/services/pindahSambungService";
import { axiosServices } from "@/services/axios";

interface Option {
  value: number;
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
    return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
  if (status === "approved")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
  if (status === "rejected")
    return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
  if (status === "reverted")
    return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
  return "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
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
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            History Pindah Sambung
          </div>
          <button
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-10">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100 mx-auto" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading history...
              </p>
            </div>
          ) : !data ? (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No data available
              </p>
            </div>
          ) : (
            <>
              {/* Peserta Info */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {data.peserta.nama_lengkap}
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {data.peserta.kode_cari_data}
                </div>
                <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                  Lokasi Sekarang:{" "}
                  <span className="font-semibold">
                    {data.peserta.lokasi_sekarang.daerah} &gt;{" "}
                    {data.peserta.lokasi_sekarang.desa} &gt;{" "}
                    {data.peserta.lokasi_sekarang.kelompok}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Total Pindah
                    </div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {data.total_pindah}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Pending Requests
                    </div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {data.pending_requests}
                    </div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="mt-5">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  History ({data.history.length})
                </div>

                {data.history.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Belum ada history pindah sambung
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
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
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  From
                                </div>
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {item.lokasi_asal.formatted}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  To
                                </div>
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {item.lokasi_tujuan.formatted}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
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

        <div className="sticky bottom-0 border-t border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
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
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </div>
          <button
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {label}
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || loading}
              className={cn(
                "flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed",
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
    ke_daerah_id: number;
    ke_desa_id: number;
    ke_kelompok_id: number;
    alasan_pindah: string;
  }) => void;
  loading?: boolean;
}

export function RequestModal({
  open,
  onClose,
  onSubmit,
  loading,
}: RequestModalProps) {
  const [kodeCariData, setKodeCariData] = useState("");
  const [alasanPindah, setAlasanPindah] = useState("");

  // Location states
  const [daerahOptions, setDaerahOptions] = useState<Option[]>([]);
  const [desaOptions, setDesaOptions] = useState<Option[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<Option[]>([]);

  const [selectedDaerah, setSelectedDaerah] = useState<number | "">("");
  const [selectedDesa, setSelectedDesa] = useState<number | "">("");
  const [selectedKelompok, setSelectedKelompok] = useState<number | "">("");

  const [loadingDaerah, setLoadingDaerah] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [loadingKelompok, setLoadingKelompok] = useState(false);

  // Load daerah options on mount
  useEffect(() => {
    if (open) {
      loadDaerah();
    }
  }, [open]);

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
      console.error("Failed to load daerah:", error);
    } finally {
      setLoadingDaerah(false);
    }
  };

  const loadDesa = async (daerahId: number) => {
    setLoadingDesa(true);
    try {
      const response = await axiosServices().get(
        `/api/v1/desa/by-daerah/${daerahId}`,
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
      console.error("Failed to load desa:", error);
    } finally {
      setLoadingDesa(false);
    }
  };

  const loadKelompok = async (desaId: number) => {
    setLoadingKelompok(true);
    try {
      const response = await axiosServices().get(
        `/api/v1/kelompok/by-desa/${desaId}`,
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
      console.error("Failed to load kelompok:", error);
    } finally {
      setLoadingKelompok(false);
    }
  };

  const handleSubmit = () => {
    if (
      !kodeCariData.trim() ||
      !selectedDaerah ||
      !selectedDesa ||
      !selectedKelompok ||
      !alasanPindah.trim()
    ) {
      alert("Mohon lengkapi semua field");
      return;
    }

    onSubmit({
      kode_cari_data: kodeCariData.trim(),
      ke_daerah_id: selectedDaerah as number,
      ke_desa_id: selectedDesa as number,
      ke_kelompok_id: selectedKelompok as number,
      alasan_pindah: alasanPindah.trim(),
    });
  };

  const handleClose = () => {
    setKodeCariData("");
    setAlasanPindah("");
    setSelectedDaerah("");
    setSelectedDesa("");
    setSelectedKelompok("");
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
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Request Pindah Sambung
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Ajukan perpindahan peserta ke lokasi baru
            </div>
          </div>
          <button
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 shrink-0"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Kode Cari Data */}
          <div>
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Kode Cari Data Peserta{" "}
              <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <input
              value={kodeCariData}
              onChange={(e) => setKodeCariData(e.target.value)}
              placeholder="Contoh: SEN250502191126409"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
            />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Masukkan kode cari data peserta yang akan dipindahkan
            </p>
          </div>

          {/* Lokasi Tujuan Section */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              Lokasi Tujuan
            </div>

            <div className="space-y-4">
              {/* Daerah */}
              <div>
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Daerah{" "}
                  <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <select
                  value={selectedDaerah}
                  onChange={(e) =>
                    setSelectedDaerah(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  disabled={loadingDaerah}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Desa{" "}
                  <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <select
                  value={selectedDesa}
                  onChange={(e) =>
                    setSelectedDesa(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  disabled={!selectedDaerah || loadingDesa}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Kelompok{" "}
                  <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <select
                  value={selectedKelompok}
                  onChange={(e) =>
                    setSelectedKelompok(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  disabled={!selectedDesa || loadingKelompok}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
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
            </div>
          </div>

          {/* Alasan Pindah */}
          <div>
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Alasan Pindah{" "}
              <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <textarea
              value={alasanPindah}
              onChange={(e) => setAlasanPindah(e.target.value)}
              placeholder="Jelaskan alasan perpindahan peserta..."
              rows={4}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                !kodeCariData.trim() ||
                !selectedDaerah ||
                !selectedDesa ||
                !selectedKelompok ||
                !alasanPindah.trim()
              }
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
