import { useEffect, useState } from "react";
import { axiosServices } from "@/services/axios";
import { useNavigate } from "react-router-dom";
import { THEME_COLORS } from "@/config/theme";
import { toast } from "sonner";

interface UserData {
  id: number;
  uuid: string;
  nama_lengkap: string;
  email: string;
  username: string;
  nm_role: string;
  nm_daerah: string;
  nm_desa: string;
  nm_kelompok: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ProfileDetail = () => {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosServices().get("/api/v1/me");
        setData(res.data.data);
      } catch (error) {
        toast.error("Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className={`flex justify-center items-start md:items-center p-3 sm:p-6 pt-6 md:pt-6 ${THEME_COLORS.background.primary}`}
    >
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 transition-all duration-300 ${THEME_COLORS.background.card}`}
      >
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-[#457b9d]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <h1
                className={`text-xl sm:text-2xl font-bold ${THEME_COLORS.text.primary}`}
              >
                Profile User
              </h1>

              <button
                onClick={() => navigate("/auth/change-password")}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-all text-sm sm:text-base font-medium ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText}`}
              >
                Ubah Password
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <InfoItem label="Nama Lengkap" value={data?.nama_lengkap} />
              <InfoItem label="Username" value={data?.username} />
              <InfoItem label="Email" value={data?.email} />
              <InfoItem label="UUID" value={data?.uuid} />
              <InfoItem label="Roles" value={data?.nm_role} />
              <InfoItem label="Daerah" value={data?.nm_daerah} />
              <InfoItem label="Desa" value={data?.nm_desa} />
              <InfoItem label="Kelompok" value={data?.nm_kelompok} />

              <InfoItem
                label="Status"
                value={data?.status === "1" ? "Aktif" : "Non Aktif"}
                highlight
              />

              <InfoItem
                label="Tanggal Dibuat"
                value={new Date(data!.created_at).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />

              <InfoItem
                label="Terakhir Update"
                value={new Date(data!.updated_at).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) => {
  return (
    <div
      className={`flex flex-col p-3 sm:p-4 rounded-xl hover:shadow-md transition ${THEME_COLORS.background.tableHeader}`}
    >
      <span
        className={`text-xs sm:text-sm font-medium mb-1 ${THEME_COLORS.text.muted}`}
      >
        {label}
      </span>
      <span
        className={`text-sm sm:text-base font-medium wrap-break-word ${
          highlight
            ? "text-green-600 dark:text-green-400"
            : THEME_COLORS.text.primary
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
};

export default ProfileDetail;
