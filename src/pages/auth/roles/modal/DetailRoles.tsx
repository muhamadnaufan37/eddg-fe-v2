import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/global";
import { THEME_COLORS } from "@/config/theme";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { ArrowLeft, Calendar, Clock, ShieldBan } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const DetailRoles = () => {
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const userData = dataBalikan?.detailData;

  const formatDateString = (date: any) => {
    if (!date) return "-";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
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
                onClick={() => navigate("/auth/roles", { replace: true })}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ShieldBan className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detail Roles</h2>
                <p className="text-white/80 text-sm mt-0.5">
                  Informasi lengkap roles
                </p>
              </div>
            </div>
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
              <ShieldBan className="w-4 h-4" />
              Informasi Roles
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
                  Roles
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.name || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Guard
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.guard_name || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                >
                  Deskripsi
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
                >
                  <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {userData.description || "-"}
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

            <div className="grid grid-cols-1 gap-4">
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
        </div>

        {/* Footer Actions */}
        <div
          className={`flex justify-end items-center gap-3 p-4 ${THEME_COLORS.background.tableHeader} rounded-b-xl border-t ${THEME_COLORS.border.default}`}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/auth/roles", { replace: true })}
          >
            Kembali
          </Button>
          <Button
            type="button"
            onClick={() =>
              navigate("/auth/roles/update", {
                state: dataBalikan,
                replace: true,
              })
            }
          >
            Edit Roles
          </Button>
        </div>
      </div>
    </>
  );
};

export default DetailRoles;
