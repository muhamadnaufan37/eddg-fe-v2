import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Pagination from "@/components/features/Pagination";
import ParticipantSkeleton from "@/pages/digital-data/sensus/components/ParticipantSkeleton";
import FilterModal from "@/pages/digital-data/sensus/components/FilterModal";
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import { BASE_TITLE } from "@/store/actions";
import { THEME_COLORS } from "@/config/theme";
import { getLocalStorage } from "@/services/localStorageService";
import {
  fetchPresensiReport,
  checkPresensi,
  createPresensi,
  storePresensiByCoordinate,
  type PresensiPesertaData,
  type Statistics,
} from "@/services/presensiService";
import { handleApiError } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Search,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PresensiModalState {
  open: boolean;
  pesertaId: string | null;
  pesertaNama: string | null;
  mode: "regular" | "coordinate";
}

const PresensiPesertaPage = () => {
  const { kode_kegiatan, id_kegiatan } = useParams<{
    kode_kegiatan: string;
    id_kegiatan: string;
  }>();

  const navigate = useNavigate();
  const dataLogin = getLocalStorage("userData");

  // State untuk list dan pagination
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // State untuk presensi modal
  const [presensiModal, setPresensiModal] = useState<PresensiModalState>({
    open: false,
    pesertaId: null,
    pesertaNama: null,
    mode: "regular",
  });

  // State untuk coordinate
  const [coordinate, setCoordinate] = useState({
    latitude: "",
    longitude: "",
    radiusMeter: 1000,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultPetugasId = String(dataLogin?.user?.id || "");

  // Fetch report data dengan pagination - menggunakan report endpoint untuk peserta dan statistik
  const {
    data: reportData,
    isFetching,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["presensi-report", id_kegiatan, page, rows, debouncedSearch],
    queryFn: () => {
      if (!id_kegiatan) throw new Error("Kode kegiatan tidak ditemukan");
      // Catatan: API report mungkin belum support filter[search], tapi kita siapkan di sini
      return fetchPresensiReport(id_kegiatan, page, rows, debouncedSearch);
    },
    enabled: !!id_kegiatan,
    refetchOnWindowFocus: false,
  });

  // Extract data dan statistics dari report
  const listData = reportData?.list_data_presensi_peserta;
  const statistics = reportData?.statistics;

  // Filter peserta berdasarkan search (client-side jika API belum support)
  const filteredData = useMemo(() => {
    if (!listData?.data) return [];
    if (!debouncedSearch.trim()) return listData.data;

    return listData.data.filter(
      (item: PresensiPesertaData) =>
        item.nama_lengkap
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        String(item.id).includes(debouncedSearch),
    );
  }, [listData?.data, debouncedSearch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const handlePresensi = async () => {
    if (!presensiModal.pesertaId) {
      toast.error("Error", {
        description: "ID peserta tidak ditemukan",
        duration: 3000,
      });
      return;
    }

    // Check presensi terlebih dahulu
    try {
      const checkResponse = await checkPresensi({
        kode_kegiatan: kode_kegiatan || "",
        id_peserta: presensiModal.pesertaId,
      });

      if (checkResponse.data?.already_presensi) {
        toast.warning("Peringatan", {
          description: "Peserta sudah melakukan presensi",
          duration: 3000,
        });
        setPresensiModal({ ...presensiModal, open: false });
        return;
      }
    } catch (error: any) {
      handleApiError(error, {});
      return;
    }

    setIsSubmitting(true);
    try {
      let response;

      if (presensiModal.mode === "coordinate") {
        // Store by coordinate
        if (!coordinate.latitude || !coordinate.longitude) {
          toast.warning("Validasi", {
            description: "Koordinat lokasi harus diisi",
            duration: 3000,
          });
          setIsSubmitting(false);
          return;
        }

        response = await storePresensiByCoordinate({
          kode_kegiatan: kode_kegiatan || "",
          id_peserta: presensiModal.pesertaId,
          add_by_petugas: defaultPetugasId,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          radius_meter: coordinate.radiusMeter,
        });
      } else {
        // Regular presensi
        response = await createPresensi({
          kode_kegiatan: kode_kegiatan || "",
          id_peserta: presensiModal.pesertaId,
          add_by_petugas: defaultPetugasId,
        });
      }

      if (response.success) {
        toast.success("Berhasil", {
          description: `${presensiModal.pesertaNama} berhasil di-presensi`,
          duration: 3000,
        });
        setPresensiModal({ ...presensiModal, open: false });
        refetch();
      }
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetCoordinate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinate({
            ...coordinate,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          toast.success("Lokasi", {
            description: "Koordinat berhasil diambil",
            duration: 2000,
          });
        },
        (error) => {
          toast.error("Error", {
            description: `Gagal mendapatkan lokasi: ${error.message}`,
            duration: 3000,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } else {
      toast.error("Error", {
        description: "Geolocation tidak didukung oleh browser",
        duration: 3000,
      });
    }
  };

  const columns: Column<PresensiPesertaData>[] = [
    { key: "nama_lengkap", header: "Nama Peserta", sortable: true },
    {
      key: "jenis_kelamin",
      header: "Jenis Kelamin",
      sortable: true,
      mobileHidden: true,
    },
    {
      key: "lokasi",
      header: "Lokasi",
      render: (item: PresensiPesertaData) => (
        <span className="text-xs">
          {item.nama_kelompok || item.nama_desa || item.nama_daerah || "-"}
        </span>
      ),
    },
    {
      key: "status_presensi",
      header: "Status",
      render: (item: PresensiPesertaData) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            item.status_presensi === "HADIR"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : item.status_presensi === "TERLAMBAT"
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                : item.status_presensi === "IZIN"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  : item.status_presensi === "SAKIT"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
        >
          {item.status_presensi ? (
            <>
              <Check className="w-3 h-3" />
              {item.status_presensi}
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              Belum Presensi
            </>
          )}
        </span>
      ),
    },
    {
      key: "waktu_presensi",
      header: "Waktu",
      render: (item: PresensiPesertaData) =>
        item.waktu_presensi ? (
          <span className="text-xs">
            {formatDistanceToNow(new Date(item.waktu_presensi), {
              addSuffix: true,
              locale: id,
            })}
          </span>
        ) : (
          <span className="text-xs text-gray-500">-</span>
        ),
    },
  ];

  const rowActions = [
    {
      label: "Presensi",
      value: "presensi",
      disabled: (item: PresensiPesertaData) => !!item.status_presensi,
    },
  ];

  const handleRowAction = (item: PresensiPesertaData, action: string) => {
    if (action === "presensi") {
      setPresensiModal({
        open: true,
        pesertaId: String(item.id),
        pesertaNama: item.nama_lengkap,
        mode: "regular",
      });
      setCoordinate({
        latitude: "",
        longitude: "",
        radiusMeter: 1000,
      });
    }
  };

  const handleReset = () => {
    setPage(1);
    setRows(10);
    setSearch("");
  };

  const totalPresensi = useMemo(() => {
    if (!statistics) return 0;
    return (
      statistics.hadir +
      statistics.terlambat +
      statistics.izin +
      statistics.sakit +
      statistics.alfa
    );
  }, [statistics]);

  document.title = BASE_TITLE + "Presensi Peserta";

  if (!kode_kegiatan) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-sm font-medium">Kode kegiatan tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative md:h-full">
        {(isFetching || isLoading || isSubmitting) && (
          <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-xs">
            <svg
              className="animate-spin h-6 w-6"
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
          </div>
        )}

        <div className="flex flex-col gap-5 h-full">
          {/* Header */}
          <div
            className={`${THEME_COLORS.background.card} rounded-2xl shadow-lg border ${THEME_COLORS.border.default} overflow-hidden`}
          >
            <div className={`${THEME_COLORS.active.background} px-6 py-5`}>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => navigate("/presensi")}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-2xl text-white tracking-tight">
                    Presensi Peserta
                  </h1>
                  <p className="text-white/80 text-sm mt-0.5">
                    Kode Kegiatan: {kode_kegiatan}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Hadir
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {statistics.hadir}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Terlambat
                    </p>
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {statistics.terlambat}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Izin
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {statistics.izin}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Sakit
                    </p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {statistics.sakit}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Alfa
                    </p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {statistics.alfa}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total
                    </p>
                    <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      {totalPresensi}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-6 space-y-5 border-t border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${THEME_COLORS.text.muted}`}
                >
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  value={search}
                  className={`w-full pl-11 pr-4 py-3 text-sm border ${THEME_COLORS.border.default} rounded-xl shadow-sm focus:ring-2 ${THEME_COLORS.focus.ring} focus:border-transparent transition-all ${THEME_COLORS.background.input} ${THEME_COLORS.text.primary}`}
                  placeholder="Cari nama peserta..."
                  onChange={(e: any) => setSearch(e.target.value)}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter") {
                      setDebouncedSearch(search.trim());
                      refetch();
                    }
                  }}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    disabled={isFetching}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex flex-col gap-2">
            {isLoading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ParticipantSkeleton key={i} />
                ))}
              </div>
            )}

            {!isLoading && (
              <DataTableAdvanced
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                data={filteredData || []}
                columns={columns}
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
                getRowId={(item: PresensiPesertaData) => String(item.id)}
                disabled={isSubmitting}
              />
            )}

            {isFetching && !isLoading && (
              <div
                className={`text-xs ${THEME_COLORS.text.muted} text-center animate-pulse`}
              >
                Memperbarui data...
              </div>
            )}

            <div className="mt-3 shrink-0">
              <Pagination
                currentPage={listData?.current_page || 1}
                lastPage={listData?.last_page || 1}
                totalItems={listData?.total || 0}
                rowsPerPage={rows}
                onPageChange={(params) => {
                  setPage(params.page + 1);
                  setRows(params.rows);
                }}
                disabled={isFetching}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Presensi Modal */}
      <FilterModal
        open={presensiModal.open}
        onClose={() => setPresensiModal({ ...presensiModal, open: false })}
        title={`Presensi - ${presensiModal.pesertaNama}`}
      >
        <div className="space-y-4">
          {/* Mode Selection */}
          <div>
            <label className="text-xs font-medium mb-2 block">
              Tipe Presensi
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="regular"
                  checked={presensiModal.mode === "regular"}
                  onChange={(e) =>
                    setPresensiModal({
                      ...presensiModal,
                      mode: e.target.value as "regular" | "coordinate",
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Presensi Biasa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="coordinate"
                  checked={presensiModal.mode === "coordinate"}
                  onChange={(e) =>
                    setPresensiModal({
                      ...presensiModal,
                      mode: e.target.value as "regular" | "coordinate",
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Presensi Lokasi</span>
              </label>
            </div>
          </div>

          {/* Coordinate Section */}
          {presensiModal.mode === "coordinate" && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Presensi dengan lokasi memerlukan koordinat GPS. Radius
                  maksimal 1000 meter.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Latitude
                  </label>
                  <Input
                    type="text"
                    value={coordinate.latitude}
                    className="w-full text-xs"
                    placeholder="-6.4248824"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Longitude
                  </label>
                  <Input
                    type="text"
                    value={coordinate.longitude}
                    className="w-full text-xs"
                    placeholder="107.4751268"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">
                  Radius (meter)
                </label>
                <Input
                  type="number"
                  value={coordinate.radiusMeter}
                  onChange={(e: any) =>
                    setCoordinate({
                      ...coordinate,
                      radiusMeter: Math.min(
                        1000,
                        Math.max(0, parseInt(e.target.value) || 0),
                      ),
                    })
                  }
                  min="0"
                  max="1000"
                  className="w-full text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal radius: 1000 meter
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetCoordinate}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mendapatkan Lokasi...
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    Ambil Koordinat
                  </>
                )}
              </button>
            </div>
          )}

          {presensiModal.mode === "regular" && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs text-gray-600 dark:text-gray-400">
              Presensi akan dicatat tanpa verifikasi lokasi.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
            onClick={() => setPresensiModal({ ...presensiModal, open: false })}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs rounded-lg flex items-center gap-2 ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handlePresensi}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Simpan Presensi
              </>
            )}
          </button>
        </div>
      </FilterModal>
    </>
  );
};

export default PresensiPesertaPage;
