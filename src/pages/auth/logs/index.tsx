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
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import { Logs, RefreshCcw, Search, X } from "lucide-react";
import ParticipantSkeleton from "@/pages/sensus/components/ParticipantSkeleton";
import { fetchLogsData } from "@/services/logsServoces";
import { THEME_COLORS } from "@/config/theme";

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
              <div className="font-semibold text-gray-700">Update</div>
              <div className="text-gray-500">
                {Object.keys(props.old).length} field berubah
              </div>
            </div>
          );
        }

        // delete case
        if (props?.deleted_data) {
          return (
            <div className="text-xs">
              <div className="font-semibold text-red-600">Deleted</div>
              <div className="text-gray-500">
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
          {/* Modern Header Card with Gradient */}
          <div className="bg-linear-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header Section */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Logs className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-2xl text-white tracking-tight">
                      Logs Aktivitas Users
                    </h1>
                    <p className="text-blue-100 text-sm mt-0.5">
                      Kelola dan pantau logs aktivitas users dengan mudah
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* --- LEFT: Search Bar --- */}
                <div className="relative w-full sm:max-w-md">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search className="w-5 h-5" />
                  </div>
                  <Input
                    value={filterInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilterInput(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                      e.key === "Enter" && refetchListLogs()
                    }
                    placeholder="Cari Type Aktivitas, Model, Nama..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                  {/* Optional: Clear Button inside input if text exists */}
                  {filterInput && (
                    <button
                      onClick={() => setFilterInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* --- RIGHT: Actions --- */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Reset Button */}
                  <button
                    onClick={onResetFilter}
                    disabled={isRefetchingLogs}
                    className={`group w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all border ${
                      selectedRows.size > 0
                        ? `${THEME_COLORS.background.card} ${THEME_COLORS.border.default} ${THEME_COLORS.text.secondary} ${THEME_COLORS.hover.item}`
                        : `${THEME_COLORS.background.card} border-dashed ${THEME_COLORS.border.input} ${THEME_COLORS.text.muted} hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/10`
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <RefreshCcw
                      className={`w-4 h-4 transition-transform group-hover:rotate-180 ${isRefetchingLogs ? "animate-spin" : ""}`}
                    />{" "}
                    Reset
                  </button>
                </div>
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
                rowActions={rowActions}
                onRowAction={handleRowAction}
                selectable={true}
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
