import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Pagination from "@/components/features/Pagination";
import ParticipantSkeleton from "@/pages/digital-data/sensus/components/ParticipantSkeleton";
import FilterModal from "@/pages/digital-data/sensus/components/FilterModal";
import {
  DataTableAdvanced,
  Input,
  type Column,
  Modal,
} from "@/components/global";
import { BASE_TITLE } from "@/store/actions";
import { THEME_COLORS } from "@/config/theme";
import { getLocalStorage } from "@/services/localStorageService";
import {
  fetchPresensiReport,
  fetchPresensiReportPdf,
  checkPresensi,
  createPresensi,
  storePresensiByCoordinate,
  type PresensiPesertaData,
} from "@/services/presensiService";
import { handleApiError } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  MapPin,
  Search,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const PDF_FILENAME_REGEX = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i;
const ALLOWED_ROW_ACTION_ROLE_IDS = [
  "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
  "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6",
];

interface PresensiModalState {
  open: boolean;
  pesertaId: string | null;
  pesertaKode: string | null;
  pesertaNama: string | null;
  mode: "regular" | "coordinate";
  category: string;
  statusPresensi: "hadir" | "izin" | "sakit";
  keterangan: string;
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
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<PresensiPesertaData | null>(
    null,
  );

  // State untuk presensi modal
  const [presensiModal, setPresensiModal] = useState<PresensiModalState>({
    open: false,
    pesertaId: null,
    pesertaKode: null,
    pesertaNama: null,
    mode: "regular",
    category: "",
    statusPresensi: "hadir",
    keterangan: "",
  });

