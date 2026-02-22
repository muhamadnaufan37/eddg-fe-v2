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
      className={`min-h-screen flex justify-center items-center p-6 ${THEME_COLORS.background.primary}`}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl p-8 ${THEME_COLORS.background.card}`}
      >
        <h1
          className={`text-2xl font-bold mb-6 text-center ${THEME_COLORS.text.primary}`}
        >
          Ubah Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className={`w-full py-3 rounded-xl transition-all font-medium disabled:opacity-50 ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText}`}
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
      <label className={`text-sm mb-1 ${THEME_COLORS.text.label}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl px-4 py-2 outline-none border ${THEME_COLORS.background.input} ${THEME_COLORS.border.input} ${THEME_COLORS.text.primary} focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#457b9d]`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className={`absolute right-3 top-2 text-sm ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.text}`}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

export default UbahPassword;
