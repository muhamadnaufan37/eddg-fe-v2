import { useState } from "react";
import { axiosServices } from "@/services/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { THEME_COLORS } from "@/config/theme";
import { getLocalStorage } from "@/services/localStorageService";

const UbahPassword = () => {
  const dataLogin = getLocalStorage("userData");
  const [form, setForm] = useState({
    id: dataLogin?.user?.id || "",
    password: "",
    konfirmasi_password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosServices().post("/api/v1/change-password", form);

      if (res.data.success) {
        toast.success("Password berhasil diubah");
        navigate("/auth/profile");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex justify-center items-start md:items-center p-3 sm:p-6 pt-6 md:pt-6 ${THEME_COLORS.background.primary}`}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 ${THEME_COLORS.background.card}`}
      >
        <h1
          className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center ${THEME_COLORS.text.primary}`}
        >
          Ubah Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <InputPassword
            label="Password Baru"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
          />

          <InputPassword
            label="Konfirmasi Password"
            value={form.konfirmasi_password}
            onChange={(v) => setForm({ ...form, konfirmasi_password: v })}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 sm:py-3 rounded-xl transition-all font-medium disabled:opacity-50 text-sm sm:text-base ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText}`}
          >
            {loading ? "Memproses..." : "Simpan Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

const InputPassword = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col">
      <label
        className={`text-xs sm:text-sm mb-1.5 sm:mb-2 font-medium ${THEME_COLORS.text.label}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#457b9d]`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className={`absolute right-2 sm:right-3 top-2 sm:top-2.5 text-xs sm:text-sm font-medium ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.text}`}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

export default UbahPassword;