  // State untuk coordinate
  const [coordinate, setCoordinate] = useState({
    latitude: "",
    longitude: "",
    radiusMeter: 1000,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const canUseRowActions = ALLOWED_ROW_ACTION_ROLE_IDS.includes(
    String(dataLogin?.user?.role_id || ""),
  );

  const defaultPetugasId = String(dataLogin?.user?.id || "");

  // Fetch report data dengan pagination - menggunakan report endpoint untuk peserta dan statistik
  const {
    data: reportData,
    isFetching,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["presensi-report", id_kegiatan, page, rows, submittedSearch],
    queryFn: () => {
      if (!id_kegiatan) throw new Error("Kode kegiatan tidak ditemukan");
      // Catatan: API report mungkin belum support filter[search], tapi kita siapkan di sini
      return fetchPresensiReport(id_kegiatan, page, rows, submittedSearch);
    },
    enabled: !!id_kegiatan,
    refetchOnWindowFocus: false,
  });

  // Extract data dan statistics dari report
  const dataCategory = reportData?.category;
  const listData = reportData?.list_data_presensi_peserta;
  const statistics = reportData?.statistics;

  const tableData = listData?.data || [];

  const handleSearch = () => {
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  const handlePresensi = async () => {
    if (!presensiModal.pesertaKode) {
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
        id_peserta: presensiModal.pesertaKode,
        category: dataCategory || "",
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
          id_peserta: presensiModal.pesertaKode,
          add_by_petugas: defaultPetugasId,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          radius_meter: coordinate.radiusMeter,
          category: dataCategory || "",
        });
      } else {
        // Regular presensi
        response = await createPresensi({
          kode_kegiatan: kode_kegiatan || "",
          id_peserta: presensiModal.pesertaKode,
          add_by_petugas: defaultPetugasId,
          category: dataCategory || "",
          status_presensi: presensiModal.statusPresensi,
          keterangan: presensiModal.keterangan,
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

  const handleDownloadPdf = async () => {
    if (!id_kegiatan) return;

    setIsDownloadingPdf(true);

    try {
      const { blob, contentDisposition } = await fetchPresensiReportPdf(
        id_kegiatan,
        submittedSearch,
      );

      let filename = `laporan-presensi-${kode_kegiatan}-${new Date().toISOString().split("T")[0]}.pdf`;

      if (
        contentDisposition &&
        contentDisposition.indexOf("attachment") !== -1
      ) {
        const matches = /filename=([^;]+)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].trim().replace(/^"|"$/g, "");
        }
      }

      const matchedFilename = contentDisposition?.match(PDF_FILENAME_REGEX);
      const resolvedFilename =
        (matchedFilename?.[1] || matchedFilename?.[2] || "")
          .replace(/\"/g, "")
          .trim() || filename;
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = blobUrl;
      downloadLink.download = resolvedFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

      toast.success("Berhasil", {
        description: `Laporan disimpan sebagai ${resolvedFilename}`,
        duration: 3000,
      });
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const statusColors = (item: PresensiPesertaData) => {
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        item.status_presensi === "hadir"
          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
          : item.status_presensi === "terlambat"
            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
            : item.status_presensi === "izin"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              : item.status_presensi === "sakit"
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
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
          Belum Absen
        </>
      )}
    </span>;
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
            item.status_presensi === "hadir"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : item.status_presensi === "terlambat"
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                : item.status_presensi === "izin"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  : item.status_presensi === "sakit"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
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
              Belum Absen
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
      label: "Detail",
      value: "detail",
    },
    {
      label: "Presensi",
      value: "presensi",
      disabled: (item: PresensiPesertaData) => !!item.status_presensi,
    },
  ];

  const handleRowAction = (item: PresensiPesertaData, action: string) => {
    if (action === "detail") {
      setDetailData(item);
      setShowDetailModal(true);
      return;
    }

    if (action === "presensi") {
      setPresensiModal({
        open: true,
        pesertaId: String(item.id),
        pesertaKode: item.kode_cari_data,
        pesertaNama: item.nama_lengkap,
        mode: "regular",
        category: "",
        statusPresensi: "hadir",
        keterangan: "",
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
    setSubmittedSearch("");
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
                      Alfa / Belum Absen
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
                  placeholder="Cari nama peserta, jenis kelamin, lokasi, atau keterangan..."
                  onChange={(e: any) => setSearch(e.target.value)}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <button
                    disabled={isFetching}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled={isFetching}
                    onClick={handleSearch}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cari Data
                  </button>
                  <button
                    type="button"
                    disabled={isDownloadingPdf || isFetching || isLoading}
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Unduh PDF
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
                data={tableData}
                columns={columns}
                rowActions={canUseRowActions ? rowActions : undefined}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium block">
                  Status Presensi
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["hadir", "izin", "sakit"] as const).map((status) => {
                    const isActive = presensiModal.statusPresensi === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setPresensiModal({
                            ...presensiModal,
                            statusPresensi: status,
                          })
                        }
                        className={`px-4 py-2 text-xs rounded-lg border transition-all capitalize ${
                          isActive
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium block">Keterangan</label>
                <textarea
                  value={presensiModal.keterangan}
                  onChange={(e) =>
                    setPresensiModal({
                      ...presensiModal,
                      keterangan: e.target.value,
                    })
                  }
                  placeholder="Isi keterangan jika diperlukan"
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border ${THEME_COLORS.border.default} rounded-lg ${THEME_COLORS.background.input} ${THEME_COLORS.text.primary} focus:ring-2 ${THEME_COLORS.focus.ring} focus:border-transparent`}
                />
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                Presensi akan dicatat tanpa verifikasi lokasi.
              </div>
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

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailData(null);
        }}
        title="Detail Peserta"
        size="xl"
      >
        {detailData ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Users className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {detailData.nama_lengkap}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {detailData.kode_cari_data}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  detailData.status_presensi
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {detailData.status_presensi || "Belum Absen"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem
                label="ID Peserta"
                value={detailData.id_peserta ?? detailData.id}
              />
              <DetailItem label="Kode CAI" value={detailData.kode_cari_data} />
              <DetailItem
                label="Nama Lengkap"
                value={detailData.nama_lengkap}
              />
              <DetailItem
                label="Tanggal Lahir"
                value={detailData.tanggal_lahir}
              />
              <DetailItem
                label="Jenis Kelamin"
                value={detailData.jenis_kelamin}
              />
              <DetailItem
                label="Status Presensi"
                value={statusColors(detailData)}
              />
              <DetailItem
                label="Status Sambung"
                value={detailData.status_sambung}
              />
              <DetailItem
                label="Status Pernikahan"
                value={detailData.status_pernikahan ? "Ya" : "Tidak"}
              />
              <DetailItem label="Daerah" value={detailData.nama_daerah} />
              <DetailItem label="Desa" value={detailData.nama_desa} />
              <DetailItem label="Kelompok" value={detailData.nama_kelompok} />
              <DetailItem
                label="Waktu Presensi"
                value={detailData.waktu_presensi}
              />
              <DetailItem
                label="Keterangan"
                value={
                  typeof detailData.keterangan === "string"
                    ? detailData.keterangan
                    : (detailData.keterangan?.catatan ?? "-")
                }
              />
              <DetailItem
                label="Koordinat Latitude"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.koordinat?.latitude
                }
              />
              <DetailItem
                label="Koordinat Longitude"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.koordinat?.longitude
                }
              />
              <DetailItem
                label="Jarak Meter"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.jarak_meter
                }
              />
              <DetailItem
                label="Radius Meter"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.radius_meter
                }
              />
              <DetailItem
                label="Referensi Level"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.referensi?.level
                }
              />
              <DetailItem
                label="Referensi ID"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.referensi?.id
                }
              />
              <DetailItem
                label="Referensi Name"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.referensi?.name
                }
              />
              <DetailItem
                label="Referensi Latitude"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.referensi?.latitude
                }
              />
              <DetailItem
                label="Referensi Longitude"
                value={
                  typeof detailData.keterangan === "string"
                    ? "-"
                    : detailData.keterangan?.referensi?.longitude
                }
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailData(null);
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Data detail tidak tersedia.
          </div>
        )}
      </Modal>
    </>
  );
};

const DetailItem = ({ label, value }: { label: string; value: unknown }) => {
  const displayValue =
    value === null || value === undefined || value === "" ? "-" : String(value);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950/60">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white wrap-break-word">
        {displayValue}
      </div>
    </div>
  );
};

export default PresensiPesertaPage;
