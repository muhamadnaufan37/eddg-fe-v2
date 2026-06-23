import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, Formik, ErrorMessage, useField } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  AlertTriangle,
  Copy,
  Database,
  Download,
  Filter,
  ImageIcon,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataTableAdvanced,
  Input,
  type Column,
  Button,
  Card,
  Label,
  Modal,
  Select,
} from "@/components/global";
import Pagination from "@/components/features/Pagination";
import { getLocalStorage } from "@/services/localStorageService";
import { BASE_TITLE } from "@/store/actions";
import { handleApiError } from "@/utils/errorUtils";
import {
  createObjectPreviewUrl,
  resolvePreviewUrl,
} from "@/utils/previewUtils";
import {
  bulkDeleteCaiData,
  createCaiData,
  deleteCaiData,
  fetchCaiData,
  fetchCaiDetail,
  fetchCaiReportPdf,
  fetchDaerahOptions,
  fetchDesaOptionsByDaerah,
  fetchKelompokOptionsByDesa,
  updateCaiData,
  type CaiDetailData,
  type CaiFormValues,
  type CaiListItem,
  type CaiOption,
} from "@/services/caiService";

type ModalMode = "create" | "update";

const UTUSAN_OPTIONS: CaiOption[] = [
  { label: "Keimaman / 4S", value: "keimaman/4s" },
  { label: "Organisasi", value: "organisasi" },
  { label: "MT", value: "mt" },
  { label: "Panitia / PPG", value: "panitia_ppg" },
  { label: "Utusan Desa", value: "utusan_desa" },
  { label: "Utusan Kelompok", value: "utusan_kelompok" },
  { label: "Pondok", value: "pondok" },
];

const SIZE_TSHIRT_OPTIONS: CaiOption[] = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "2XL", label: "2XL" },
  { value: "3XL", label: "3XL" },
  { value: "4XL", label: "4XL" },
];

const JENIS_KELAMIN_OPTIONS: CaiOption[] = [
  { value: "LAKI-LAKI", label: "LAKI-LAKI" },
  { value: "PEREMPUAN", label: "PEREMPUAN" },
];

const createEmptyFormValues = (akses: {
  daerah: string;
  desa: string;
  kelompok: string;
}): CaiFormValues => ({
  id_card: "",
  nama_lengkap: "",
  tgl_lahir: "",
  jenis_kelamin: "",
  tmpt_daerah: akses.daerah,
  tmpt_desa: akses.desa,
  tmpt_kelompok: akses.kelompok,
  utusan: "",
  img: null,
});

const getGenderBadgeClass = (jenisKelamin: string) =>
  jenisKelamin === "LAKI-LAKI"
    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
    : "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800";

const getActiveBadgeClass = (isActive: boolean) =>
  isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
    : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

const formatDate = (date?: string) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy", { locale: id });
};

const getPreviewFallback = (jenisKelamin?: string) =>
  jenisKelamin === "LAKI-LAKI"
    ? "/assets/empty-img-sensus-male.svg"
    : "/assets/empty-img-sensus-female.svg";

const PDF_FILENAME_REGEX = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i;

