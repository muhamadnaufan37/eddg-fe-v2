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

  const defaultPetugasId = 40;

  const loadDaerahOptions = async () => {
    const daerah = await fetchOptions(
      "/api/v1/daerah/all",
      "data_tempat_sambung",
      "nama_daerah",
    );
    setDaerahOptions(daerah);
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

    if (form.usia_mode === "single" && !form.usia_operator) {
      return "Operator usia wajib dipilih untuk mode single";
    }

    if (form.usia_mode === "range" && !form.usia_max) {
      return "Usia maksimum wajib diisi untuk mode range";
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

    const payload = {
      nama_kegiatan: form.nama_kegiatan.trim(),
      tmpt_kegiatan: form.tmpt_kegiatan.trim(),
      type_kegiatan: form.type_kegiatan.trim(),
      tgl_kegiatan: form.tgl_kegiatan,
      jam_kegiatan: form.jam_kegiatan,
      expired_date_time: toApiDateTime(form.expired_date_time),
      category: form.category.trim(),
      usia_mode: form.usia_mode,
      usia_min: form.usia_min,
      ...(form.usia_mode === "single"
        ? { usia_operator: form.usia_operator }
        : {}),
      ...(form.usia_mode === "range" ? { usia_max: form.usia_max } : {}),
      tmpt_daerah: form.tmpt_daerah,
      metode_presensi: form.metode_presensi,
      daerah_ids: form.daerah_ids.map(Number).filter(Number.isInteger),
      desa_ids: form.desa_ids.map(Number).filter(Number.isInteger),
      kelompok_ids: form.kelompok_ids.map(Number).filter(Number.isInteger),
      ...(form.tmpt_desa ? { tmpt_desa: form.tmpt_desa } : {}),
      ...(form.tmpt_kelompok ? { tmpt_kelompok: form.tmpt_kelompok } : {}),
      add_by_petugas: defaultPetugasId,
    } as any;

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
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={titleForm}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">
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
            <label className="text-xs font-medium mb-1 block">
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
            <label className="text-xs font-medium mb-1 block">
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
            <label className="text-xs font-medium mb-1 block">Kategori</label>
            <Input
              value={form.category}
              className="w-full text-xs"
              placeholder="Contoh: mumi"
              onChange={(e: any) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
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
            <label className="text-xs font-medium mb-1 block">
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
            <label className="text-xs font-medium mb-1 block">
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
              Expired Date Time
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

          <div>
            <label className="text-xs font-medium mb-1 block">Daerah</label>
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
            <label className="text-xs font-medium mb-1 block">Desa</label>
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
            <label className="text-xs font-medium mb-1 block">Kelompok</label>
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

          <div>
            <label className="text-xs font-medium mb-1 block">
              Daerah Tambahan
            </label>
            <select
              multiple
              value={form.daerah_ids}
              className="h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  daerah_ids: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
            >
              {daerahOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Desa Tambahan
            </label>
            <select
              multiple
              value={form.desa_ids}
              className="h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  desa_ids: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
            >
              {desaOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium mb-1 block">
              Kelompok Tambahan
            </label>
            <select
              multiple
              value={form.kelompok_ids}
              className="h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  kelompok_ids: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
            >
              {kelompokOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
            onClick={() => {
              setShowFormModal(false);
              resetForm();
            }}
          >
            Batal
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs rounded-lg ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText}`}
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
        onClose={() => setShowDetailModal(false)}
        title="Detail Presensi Kegiatan"
      >
        {detailData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold">Kode:</span>{" "}
              {detailData.kode_kegiatan}
            </div>
            <div>
              <span className="font-semibold">Nama:</span>{" "}
              {detailData.nama_kegiatan}
            </div>
            <div>
              <span className="font-semibold">Tempat:</span>{" "}
              {detailData.tmpt_kegiatan}
            </div>
            <div>
              <span className="font-semibold">Tipe:</span>{" "}
              {detailData.type_kegiatan}
            </div>
            <div>
              <span className="font-semibold">Tanggal:</span>{" "}
              {detailData.tgl_kegiatan}
            </div>
            <div>
              <span className="font-semibold">Jam:</span>{" "}
              {detailData.jam_kegiatan}
            </div>
            <div>
              <span className="font-semibold">Expired:</span>{" "}
              {detailData.expired_date_time}
            </div>
            <div>
              <span className="font-semibold">Kategori:</span>{" "}
              {detailData.category}
            </div>
            <div>
              <span className="font-semibold">Mode Usia:</span>{" "}
              {detailData.usia_mode}
            </div>
            <div>
              <span className="font-semibold">Operator:</span>{" "}
              {detailData.usia_operator || "-"}
            </div>
            <div>
              <span className="font-semibold">Usia Min:</span>{" "}
              {detailData.usia_min ?? "-"}
            </div>
            <div>
              <span className="font-semibold">Usia Max:</span>{" "}
              {detailData.usia_max ?? "-"}
            </div>
            <div>
              <span className="font-semibold">Daerah:</span>{" "}
              {detailData.nm_daerah || "-"}
            </div>
            <div>
              <span className="font-semibold">Desa:</span>{" "}
              {detailData.nm_desa || "-"}
            </div>
            <div>
              <span className="font-semibold">Kelompok:</span>{" "}
              {detailData.nm_kelompok || "-"}
            </div>
            <div>
              <span className="font-semibold">Petugas:</span>{" "}
              {detailData.petugas || "-"}
            </div>
            <div>
              <span className="font-semibold">Total Presensi:</span>{" "}
              {detailData.total_presensi || 0}
            </div>
            <div>
              <span className="font-semibold">Total Hadir:</span>{" "}
              {detailData.total_hadir || 0}
            </div>
            <div>
              <span className="font-semibold">Total Terlambat:</span>{" "}
              {detailData.total_terlambat || 0}
            </div>
            <div>
              <span className="font-semibold">Total Tidak Hadir:</span>{" "}
              {detailData.total_tidak_hadir || 0}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Data detail tidak tersedia.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700"
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
