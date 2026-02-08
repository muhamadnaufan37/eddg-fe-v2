import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocalStorage } from "@/services/localStorageService";
import { useReactToPrint } from "react-to-print";
import { axiosServices } from "@/services/axios";
import Delete from "./modal/Delete";
import GenerateQR from "./modal/GenerateQR";
import ReportPdf from "./cetak/ReportPdf";
import StatistikDashboard from "./statistik/StatistikDashboard";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/features/Pagination";
import ParticipantSkeleton from "./components/ParticipantSkeleton";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import SensusFilterPanel from "./components/SensusFilterPanel";
import FilterModal from "./components/FilterModal";
import StatusTableBadge from "@/components/features/StatusTableBadge";
import {
  STATUS_SAMBUNG_MAP,
  STATUS_PERNIKAHAN_MAP,
  JENIS_DATA_MAP,
  GENDER_MAP,
  resolveStatus,
  STATUS_FILTER_SAMBUNG,
  STATUS_FILTER_PERNIKAHAN,
  STATUS_FILTER_ATLET_ASAD,
  STATUS_FILTER_GENDER,
  STATUS_FILTER_JENIS_DATA,
} from "@/constants";
import {
  fetchSensusData,
  fetchReportData,
  fetchStatistikData,
  fetchDetailPeserta,
  fetchDesaByDaerah,
  fetchKelompokByDesa,
} from "@/services/sensusService";
import { handleApiError, handleApiResponse } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { BASE_TITLE } from "@/store/actions";
import { toast } from "sonner";
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import {
  ChartLine,
  Database,
  File,
  Filter,
  Info,
  PlusCircle,
  RefreshCcw,
  Search,
} from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

