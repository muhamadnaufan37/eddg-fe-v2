import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/global";
import { THEME_COLORS } from "@/config/theme";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { User, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const DetailDesa = () => {
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
              <div>
                <h2 className="text-xl font-bold text-white">
                  Detail kelompok
                </h2>
                <p className="text-white/80 text-sm mt-0.5">
                  Informasi lengkap kelompok
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
              <User className="w-4 h-4" />
              Informasi Kelompok
            </h3>

            <div className="space-y-2">
              <label
                className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
              >
                Foto
              </label>
              <div className="flex">
                {userData?.img_url !== null ? (
                  <img
                    src={userData?.img_url}
                    alt="Foto kelompok"
                    className="w-20 h-15 object-cover rounded-md"
                  />
                ) : (
                  <>
                    <span className="font-semibold text-xs italic w-full text-gray-600 dark:text-gray-400">
                      *data ini belum upload foto
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
              >
                Desa Asal
              </label>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
              >
                <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                  {userData.data_desa?.nama_desa || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
              >
                Nama Kelompok
              </label>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
              >
                <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                  {userData.nama_kelompok || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
              >
                Alamat
              </label>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
              >
                <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                  {userData.alamat || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
              >
                latitude, longitude
              </label>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
              >
                <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                  {userData.latitude || "-"}, {userData.longitude || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
              >
                Status
              </label>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${THEME_COLORS.background.input} border ${THEME_COLORS.border.default}`}
              >
                <span className={`text-sm ${THEME_COLORS.text.primary}`}>
                  {userData.is_active === true ? "Aktif" : "Tidak Aktif"}
                </span>
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
            onClick={() =>
              navigate("/master-data/tempat-sambung/kelompok", {
                replace: true,
              })
            }
          >
            Kembali
          </Button>
          <Button
            type="button"
            onClick={() =>
              navigate("/master-data/tempat-sambung/kelompok/update", {
                state: dataBalikan,
                replace: true,
              })
            }
          >
            Edit Desa
          </Button>
        </div>
      </div>
    </>
  );
};

export default DetailDesa;
