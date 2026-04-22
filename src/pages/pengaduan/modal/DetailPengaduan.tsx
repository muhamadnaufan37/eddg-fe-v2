import { useLocation, useNavigate } from "react-router-dom";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { Button } from "@/components/global";
import { type PengaduanDetail } from "@/services/pengaduanService";
import { THEME_COLORS } from "@/config/theme";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const formatDate = (date: string) => {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd MMMM yyyy HH:mm", { locale: id });
  } catch {
    return "-";
  }
};

const DetailPengaduan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dataBalikan = location?.state as { detailData?: PengaduanDetail };
  const detailData = dataBalikan?.detailData;

  return (
    <>
      {!detailData && <ModalInvalidId />}

      <div
        className={`max-w-4xl mx-auto ${THEME_COLORS.background.card} rounded-xl shadow-lg`}
      >
        <div className={`p-4 sm:p-6 border-b-2 ${THEME_COLORS.border.default}`}>
          <h2
            className={`text-base sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
          >
            Detail Pengaduan
          </h2>
          <p className={`text-xs sm:text-sm ${THEME_COLORS.text.muted}`}>
            Informasi lengkap pengaduan pengguna
          </p>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>UUID</p>
            <p className={`text-sm font-semibold ${THEME_COLORS.text.primary}`}>
              {detailData?.uuid || "-"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>Status</p>
            <p className={`text-sm font-semibold ${THEME_COLORS.text.primary}`}>
              {detailData?.status_pengaduan || "-"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>Nama Lengkap</p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {detailData?.nama_lengkap || "-"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>Kontak</p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {detailData?.kontak || "-"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>
              Jenis Pengaduan
            </p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {detailData?.jenis_pengaduan || "-"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>
              Nama Kelompok
            </p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {detailData?.nama_kelompok || "-"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>Subjek</p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {detailData?.subjek || "-"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>
              Isi Pengaduan
            </p>
            <p
              className={`text-sm whitespace-pre-wrap ${THEME_COLORS.text.primary}`}
            >
              {detailData?.isi_pengaduan || "-"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>
              Balasan Admin
            </p>
            <p
              className={`text-sm whitespace-pre-wrap ${THEME_COLORS.text.primary}`}
            >
              {detailData?.balasan_admin || "-"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>
              Tanggal Dibuat
            </p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {formatDate(detailData?.created_at || "")}
            </p>
          </div>
          <div>
            <p className={`text-xs ${THEME_COLORS.text.muted}`}>
              Tanggal Dibalas
            </p>
            <p className={`text-sm ${THEME_COLORS.text.primary}`}>
              {formatDate(detailData?.tanggal_dibalas || "")}
            </p>
          </div>

          {!!detailData?.lampiran_url && (
            <div className="md:col-span-2">
              <p className={`text-xs mb-2 ${THEME_COLORS.text.muted}`}>
                Lampiran
              </p>
              <img
                src={detailData.lampiran_url}
                alt="Lampiran pengaduan"
                className="max-h-72 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>

        <div
          className={`flex justify-end gap-3 p-4 sm:p-6 border-t ${THEME_COLORS.border.default}`}
        >
          <Button
            variant="outline"
            onClick={() => navigate("/pengaduan", { replace: true })}
          >
            Kembali
          </Button>
          <Button
            onClick={() =>
              navigate("/pengaduan/reply", {
                state: { detailData },
                replace: true,
              })
            }
            disabled={!detailData}
          >
            Balas Pengaduan
          </Button>
        </div>
      </div>
    </>
  );
};

export default DetailPengaduan;
