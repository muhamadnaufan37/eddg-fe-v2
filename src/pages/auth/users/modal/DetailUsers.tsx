import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/global";
import { THEME_COLORS } from "@/config/theme";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const DetailUsers = () => {
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const userData = dataBalikan?.detailData;

  const formatDateString = (date: any) => {
    if (!date) return "-";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
  };

  const getStatusIcon = (status: any) => {
    switch (String(status)) {
      case "1":
        return (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      case "0":
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "-1":
        return <Ban className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: any) => {
    switch (String(status)) {
      case "1":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Aktif
          </div>
        );
      case "0":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Tidak Aktif
          </div>
        );
      case "-1":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium">
            <Ban className="w-4 h-4" />
            Banned
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!dataBalikan || !dataBalikan?.detailData?.id) {
      setShowModal(true);
    }
  }, [dataBalikan]);

  if (!userData) {
    return null;
  }

  return (
    <>
      {showModal && <ModalInvalidId />}

      <div
        className={`max-w-4xl mx-auto ${THEME_COLORS.background.card} rounded-xl shadow-lg`}
      >
        {/* Header */}
        <div
          className={`${THEME_COLORS.active.background} px-6 py-5 rounded-t-xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/auth/users", { replace: true })}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detail User</h2>
                <p className="text-white/80 text-sm mt-0.5">
                  Informasi lengkap user
                </p>
              </div>
            </div>
            {getStatusBadge(userData.status)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informasi Utama */}
          <div
            className={`rounded-xl border ${THEME_COLORS.border.default} p-5 space-y-4`}
          >
            <h3
              className={`text-sm font-semibold ${THEME_COLORS.text.primary} flex items-center gap-2 border-b ${THEME_COLORS.border.default} pb-3`}
            >
              <User className="w-4 h-4" />
              Informasi Akun
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  UUID
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span
                    className={`text-sm font-mono ${THEME_COLORS.text.primary}`}
                  >
                    {userData.uuid || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Nama Lengkap
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <User className={`w-4 h-4 ${THEME_COLORS.text.muted}`} />
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.nama_lengkap || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Username
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    @{userData.username || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Email
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <Mail className={`w-4 h-4 ${THEME_COLORS.text.muted}`} />
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.email || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Akses */}
          <div
            className={`rounded-xl border ${THEME_COLORS.border.default} p-5 space-y-4`}
          >
            <h3
              className={`text-sm font-semibold ${THEME_COLORS.text.primary} flex items-center gap-2 border-b ${THEME_COLORS.border.default} pb-3`}
            >
              <Shield className="w-4 h-4" />
              Role & Akses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Role
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <Shield className={`w-4 h-4 ${THEME_COLORS.text.muted}`} />
                  <span
                    className={`text-sm font-medium ${THEME_COLORS.text.primary}`}
                  >
                    {userData.nm_role || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Status Akun
                </label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(userData.status)}
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {String(userData.status) === "1"
                      ? "Aktif"
                      : String(userData.status) === "0"
                        ? "Tidak Aktif"
                        : "Banned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lokasi Akses */}
          <div
            className={`rounded-xl border ${THEME_COLORS.border.default} p-5 space-y-4`}
          >
            <h3
              className={`text-sm font-semibold ${THEME_COLORS.text.primary} flex items-center gap-2 border-b ${THEME_COLORS.border.default} pb-3`}
            >
              <MapPin className="w-4 h-4" />
              Akses Lokasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Daerah
                </label>
                <div
                  className={`p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.nm_daerah || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Desa
                </label>
                <div
                  className={`p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.nm_desa || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Kelompok
                </label>
                <div
                  className={`p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.nm_kelompok || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Tambahan */}
          <div
            className={`rounded-xl border ${THEME_COLORS.border.default} p-5 space-y-4`}
          >
            <h3
              className={`text-sm font-semibold ${THEME_COLORS.text.primary} flex items-center gap-2 border-b ${THEME_COLORS.border.default} pb-3`}
            >
              <Clock className="w-4 h-4" />
              Informasi Waktu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Login Terakhir
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <Clock className={`w-4 h-4 ${THEME_COLORS.text.muted}`} />
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {formatDateString(userData.login_terakhir)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Tanggal Dibuat
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <Calendar className={`w-4 h-4 ${THEME_COLORS.text.muted}`} />
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {formatDateString(userData.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Ban (jika ada) */}
          {String(userData.status) === "-1" && userData.reason_ban && (
            <div
              className={`rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 space-y-3`}
            >
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Alasan Pemblokiran
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {userData.reason_ban}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`flex justify-end items-center gap-3 p-4 ${THEME_COLORS.background.tableHeader} rounded-b-xl border-t ${THEME_COLORS.border.default}`}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/auth/users", { replace: true })}
          >
            Kembali
          </Button>
          <Button
            type="button"
            onClick={() =>
              navigate("/auth/users/update", {
                state: dataBalikan,
                replace: true,
              })
            }
          >
            Edit User
          </Button>
        </div>
      </div>
    </>
  );
};

export default DetailUsers;
