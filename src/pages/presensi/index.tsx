import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/features/Pagination";
import FilterModal from "@/pages/digital-data/sensus/components/FilterModal";
import { Input } from "@/components/global";
import { BASE_TITLE } from "@/store/actions";
import { THEME_COLORS } from "@/config/theme";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import { getLocalStorage } from "@/services/localStorageService";
import {
  fetchDesaByDaerah,
  fetchKelompokByDesa,
} from "@/services/sensusService";
import {
  createPresensiKegiatan,
  deletePresensiKegiatan,
  fetchDetailPresensiKegiatan,
  fetchPresensiKegiatanData,
  type PresensiKegiatanItem,
  type MetodePresensi,
  type UpsertPresensiKegiatanPayload,
  updatePresensiKegiatan,
} from "@/services/presensiKegiatanService";
import { handleApiError } from "@/utils/errorUtils";
import CalendarEventsView from "./CalendarEventsView";
import { Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";

type Option = {
  value: string | number;
  label: string;
};

const CATEGORY_OPTIONS = [
  "sensus",
  "cai",
  "mumi",
  "remaja",
  "praremaja",
  "caberawit",
];

type FormState = {
  nama_kegiatan: string;
  tmpt_kegiatan: string;
  type_kegiatan: string;
  tgl_kegiatan: string;
  jam_kegiatan: string;
  expired_date_time: string;
  category: string;
  usia_mode: "single" | "range";
  usia_operator: string;
  usia_min: string;
  usia_max: string;
  tmpt_daerah: string;
  tmpt_desa: string;
  tmpt_kelompok: string;
  metode_presensi: MetodePresensi;
  daerah_ids: string[];
  desa_ids: string[];
  kelompok_ids: string[];
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const normalized = value.replace(" ", "T");
  return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
};

const toApiDateTime = (value: string) => {
  if (!value) return "";
  const withSpace = value.replace("T", " ");
  return withSpace.length === 16 ? `${withSpace}:00` : withSpace;
};

const PresensiKegiatanPage = () => {
  const dataLogin = getLocalStorage("userData");
  const navigate = useNavigate();
  const { fetchOptions } = useFetchOptions();

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(100);
  const [search, setSearch] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<PresensiKegiatanItem | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [daerahOptions, setDaerahOptions] = useState<Option[]>([]);
  const [desaOptions, setDesaOptions] = useState<Option[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<Option[]>([]);
  const [targetDesaOptions, setTargetDesaOptions] = useState<Option[]>([]);
  const [targetKelompokOptions, setTargetKelompokOptions] = useState<Option[]>(
    [],
  );

  const [form, setForm] = useState<FormState>({
    nama_kegiatan: "",
    tmpt_kegiatan: "",
    type_kegiatan: "DAERAH",
    tgl_kegiatan: "",
    jam_kegiatan: "",
    expired_date_time: "",
    category: "",
    usia_mode: "single",
    usia_operator: ">=",
    usia_min: "",
    usia_max: "",
    tmpt_daerah: "",
    tmpt_desa: "",
    tmpt_kelompok: "",
    metode_presensi: "both",
    daerah_ids: [],
    desa_ids: [],
    kelompok_ids: [],
  });

  const defaultPetugasId = String(dataLogin?.user?.id || "");

  const loadDaerahOptions = async () => {
    const [daerah, targetDesa] = await Promise.all([
      fetchOptions("/api/v1/daerah/all", "data_tempat_sambung", "nama_daerah"),
      fetchOptions("/api/v1/desa/all", "data_tempat_sambung", "nama_desa"),
    ]);
    setDaerahOptions(daerah);
    setTargetDesaOptions(targetDesa);
  };

  const loadDesaOptions = async (daerahId: string) => {
    if (!daerahId) {
      setDesaOptions([]);
      return;
    }

    const response = await fetchDesaByDaerah(daerahId);
    if (Array.isArray(response?.data_tempat_sambung)) {
      setDesaOptions(
        response.data_tempat_sambung.map((item: any) => ({
          value: item.id,
          label: item.nama_desa,
        })),
      );
      return;
    }

    setDesaOptions([]);
  };

  const loadKelompokOptions = async (desaId: string) => {
    if (!desaId) {
      setKelompokOptions([]);
      return;
    }

    const response = await fetchKelompokByDesa(desaId);
    if (Array.isArray(response?.data_tempat_sambung)) {
      setKelompokOptions(
        response.data_tempat_sambung.map((item: any) => ({
          value: item.id,
          label: item.nama_kelompok,
        })),
      );
      return;
    }

    setKelompokOptions([]);
  };

  const loadTargetKelompokOptions = async (
    desaIds: string[],
    selectedGroupIds: string[] = form.kelompok_ids,
  ) => {
    if (desaIds.length === 0) {
      setTargetKelompokOptions([]);
      setForm((previous) => ({ ...previous, kelompok_ids: [] }));
      return;
    }

    const responses = await Promise.all(
      desaIds.map((desaId) => fetchKelompokByDesa(desaId)),
    );
    const optionsById = new Map<string, Option>();

    responses.forEach((response) => {
      response?.data_tempat_sambung?.forEach((item: any) => {
        optionsById.set(String(item.id), {
          value: item.id,
          label: item.nama_kelompok,
        });
      });
    });

    const options = Array.from(optionsById.values());
    const availableIds = new Set(options.map((option) => String(option.value)));
    setTargetKelompokOptions(options);
    setForm((previous) => ({
      ...previous,
      kelompok_ids: selectedGroupIds.filter((id) => availableIds.has(id)),
    }));
  };

  const toggleTargetId = (
    field: "daerah_ids" | "desa_ids" | "kelompok_ids",
    id: string,
  ) => {
    const currentIds = form[field];
    const nextIds = currentIds.includes(id)
      ? currentIds.filter((currentId) => currentId !== id)
      : [...currentIds, id];

    setForm((previous) => ({ ...previous, [field]: nextIds }));
    if (field === "desa_ids") {
      void loadTargetKelompokOptions(nextIds, form.kelompok_ids);
    }
  };

  useEffect(() => {
    loadDaerahOptions();
  }, []);

  const {
    data: listData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["presensi-kegiatan", page, rows, search],
    queryFn: () =>
      fetchPresensiKegiatanData({
        page,
        rows,
        search,
      }),
    refetchOnWindowFocus: false,
  });

  const resetForm = () => {
    setForm({
      nama_kegiatan: "",
      tmpt_kegiatan: "",
      type_kegiatan: "DAERAH",
      tgl_kegiatan: "",
      jam_kegiatan: "",
      expired_date_time: "",
      category: "",
      usia_mode: "single",
      usia_operator: ">=",
      usia_min: "",
      usia_max: "",
      tmpt_daerah: "",
      tmpt_desa: "",
      tmpt_kelompok: "",
      metode_presensi: "both",
      daerah_ids: [],
      desa_ids: [],
      kelompok_ids: [],
    });
    setDesaOptions([]);
    setKelompokOptions([]);
    setTargetKelompokOptions([]);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openDetailModal = async (idValue: number) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchDetailPresensiKegiatan(idValue);
      if (!response.success) {
        toast.error("Error", {
          description:
            response.message || "Gagal memuat detail presensi kegiatan",
          duration: 3000,
        });
        return;
      }

      setDetailData(response.data);
      setShowDetailModal(true);
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openEditModal = async (idValue: number) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchDetailPresensiKegiatan(idValue);
      if (!response.success) {
        toast.error("Error", {
          description:
            response.message || "Gagal memuat detail presensi kegiatan",
          duration: 3000,
        });
        return;
      }

      const data = response.data;
      setEditingId(data.id);
      setForm({
        nama_kegiatan: data.nama_kegiatan || "",
        tmpt_kegiatan: data.tmpt_kegiatan || "",
        type_kegiatan: data.type_kegiatan || "DAERAH",
        tgl_kegiatan: data.tgl_kegiatan || "",
        jam_kegiatan: data.jam_kegiatan || "",
        expired_date_time: toInputDateTime(data.expired_date_time),
        category: data.category || "",
        usia_mode: data.usia_mode === "range" ? "range" : "single",
        usia_operator: data.usia_operator || ">=",
        usia_min:
          data.usia_min !== null && data.usia_min !== undefined
            ? String(data.usia_min)
            : "",
        usia_max:
          data.usia_max !== null && data.usia_max !== undefined
            ? String(data.usia_max)
            : "",
        tmpt_daerah: data.kd_daerah ? String(data.kd_daerah) : "",
        tmpt_desa: data.kd_desa ? String(data.kd_desa) : "",
        tmpt_kelompok: data.kd_kelompok ? String(data.kd_kelompok) : "",
        metode_presensi: data.metode_presensi || "both",
        daerah_ids: (data.daerah_ids || []).map(String),
        desa_ids: (data.desa_ids || []).map(String),
        kelompok_ids: (data.kelompok_ids || []).map(String),
      });

      await loadTargetKelompokOptions(
        (data.desa_ids || []).map(String),
        (data.kelompok_ids || []).map(String),
      );

      if (data.kd_daerah) {
        await loadDesaOptions(String(data.kd_daerah));
      } else {
        setDesaOptions([]);
      }

      if (data.kd_desa) {
        await loadKelompokOptions(String(data.kd_desa));
      } else {
        setKelompokOptions([]);
      }

      setShowFormModal(true);
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (idValue: number) => {
    const ok = window.confirm("Apakah Anda yakin ingin menghapus data ini?");
    if (!ok) return;

    try {
      await deletePresensiKegiatan(idValue);
      toast.success("Berhasil", {
        description: "Presensi kegiatan berhasil dihapus",
        duration: 3000,
      });
      refetch();
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const validateForm = () => {
    if (!form.nama_kegiatan.trim()) return "Nama kegiatan wajib diisi";
    if (!form.tmpt_kegiatan.trim()) return "Tempat kegiatan wajib diisi";
    if (!form.type_kegiatan.trim()) return "Tipe kegiatan wajib diisi";
    if (!form.tgl_kegiatan) return "Tanggal kegiatan wajib diisi";
    if (!form.jam_kegiatan) return "Jam kegiatan wajib diisi";
    if (!form.expired_date_time) return "Expired date time wajib diisi";
    if (!form.category.trim()) return "Kategori wajib diisi";
    if (!form.tmpt_daerah) return "Daerah wajib dipilih";
    if (!form.usia_min) return "Usia minimum wajib diisi";
    if (!defaultPetugasId) return "Akun petugas tidak teridentifikasi";
    if (!Number.isInteger(Number(form.usia_min)) || Number(form.usia_min) < 0) {
      return "Usia minimum harus berupa bilangan bulat non-negatif";
    }

    if (form.usia_mode === "single" && !form.usia_operator) {
      return "Operator usia wajib dipilih untuk mode single";
    }

    if (form.usia_mode === "range" && !form.usia_max) {
      return "Usia maksimum wajib diisi untuk mode range";
    }
    if (
      form.usia_mode === "range" &&
      (!Number.isInteger(Number(form.usia_max)) ||
        Number(form.usia_max) < Number(form.usia_min))
    ) {
      return "Usia maksimum harus bilangan bulat dan tidak lebih kecil dari usia minimum";
    }

    return null;
  };

  const handleSubmit = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      toast.warning("Validasi", {
        description: errorMessage,
        duration: 3000,
      });
      return;
    }

    const payload: UpsertPresensiKegiatanPayload = {
      nama_kegiatan: form.nama_kegiatan.trim(),
      tmpt_kegiatan: form.tmpt_kegiatan.trim(),
      type_kegiatan: form.type_kegiatan.trim(),
      tgl_kegiatan: form.tgl_kegiatan,
      jam_kegiatan: form.jam_kegiatan,
      expired_date_time: toApiDateTime(form.expired_date_time),
      category: form.category.trim(),
      usia_mode: form.usia_mode,
      usia_min: Number(form.usia_min),
      ...(form.usia_mode === "single"
        ? { usia_operator: form.usia_operator }
        : {}),
      ...(form.usia_mode === "range"
        ? { usia_max: Number(form.usia_max) }
        : {}),
      tmpt_daerah: Number(form.tmpt_daerah),
      metode_presensi: form.metode_presensi,
      daerah_ids: form.daerah_ids.map(Number).filter(Number.isInteger),
      desa_ids: form.desa_ids.map(Number).filter(Number.isInteger),
      kelompok_ids: form.kelompok_ids.map(Number).filter(Number.isInteger),
      ...(form.tmpt_desa ? { tmpt_desa: Number(form.tmpt_desa) } : {}),
      ...(form.tmpt_kelompok
        ? { tmpt_kelompok: Number(form.tmpt_kelompok) }
        : {}),
      add_by_petugas: Number(defaultPetugasId),
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updatePresensiKegiatan(editingId, payload);
        toast.success("Berhasil", {
          description: "Presensi kegiatan berhasil diperbarui",
          duration: 3000,
        });
      } else {
        await createPresensiKegiatan(payload);
        toast.success("Berhasil", {
          description: "Presensi kegiatan berhasil dibuat",
          duration: 3000,
        });
      }

      setShowFormModal(false);
      resetForm();
      refetch();
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowAction = (item: PresensiKegiatanItem, action: string) => {
    const kegiatanKey = String(item.kode_kegiatan || item.id || "");
    const idKegiatan = String(item.id || "");

    if (action === "presensi") {
      if (!kegiatanKey) {
        toast.error("Error", {
          description: "Kode kegiatan tidak ditemukan",
          duration: 3000,
        });
        return;
      }
      navigate(`/presensi/peserta/${idKegiatan}/${item.kode_kegiatan}`);
      return;
    }

    if (action === "list") {
      if (!kegiatanKey) {
        toast.error("Error", {
          description: "Kode kegiatan tidak ditemukan",
          duration: 3000,
        });
        return;
      }
      navigate(`/presensi/list/${idKegiatan}/${item.kode_kegiatan}`);
      return;
    }

    if (action === "detail") {
      openDetailModal(item.id);
      return;
    }

    if (action === "edit") {
      openEditModal(item.id);
      return;
    }

    if (action === "delete") {
      handleDelete(item.id);
    }
  };

  const handleReset = () => {
    setPage(1);
    setRows(100);
    setSearch("");
  };

  const titleForm = useMemo(
    () => (editingId ? "Ubah Presensi Kegiatan" : "Tambah Presensi Kegiatan"),
    [editingId],
  );

  const detailFields = detailData
    ? [
        { label: "Kode Kegiatan", value: detailData.kode_kegiatan },
        { label: "Nama Kegiatan", value: detailData.nama_kegiatan },
        { label: "Tipe", value: detailData.type_kegiatan },
        { label: "Tanggal", value: detailData.tgl_kegiatan },
        { label: "Jam", value: detailData.jam_kegiatan },
        { label: "Batas Presensi", value: detailData.expired_date_time },
        { label: "Kategori", value: detailData.category },
        { label: "Metode Presensi", value: detailData.metode_presensi },
        { label: "Mode Usia", value: detailData.usia_mode },
        { label: "Operator Usia", value: detailData.usia_operator },
        { label: "Usia Minimum", value: detailData.usia_min },
        { label: "Usia Maksimum", value: detailData.usia_max },
        { label: "Petugas", value: detailData.petugas },
      ]
    : [];
  const venueFields = detailData
    ? [
        { label: "Tempat Acara", value: detailData.tmpt_kegiatan },
        {
          label: "Daerah Venue",
          value: detailData.nm_daerah || detailData.kd_daerah,
        },
        {
          label: "Desa Venue",
          value: detailData.nm_desa || detailData.kd_desa,
        },
        {
          label: "Kelompok Venue",
          value: detailData.nm_kelompok || detailData.kd_kelompok,
        },
      ]
    : [];
  const targetFields = detailData
    ? [
        {
          label: "ID Daerah Sasaran",
          value: detailData.daerah_ids?.join(", ") || "-",
        },
        {
          label: "ID Desa Sasaran",
          value: detailData.desa_ids?.join(", ") || "-",
        },
        {
          label: "ID Kelompok Sasaran",
          value: detailData.kelompok_ids?.join(", ") || "-",
        },
      ]
    : [];

  document.title = BASE_TITLE + "Presensi Kegiatan";

  return (
    <>
      <div className="relative md:h-full">
        {(isFetching || isLoadingDetail || isSubmitting) && (
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

        <div className="flex min-w-0 flex-col gap-4">
          <CalendarEventsView
            events={listData?.data || []}
            isFetching={isFetching}
            isLoadingDetail={isLoadingDetail}
            isSubmitting={isSubmitting}
            search={search}
            onSearchChange={(value) => {
              setPage(1);
              setSearch(value);
            }}
            onRefresh={() => refetch()}
            onReset={handleReset}
            onCreate={openCreateModal}
            onAction={handleRowAction}
          />
          {(listData?.meta?.last_page || 1) > 1 && (
            <Pagination
              currentPage={listData?.meta?.current_page || 1}
              lastPage={listData?.meta?.last_page || 1}
              totalItems={listData?.meta?.total || 0}
              rowsPerPage={rows}
              onPageChange={(params) => {
                setPage(params.page + 1);
                setRows(params.rows);
              }}
              disabled={isFetching}
            />
          )}
        </div>
      </div>

      <FilterModal
        open={showFormModal}
        size="xl"
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={titleForm}
      >
        <div className="grid grid-cols-1 gap-4 text-gray-900 md:grid-cols-2 xl:grid-cols-3 dark:text-gray-100">
          <div className="border-b border-gray-200 pb-2 md:col-span-2 xl:col-span-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold">Informasi kegiatan</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Waktu, kategori peserta, dan aturan keikutsertaan.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Nama Kegiatan
            </label>
            <Input
              value={form.nama_kegiatan}
              className="w-full text-xs"
              placeholder="Masukkan nama kegiatan"
              onChange={(e: any) =>
                setForm((prev) => ({ ...prev, nama_kegiatan: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Tempat Kegiatan
            </label>
            <Input
              value={form.tmpt_kegiatan}
              className="w-full text-xs"
              placeholder="Masukkan tempat kegiatan"
              onChange={(e: any) =>
                setForm((prev) => ({ ...prev, tmpt_kegiatan: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Tipe Kegiatan
            </label>
            <select
              value={form.type_kegiatan}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type_kegiatan: e.target.value }))
              }
            >
              <option value="DAERAH">DAERAH</option>
              <option value="DESA">DESA</option>
              <option value="KELOMPOK">KELOMPOK</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Kategori
            </label>
            <select
              value={form.category}
              className="min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
            >
              <option value="">Pilih kategori</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Metode Presensi
            </label>
            <select
              value={form.metode_presensi}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  metode_presensi: e.target.value as MetodePresensi,
                }))
              }
            >
              <option value="both">Tapping dan Manual</option>
              <option value="tapping">Tapping saja</option>
              <option value="manual">Manual saja</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Tanggal Kegiatan
            </label>
            <Input
              type="date"
              value={form.tgl_kegiatan}
              className="w-full text-xs"
              onChange={(e: any) =>
                setForm((prev) => ({ ...prev, tgl_kegiatan: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Jam Kegiatan
            </label>
            <Input
              type="time"
              step="1"
              value={form.jam_kegiatan}
              className="w-full text-xs"
              onChange={(e: any) =>
                setForm((prev) => ({ ...prev, jam_kegiatan: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium mb-1 block">
              Batas Waktu Presensi
            </label>
            <Input
              type="datetime-local"
              value={form.expired_date_time}
              className="w-full text-xs"
              onChange={(e: any) =>
                setForm((prev) => ({
                  ...prev,
                  expired_date_time: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Mode Usia</label>
            <select
              value={form.usia_mode}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  usia_mode: e.target.value as "single" | "range",
                  usia_operator:
                    e.target.value === "single"
                      ? prev.usia_operator || ">="
                      : "",
                  usia_max: e.target.value === "range" ? prev.usia_max : "",
                }))
              }
            >
              <option value="single">single</option>
              <option value="range">range</option>
            </select>
          </div>

          {form.usia_mode === "single" && (
            <div>
              <label className="text-xs font-medium mb-1 block">
                Operator Usia
              </label>
              <select
                value={form.usia_operator}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    usia_operator: e.target.value,
                  }))
                }
              >
                <option value=">=">&gt;=</option>
                <option value=">">&gt;</option>
                <option value="<=">&lt;=</option>
                <option value="<">&lt;</option>
                <option value="=">=</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1 block">Usia Min</label>
            <Input
              type="number"
              min={0}
              value={form.usia_min}
              className="w-full text-xs"
              onChange={(e: any) =>
                setForm((prev) => ({ ...prev, usia_min: e.target.value }))
              }
            />
          </div>

          {form.usia_mode === "range" && (
            <div>
              <label className="text-xs font-medium mb-1 block">Usia Max</label>
              <Input
                type="number"
                min={0}
                value={form.usia_max}
                className="w-full text-xs"
                onChange={(e: any) =>
                  setForm((prev) => ({ ...prev, usia_max: e.target.value }))
                }
              />
            </div>
          )}

          <div className="border-b border-gray-200 pb-2 md:col-span-2 xl:col-span-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold">Venue kegiatan</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lokasi acara sebagai titik pusat untuk verifikasi radius presensi.
              Bagian ini bukan daftar peserta yang boleh hadir.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
              Daerah venue
            </label>
            <select
              value={form.tmpt_daerah}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
              onChange={async (e) => {
                const value = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  tmpt_daerah: value,
                  tmpt_desa: "",
                  tmpt_kelompok: "",
                }));
                setKelompokOptions([]);
                await loadDesaOptions(value);
              }}
            >
              <option value="">Pilih daerah</option>
              {daerahOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Desa venue</label>
            <select
              value={form.tmpt_desa}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
              onChange={async (e) => {
                const value = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  tmpt_desa: value,
                  tmpt_kelompok: "",
                }));
                await loadKelompokOptions(value);
              }}
            >
              <option value="">Pilih desa (opsional)</option>
              {desaOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium mb-1 block">
              Kelompok venue
            </label>
            <select
              value={form.tmpt_kelompok}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tmpt_kelompok: e.target.value }))
              }
            >
              <option value="">Pilih kelompok (opsional)</option>
              {kelompokOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border-b border-gray-200 pb-2 md:col-span-2 xl:col-span-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold">Sasaran peserta</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pilih wilayah peserta yang boleh mengikuti kegiatan. Sasaran ini
              terpisah dari venue dan boleh mencakup beberapa lokasi.
            </p>
          </div>
          <div>
            <fieldset>
              <legend className="text-xs font-medium">Daerah sasaran</legend>
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-gray-300 p-2 dark:border-gray-700">
                {daerahOptions.map((option) => {
                  const id = String(option.value);
                  return (
                    <label
                      key={id}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={form.daerah_ids.includes(id)}
                        onChange={() => toggleTargetId("daerah_ids", id)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600 dark:border-gray-600"
                      />
                      <span className="wrap-break-word">{option.label}</span>
                    </label>
                  );
                })}
                {daerahOptions.length === 0 && (
                  <p className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                    Opsi daerah belum tersedia.
                  </p>
                )}
              </div>
            </fieldset>
          </div>

          <div>
            <fieldset>
              <legend className="text-xs font-medium">Desa sasaran</legend>
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-gray-300 p-2 dark:border-gray-700">
                {targetDesaOptions.map((option) => {
                  const id = String(option.value);
                  return (
                    <label
                      key={id}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={form.desa_ids.includes(id)}
                        onChange={() => toggleTargetId("desa_ids", id)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600 dark:border-gray-600"
                      />
                      <span className="wrap-break-word">{option.label}</span>
                    </label>
                  );
                })}
                {targetDesaOptions.length === 0 && (
                  <p className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                    Opsi desa belum tersedia.
                  </p>
                )}
              </div>
            </fieldset>
          </div>

          <div className="md:col-span-2">
            <fieldset>
              <legend className="text-xs font-medium">Kelompok sasaran</legend>
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-md border border-gray-300 p-2 dark:border-gray-700">
                {targetKelompokOptions.map((option) => {
                  const id = String(option.value);
                  return (
                    <label
                      key={id}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={form.kelompok_ids.includes(id)}
                        onChange={() => toggleTargetId("kelompok_ids", id)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600 dark:border-gray-600"
                      />
                      <span className="wrap-break-word">{option.label}</span>
                    </label>
                  );
                })}
                {form.desa_ids.length === 0 && (
                  <p className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                    Pilih desa sasaran untuk memuat kelompok.
                  </p>
                )}
                {form.desa_ids.length > 0 &&
                  targetKelompokOptions.length === 0 && (
                    <p className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                      Tidak ada opsi kelompok untuk desa sasaran yang dipilih.
                    </p>
                  )}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="min-h-10 w-full rounded-lg border border-gray-300 px-4 py-2 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-200 sm:w-auto"
            onClick={() => {
              setShowFormModal(false);
              resetForm();
            }}
          >
            Batal
          </button>
          <button
            type="button"
            className={`min-h-10 w-full rounded-lg px-4 py-2 text-xs ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} sm:w-auto`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {editingId ? (
              <span className="inline-flex items-center gap-1">
                <Pencil className="h-3.5 w-3.5" /> Simpan Perubahan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <PlusCircle className="h-3.5 w-3.5" /> Simpan
              </span>
            )}
          </button>
        </div>
      </FilterModal>

      <FilterModal
        open={showDetailModal}
        size="xl"
        onClose={() => setShowDetailModal(false)}
        title="Detail Presensi Kegiatan"
      >
        {detailData ? (
          <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              {[
                { label: "Total Presensi", value: detailData.total_presensi },
                { label: "Hadir", value: detailData.count_hadir },
                { label: "Terlambat", value: detailData.count_terlambat },
                { label: "Izin", value: detailData.count_izin },
                { label: "Sakit", value: detailData.count_sakit },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/60"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {stat.value || 0}
                  </p>
                </div>
              ))}
            </div>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                Informasi kegiatan
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {detailFields.map((field) => (
                  <div
                    key={field.label}
                    className="min-w-0 rounded-md border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {field.label}
                    </p>
                    <p className="mt-1 wrap-break-word text-sm font-medium">
                      {field.value ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <h3 className="text-xs font-semibold uppercase text-emerald-900 dark:text-emerald-200">
                Venue / titik lokasi acara
              </h3>
              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                Lokasi yang menjadi pusat verifikasi radius presensi.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {venueFields.map((field) => (
                  <div
                    key={field.label}
                    className="min-w-0 rounded-md border border-emerald-200 bg-white p-3 dark:border-emerald-900 dark:bg-gray-900"
                  >
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {field.label}
                    </p>
                    <p className="mt-1 wrap-break-word text-sm font-medium text-gray-900 dark:text-gray-100">
                      {field.value ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-md border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-900 dark:bg-sky-950/30">
              <h3 className="text-xs font-semibold uppercase text-sky-900 dark:text-sky-200">
                Sasaran peserta
              </h3>
              <p className="mt-1 text-xs text-sky-800 dark:text-sky-300">
                ID wilayah yang diizinkan mengikuti kegiatan, terpisah dari
                venue.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {targetFields.map((field) => (
                  <div
                    key={field.label}
                    className="min-w-0 rounded-md border border-sky-200 bg-white p-3 dark:border-sky-900 dark:bg-gray-900"
                  >
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {field.label}
                    </p>
                    <p className="mt-1 wrap-break-word text-sm font-medium text-gray-900 dark:text-gray-100">
                      {field.value ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Data detail tidak tersedia.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="min-h-10 w-full rounded-lg border border-gray-300 px-4 py-2 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-200 sm:w-auto"
            onClick={() => setShowDetailModal(false)}
          >
            Tutup
          </button>
        </div>
      </FilterModal>
    </>
  );
};

export default PresensiKegiatanPage;