const SensusPage = () => {
  const dataLogin = getLocalStorage("userData");
  const { fetchOptions, loading } = useFetchOptions();
  const hasFetched = useRef(false);
  const printRefCetakDataPdf = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [filterInput, setFilterInput] = useState("");
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [fetchDataDaerah, setFetchDataDaerah] = useState<Option[]>([]);
  const [statusSambung, setStatusSambung] = useState<string | number | null>(
    null,
  );
  const [statusPernikahan, setStatusPernikahan] = useState<
    string | number | null
  >(null);
  const [statusAtletAsad, setStatusAtletAsad] = useState<
    string | number | null
  >(null);
  const [statusGender, setStatusGender] = useState<string | number | null>(
    null,
  );
  const [resultJenisData, setResultJenisData] = useState<
    string | number | null
  >(null);
  const [userData, setUserData] = useState(null);
  const [fetchDataPekerjaan, setFetchDataPekerjaan] = useState<Option[]>([]);
  const [fetchDataUsersSensus, setFetchDataUsersSensus] = useState<Option[]>(
    [],
  );
  const [generateQrCode, setGenerateQrCode] = useState(false);
  const [dataLaporanPrint, setDataLaporanPrint] = useState([]);
  const [balikanDataStatistik, setBalikanDataStatistik] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rangeUmurMin, setRangeUmurMin] = useState("");
  const [rangeUmurMax, setRangeUmurMax] = useState("");
  const [filterDaerah, setFilterDaerah] = useState(
    dataLogin?.user?.akses_daerah || "",
  );
  const [filterDesa, setFilterDesa] = useState(
    dataLogin?.user?.akses_desa || "",
  );
  const [filterKelompok, setFilterKelompok] = useState(
    dataLogin?.user?.akses_kelompok || "",
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [balikanDataDesa, setBalikanDataDesa] = useState([]);
  const [balikanDataKelompok, setBalikanDataKelompok] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const navigate = useNavigate();

  const handlePrintPdf = useReactToPrint({
    contentRef: printRefCetakDataPdf,
  });

  const fetchData = async () => {
    try {
      return await fetchSensusData({
        page,
        rows,
        resultJenisData,
        filterInput,
        statusSambung,
        statusPernikahan,
        statusAtletAsad,
        statusGender,
        rangeUmurMin,
        rangeUmurMax,
        filterDaerah: dataLogin?.user?.akses_daerah || filterDaerah,
        filterDesa: dataLogin?.user?.akses_desa || filterDesa,
        filterKelompok: dataLogin?.user?.akses_kelompok || filterKelompok,
      });
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const loadDataRincian = async () => {
    toast.info("Info", {
      description: "Mohon tunggu, data sedang di proses.",
      duration: 1000,
    });

    try {
      const response = await fetchReportData({
        filterDaerah: dataLogin?.user?.akses_daerah || filterDaerah,
        filterDesa: dataLogin?.user?.akses_desa || filterDesa,
        filterKelompok: dataLogin?.user?.akses_kelompok || filterKelompok,
        statusSambung,
        statusPernikahan,
        statusAtletAsad,
        statusGender,
        rangeUmurMin,
        rangeUmurMax,
        resultJenisData,
      });

      handleApiResponse(response, (data) => {
        setDataLaporanPrint(data.data);
        setTimeout(() => handlePrintPdf(), 2000);
      });
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const loadStatistikGenerus = async () => {
    try {
      const response = await fetchStatistikData({
        filterDaerah: dataLogin?.user?.akses_daerah || filterDaerah || "",
        filterDesa: dataLogin?.user?.akses_desa || filterDesa,
        filterKelompok: dataLogin?.user?.akses_kelompok || filterKelompok,
        statusSambung,
        statusPernikahan,
        statusAtletAsad,
        statusGender,
        rangeUmurMin,
        rangeUmurMax,
        resultJenisData,
      });

      handleApiResponse(response, (data) => {
        setBalikanDataStatistik(data);
        setIsModalOpen(true);
      });
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const loadAllData = async () => {
    const [daerah, pekerjaan, users] = await Promise.all([
      fetchOptions("/api/v1/daerah/all", "data_tempat_sambung", "nama_daerah"),
      fetchOptions("/api/v1/pekerjaan/all", "data", "nama_pekerjaan"),
      fetchOptions("/api/v1/users/all", "data", "nama_lengkap"),
    ]);

    setFetchDataDaerah(daerah);
    setFetchDataPekerjaan(pekerjaan);
    setFetchDataUsersSensus(users);
  };

  const fetchDesa = async (id: any) => {
    try {
      const response = await fetchDesaByDaerah(
        dataLogin?.user?.akses_daerah || id,
      );

      if (
        response?.data_tempat_sambung &&
        Array.isArray(response.data_tempat_sambung)
      ) {
        const formattedData = response.data_tempat_sambung.map(
          (option: any) => ({
            value: option.id,
            label: option.nama_desa,
          }),
        );
        setBalikanDataDesa(formattedData);
      } else {
        setBalikanDataDesa([]);
      }
    } catch (error: any) {
      setBalikanDataDesa([]);
      handleApiError(error, {});
    }
  };

  const fetchKelompok = async (desaId: any) => {
    try {
      const response = await fetchKelompokByDesa(
        dataLogin?.user?.akses_desa || desaId,
      );

      if (
        response?.data_tempat_sambung &&
        Array.isArray(response.data_tempat_sambung)
      ) {
        const formattedData = response.data_tempat_sambung.map(
          (option: any) => ({
            value: option.id,
            label: option.nama_kelompok,
          }),
        );
        setBalikanDataKelompok(formattedData);
      } else {
        setBalikanDataKelompok([]);
      }
    } catch (error: any) {
      setBalikanDataKelompok([]);
      handleApiError(error, {});
    }
  };

  const {
    data: dataListSensus,
    isFetching: isRefetchingSensus,
    refetch: refetchListSensus,
  } = useQuery({
    queryKey: ["dataListSensus", page, rows],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  const onResetFilter = () => {
    setPage(1);
    setRows(10);
    setFilterInput("");
    setStatusSambung("");
    setStatusPernikahan("");
    setStatusAtletAsad("");
    setStatusGender("");
    setResultJenisData("");
    setRangeUmurMin("");
    setRangeUmurMax("");
    setFilterDaerah(dataLogin?.user?.akses_daerah || "");
    setFilterDesa(dataLogin?.user?.akses_desa || "");
    setFilterKelompok(dataLogin?.user?.akses_kelompok || "");
  };

  useEffect(() => {
    const isAnyFilterEmpty =
      filterInput === "" ||
      statusSambung === "" ||
      statusPernikahan === "" ||
      statusAtletAsad === "" ||
      statusGender === "" ||
      resultJenisData === "" ||
      rangeUmurMin === "" ||
      rangeUmurMax === "" ||
      filterDaerah === "" ||
      filterDesa === "" ||
      filterKelompok === "";

    if (isAnyFilterEmpty) {
      refetchListSensus();
    }
  }, [
    filterInput,
    statusSambung,
    statusPernikahan,
    statusAtletAsad,
    statusGender,
    resultJenisData,
    rangeUmurMin,
    rangeUmurMax,
    filterDaerah,
    filterDesa,
    filterKelompok,
    refetchListSensus,
  ]);

  useEffect(() => {
    if (!hasFetched.current) {
      loadAllData();
      hasFetched.current = true;
    }
  }, []);

  // Auto-fetch desa dan kelompok berdasarkan akses user
  useEffect(() => {
    // Jika user memiliki akses_daerah, fetch desa
    if (dataLogin?.user?.akses_daerah) {
      fetchDesa(dataLogin?.user?.akses_daerah);
    }

    // Jika user memiliki akses_desa, fetch kelompok
    if (dataLogin?.user?.akses_desa) {
      fetchKelompok(dataLogin?.user?.akses_desa);
    }
  }, [dataLogin?.user?.akses_daerah, dataLogin?.user?.akses_desa]);

  const DetailDataFetch = async (Kode: any, visibilityOption: any) => {
    try {
      const response = await fetchDetailPeserta(Kode);

      if (!response.success) {
        toast.error("Error!", {
          description: response.message || "Gagal memuat data penetapan",
          duration: 3000,
        });
        return;
      }

      const detailDataArray = response.data;
      setUserData(detailDataArray);

      // Handle navigation based on visibility option
      const navigationState = {
        detailData: detailDataArray,
        balikanLogin: dataLogin,
        fetchdataDearah: fetchDataDaerah,
        dataPekerjaan: fetchDataPekerjaan,
        fetchDataUsersSensus: fetchDataUsersSensus,
      };

      switch (visibilityOption) {
        case 2:
          navigate("/sensus/detail", { state: navigationState, replace: true });
          break;
        case 3:
          navigate("/sensus/update", { state: navigationState, replace: true });
          break;
        case 4:
          setShowModalDelete(true);
          break;
        case 6:
          setGenerateQrCode(true);
          break;
        case 7:
          navigate("/sensus/presensi", {
            state: navigationState,
            replace: true,
          });
          break;
      }
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const handleModalDeleteHide = () => {
    setShowModalDelete(false);
  };

  const handleModalQrCodeHide = () => {
    setGenerateQrCode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast.warning("Peringatan", {
        description: "Pilih minimal satu data untuk dihapus",
        duration: 3000,
      });
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedRows.size} data terpilih?`,
    );

    if (!confirmed) return;

    setIsBulkDeleting(true);

    try {
      // Convert Set to Array
      const kode_cari_data = Array.from(selectedRows);

      const response = await axiosServices().delete(
        "/api/v1/data_peserta/bulk-destroy",
        { data: { kode_cari_data } },
      );

      // Check if delete was successful
      if (response.status >= 200 && response.status < 300) {
        toast.success("Berhasil!", {
          description:
            response.data?.message ||
            `${selectedRows.size} data berhasil dihapus`,
          duration: 3000,
        });

        // Clear selection
        setSelectedRows(new Set());

        // Refresh data
        setTimeout(() => {
          refetchListSensus();
        }, 1000);
      } else {
        throw new Error(response.data?.message || "Gagal menghapus data");
      }
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const formatDateString = (date: any) => {
    if (!date) return ""; // Handle jika tanggal tidak tersedia
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  // Definisi kolom
  const columns: Column<any>[] = [
    {
      key: "kode_cari_data",
      header: "Kode",
      sortable: true,
      bold: true,
    },
    {
      key: "nama_lengkap",
      header: "Nama",
      sortable: true,
    },
    {
      key: "jenis_kelamin",
      header: "Jenis Kelamin",
      sortable: true,
      render: (item: any) => {
        const dataStatus = resolveStatus(GENDER_MAP, item.jenis_kelamin);
        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "umur",
      header: "Umur",
      sortable: true,
    },
    {
      key: "tempat_sambung_info",
      header: "Tempat Sambung",
      sortable: false,
      render: (item: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold">{item.nm_daerah || "-"}</span>
          <span className="text-xs font-medium">{item.nm_desa || "-"}</span>
          <span className="text-xs text-gray-500">
            {item.nm_kelompok || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "status_sambung",
      header: "Status Sambung",
      sortable: true,
      render: (item: any) => {
        const dataStatus = resolveStatus(
          STATUS_SAMBUNG_MAP,
          item.status_sambung,
        );
        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "status_pernikahan",
      header: "Status Pernikahan",
      sortable: true,
      render: (item: any) => {
        const dataStatus = resolveStatus(
          STATUS_PERNIKAHAN_MAP,
          item.status_pernikahan,
        );
        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "jenis_data",
      header: "Jenis Data",
      sortable: true,
      render: (item: any) => {
        const dataStatus = resolveStatus(JENIS_DATA_MAP, item.jenis_data);
        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "nm_petugas_input",
      header: "Petugas Input",
      sortable: true,
    },
    {
      key: "created_at",
      header: "Tanggal Dibuat",
      sortable: true,
      render: (item: any) => <div>{formatDateString(item.created_at)}</div>,
    },
  ];

  // Row actions (menu 3 titik)
  const rowActions = [
    { label: "Detail", value: "detail" },
    { label: "Ubah", value: "edit" },
    { label: "QR Code", value: "qrcode" },
    { label: "Cek Presensi", value: "presensi" },
    { label: "Hapus", value: "delete" },
  ];

  const handleRowAction = (item: any, action: string) => {
    switch (action) {
      case "detail":
        DetailDataFetch(item.kode_cari_data, 2);
        break;
      case "edit":
        DetailDataFetch(item.kode_cari_data, 3);
        break;
      case "qrcode":
        DetailDataFetch(item.kode_cari_data, 6);
        break;
      case "presensi":
        DetailDataFetch(item.kode_cari_data, 7);
        break;
      case "delete":
        DetailDataFetch(item.kode_cari_data, 4);
        break;
    }
  };

  document.title = BASE_TITLE + "Data Digital Generus";

  return (
    <>
      <div className="relative md:h-full">
        {isRefetchingSensus && (
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
          {/* Modern Header Card with Gradient */}
          <div className="bg-linear-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header Section */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-2xl text-white tracking-tight">
                      Data Digital Generus
                    </h1>
                    <p className="text-blue-100 text-sm mt-0.5">
                      Kelola dan pantau data digital generus dengan mudah
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-5">
              {/* Search Bar with Modern Design */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  value={filterInput}
                  className="w-full pl-11 pr-4 py-3 text-sm border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Cari berdasarkan Kode, Nama, Daerah, Desa, Kelompok, atau Petugas..."
                  onChange={(e: any) => setFilterInput(e.target.value)}
                  onKeyDown={(e: any) =>
                    e.key === "Enter" && refetchListSensus()
                  }
                />
              </div>

              {/* Action Buttons with Better Layout */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Bulk Delete Button - Only show when rows are selected */}
                {selectedRows.size > 0 && (
                  <div className="flex items-center gap-2 mr-auto">
                    <button
                      disabled={isBulkDeleting}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleBulkDelete}
                    >
                      {isBulkDeleting ? (
                        <>
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
                          <span>Menghapus...</span>
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          <span>Hapus {selectedRows.size} Data</span>
                        </>
                      )}
                    </button>
                    <button
                      disabled={isBulkDeleting}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline disabled:opacity-50"
                      onClick={() => setSelectedRows(new Set())}
                    >
                      Batalkan Pilihan
                    </button>
                  </div>
                )}

                {/* Filter & Reset Group */}
                <div
                  className={`flex items-center gap-2 ${selectedRows.size > 0 ? "" : "mr-auto"}`}
                >
                  <button
                    disabled={isRefetchingSensus}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setOpenFilter(true)}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter Lanjutan</span>
                  </button>
                  <button
                    disabled={isRefetchingSensus}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onResetFilter}
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isRefetchingSensus}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={loadDataRincian}
                  >
                    <File className="w-4 h-4" />
                    <span>Pelaporan</span>
                  </button>
                  <button
                    disabled={isRefetchingSensus}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={loadStatistikGenerus}
                  >
                    <ChartLine className="w-4 h-4" />
                    <span>Statistik</span>
                  </button>
                  <button
                    disabled={isRefetchingSensus}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      navigate("/sensus/create", {
                        state: {
                          balikanLogin: dataLogin,
                          fetchdataDearah: fetchDataDaerah,
                          dataPekerjaan: fetchDataPekerjaan,
                        },
                        replace: true,
                      })
                    }
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah Data</span>
                  </button>
                </div>
              </div>

              {/* Info Badge - Optional: showing active filters count */}
              {(statusSambung ||
                statusPernikahan ||
                statusAtletAsad ||
                statusGender ||
                filterDaerah ||
                filterDesa ||
                filterKelompok ||
                rangeUmurMin ||
                rangeUmurMax) && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                  <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />

                  <span className="font-medium">Filter aktif diterapkan</span>
                  <button
                    onClick={onResetFilter}
                    className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  >
                    Hapus Semua Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Initial loading */}
            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ParticipantSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Data Table */}
            {!loading && (
              <DataTableAdvanced
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                data={dataListSensus?.data || []}
                columns={columns}
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
                getRowId={(item: any) => item.kode_cari_data}
              />
            )}

            {/* Refetch indicator */}
            {isRefetchingSensus && !loading && (
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center animate-pulse">
                Memperbarui data...
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-3 shrink-0">
              <Pagination
                currentPage={dataListSensus?.meta?.current_page || 1}
                lastPage={dataListSensus?.meta?.last_page || 1}
                totalItems={dataListSensus?.meta?.total || 0}
                rowsPerPage={rows}
                onPageChange={(params) => {
                  setPage(params.page + 1);
                  setRows(params.rows);
                }}
                disabled={isRefetchingSensus}
              />
            </div>
          </div>
        </div>
      </div>

      {/* manggil ke component Print preview */}
      <div className="hidden">
        <ReportPdf ref={printRefCetakDataPdf} data={dataLaporanPrint} />
      </div>

      <FilterModal
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        title="Filter Data"
      >
        <SensusFilterPanel
          rangeUmurMin={rangeUmurMin}
          rangeUmurMax={rangeUmurMax}
          setRangeUmurMin={setRangeUmurMin}
          setRangeUmurMax={setRangeUmurMax}
          activeKey={activeKey}
          balikanDataDesa={balikanDataDesa}
          balikanDataKelompok={balikanDataKelompok}
          dataLogin={dataLogin}
          fetchDataDaerah={fetchDataDaerah}
          fetchDesa={fetchDesa}
          fetchKelompok={fetchKelompok}
          setBalikanDataDesa={setBalikanDataDesa}
          setBalikanDataKelompok={setBalikanDataKelompok}
          filterDaerah={filterDaerah}
          filterDesa={filterDesa}
          filterKelompok={filterKelompok}
          setActiveKey={setActiveKey}
          setFilterDaerah={setFilterDaerah}
          setFilterDesa={setFilterDesa}
          setFilterKelompok={setFilterKelompok}
          setStatusAtletAsad={setStatusAtletAsad}
          setStatusGender={setStatusGender}
          setStatusSambung={setStatusSambung}
          setStatusPernikahan={setStatusPernikahan}
          statusAtletAsad={statusAtletAsad}
          statusFilterInfoAtletAsad={STATUS_FILTER_ATLET_ASAD}
          statusFilterInfoGender={STATUS_FILTER_GENDER}
          statusFilterInfoPernikahan={STATUS_FILTER_PERNIKAHAN}
          statusFilterInfoSambung={STATUS_FILTER_SAMBUNG}
          statusGender={statusGender}
          statusPernikahan={statusPernikahan}
          statusSambung={statusSambung}
          resultJenisData={resultJenisData}
          setResultJenisData={setResultJenisData}
          statusFilterJenisData={STATUS_FILTER_JENIS_DATA}
        />
      </FilterModal>

      {/* manggil ke component form Delete */}
      <FilterModal
        open={showModalDelete}
        onClose={handleModalDeleteHide}
        title="Hapus Data"
      >
        <Delete
          fetchData={refetchListSensus}
          onHide={handleModalDeleteHide}
          detailData={userData}
        />
      </FilterModal>

      {/* manggil ke component form Generate QRCODE */}
      <FilterModal
        open={generateQrCode}
        onClose={handleModalQrCodeHide}
        title="Generate QR Code"
      >
        <GenerateQR detailData={userData} />
      </FilterModal>

      <StatistikDashboard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={balikanDataStatistik}
      />
    </>
  );
};

export default SensusPage;
