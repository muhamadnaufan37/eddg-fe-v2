import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/features/Pagination";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import StatusTableBadge from "@/components/features/StatusTableBadge";
import { handleApiError } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { BASE_TITLE } from "@/store/actions";
import { DataTableAdvanced, Input, Dropdown, DropdownItem, type Column } from "@/components/global";
import { Logs, RefreshCcw, Search, X, Activity, FileText, Clock, MoreVertical } from "lucide-react";
import { fetchLogsData } from "@/services/logsServoces";
import { THEME_COLORS } from "@/config/theme";
import ParticipantSkeleton from "@/pages/digital-data/sensus/components/ParticipantSkeleton";

const LogsPage = () => {
  const { loading } = useFetchOptions();
  const hasFetched = useRef(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [filterInput, setFilterInput] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      return await fetchLogsData({
        page,
        rows,
        filterInput,
      });
    } catch (error: any) {
      handleApiError(error, {});
    }
  };

  const {
    data: dataListLogs,
    isFetching: isRefetchingLogs,
    refetch: refetchListLogs,
  } = useQuery({
    queryKey: ["dataListLogs", page, rows],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  const onResetFilter = () => {
    setPage(1);
    setRows(10);
    setFilterInput("");
  };

  useEffect(() => {
    if (hasFetched.current) {
      refetchListLogs();
    }
  }, [page, rows, filterInput]);

  const formatDateString = (date: any) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  // Definisi kolom
  const columns: Column<any>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      bold: true,
    },
    {
      key: "user",
      header: "User",
      sortable: false,
      render: (item: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold">
            {item?.user?.nama_lengkap || "-"}
          </span>
          <span className="text-xs text-gray-500">
            @{item?.user?.username || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "activity_type",
      header: "Aktivitas",
      sortable: true,
      render: (item: any) => {
        const type = item?.activity_type;

        // Optional: mapping badge
        const map: Record<string, { text: string; color: any }> = {
          view: { text: "View", color: "blue" },
          update: { text: "Update", color: "yellow" },
          delete: { text: "Delete", color: "red" },
          create: { text: "Create", color: "green" },
        };

        const dataStatus = map[type] || { text: type || "-", color: "gray" };

        return (
          <StatusTableBadge label={dataStatus.text} color={dataStatus.color} />
        );
      },
    },
    {
      key: "description",
      header: "Deskripsi",
      sortable: false,
      render: (item: any) => (
        <div className="max-w-65 truncate text-sm">
          {item?.description || "-"}
        </div>
      ),
    },
    {
      key: "model_type",
      header: "Model",
      sortable: true,
      render: (item: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold">
            {item?.model_type || "-"}
          </span>
          <span className="text-xs text-gray-500">
            ID: {item?.model_id || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "ip_address",
      header: "IP Address",
      sortable: true,
      render: (item: any) => <span>{item?.ip_address || "-"}</span>,
    },
    {
      key: "properties",
      header: "Perubahan",
      sortable: false,
      render: (item: any) => {
        const props = item?.properties;

        if (!props) return <span className="text-gray-400">-</span>;

        // update case
        if (props?.old && props?.new) {
          return (
            <div className="text-xs">
              <div className="font-semibold text-gray-700 dark:text-gray-200">
                Update
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {Object.keys(props.old).length} field berubah
              </div>
            </div>
          );
        }

        // delete case
        if (props?.deleted_data) {
          return (
            <div className="text-xs">
              <div className="font-semibold text-red-600 dark:text-red-400">
                Deleted
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {props.deleted_data?.kode_cari_data || "-"}
              </div>
            </div>
          );
        }

        return <span className="text-xs text-gray-500">Ada data</span>;
      },
    },

    {
      key: "created_at",
      header: "Tanggal",
      sortable: true,
      render: (item: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">
            {formatDateString(item?.created_at)}
          </span>
          <span className="text-xs text-gray-500">{item?.time_ago || "-"}</span>
        </div>
      ),
    },
  ];

  // Row actions (menu 3 titik)
  const rowActions = [{ label: "Detail", value: "detail" }];

  const handleRowAction = (item: any, action: string) => {
    switch (action) {
      case "detail":
        navigate(`/logs/${item.id}`);
        break;
    }
  };

  document.title = BASE_TITLE + "Logs Users";

  const customLogCardRender = (
    item: any,
    actions: { label: string; value: string }[] | undefined,
    isSelected: boolean,
    onSelect: (checked: boolean) => void
  ) => {
    const type = item?.activity_type;
    const map: Record<string, { text: string; color: any }> = {
      view: { text: "View", color: "blue" },
      update: { text: "Update", color: "yellow" },
      delete: { text: "Delete", color: "red" },
      create: { text: "Create", color: "green" },
      login: { text: "Login", color: "green" },
      logout: { text: "Logout", color: "gray" },
    };
    const badgeInfo = map[type?.toLowerCase()] || {
      text: type || "Unknown",
      color: "gray",
    };
    const rowActs = actions || rowActions;

    return (
      <div className={`relative h-full flex flex-col rounded-2xl border transition-all duration-300 bg-white dark:bg-gray-800 border-gray-100 hover:border-gray-200 hover:shadow-lg dark:border-gray-700 dark:hover:border-gray-600 ${isSelected ? "border-blue-500 bg-blue-50/30 dark:border-blue-400 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500 dark:ring-blue-400" : ""}`}>
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
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {item?.user?.nama_lengkap || "Sistem"}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  @{item?.user?.username || "sistem"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0">
              <StatusTableBadge label={badgeInfo.text} color={badgeInfo.color} />
            </div>
          </div>

          <div className="mb-3 h-px w-full bg-gray-100 dark:bg-gray-700" />

          <div className="grid grid-cols-1 gap-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-500 dark:text-gray-400">
                <FileText className="h-3 w-3" />
                <span>Deskripsi</span>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 break-words line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatDateString(item.created_at)}</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              ID: {item.id}
            </p>
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
              align="right"
            >
              {rowActs.map((action, i) => (
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
      </div>
    );
  };

  return (
    <>
      <div className="relative md:h-full">
        {isRefetchingLogs && (
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
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Logs Aktivitas Users
            </h1>
            <div className="flex items-center gap-2">
              <button
                disabled={isRefetchingLogs}
                onClick={onResetFilter}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefetchingLogs ? "animate-spin" : ""}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Search & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 rounded-xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  value={filterInput}
                  onChange={(e: any) => setFilterInput(e.target.value)}
                  onKeyDown={(e: any) => e.key === "Enter" && refetchListLogs()}
                  placeholder="Cari Type Aktivitas, Model, Nama..."
                  className="w-full rounded-lg border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                />
              </div>
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
                data={dataListLogs?.data || []}
                columns={columns}
                mobileCardView
                mobileCardTitleKey="user"
                mobileCardColumns={[
                  "activity_type",
                  "description",
                  "model_type",
                  "created_at",
                ]}
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
                alwaysCardView={true}
                customCardRender={customLogCardRender}
                gridCols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                getRowId={(item: any) => item.id}
              />
            )}

            {/* Refetch indicator */}
            {isRefetchingLogs && !loading && (
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center animate-pulse">
                Memperbarui data...
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-3 shrink-0">
              <Pagination
                currentPage={dataListLogs?.meta?.current_page || 1}
                lastPage={dataListLogs?.meta?.last_page || 1}
                totalItems={dataListLogs?.meta?.total || 0}
                rowsPerPage={rows}
                onPageChange={(params) => {
                  setPage(params.page + 1);
                  setRows(params.rows);
                }}
                disabled={isRefetchingLogs}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogsPage;