const CaiPage = () => {
  const dataLogin = getLocalStorage("userData");
  const accessDaerah = dataLogin?.user?.akses_daerah || "";
  const accessDesa = dataLogin?.user?.akses_desa || "";
  const accessKelompok = dataLogin?.user?.akses_kelompok || "";

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filterDaerah, setFilterDaerah] = useState(accessDaerah);
  const [filterDesa, setFilterDesa] = useState(accessDesa);
  const [filterKelompok, setFilterKelompok] = useState(accessKelompok);
  const [filterTshirt, setFilterTshirt] = useState("");
  const [daerahOptions, setDaerahOptions] = useState<CaiOption[]>([]);
  const [desaOptions, setDesaOptions] = useState<CaiOption[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<CaiOption[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>("create");
  const [selectedRecord, setSelectedRecord] = useState<CaiListItem | null>(
    null,
  );
  const [detailData, setDetailData] = useState<CaiDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState("");
  const [imagePreviewTitle, setImagePreviewTitle] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const activeDaerah = accessDaerah || filterDaerah;
  const activeDesa = accessDesa || filterDesa;
  const activeKelompok = accessKelompok || filterKelompok;
  const activeTshirt = filterTshirt;

  const listQuery = useQuery({
    queryKey: [
      "cai-list",
      page,
      perPage,
      search,
      activeDaerah,
      activeDesa,
      activeKelompok,
      activeTshirt,
    ],
    queryFn: () =>
      fetchCaiData({
        page,
        perPage,
        search,
        tmptDaerah: activeDaerah,
        tmptDesa: activeDesa,
        tmptKelompok: activeKelompok,
        sizeTshirt: activeTshirt,
      }),
    refetchOnWindowFocus: false,
  });

  const listData = listQuery.data?.data || [];
  const paginationMeta = listQuery.data?.meta;

  const initialFormValues = useMemo(() => {
    const fallback = createEmptyFormValues({
      daerah: accessDaerah,
      desa: accessDesa,
      kelompok: accessKelompok,
    });

    if (!selectedRecord) return fallback;

    return {
      id_card: selectedRecord.id_card || "",
      nama_lengkap: selectedRecord.nama_lengkap || "",
      tgl_lahir: selectedRecord.tgl_lahir || "",
      jenis_kelamin: selectedRecord.jenis_kelamin || "",
      tmpt_daerah: selectedRecord.kd_daerah || accessDaerah,
      tmpt_desa: selectedRecord.kd_desa || accessDesa,
      tmpt_kelompok: selectedRecord.kd_kelompok || accessKelompok,
      utusan: selectedRecord.utusan || "",
      size_tshirt: selectedRecord.size_tshirt || "",
      img: null,
    };
  }, [accessDaerah, accessDesa, accessKelompok, selectedRecord]);

  useEffect(() => {
    const loadDaerah = async () => {
      const options = await fetchDaerahOptions();
      setDaerahOptions(options);
    };

    loadDaerah();
  }, []);

  useEffect(() => {
    const loadDesa = async () => {
      if (!activeDaerah) {
        setDesaOptions([]);
        return;
      }

      const options = await fetchDesaOptionsByDaerah(String(activeDaerah));
      setDesaOptions(options);
    };

    loadDesa();
  }, [activeDaerah]);

  useEffect(() => {
    const loadKelompok = async () => {
      if (!activeDesa) {
        setKelompokOptions([]);
        return;
      }

      const options = await fetchKelompokOptionsByDesa(String(activeDesa));
      setKelompokOptions(options);
    };

    loadKelompok();
  }, [activeDesa]);

  useEffect(() => {
    document.title = `${BASE_TITLE}Data CAI`;
  }, []);

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setFilterDaerah(accessDaerah);
    setFilterDesa(accessDesa);
    setFilterKelompok(accessKelompok);
    setFilterTshirt("");
  };

  const openCreateModal = () => {
    setSelectedRecord(null);
    setFormMode("create");
    setIsFormLoading(false);
    setShowFormModal(true);
  };

  const openUpdateModal = async (item: CaiListItem) => {
    setSelectedRecord(null);
    setFormMode("update");
    setShowFormModal(true);
    setIsFormLoading(true);

    try {
      const response = await fetchCaiDetail(item.uuid);
      if (response?.success) {
        setSelectedRecord(response.data);
      } else {
        toast.error("Gagal", {
          description: response?.message || "Gagal memuat detail data",
          duration: 3000,
        });
      }
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setIsFormLoading(false);
    }
  };

  const openDetailModal = async (item: CaiListItem) => {
    setIsDetailLoading(true);
    try {
      const response = await fetchCaiDetail(item.uuid);
      if (response?.success) {
        setDetailData(response.data);
        setIsDetailOpen(true);
      } else {
        toast.error("Gagal", {
          description: response?.message || "Gagal memuat detail data",
          duration: 3000,
        });
      }
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openImagePreview = (
    src?: string | null,
    title?: string,
    jenisKelamin?: string,
  ) => {
    const previewSrc =
      resolvePreviewUrl(src) || getPreviewFallback(jenisKelamin);
    setImagePreviewSrc(previewSrc);
    setImagePreviewTitle(title || "Preview Foto");
    setShowImagePreview(true);
  };

  const handleDeleteSingle = async (item: CaiListItem) => {
    const confirmed = window.confirm(`Hapus data ${item.nama_lengkap}?`);
    if (!confirmed) return;

    try {
      const response = await deleteCaiData(item.uuid);
      if (response?.success === false) {
        throw new Error(response?.message || "Gagal menghapus data");
      }

      toast.success("Berhasil", {
        description: response?.message || "Data berhasil dihapus",
        duration: 3000,
      });

      listQuery.refetch();
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(item.uuid);
        return next;
      });
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      toast.warning("Peringatan", {
        description: "Pilih minimal satu data untuk dihapus",
        duration: 3000,
      });
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedRows.size} data terpilih?`,
    );

    if (!confirmed) return;

    try {
      const response = await bulkDeleteCaiData(Array.from(selectedRows));
      if (response?.success === false) {
        throw new Error(response?.message || "Gagal menghapus data");
      }

      toast.success("Berhasil", {
        description: response?.message || "Data berhasil dihapus",
        duration: 3000,
      });

      setSelectedRows(new Set());
      listQuery.refetch();
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    }
  };

  const handleSubmitForm = async (values: CaiFormValues) => {
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "img") return;
      if (value === null || value === undefined || value === "") return;
      formData.append(key, String(value));
    });

    if (values.img instanceof File) {
      formData.append("img", values.img);
    }

    try {
      const response =
        formMode === "create"
          ? await createCaiData(formData)
          : await updateCaiData(String(selectedRecord?.uuid || ""), formData);

      if (response?.success === false) {
        throw new Error(response?.message || "Gagal menyimpan data");
      }

      toast.success("Berhasil", {
        description: response?.message || "Data berhasil disimpan",
        duration: 3000,
      });

      setShowFormModal(false);
      setSelectedRecord(null);
      listQuery.refetch();
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<CaiListItem>[] = [
    {
      key: "kode_cari_data",
      header: "Kode",
      sortable: true,
      bold: true,
      render: (item) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(item.kode_cari_data);
            toast.success("Berhasil", {
              description: "Kode berhasil disalin",
              duration: 1500,
            });
          }}
          title="Klik untuk menyalin kode"
        >
          <span>{item.kode_cari_data}</span>
          <Copy className="h-3.5 w-3.5" />
        </button>
      ),
    },
    {
      key: "id_card",
      header: "ID Card",
      sortable: true,
      bold: true,
      render: (item) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(item.id_card);
            toast.success("Berhasil", {
              description: "Kode berhasil disalin",
              duration: 1500,
            });
          }}
          title="Klik untuk menyalin kode"
        >
          <span>{item.id_card}</span>
          <Copy className="h-3.5 w-3.5" />
        </button>
      ),
    },
    {
      key: "nama_lengkap",
      header: "Nama Lengkap",
      sortable: true,
      bold: true,
    },
    {
      key: "tgl_lahir",
      header: "Tgl Lahir",
      sortable: true,
      render: (item) => <span>{formatDate(item.tgl_lahir)}</span>,
    },
    {
      key: "jenis_kelamin",
      header: "Jenis Kelamin",
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getGenderBadgeClass(
            item.jenis_kelamin,
          )}`}
        >
          {item.jenis_kelamin || "-"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Aktif",
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getActiveBadgeClass(
            item.is_active,
          )}`}
        >
          {item.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "tempat_sambung",
      header: "Tempat CAI",
      sortable: false,
      mobileHidden: true,
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {item.nm_daerah || "-"}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {item.nm_desa || "-"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.nm_kelompok || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "utusan",
      header: "Utusan",
      sortable: true,
      render: (item) => (
        <span className="capitalize">
          {UTUSAN_OPTIONS.find((option) => option.value === item.utusan)
            ?.label || "-"}
        </span>
      ),
    },
    {
      key: "size_tshirt",
      header: "Ukuran T-Shirt",
      sortable: true,
      render: (item) => (
        <span className="capitalize">{item.size_tshirt || "-"}</span>
      ),
    },
    {
      key: "img_url",
      header: "Foto",
      sortable: false,
      render: (item) => {
        const previewSrc =
          resolvePreviewUrl(item.img_url) ||
          getPreviewFallback(item.jenis_kelamin);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openImagePreview(
                item.img_url,
                item.nama_lengkap,
                item.jenis_kelamin,
              );
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <img
              src={previewSrc}
              alt={item.nama_lengkap}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span>Lihat Foto</span>
          </button>
        );
      },
    },
    {
      key: "created_at",
      header: "Dibuat",
      sortable: true,
      mobileHidden: true,
      render: (item) => <span>{formatDate(item.created_at)}</span>,
    },
  ];

  const rowActions = [
    { label: "Detail", value: "detail" },
    { label: "Ubah", value: "edit" },
    { label: "Hapus", value: "delete" },
  ];

  const handleRowAction = (item: CaiListItem, action: string) => {
    switch (action) {
      case "detail":
        openDetailModal(item);
        break;
      case "edit":
        openUpdateModal(item);
        break;
      case "delete":
        handleDeleteSingle(item);
        break;
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);

    try {
      const { blob, contentDisposition } = await fetchCaiReportPdf({
        page,
        perPage,
        search,
        tmptDaerah: activeDaerah,
        tmptDesa: activeDesa,
        tmptKelompok: activeKelompok,
        sizeTshirt: activeTshirt,
      });

      let filename = `peserta-cai-${new Date().toISOString().split("T")[0]}.pdf`;

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

  return (
    <div className="relative md:h-full">
      {listQuery.isFetching && (
        <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-[1px]">
          <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            Memuat data...
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        <Card className="overflow-hidden border border-gray-200 shadow-lg dark:border-gray-700">
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-cyan-900 px-4 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Data CAI
                </h1>
                <p className="text-sm text-cyan-100">
                  Kelola data CAI, filter, upload foto, dan preview gambar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-3">
              <div className="relative sm:col-span-2 xl:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, kode, utusan, daerah, desa, atau kelompok..."
                  className="pl-10"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select
                  label="Daerah"
                  isClearable
                  placeholder="Semua daerah"
                  options={daerahOptions}
                  value={
                    daerahOptions.find(
                      (option) => String(option.value) === String(activeDaerah),
                    ) || null
                  }
                  onChange={(option: any) => {
                    setPage(1);
                    setFilterDaerah(option?.value || "");
                    setFilterDesa("");
                    setFilterKelompok("");
                  }}
                  isDisabled={Boolean(accessDaerah)}
                />

                <Select
                  label="Desa"
                  isClearable
                  placeholder="Semua desa"
                  options={desaOptions}
                  value={
                    desaOptions.find(
                      (option) => String(option.value) === String(activeDesa),
                    ) || null
                  }
                  onChange={(option: any) => {
                    setPage(1);
                    setFilterDesa(option?.value || "");
                    setFilterKelompok("");
                  }}
                  isDisabled={Boolean(accessDesa) || !activeDaerah}
                />

                <Select
                  label="Kelompok"
                  isClearable
                  placeholder="Semua kelompok"
                  options={kelompokOptions}
                  value={
                    kelompokOptions.find(
                      (option) =>
                        String(option.value) === String(activeKelompok),
                    ) || null
                  }
                  onChange={(option: any) => {
                    setPage(1);
                    setFilterKelompok(option?.value || "");
                  }}
                  isDisabled={Boolean(accessKelompok) || !activeDesa}
                />

                <Select
                  label="T-Shirt"
                  isClearable
                  placeholder="Semua ukuran T-Shirt"
                  options={SIZE_TSHIRT_OPTIONS}
                  value={
                    SIZE_TSHIRT_OPTIONS.find(
                      (option) => String(option.value) === String(activeTshirt),
                    ) || null
                  }
                  onChange={(option: any) => {
                    setPage(1);
                    setFilterTshirt(option?.value || "");
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-end">
              <div className="grid w-full grid-cols-1 gap-2 items-center sm:flex sm:w-auto sm:flex-wrap">
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setPage(1)}
                >
                  Terapkan Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={openCreateModal}
                >
                  Tambah Data
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={handleDownloadPdf}
                  disabled={
                    isDownloadingPdf ||
                    !listData.length ||
                    listQuery.isFetching ||
                    Boolean(listQuery.error)
                  }
                >
                  Unduh PDF
                </Button>
              </div>

              {selectedRows.size > 0 && (
                <div className="sm:ml-auto flex w-full flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="font-medium">
                    {selectedRows.size} data dipilih
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Terpilih
                  </Button>
                  <button
                    type="button"
                    className="text-xs font-medium underline self-start sm:self-auto"
                    onClick={() => setSelectedRows(new Set())}
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <DataTableAdvanced
          data={listData}
          columns={columns}
          rowActions={rowActions}
          onRowAction={handleRowAction}
          selectable
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          getRowId={(item) => item.uuid}
          disabled={listQuery.isFetching}
        />

        <Pagination
          currentPage={paginationMeta?.current_page || 1}
          lastPage={paginationMeta?.last_page || 1}
          totalItems={paginationMeta?.total || 0}
          rowsPerPage={perPage}
          rowsOptions={[10, 25, 50, 100]}
          onPageChange={(params) => {
            setPage(params.page + 1);
            setPerPage(params.rows);
          }}
          disabled={listQuery.isFetching}
        />
      </div>

      <CaiFormModal
        isOpen={showFormModal}
        mode={formMode}
        initialValues={initialFormValues}
        initialImageUrl={resolvePreviewUrl(selectedRecord?.img_url) || ""}
        daerahOptions={daerahOptions}
        accessDaerah={accessDaerah}
        accessDesa={accessDesa}
        accessKelompok={accessKelompok}
        onClose={() => {
          setShowFormModal(false);
          setSelectedRecord(null);
          setIsFormLoading(false);
        }}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        isLoading={isFormLoading}
        onPreviewImage={openImagePreview}
      />

      <CaiDetailModal
        isOpen={isDetailOpen}
        isLoading={isDetailLoading}
        detailData={detailData}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailData(null);
        }}
        onPreviewImage={openImagePreview}
      />

      <Modal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        title={imagePreviewTitle}
        size="xl"
      >
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <img
              src={imagePreviewSrc}
              alt={imagePreviewTitle}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImagePreview(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {isDetailLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-lg dark:bg-gray-900 dark:text-white">
            Memuat detail...
          </div>
        </div>
      )}
    </div>
  );
};

const FormikSelectField = ({
  name,
  label,
  options,
  required = false,
  placeholder = "Pilih data",
  isDisabled = false,
  onChangeExtra,
}: {
  name: string;
  label: string;
  options: CaiOption[];
  required?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
  onChangeExtra?: (value: string) => void;
}) => {
  const [field, meta, helpers] = useField(name);

  return (
    <Select
      label={label}
      required={required}
      isClearable
      placeholder={placeholder}
      isDisabled={isDisabled}
      options={options}
      value={
        options.find(
          (option) => String(option.value) === String(field.value),
        ) || null
      }
      onChange={(option: any) => {
        const nextValue = option?.value || "";
        helpers.setValue(nextValue);
        onChangeExtra?.(String(nextValue));
      }}
      onBlur={() => helpers.setTouched(true)}
      error={meta.touched && meta.error ? String(meta.error) : undefined}
    />
  );
};

const FormikInputField = ({
  name,
  type = "text",
  placeholder,
}: {
  name: string;
  type?: string;
  placeholder?: string;
}) => {
  const [field, meta] = useField(name);

  return (
    <Input
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.touched && meta.error ? String(meta.error) : undefined}
    />
  );
};

const CaiFormModal = ({
  isOpen,
  mode,
  initialValues,
  initialImageUrl,
  daerahOptions,
  accessDaerah,
  accessDesa,
  accessKelompok,
  onClose,
  onSubmit,
  isSubmitting,
  isLoading,
  onPreviewImage,
}: {
  isOpen: boolean;
  mode: ModalMode;
  initialValues: CaiFormValues;
  initialImageUrl: string;
  daerahOptions: CaiOption[];
  accessDaerah: string;
  accessDesa: string;
  accessKelompok: string;
  onClose: () => void;
  onSubmit: (values: CaiFormValues) => Promise<void>;
  isSubmitting: boolean;
  isLoading: boolean;
  onPreviewImage: (
    src?: string | null,
    title?: string,
    jenisKelamin?: string,
  ) => void;
}) => {
  const validationSchema = Yup.object().shape({
    nama_lengkap: Yup.string().required("Nama lengkap harus diisi"),
    tgl_lahir: Yup.string().required("Tanggal lahir harus diisi"),
    jenis_kelamin: Yup.string()
      .oneOf(["LAKI-LAKI", "PEREMPUAN"], "Jenis kelamin tidak valid")
      .required("Jenis kelamin harus diisi"),
    tmpt_daerah: Yup.string().required("Daerah harus diisi"),
    utusan: Yup.string().required("Utusan harus diisi"),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Tambah Data CAI" : "Ubah Data CAI"}
      size="xl"
    >
      <div className="relative">
        {isLoading && mode === "update" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-gray-950/70">
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              Memuat detail data...
            </div>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={onSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-5">
              <CaiCascadeFields
                values={values}
                setFieldValue={setFieldValue}
                daerahOptions={daerahOptions}
                accessDaerah={accessDaerah}
                accessDesa={accessDesa}
                accessKelompok={accessKelompok}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nama_lengkap" required>
                    Nama Lengkap
                  </Label>
                  <FormikInputField
                    name="nama_lengkap"
                    placeholder="Nama lengkap"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_card">ID Card</Label>
                  <FormikInputField name="id_card" placeholder="ID Card" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tgl_lahir" required>
                    Tanggal Lahir
                  </Label>
                  <FormikInputField name="tgl_lahir" type="date" />
                </div>

                <div className="space-y-2">
                  <FormikSelectField
                    name="jenis_kelamin"
                    label="Jenis Kelamin"
                    required
                    placeholder="Pilih jenis kelamin"
                    options={JENIS_KELAMIN_OPTIONS}
                  />
                </div>

                <div className="space-y-2">
                  <FormikSelectField
                    name="utusan"
                    label="Utusan"
                    required
                    placeholder="Pilih utusan"
                    options={UTUSAN_OPTIONS}
                  />
                </div>

                <div className="space-y-2">
                  <FormikSelectField
                    name="size_tshirt"
                    label="Ukuran T-Shirt"
                    required
                    placeholder="Pilih ukuran T-Shirt"
                    options={SIZE_TSHIRT_OPTIONS}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="img">Foto</Label>
                <input
                  id="img"
                  name="img"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] || null;
                    setFieldValue("img", file);
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-700 dark:text-gray-300"
                />
                {values.img instanceof File ? (
                  <div className="text-xs text-gray-500">{values.img.name}</div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  <ImageIcon className="h-4 w-4" />
                  Preview Foto
                </div>

                <button
                  type="button"
                  className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-3 text-left hover:border-cyan-500 dark:border-gray-600 dark:bg-gray-900"
                  onClick={() =>
                    onPreviewImage(
                      values.img instanceof File
                        ? createObjectPreviewUrl(values.img)
                        : initialImageUrl ||
                            getPreviewFallback(values.jenis_kelamin),
                      values.nama_lengkap || "Preview Foto",
                      values.jenis_kelamin,
                    )
                  }
                >
                  <img
                    src={
                      values.img instanceof File
                        ? createObjectPreviewUrl(values.img)
                        : initialImageUrl ||
                          getPreviewFallback(values.jenis_kelamin)
                    }
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Klik untuk melihat preview
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Foto yang dipilih atau placeholder default.
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
};

const CaiCascadeFields = ({
  values,
  setFieldValue,
  daerahOptions,
  accessDaerah,
  accessDesa,
  accessKelompok,
}: {
  values: CaiFormValues;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  daerahOptions: CaiOption[];
  accessDaerah: string;
  accessDesa: string;
  accessKelompok: string;
}) => {
  const [desaOptions, setDesaOptions] = useState<CaiOption[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<CaiOption[]>([]);

  useEffect(() => {
    const loadDesa = async () => {
      if (!values.tmpt_daerah) {
        setDesaOptions([]);
        if (!accessDesa) {
          setFieldValue("tmpt_desa", "", false);
          setFieldValue("tmpt_kelompok", "", false);
        }
        return;
      }

      const options = await fetchDesaOptionsByDaerah(
        String(values.tmpt_daerah),
      );
      setDesaOptions(options);

      if (
        !options.some(
          (option) => String(option.value) === String(values.tmpt_desa),
        )
      ) {
        setFieldValue("tmpt_desa", accessDesa || "", false);
        setFieldValue("tmpt_kelompok", accessKelompok || "", false);
      }
    };

    loadDesa();
  }, [accessDesa, accessKelompok, setFieldValue, values.tmpt_daerah]);

  useEffect(() => {
    const loadKelompok = async () => {
      if (!values.tmpt_desa) {
        setKelompokOptions([]);
        if (!accessKelompok) {
          setFieldValue("tmpt_kelompok", "", false);
        }
        return;
      }

      const options = await fetchKelompokOptionsByDesa(
        String(values.tmpt_desa),
      );
      setKelompokOptions(options);

      if (
        !options.some(
          (option) => String(option.value) === String(values.tmpt_kelompok),
        )
      ) {
        setFieldValue("tmpt_kelompok", accessKelompok || "", false);
      }
    };

    loadKelompok();
  }, [accessKelompok, setFieldValue, values.tmpt_desa, values.tmpt_kelompok]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FormikSelectField
        name="tmpt_daerah"
        label="Daerah"
        required
        placeholder="Pilih daerah"
        options={daerahOptions}
        isDisabled={Boolean(accessDaerah)}
        onChangeExtra={() => {
          setFieldValue("tmpt_desa", "", false);
          setFieldValue("tmpt_kelompok", "", false);
        }}
      />

      <FormikSelectField
        name="tmpt_desa"
        label="Desa"
        placeholder="Pilih desa"
        options={desaOptions}
        isDisabled={!values.tmpt_daerah || Boolean(accessDesa)}
        onChangeExtra={() => {
          setFieldValue("tmpt_kelompok", "", false);
        }}
      />

      <FormikSelectField
        name="tmpt_kelompok"
        label="Kelompok"
        placeholder="Pilih kelompok"
        options={kelompokOptions}
        isDisabled={!values.tmpt_desa || Boolean(accessKelompok)}
      />
    </div>
  );
};

const CaiDetailModal = ({
  isOpen,
  isLoading,
  detailData,
  onClose,
  onPreviewImage,
}: {
  isOpen: boolean;
  isLoading: boolean;
  detailData: CaiDetailData | null;
  onClose: () => void;
  onPreviewImage: (
    src?: string | null,
    title?: string,
    jenisKelamin?: string,
  ) => void;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Data CAI" size="xl">
      {isLoading ? (
        <div className="flex items-center gap-3 py-6 text-sm text-gray-600 dark:text-gray-300">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          Memuat detail...
        </div>
      ) : detailData ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row">
            <button
              type="button"
              onClick={() =>
                onPreviewImage(
                  detailData.img_url,
                  detailData.nama_lengkap,
                  detailData.jenis_kelamin,
                )
              }
              className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            >
              <img
                src={
                  resolvePreviewUrl(detailData.img_url) ||
                  getPreviewFallback(detailData.jenis_kelamin)
                }
                alt={detailData.nama_lengkap}
                className="h-40 w-40 object-cover"
              />
            </button>

            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <DetailField label="Kode" value={detailData.kode_cari_data} />
              <DetailField label="ID Card" value={detailData.id_card} />
              <DetailField
                label="Nama Lengkap"
                value={detailData.nama_lengkap}
              />
              <DetailField
                label="Tanggal Lahir"
                value={formatDate(detailData.tgl_lahir)}
              />
              <DetailField label="Umur" value={`${detailData.umur} tahun`} />
              <DetailField
                label="Jenis Kelamin"
                value={detailData.jenis_kelamin}
              />
              <DetailField
                label="Status Aktif"
                value={detailData.is_active ? "Aktif" : "Nonaktif"}
              />
              <DetailField label="Daerah" value={detailData.nm_daerah} />
              <DetailField label="Desa" value={detailData.nm_desa} />
              <DetailField label="Kelompok" value={detailData.nm_kelompok} />
              <DetailField
                label="Utusan"
                value={
                  UTUSAN_OPTIONS.find(
                    (option) => option.value === detailData.utusan,
                  )?.label || "-"
                }
              />
              <DetailField
                label="Ukuran T-Shirt"
                value={detailData.size_tshirt}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Data tidak tersedia.
        </div>
      )}
    </Modal>
  );
};

const DetailField = ({ label, value }: { label: string; value?: string }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
    <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
      {value || "-"}
    </div>
  </div>
);

export default CaiPage;
