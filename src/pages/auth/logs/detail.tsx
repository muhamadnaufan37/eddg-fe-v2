import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchLogsData } from "@/services/logsServoces";
import { handleApiError } from "@/utils/errorUtils";
import {
  ArrowLeft,
  Calendar,
  Globe,
  Monitor,
  User,
  FileText,
  Activity,
  Info,
} from "lucide-react";
import { Button, Card } from "@/components/global";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { BASE_TITLE } from "@/store/actions";
import { motion } from "framer-motion";
import StatusTableBadge from "@/components/features/StatusTableBadge";

const LogDetailPage = () => {
  const { id: logId } = useParams();
  const navigate = useNavigate();
  const [logDetail, setLogDetail] = useState<any>(null);

  const { data: dataListLogs, isLoading } = useQuery({
    queryKey: ["dataListLogsDetail"],
    queryFn: async () => {
      try {
        return await fetchLogsData({
          page: 1,
          rows: 1000, // Fetch banyak untuk cari by ID
          filterInput: "",
        });
      } catch (error: any) {
        handleApiError(error, {});
      }
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (dataListLogs?.data && logId) {
      const foundLog = dataListLogs.data.find(
        (item: any) => item.id === parseInt(logId),
      );
      setLogDetail(foundLog);
    }
  }, [dataListLogs, logId]);

  const formatDateString = (date: any) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  const getActivityBadge = (type: string) => {
    const map: Record<string, { text: string; color: any }> = {
      view: { text: "View", color: "blue" },
      update: { text: "Update", color: "yellow" },
      delete: { text: "Delete", color: "red" },
      create: { text: "Create", color: "green" },
    };
    return map[type] || { text: type || "-", color: "gray" };
  };

  document.title = BASE_TITLE + "Detail Logs";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat data...
          </p>
        </div>
      </div>
    );
  }

  if (!logDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-6xl">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Log Tidak Ditemukan
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Log dengan ID {logId} tidak ditemukan
        </p>
        <Button onClick={() => navigate("/logs")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Logs
        </Button>
      </div>
    );
  }

  const activity = getActivityBadge(logDetail.activity_type);

  return (
    <div className="container mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/auth/logs")}
            className="mb-4"
          >
            Kembali
          </Button>

          <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Detail Log Aktivitas
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    ID: {logDetail.id}
                  </p>
                </div>
              </div>
              <StatusTableBadge label={activity.text} color={activity.color} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informasi User
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nama Lengkap
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {logDetail.user?.nama_lengkap || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Username
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    @{logDetail.user?.username || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    User ID
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {logDetail.user?.id || "-"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Activity Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detail Aktivitas
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipe Aktivitas
                  </span>
                  <StatusTableBadge
                    label={activity.text}
                    color={activity.color}
                  />
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Model Type
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {logDetail.model_type || "-"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Model ID
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {logDetail.model_id || "-"}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Deskripsi
                  </span>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {logDetail.description || "-"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Properties - Conditional Rendering */}
            {logDetail.properties && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detail Perubahan
                  </h2>
                </div>

                {/* Update Activity - Show Old vs New */}
                {logDetail.properties.old && logDetail.properties.new && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Data Lama
                        </h3>
                        <div className="bg-[#2a2a2a] dark:bg-[#2a2a2a]/10 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                          {Object.entries(logDetail.properties.old).map(
                            ([key, value]: [string, any]) => (
                              <div key={key} className="mb-2 last:mb-0">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {key}:
                                </span>
                                <p className="text-sm text-gray-900 dark:text-white break-all">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Data Baru
                        </h3>
                        <div className="bg-[#2a2a2a] dark:bg-green-900/10 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                          {Object.entries(logDetail.properties.new).map(
                            ([key, value]: [string, any]) => (
                              <div key={key} className="mb-2 last:mb-0">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {key}:
                                </span>
                                <p className="text-sm text-gray-900 dark:text-white break-all">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Activity - Show Deleted Data */}
                {logDetail.properties.deleted_data && (
                  <div className="bg-[#2a2a2a] dark:bg-[#2a2a2a]/10 p-4 rounded-lg border border-gray-700 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
                      Data yang Dihapus
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(logDetail.properties.deleted_data).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="flex justify-between py-1 border-b border-red-100 dark:border-red-800/50 last:border-0"
                          >
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {key}
                            </span>
                            <span className="text-xs text-gray-900 dark:text-white">
                              {value !== null && value !== undefined
                                ? String(value)
                                : "-"}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Other Properties */}
                {!logDetail.properties.old &&
                  !logDetail.properties.deleted_data && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="space-y-2">
                        {Object.entries(logDetail.properties).map(
                          ([key, value]: [string, any]) => (
                            <div
                              key={key}
                              className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                            >
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {key}
                              </span>
                              <span className="text-xs text-gray-900 dark:text-white">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </Card>
            )}
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* System Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informasi Sistem
                </h2>
              </div>
              <div className="space-y-3">
                <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    IP Address
                  </span>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {logDetail.ip_address || "-"}
                    </span>
                  </div>
                </div>
                <div className="py-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    User Agent
                  </span>
                  <p className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded break-all">
                    {logDetail.user_agent || "-"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Timestamp */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Waktu
                </h2>
              </div>
              <div className="space-y-3">
                <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    Dibuat
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(logDetail.created_at).toLocaleString("id-ID", {
                      dateStyle: "full",
                      timeStyle: "medium",
                    })}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    Relatif
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDateString(logDetail.created_at)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LogDetailPage;
