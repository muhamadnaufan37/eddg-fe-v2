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
import Swal from "sweetalert2";
import { DataTableAdvanced, Input, Dropdown, DropdownItem, type Column } from "@/components/global";
import {
  Copy,
  Filter,
  Info,
  PlusCircle,
  RefreshCcw,
  Search,
  Users,
  MoreVertical,
  ChartLine,
  Database,
} from "lucide-react";
import {
  fetchDetailUsers,
  fetchResetPassUsers,
  fetchResetDeviceUsers,
  fetchUnbanUsers,
  fetchUsersData,
  forceLogoutUser,
} from "@/services/UserServices";
import UsersFilterPanel from "./components/UsersFilterPanel";
import { THEME_COLORS } from "@/config/theme";
import Delete from "./modal/Delete";
import { axiosServices } from "@/services/axios";
import BannedUsers from "./modal/BannedUsers";
import ParticipantSkeleton from "@/pages/digital-data/sensus/components/ParticipantSkeleton";
import FilterModal from "@/pages/digital-data/sensus/components/FilterModal";

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
  const [status, setStatus] = useState<any>("");
  const [statusNda, setStatusNda] = useState<any>("");
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
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showModalBanned, setShowModalBanned] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResettingDevice, setIsResettingDevice] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [isForceLoggingOut, setIsForceLoggingOut] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      return await fetchUsersData({
        page,
        rows,
        filterInput,
        status,
        status_nda: statusNda,
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
    setStatusNda("");
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
      filterKelompok === "" ||
      statusNda === "";

    if (isAnyFilterEmpty) {
      refetchListUsers();
    }
  }, [status, statusNda, filterDaerah, filterDesa, filterKelompok]);

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
    setIsLoadingDetail(true);
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
        case 6:
          setShowModalBanned(true);
          break;
      }
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const resetPassUsers = async (Kode: any, visibilityOption: any) => {
    setIsResettingPassword(true);
    try {
      const response = await fetchResetPassUsers(Kode);

      if (!response.success) {
        toast.error("Error!", {
          description: response.message || "Gagal memuat data penetapan",
          duration: 3000,
        });
        return;
      }

      switch (visibilityOption) {
        case 5:
          toast.success("Sukses", {
            description: response?.message || "-",
            duration: 3000,
          });
          refetchListUsers();
          break;
      }
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsResettingPassword(false);
    }
  };

  const resetDeviceUsers = async (Kode: any, visibilityOption: any) => {
    setIsResettingDevice(true);
    try {
      const response = await fetchResetDeviceUsers(Kode);

      if (!response.success) {
        toast.error("Error!", {
          description: response.message || "Gagal mereset device user",
          duration: 3000,
        });
        return;
      }

      switch (visibilityOption) {
        case 8:
          toast.success("Sukses", {
            description: response.message || "Device berhasil direset",
            duration: 3000,
          });
          refetchListUsers();
          break;
      }
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsResettingDevice(false);
    }
  };

  const unbanUsers = async (Kode: any, visibilityOption: any) => {
    setIsUnbanning(true);
    try {
      const response = await fetchUnbanUsers(Kode);

      if (!response.success) {
        toast.error("Error!", {
          description: response.message || "Gagal memuat data penetapan",
          duration: 3000,
        });
        return;
      }

      switch (visibilityOption) {
        case 7:
          toast.success("Sukses", {
            description: response.message || "-",
            duration: 3000,
          });
          refetchListUsers();
          break;
      }
    } catch (error: any) {
      handleApiError(error, {});
    } finally {
      setIsUnbanning(false);
    }
  };

  const handleForceLogout = async (item: any) => {
    const result = await Swal.fire({
      title: "Force Logout",
      html: `Yakin ingin force logout user <b>${item.username}</b>?<br/><br/>Masukkan alasan:`,
      input: "text",
      inputPlaceholder: "Contoh: Sesi ganda, keamanan akun...",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Force Logout!",
      cancelButtonText: "Batal",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        container: "!z-[99999]",
      },
      inputValidator: (value) => {
        if (!value?.trim()) {
          return "Alasan force logout wajib diisi!";
        }
      },
    });

    if (!result.isConfirmed) return;

    setIsForceLoggingOut(true);
    try {
      const response = await forceLogoutUser(item.uuid, result.value.trim());

      if (!response.success) {
        toast.error("Gagal!", {
          description: response.message || "Gagal melakukan force logout",
          duration: 3000,
        });
        return;
      }

      toast.success("Berhasil", {
        description: response.message || "User berhasil dilogout paksa",
        duration: 3000,
      });
      refetchListUsers();
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setIsForceLoggingOut(false);
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

    // Confirmation dialog
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedRows.size} data terpilih?`,
    );

    if (!confirmed) return;

    setIsBulkDeleting(true);

    try {
      // Convert Set to Array
      const uuid = Array.from(selectedRows);

      const response = await axiosServices().delete(
        "/api/v1/users/bulk-destroy",
        { data: { uuid } },
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
          refetchListUsers();
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
      key: "uuid",
      header: "UUID",
      sortable: true,
      bold: true,
      render: (item: any) => (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyKode(item.uuid);
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
      key: "is_online",
      header: "Online",
      sortable: true,
      render: (item: any) => (
        <StatusTableBadge
          label={item.is_online ? "Online" : "Offline"}
          color={item.is_online ? "green" : "gray"}
        />
      ),
    },
    {
      key: "last_seen_at",
      header: "Terakhir Aktif",
      render: (item: any) => (
        <span>{formatDateString(item.last_seen_at) || "-"}</span>
      ),
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
      key: "status_nda",
      header: "Status NDA",
      sortable: true,
    },
    {
      key: "failed_device_attempts",
      header: "Failed Device Attempts",
      sortable: true,
    },
    {
      key: "login_terakhir",
      header: "Login Terakhir",
      sortable: true,
      render: (item: any) => <div>{formatDateString(item.login_terakhir)}</div>,
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
      { label: "Reset Password", value: "reset" },
      { label: "Reset Device", value: "reset_device" },
    ];

    // Show Ban or Unban based on status
    if (String(item.status) === "-1") {
      actions.push({ label: "Unban User", value: "unbanned" });
    } else {
      actions.push({ label: "Ban User", value: "banned" });
    }

    actions.push({ label: "Hapus", value: "delete" });

    if (
      String(dataLogin?.user?.role_id) ===
        "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" &&
      String(item.uuid) !== String(dataLogin?.user?.uuid)
    ) {
      actions.push({ label: "Force Logout", value: "force_logout" });
    }

    return actions;
  };

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
      case "reset":
        resetPassUsers(item.uuid, 5);
        break;
      case "reset_device":
        resetDeviceUsers(item.uuid, 8);
        break;
      case "banned":
        DetailDataFetch(item.uuid, 6);
        break;
      case "unbanned":
        unbanUsers(item.uuid, 7);
        break;
      case "force_logout":
        handleForceLogout(item);
        break;
    }
  };

  const handleModalDeleteHide = () => {
    setShowModalDelete(false);
  };

  const handleModalBannedHide = () => {
    setShowModalBanned(false);
  };

  const customUserCardRender = (
    item: any,
    actions: { label: string; value: string }[] | undefined,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const dataStatus = resolveStatus(STATUS_USERS_MAP, item.status);
    const rowActs = actions || rowActions(item);

    return (
      <article
        key={item.uuid}
        className={`relative h-full flex flex-col rounded-2xl border transition-all duration-300 bg-white dark:bg-gray-800 border-gray-100 hover:border-gray-200 hover:shadow-lg dark:border-gray-700 dark:hover:border-gray-600 ${
          isSelected
            ? "border-blue-500 bg-blue-50/30 dark:border-blue-400 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500 dark:ring-blue-400"
            : ""
        }`}
      >
        <div className="flex flex-col flex-grow p-4">
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
                {item.username ? item.username.substring(0, 2).toUpperCase() : "-"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {item.username || "-"}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {item.email}
                </p>
              </div>
            </div>
            <div className="flex shrink-0">
              <StatusTableBadge
                label={item.is_online ? "Online" : "Offline"}
                color={item.is_online ? "green" : "gray"}
              />
            </div>
          </div>

          <div className="mb-3 h-px w-full bg-gray-100 dark:bg-gray-700" />

          <div className="grid grid-cols-2 gap-x-2 gap-y-4">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Role</p>
              <div className="mt-1 flex flex-col gap-1">
                <span className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{item.nm_role}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Status Akun</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Status NDA</p>
              <div className="mt-1 flex items-center">
                {item.status_nda === 1 ? (
                  <StatusTableBadge label="NDA" color="green" />
                ) : (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">-</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Aktivitas</p>
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-700 dark:text-gray-300">
                  Login: {item.login_terakhir ? formatDateString(item.login_terakhir) : "-"}
                </span>
                <span className="text-[10px] text-gray-700 dark:text-gray-300">
                  Aktif: {item.last_seen_at ? formatDateString(item.last_seen_at) : "-"}
                </span>
                {Number(item.failed_device_attempts) > 0 && (
                  <span className="text-[10px] text-red-500">
                    Gagal Device: {item.failed_device_attempts}x
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Wilayah Sambung</p>
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {item.nm_daerah || "-"}
                </span>
                {(item.nm_desa || item.nm_kelompok) && (
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {item.nm_desa ? item.nm_desa : ""}
                    {item.nm_desa && item.nm_kelompok ? " • " : ""}
                    {item.nm_kelompok ? item.nm_kelompok : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50 rounded-b-2xl">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Dibuat: {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}
          </p>
          <div className="flex gap-2">
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-blue-400 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
              align="right"
            >
              {rowActs.map((action: any, i: number) => (
                <DropdownItem
                  key={i}
                  onClick={() => handleRowAction(item, action.value)}
                  danger={action.value === "delete" || action.value === "banned"}
                >
                  {action.label}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        </div>
      </article>
    );
  };

  document.title = BASE_TITLE + "Users Management";

  const hasActiveFilters = Boolean(
    status || statusNda || filterDaerah || filterDesa || filterKelompok
  );

  return (
    <>
      <div className="relative md:h-full">
        {(isRefetchingUsers ||
          isLoadingDetail ||
          isResettingPassword ||
          isResettingDevice ||
          isUnbanning ||
          isForceLoggingOut) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[999] bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl">
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
              {isLoadingDetail
                ? "Memuat detail..."
                : isResettingPassword
                  ? "Mereset password..."
                  : isResettingDevice
                    ? "Mereset device..."
                    : isUnbanning
                      ? "Membuka blokir..."
                      : "Memperbarui data..."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-5 h-full">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Users Management
            </h1>
            <div className="flex items-center gap-2">
              <button
                disabled={isRefetchingUsers}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700"
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
                <PlusCircle className="h-4 w-4" />
                <span>Tambah User</span>
              </button>
            </div>
          </div>

          {/* Search & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              {selectedRows.size > 0 && (
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
                  onKeyDown={(e: any) => e.key === "Enter" && refetchListUsers()}
                  placeholder="Cari Users..."
                  className="w-full rounded-lg border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                />
              </div>
              <button
                disabled={isRefetchingUsers}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm font-medium transition-all ${
                  hasActiveFilters
                    ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => setOpenFilter(true)}
                title="Filter Lanjutan"
              >
                <Filter className="h-4 w-4" />
              </button>
              {(hasActiveFilters || filterInput) && (
                <button
                  disabled={isRefetchingUsers}
                  onClick={onResetFilter}
                  className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition-all hover:bg-gray-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-red-400"
                  title="Reset Filter"
                >
                  <RefreshCcw className={`h-4 w-4 transition-transform hover:rotate-180 ${isRefetchingUsers ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Data Table */}
            {!loading && (
              <DataTableAdvanced
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                data={dataListUsers?.data || []}
                columns={columns}
                mobileCardView
                mobileCardTitleKey="nama_lengkap"
                mobileCardColumns={[
                  "uuid",
                  "username",
                  "email",
                  "nm_role",
                  "status",
                  "is_online",
                  "last_seen_at",
                  "tempat_sambung_info",
                ]}
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
                alwaysCardView={true}
                customCardRender={customUserCardRender}
                gridCols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                getRowId={(item: any) => item.uuid}
                disabled={isLoadingDetail || isResettingPassword || isUnbanning}
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
          statusNda={statusNda}
          setStatusNda={setStatusNda}
          statusNdaOptions={[
            { value: "", label: "Semua Status NDA" },
            { value: 1, label: "Sudah NDA" },
            { value: 0, label: "Belum NDA" },
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

      {/* manggil ke component form Banned */}
      <FilterModal
        open={showModalBanned}
        onClose={handleModalBannedHide}
        title="Blokir Pengguna"
      >
        <BannedUsers
          fetchData={refetchListUsers}
          onHide={handleModalBannedHide}
          detailData={userData}
        />
      </FilterModal>
    </>
  );
};

export default UsersPage;
