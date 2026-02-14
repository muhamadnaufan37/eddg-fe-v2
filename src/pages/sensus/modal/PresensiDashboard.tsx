import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Search,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { axiosServices } from "@/services/axios";
import { toast } from "sonner";
import { Select } from "@/components/global";

/* ---------------------------
  Types from backend
----------------------------*/
export interface Root {
  success: boolean;
  message: string;
  data: Data;
}

export interface Data {
  peserta: Peserta;
  filter: Filter;
  statistik: Statistik;
  logs: Log[];
}

export interface Peserta {
  id: number;
  kode_cari_data: string;
  nama_lengkap: string;
  jenis_data: string;
  umur: number;
  lokasi: Lokasi;
}

export interface Lokasi {
  daerah: string;
  desa: string;
  kelompok: string;
}

export interface Filter {
  bulan: any;
  tahun: string;
}

export interface Statistik {
  total_kegiatan: number;
  total_hadir: number;
  total_terlambat: number;
  total_tidak_hadir: number;
  persentase_kehadiran: string;
}

export interface Log {
  kegiatan: Kegiatan;
  presensi: Presensi;
}

export interface Kegiatan {
  id: number;
  kode_kegiatan: string;
  nama_kegiatan: string;
  tmpt_kegiatan: string;
  type_kegiatan: string;
  tgl_kegiatan: string;
  jam_kegiatan: string;
  category: string;
}

export interface Presensi {
  id?: number;
  status_presensi: string;
  waktu_presensi?: string;
  keterangan: string;
  hadir: boolean;
}

type LocationState = { detailData?: Root } | Root;

/* ---------------------------
  Helpers & constants
----------------------------*/
const statusColor: Record<string, string> = {
  hadir: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  terlambat:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "tidak hadir": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const cx = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(" ");

const formatDateId = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
};

