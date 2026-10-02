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
  fetchUsersSensusOptions,
} from "@/services/sensusService";
import { handleApiError, handleApiResponse } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { BASE_TITLE } from "@/store/actions";
import { toast } from "sonner";
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import { getActionIcon, getActionButtonClass } from "@/components/global/DataTableAdvanced";
import usePermission from "@/hooks/usePermission";
import {
  ChartLine,
  Copy,
  Database,
  File,
  Filter,
  Info,
  PlusCircle,
  RefreshCcw,
  Search,
} from "lucide-react";
import { THEME_COLORS } from "@/config/theme";

interface Option {
  value: string | number;
  label: string;
}

const isAtletAsadActive = (value: unknown) => {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }
  return false;
};

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
  const [printFileName, setPrintFileName] = useState("REKAP_DATA_SENSUS");
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

  const buildUniquePrintFileName = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const milli = String(now.getMilliseconds()).padStart(3, "0");
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `REKAP_DATA_SENSUS_${date}_${time}${milli}_${random}`;
  };

  const handlePrintPdf = useReactToPrint({
    contentRef: printRefCetakDataPdf,
    documentTitle: printFileName,
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
        filterInput,
      });

      handleApiResponse(response, (data) => {
        const printableData = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

        setPrintFileName(buildUniquePrintFileName());
        setDataLaporanPrint(printableData);
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
        filterInput,
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
      fetchUsersSensusOptions(),
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

  const handleCopyKode = async (kode: string | number) => {
    const text = String(kode || "").trim();
    if (!text) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      toast.success("Berhasil", {
        description: `Kode ${text} berhasil disalin`,
        duration: 2000,
      });
    } catch (error) {
      toast.error("Gagal", {
        description: "Kode tidak dapat disalin",
        duration: 2500,
      });
    }
  };

  // Definisi kolom
  const columns: Column<any>[] = [
    {
      key: "kode_cari_data",
      header: "Kode",
      sortable: true,
      bold: true,
      render: (item: any) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyKode(item.kode_cari_data);
          }}
          title="Klik untuk menyalin kode"
        >
          <span>Salin Kode</span>
          <Copy className="h-3.5 w-3.5" />
        </button>
      ),
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
      key: "status_atlet_asad",
      header: "Atlet ASAD",
      sortable: true,
      render: (item: any) => {
        const isAtlet = isAtletAsadActive(item.status_atlet_asad);

        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${isAtlet
              ? "border-green-300 bg-green-100 text-green-800 animate-pulse dark:border-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
          >
            {isAtlet ? "Atlet Aktif" : "Non Atlet"}
          </span>
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

  const { isViewOnly } = usePermission();

  // Row actions (menu 3 titik) — pengurus hanya bisa view
  const rowActions = isViewOnly
    ? [
        { label: "Detail", value: "detail" },
      ]
    : [
        { label: "Detail", value: "detail" },
        { label: "Ubah", value: "edit" },
        { label: "QR Code", value: "qrcode" },
        { label: "Cek Presensi", value: "presensi" },
        { label: "Hapus", value: "delete" },
      ];

  // Custom Card Render for Sensus to match UI mockup
  const customSensusCardRender = (
    item: any,
    actions: Array<{ label: string; value: string }> | undefined,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const initials = item.nama_lengkap
      ? item.nama_lengkap
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
      : "??";

    const isAtlet = isAtletAsadActive(item.status_atlet_asad);
    const genderData = resolveStatus(GENDER_MAP, item.jenis_kelamin);
    const nikahData = resolveStatus(STATUS_PERNIKAHAN_MAP, item.status_pernikahan);
    const sambungData = resolveStatus(STATUS_SAMBUNG_MAP, item.status_sambung);

    return (
      <article
        key={item.kode_cari_data}
        className={`relative flex flex-col rounded-xl border p-4 shadow-sm transition-all duration-300 ${isAtlet
            ? "bg-gradient-to-br from-green-50/60 via-white to-red-50/60 dark:from-green-900/10 dark:via-gray-900 dark:to-red-900/10 border-green-200/80 dark:border-green-800/50 shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)] dark:shadow-[0_0_15px_-3px_rgba(34,197,94,0.05)] ring-1 ring-green-500/20 dark:ring-green-500/10"
            : "bg-white dark:bg-gray-900 border-gray-100 hover:border-gray-200 hover:shadow-md dark:border-gray-800"
          } ${isSelected
            ? "!border-blue-500 ring-2 ring-blue-500 dark:!border-blue-400 dark:ring-blue-400"
            : ""
          }`}
      >
        {/* Glow effect for Atlet */}
        {isAtlet && (
          <>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-red-500 rounded-t-xl" />
            <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-sm border-2 border-white dark:border-gray-900"></span>
            </div>
          </>
        )}
        {/* Top Section */}
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="pt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400"
              />
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {item.nama_lengkap || "-"}
              </h3>
              <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                {item.nm_daerah} {item.nm_desa ? `• ${item.nm_desa}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-3 h-px w-full bg-gray-100 dark:bg-gray-800" />

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          {/* Kode Data */}
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Kode Data</p>
            <div className="mt-1 flex items-center gap-1">
              <span className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                {item.kode_cari_data}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyKode(item.kode_cari_data); }}
                className="text-gray-400 hover:text-blue-500"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Umur */}
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Umur</p>
            <p className="mt-1 truncate text-xs font-medium text-gray-900 dark:text-gray-100">
              {item.umur} Tahun
            </p>
          </div>

          {/* Gender / Nikah */}
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Gender / Nikah</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <StatusTableBadge label={genderData.text} color={genderData.color} />
              <StatusTableBadge label={nikahData.text} color={nikahData.color} />
            </div>
          </div>

          {/* Status Sambung */}
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Status Sambung</p>
            <div className="mt-1">
              <StatusTableBadge label={sambungData.text} color={sambungData.color} />
            </div>
          </div>

          {/* Status Atlet */}
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Status Atlet</p>
            <div className="mt-1">
              <span
                className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium transition-all ${isAtlet
                    ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/20"
                    : "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
              >
                {isAtlet && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
                {isAtlet ? "Atlet Aktif" : "Non Atlet"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons at the Bottom */}
        {actions && actions.length > 0 && (
          <>
            <div className="mt-4 mb-3 h-px w-full bg-gray-100 dark:bg-gray-800" />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {actions.map((action) => {
                const ActionIcon = getActionIcon(action.value);
                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRowAction(item, action.value); }}
                    className={`${getActionButtonClass(action.value)} !h-auto !w-auto !rounded-lg flex items-center justify-center gap-1.5 px-2.5 py-1.5 hover:shadow-sm`}
                    title={action.label}
                  >
                    <ActionIcon className="h-4 w-4" />
                    <span className="text-[10px] font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </article>
    );
  };

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

        <div className="flex flex-col gap-6 h-full">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sensus Data
            </h1>
            <div className="flex items-center gap-2">
              <button
                disabled={isRefetchingSensus}
                onClick={loadDataRincian}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <File className="h-4 w-4" />
                <span>Pelaporan</span>
              </button>
              {!isViewOnly && (
                <button
                  disabled={isRefetchingSensus}
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
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Tambah Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Statistic Cards Computed from dataListSensus */}
          {/* {(() => {
            const listData = dataListSensus?.data || [];
            const totalSensus = dataListSensus?.meta?.total || 0;
            const aktif = listData.filter((item: any) => String(item.status_sambung) === "1").length;
            const lakiLaki = listData.filter((item: any) => String(item.jenis_kelamin).toUpperCase() === "LAKI-LAKI").length;
            const perempuan = listData.filter((item: any) => String(item.jenis_kelamin).toUpperCase() === "PEREMPUAN").length;

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Data</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{totalSensus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <ChartLine className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Aktif (Hal. Ini)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{aktif}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                    <ChartLine className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Laki-Laki (Hal. Ini)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{lakiLaki}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
                    <ChartLine className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Perempuan (Hal. Ini)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{perempuan}</p>
                  </div>
                </div>
              </div>
            );
          })()} */}

          {/* Search & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                disabled={isRefetchingSensus}
                onClick={loadStatistikGenerus}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <ChartLine className="h-4 w-4" />
                <span className="hidden sm:inline">Statistik</span>
              </button>

              {selectedRows.size > 0 && !isViewOnly && (
                <button
                  disabled={isBulkDeleting}
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                  onClick={handleBulkDelete}
                >
                  {isBulkDeleting ? (
                    <span className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                  ) : (
                    <span className="flex items-center gap-1">Hapus {selectedRows.size} Data</span>
                  )}
                </button>
              )}
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  value={filterInput}
                  onChange={(e: any) => setFilterInput(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && refetchListSensus()}
                  placeholder="Cari Sensus..."
                  className="w-full rounded-lg border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                />
              </div>
              <button
                disabled={isRefetchingSensus}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setOpenFilter(true)}
                title="Filter Lanjutan"
              >
                <Filter className="h-4 w-4" />
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 sm:py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="font-medium">Filter aktif diterapkan</span>
                </div>
                <button
                  onClick={onResetFilter}
                  className="sm:ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                >
                  Hapus Semua Filter
                </button>
              </div>
            )}

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
                alwaysCardView={true}
                gridCols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                customCardRender={customSensusCardRender}
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
