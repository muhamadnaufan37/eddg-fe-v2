import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocalStorage } from "@/services/localStorageService";
// import Delete from "./modal/Delete";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/features/Pagination";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import StatusTableBadge from "@/components/features/StatusTableBadge";
import { resolveStatus, STATUS_USERS_MAP } from "@/constants";
import {
  fetchDesaByDaerah,
  fetchKelompokByDesa,
} from "@/services/sensusService";
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
  Users,
} from "lucide-react";
import { fetchDetailUsers, fetchUsersData } from "@/services/UserServices";
import ParticipantSkeleton from "@/pages/sensus/components/ParticipantSkeleton";
import FilterModal from "@/pages/sensus/components/FilterModal";
import UsersFilterPanel from "./components/UsersFilterPanel";
import { THEME_COLORS } from "@/config/theme";
import Delete from "./modal/Delete";

interface Option {
  value: string | number;
  label: string;
}

const UsersPage = () => {
  const dataLogin = getLocalStorage("userData");
  const { fetchOptions, loading } = useFetchOptions();
  const hasFetched = useRef(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [filterInput, setFilterInput] = useState("");
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [fetchDataDaerah, setFetchDataDaerah] = useState<Option[]>([]);
  const [fetchDataRoles, setFetchDataRoles] = useState<Option[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [userData, setUserData] = useState(null);
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

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      return await fetchUsersData({
        page,
        rows,
        filterInput,
        status,
        role_daerah: dataLogin?.user?.akses_daerah || filterDaerah,
        role_desa: dataLogin?.user?.akses_desa || filterDesa,
        role_kelompok: dataLogin?.user?.akses_kelompok || filterKelompok,
      });
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const loadAllData = async () => {
    const [daerah, roles] = await Promise.all([
      fetchOptions("/api/v1/daerah/all", "data_tempat_sambung", "nama_daerah"),
      fetchOptions("/api/v1/roles/all", "data", "name"),
    ]);

    setFetchDataDaerah(daerah);
    setFetchDataRoles(roles);
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
    data: dataListUsers,
    isFetching: isRefetchingUsers,
    refetch: refetchListUsers,
  } = useQuery({
    queryKey: ["dataListUsers", page, rows],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  const onResetFilter = () => {
    setPage(1);
    setRows(10);
    setFilterInput("");
    setStatus("");
    setFilterDaerah(dataLogin?.user?.akses_daerah || "");
    setFilterDesa(dataLogin?.user?.akses_desa || "");
    setFilterKelompok(dataLogin?.user?.akses_kelompok || "");
  };

  useEffect(() => {
    const isAnyFilterEmpty =
      filterInput === "" ||
      status === "" ||
      filterDaerah === "" ||
      filterDesa === "" ||
      filterKelompok === "";

    if (isAnyFilterEmpty) {
      refetchListUsers();
    }
  }, [
    filterInput,
    status,
    filterDaerah,
    filterDesa,
    filterKelompok,
    refetchListUsers,
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
      const response = await fetchDetailUsers(Kode);

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
        fetchDataRoles: fetchDataRoles,
      };

      switch (visibilityOption) {
        case 2:
          navigate("/auth/users/detail", {
            state: navigationState,
            replace: true,
          });
          break;
        case 3:
          navigate("/auth/users/update", {
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
    }
  };

  const formatDateString = (date: any) => {
    if (!date) return ""; // Handle jika tanggal tidak tersedia
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  // Definisi kolom
  const columns: Column<any>[] = [
    {
      key: "uuid",
      header: "UUID",
      sortable: true,
      bold: true,
    },
    {
      key: "nama_lengkap",
      header: "Nama",
      sortable: true,
    },
    {
      key: "username",
      header: "Username",
      sortable: true,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
    },
    {
      key: "nm_role",
      header: "Role",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item: any) => {
        const dataStatus = resolveStatus(STATUS_USERS_MAP, item.status);
        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "tempat_sambung_info",
      header: "Tempat Sambung",
      sortable: false,
      render: (item: any) => (
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-xs font-semibold ${THEME_COLORS.text.primary}`}
          >
            {item.nm_daerah || "-"}
          </span>
          <span
            className={`text-xs font-medium ${THEME_COLORS.text.secondary}`}
          >
            {item.nm_desa || "-"}
          </span>
          <span className={`text-xs ${THEME_COLORS.text.muted}`}>
            {item.nm_kelompok || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "login_terakhir",
      header: "Login Terakhir",
      sortable: true,
      render: (item: any) => <div>{formatDateString(item.created_at)}</div>,
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
    { label: "Hapus", value: "delete" },
  ];

  const handleRowAction = (item: any, action: string) => {
    switch (action) {
      case "detail":
        DetailDataFetch(item.uuid, 2);
        break;
      case "edit":
        DetailDataFetch(item.uuid, 3);
        break;
      case "delete":
        DetailDataFetch(item.uuid, 4);
        break;
    }
  };

  const handleModalDeleteHide = () => {
    setShowModalDelete(false);
  };

  document.title = BASE_TITLE + "Users Management";

  return (
    <>
      <div className="relative md:h-full">
        {isRefetchingUsers && (
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
          <div
            className={`${THEME_COLORS.background.card} rounded-2xl shadow-lg border ${THEME_COLORS.border.default} overflow-hidden`}
          >
            {/* Header Section */}
            <div className={`${THEME_COLORS.active.background} px-6 py-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-2xl text-white tracking-tight">
                      Users Management
                    </h1>
                    <p className="text-white/80 text-sm mt-0.5">
                      Kelola dan pantau data users dengan mudah
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
                  placeholder="Cari berdasarkan Kode, Nama, Daerah, Desa, Kelompok, atau Petugas..."
                  onChange={(e: any) => setFilterInput(e.target.value)}
                  onKeyDown={(e: any) =>
                    e.key === "Enter" && refetchListUsers()
                  }
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Action Buttons with Better Layout */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter & Reset Group */}
                  <div
                    className={`flex items-center gap-2 ${selectedRows.size > 0 ? "" : "mr-auto"}`}
                  >
                    <button
                      disabled={isRefetchingUsers}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${THEME_COLORS.background.card} border-2 ${THEME_COLORS.border.default} rounded-lg ${THEME_COLORS.hover.item} transition-all disabled:opacity-50 disabled:cursor-not-allowed ${THEME_COLORS.text.secondary}`}
                      onClick={() => setOpenFilter(true)}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filter Lanjutan</span>
                    </button>
                    <button
                      disabled={isRefetchingUsers}
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
                    disabled={isRefetchingUsers}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() =>
                      navigate("/auth/users/create", {
                        state: {
                          balikanLogin: dataLogin,
                          fetchdataDearah: fetchDataDaerah,
                          fetchDataRoles: fetchDataRoles,
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
              {(status || filterDaerah || filterDesa || filterKelompok) && (
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
                data={dataListUsers?.data || []}
                columns={columns}
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
                getRowId={(item: any) => item.uuid}
              />
            )}

            {/* Refetch indicator */}
            {isRefetchingUsers && !loading && (
              <div
                className={`text-xs ${THEME_COLORS.text.muted} text-center animate-pulse`}
              >
                Memperbarui data...
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-3 shrink-0">
              <Pagination
                currentPage={dataListUsers?.meta?.current_page || 1}
                lastPage={dataListUsers?.meta?.last_page || 1}
                totalItems={dataListUsers?.meta?.total || 0}
                rowsPerPage={rows}
                onPageChange={(params) => {
                  setPage(params.page + 1);
                  setRows(params.rows);
                }}
                disabled={isRefetchingUsers}
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
        <UsersFilterPanel
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
          status={status}
          setStatus={setStatus}
          statusUsersOptions={[
            { value: "", label: "Semua Status" },
            { value: 1, label: "Aktif" },
            { value: 0, label: "Tidak Aktif" },
            { value: -1, label: "Banned" },
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
          fetchData={refetchListUsers}
          onHide={handleModalDeleteHide}
          detailData={userData}
        />
      </FilterModal>
    </>
  );
};

export default UsersPage;