/* ---------------------------
  Component
----------------------------*/
const PresensiDashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // accept either Root directly or { detailData: Root }
  const incoming = (location.state as LocationState) ?? {};
  const initialApiData: any =
    "detailData" in incoming && incoming.detailData
      ? incoming.detailData
      : (incoming as Root) || null;

  const initialData = initialApiData || null;
  const kode_cari_data = initialData?.kode_cari_data || "";

  // Generate year options (10 years back, current year, 1 year forward)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = currentYear - 10; year <= currentYear + 1; year++) {
      years.push({
        value: year.toString(),
        label: year.toString(),
      });
    }
    return years.reverse(); // Most recent first
  }, [currentYear]);

  // Filter state
  const [selectedYear, setSelectedYear] = useState<string>(
    initialData?.filter?.tahun || currentYear.toString(),
  );

  // Ensure selectedYear is never empty
  useEffect(() => {
    if (!selectedYear || selectedYear.trim() === "") {
      setSelectedYear(currentYear.toString());
    }
  }, [selectedYear, currentYear]);

  // UI state
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<"nama_kegiatan" | "tgl_kegiatan">(
    "tgl_kegiatan",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch data presensi with React Query
  const fetchPresensiData = async () => {
    if (!kode_cari_data) throw new Error("Kode cari data tidak ditemukan");

    const response = await axiosServices().get(
      `/api/v1/data_peserta/${kode_cari_data}/attendance-logs?tahun=${selectedYear}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Gagal memuat data presensi");
    }

    return response.data;
  };

  const {
    data: apiData,
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = useQuery<Root>({
    queryKey: ["presensiData", kode_cari_data, selectedYear],
    queryFn: fetchPresensiData,
    enabled: !!kode_cari_data,
    refetchOnWindowFocus: false,
    initialData: initialApiData || undefined,
  });

  const data = apiData?.data || null;

  // Handle error with useEffect
  useEffect(() => {
    if (isError && error) {
      toast.error("Error", {
        description:
          (error as any)?.response?.data?.message ||
          (error as Error)?.message ||
          "Gagal memuat data presensi",
        duration: 3000,
      });
    }
  }, [isError, error]);

  // derived stats from backend
  const stats = data?.statistik || {
    total_kegiatan: 0,
    total_hadir: 0,
    total_terlambat: 0,
    total_tidak_hadir: 0,
    persentase_kehadiran: "0",
  };

  // filtered + sorted + paginated data
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.logs ?? []).filter(
      (log) =>
        log.kegiatan.nama_kegiatan?.toLowerCase().includes(q) ||
        log.kegiatan.tmpt_kegiatan?.toLowerCase().includes(q) ||
        log.presensi.keterangan?.toLowerCase().includes(q),
    );
  }, [data?.logs, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let A: any, B: any;
      if (sortField === "nama_kegiatan") {
        A = a.kegiatan.nama_kegiatan ?? "";
        B = b.kegiatan.nama_kegiatan ?? "";
      } else {
        A = a.kegiatan.tgl_kegiatan ?? "";
        B = b.kegiatan.tgl_kegiatan ?? "";
      }
      const sA = String(A).toLowerCase();
      const sB = String(B).toLowerCase();
      if (sA === sB) return 0;
      return sortOrder === "asc" ? (sA < sB ? -1 : 1) : sA > sB ? -1 : 1;
    });
    return copy;
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  // handlers
  const toggleSort = (field: "nama_kegiatan" | "tgl_kegiatan") => {
    if (field === sortField)
      setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  useEffect(() => {
    if (!kode_cari_data) {
      setShowModal(true);
    }
  }, [kode_cari_data]);

  // Handle filter change - refetch with new params
  const handleFilterChange = () => {
    // Validate year is not empty
    if (!selectedYear || selectedYear.trim() === "") {
      toast.error("Error", {
        description: "Tahun harus diisi",
        duration: 3000,
      });
      return;
    }

    toast.info("Memuat data...", {
      description: `Filter: ${selectedYear}`,
      duration: 2000,
    });
    setPage(1); // Reset to first page
    refetch(); // Trigger refetch with new and selectedYear
  };

  return (
    <>
      {showModal && <ModalInvalidId />}
      <div className="max-w-7xl mx-auto p-2 space-y-4">
        {/* Loading Overlay */}
        {(isLoading || isFetching) && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Memuat data presensi...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Detail Presensi Peserta
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Laporan aktivitas dan kehadiran
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/sensus", { replace: true })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
        >
          {/* Header dengan gradient */}
          <div className="bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-700 dark:to-violet-700 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white/30 shadow-xl shrink-0">
                <User className="w-10 h-10 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {data?.peserta?.nama_lengkap || "-"}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-white/90">
                  <span className="px-2 py-1 bg-white/20 rounded-md backdrop-blur">
                    {data?.peserta?.kode_cari_data || "-"}
                  </span>
                  <span>•</span>
                  <span>{data?.peserta?.jenis_data || "-"}</span>
                  <span>•</span>
                  <span>{data?.peserta?.umur || 0} tahun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Lokasi
                </div>
                <div className="text-sm text-gray-900 dark:text-white font-medium">
                  {data?.peserta?.lokasi?.desa || "-"},{" "}
                  {data?.peserta?.lokasi?.daerah || "-"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Kelompok: {data?.peserta?.lokasi?.kelompok || "-"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 shrink-0" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter Periode:
              </label>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-40">
                <Select
                  value={yearOptions.find((opt) => opt.value === selectedYear)}
                  onChange={(option: any) => {
                    if (option?.value) {
                      setSelectedYear(option.value);
                    }
                  }}
                  options={yearOptions}
                  placeholder="Pilih Tahun"
                  isSearchable={false}
                  className="text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleFilterChange}
                disabled={isFetching}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isFetching && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {isFetching ? "Memuat..." : "Terapkan Filter"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total Kegiatan
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total_kegiatan}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Hadir
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.total_hadir}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                {stats.persentase_kehadiran}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Terlambat
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.total_terlambat}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Tidak Hadir
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.total_tidak_hadir}
            </div>
          </div>
        </motion.div>

        {/* Search + controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama kegiatan, tempat, atau keterangan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <Search className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                Total: <strong className="ml-1">{sorted.length}</strong>
              </div>
              <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                Hal:{" "}
                <strong className="ml-1">
                  {page}/{totalPages}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              {/* Ensure minimum width for proper display */}
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    onClick={() => toggleSort("nama_kegiatan")}
                  >
                    <div className="flex items-center gap-2">
                      Kegiatan
                      {sortField === "nama_kegiatan" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Jenis</th>
                  <th className="px-4 py-3 text-left">Tempat</th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    onClick={() => toggleSort("tgl_kegiatan")}
                  >
                    <div className="flex items-center gap-2">
                      Tanggal
                      {sortField === "tgl_kegiatan" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Waktu Presensi</th>
                  <th className="px-4 py-3 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
                {paged.map((log, idx) => (
                  <tr
                    key={log.kegiatan.id + "-" + idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {log.kegiatan.nama_kegiatan}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {log.kegiatan.kode_kegiatan}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {log.kegiatan.type_kegiatan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {log.kegiatan.tmpt_kegiatan}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <div>{formatDateId(log.kegiatan.tgl_kegiatan)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {log.kegiatan.jam_kegiatan}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          statusColor[log.presensi.status_presensi] ||
                            "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                        )}
                      >
                        <span
                          className={cx(
                            "w-1.5 h-1.5 rounded-full",
                            log.presensi.hadir
                              ? "bg-green-500"
                              : "bg-red-500 animate-pulse",
                          )}
                        />
                        {log.presensi.status_presensi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {log.presensi.waktu_presensi
                        ? formatDateId(log.presensi.waktu_presensi)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                      {log.presensi.keterangan || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Menampilkan {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, sorted.length)} dari {sorted.length}{" "}
              entri
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  page <= 1
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600",
                )}
              >
                Sebelumnya
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium">
                {page}
              </div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={cx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  page >= totalPages
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600",
                )}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PresensiDashboard;
