import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/features/Pagination";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import { handleApiError } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { BASE_TITLE } from "@/store/actions";
import { toast } from "sonner";
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import {
  Filter,
  Info,
  PlusCircle,
  RefreshCcw,
  Search,
  Workflow,
} from "lucide-react";
import { THEME_COLORS } from "@/config/theme";
import Delete from "./modal/Delete";
import FilterModal from "@/pages/digital-data/sensus/components/FilterModal";
import ParticipantSkeleton from "@/pages/digital-data/sensus/components/ParticipantSkeleton";
import StatusTableBadge from "@/components/features/StatusTableBadge";
import {
  fetchDesaData,
  fetchDetailDesa,
} from "@/services/tempatSambungServices";
import { resolveStatus, STATUS_TEMPAT_SAMBUNG_MAP } from "@/constants";
import DaerahFilterPanel from "./components/DaerahFilterPanel";

interface Option {
  value: string | number;
  label: string;
}

const DesaPage = () => {
  const { fetchOptions, loading } = useFetchOptions();
  const hasFetched = useRef(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [filterInput, setFilterInput] = useState("");
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [userData, setUserData] = useState(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [fetchDataDaerah, setFetchDataDaerah] = useState<Option[]>([]);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      return await fetchDesaData({
        page,
        rows,
        filterInput,
        status,
      });
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const {
    data: dataListDesa,
    isFetching: isRefetchingDesa,
    refetch: refetchListDesa,
  } = useQuery({
    queryKey: ["dataListDesa", page, rows],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  const loadAllData = async () => {
    const [daerah] = await Promise.all([
      fetchOptions("/api/v1/daerah/all", "data_tempat_sambung", "nama_daerah"),
    ]);

    setFetchDataDaerah(daerah);
  };

  const onResetFilter = () => {
    setPage(1);
    setRows(10);
    setFilterInput("");
    setStatus("");
  };

  useEffect(() => {
    const isAnyFilterEmpty =
      filterInput === "" || status === "" || status === null;

    if (isAnyFilterEmpty) {
      refetchListDesa();
    }
  }, [filterInput, status]);

  const DetailDataFetch = async (Kode: any, visibilityOption: any) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchDetailDesa(Kode);

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
        fetchdataDearah: fetchDataDaerah,
      };

      switch (visibilityOption) {
        case 2:
          navigate("/master-data/tempat-sambung/desa/detail", {
            state: navigationState,
            replace: true,
          });
          break;
        case 3:
          navigate("/master-data/tempat-sambung/desa/update", {
            state: navigationState,
            replace: true,
          });
          break;
        case 4:
          setShowModalDelete(true);
          break;
      }
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDateString = (date: any) => {
    if (!date) return ""; // Handle jika tanggal tidak tersedia
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  // Definisi kolom
  const columns: Column<any>[] = [
    {
      key: "nama_desa",
      header: "Nama Desa",
      sortable: true,
    },
    {
      key: "data_daerah.nama_daerah",
      header: "Asal Daerah",
      sortable: true,
      render: (item: any) => {
        return <div>{item.data_daerah?.nama_daerah || "-"}</div>;
      },
    },
    {
      key: "latitude",
      header: "Latitude",
      sortable: true,
    },
    {
      key: "longitude",
      header: "Longitude",
      sortable: true,
    },
    {
      key: "alamat",
      header: "Alamat",
      sortable: true,
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (item: any) => {
        const dataStatus = resolveStatus(
          STATUS_TEMPAT_SAMBUNG_MAP,
          item.is_active,
        );
        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "created_at",
      header: "Tanggal Dibuat",
      sortable: true,
      render: (item: any) => <div>{formatDateString(item.created_at)}</div>,
    },
  ];

  // Row actions (menu 3 titik) - conditional based on user status
  const rowActions = (item: any) => {
    const actions = [
      { label: "Detail", value: "detail" },
      { label: "Ubah", value: "edit" },
      { label: "Delete", value: "delete" },
    ];

    return actions;
  };

  const handleRowAction = (item: any, action: string) => {
    switch (action) {
      case "detail":
        DetailDataFetch(item.id, 2);
        break;
      case "edit":
        DetailDataFetch(item.id, 3);
        break;
      case "delete":
        DetailDataFetch(item.id, 4);
        break;
    }
  };

  const handleModalDeleteHide = () => {
    setShowModalDelete(false);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      loadAllData();
      hasFetched.current = true;
    }
  }, []);

  document.title = BASE_TITLE + "Desa Management";

  return (
    <>
      <div className="relative md:h-full">
        {(isRefetchingDesa || isLoadingDetail) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 backdrop-blur-xs">
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
            <p className={`mt-3 text-sm ${THEME_COLORS.text.secondary}`}>
              {isLoadingDetail ? "Memuat detail..." : "Memperbarui data..."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-5 h-full">
          {/* Modern Header Card with Gradient */}
          <div
            className={`${THEME_COLORS.background.card} rounded-2xl shadow-lg border ${THEME_COLORS.border.default} overflow-hidden`}
          >
            {/* Header Section */}
            <div className={`${THEME_COLORS.active.background} px-6 py-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Workflow className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-2xl text-white tracking-tight">
                      Desa Management
                    </h1>
                    <p className="text-white/80 text-sm mt-0.5">
                      Kelola dan pantau data desa dengan mudah
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-5">
              {/* Search Bar with Modern Design */}
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${THEME_COLORS.text.muted}`}
                >
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  value={filterInput}
                  className={`w-full pl-11 pr-4 py-3 text-sm border ${THEME_COLORS.border.default} rounded-xl shadow-sm focus:ring-2 ${THEME_COLORS.focus.ring} focus:border-transparent transition-all ${THEME_COLORS.background.input} ${THEME_COLORS.text.primary}`}
                  placeholder="Cari berdasarkan nama desa..."
                  onChange={(e: any) => setFilterInput(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && refetchListDesa()}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter & Reset Group */}
                  <div
                    className={`flex items-center gap-2 ${selectedRows.size > 0 ? "" : "mr-auto"}`}
                  >
                    <button
                      disabled={isRefetchingDesa}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${THEME_COLORS.background.card} border-2 ${THEME_COLORS.border.default} rounded-lg ${THEME_COLORS.hover.item} transition-all disabled:opacity-50 disabled:cursor-not-allowed ${THEME_COLORS.text.secondary}`}
                      onClick={() => setOpenFilter(true)}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filter Lanjutan</span>
                    </button>
                    <button
                      disabled={isRefetchingDesa}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onResetFilter}
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isRefetchingDesa}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() =>
                      navigate("/master-data/tempat-sambung/desa/create", {
                        state: {
                          fetchdataDearah: fetchDataDaerah,
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
              {status && (
                <div
                  className={`flex items-center gap-2 text-xs ${THEME_COLORS.text.secondary} bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800`}
                >
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
                data={dataListDesa?.data || []}
                columns={columns}
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
                getRowId={(item: any) => item.id}
                disabled={isLoadingDetail}
              />
            )}

            {/* Refetch indicator */}
            {isRefetchingDesa && !loading && (
              <div
                className={`text-xs ${THEME_COLORS.text.muted} text-center animate-pulse`}
              >
                Memperbarui data...
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-3 shrink-0">
              <Pagination
                currentPage={dataListDesa?.meta?.current_page || 1}
                lastPage={dataListDesa?.meta?.last_page || 1}
                totalItems={dataListDesa?.meta?.total || 0}
                rowsPerPage={rows}
                onPageChange={(params) => {
                  setPage(params.page + 1);
                  setRows(params.rows);
                }}
                disabled={isRefetchingDesa}
              />
            </div>
          </div>
        </div>
      </div>

      <FilterModal
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        title="Filter Data"
      >
        <DaerahFilterPanel
          status={status}
          setStatus={setStatus}
          statusOptions={[
            { value: "", label: "Semua Status" },
            { value: 1, label: "Aktif" },
            { value: "0", label: "Tidak Aktif" },
          ]}
        />
      </FilterModal>

      {/* manggil ke component form Delete */}
      <FilterModal
        open={showModalDelete}
        onClose={handleModalDeleteHide}
        title="Hapus Data"
      >
        <Delete
          fetchData={refetchListDesa}
          onHide={handleModalDeleteHide}
          detailData={userData}
        />
      </FilterModal>
    </>
  );
};

export default DesaPage;
