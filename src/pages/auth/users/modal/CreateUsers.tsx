import { useState, useEffect } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/utils/errorUtils";
import { fetchDesa, fetchKelompok } from "@/utils/locationUtils";
import { Select, Button } from "@/components/global";
import { Input } from "@/components/global/Input";
import { THEME_COLORS } from "@/config/theme";
import { UserPlus } from "lucide-react";

const CreateUsers = () => {
  const [balikanDataDesa, setBalikanDataDesa] = useState<any[]>([]);
  const [balikanDataKelompok, setBalikanDataKelompok] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .max(255, "Username Max. 255 karakter")
      .matches(/^[^\s]+$/, "Username tidak boleh mengandung spasi")
      .matches(/^[^.]+$/, "Username tidak boleh mengandung (.)")
      .required("Username harus diisi"),
    email: Yup.string()
      .email("Email tidak valid")
      .max(255, "Email Max. 255 karakter")
      .required("Email harus diisi"),
    nama_lengkap: Yup.string()
      .max(255, "Nama Max. 255 karakter")
      .required("Nama harus diisi"),
    password: Yup.string()
      .min(6, "Password minimal 6 karakter")
      .required("Password harus diisi"),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref("password")], "Password tidak cocok")
      .required("Konfirmasi password harus diisi"),
    role_id: Yup.string().required("Role harus diisi"),
    status: Yup.string().required("Status harus diisi"),
  });

  const initialValues = {
    username: "",
    email: "",
    nama_lengkap: "",
    password: "",
    password_confirmation: "",
    role_id: "",
    status: "1",
    role_daerah: dataBalikan?.balikanLogin?.user?.akses_daerah || "",
    role_desa: dataBalikan?.balikanLogin?.user?.akses_desa || "",
    role_kelompok: dataBalikan?.balikanLogin?.user?.akses_kelompok || "",
  };

  const statusAkun = [
    { value: "1", label: "Aktif" },
    { value: "0", label: "Tidak Aktif" },
  ];

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);
    try {
      const response = await axiosServices().post("/api/v1/users", values);
      const responseDatamessage = response.data;
      if (responseDatamessage.success === true) {
        toast.success("Sukses", {
          description: responseDatamessage.message,
          duration: 3000,
        });
        setTimeout(() => {
          navigate("/auth/users", { replace: true });
        }, 900);
      } else if (responseDatamessage.success === false) {
        toast.warning("Error", {
          description: responseDatamessage.message,
          duration: 3000,
        });
      } else {
        toast.error("Error", {
          description: responseDatamessage.message,
          duration: 3000,
        });
      }
    } catch (error: any) {
      setLoadingData(false);
      handleApiError(error, { showToast: true });
    } finally {
      setSubmitting(false);
    }
  };

  const loadDesaData = async (daerahId: any) => {
    const data = await fetchDesa(daerahId, setBalikanDataDesa);
    return data;
  };

  const loadKelompokData = async (desaId: any) => {
    const data = await fetchKelompok(desaId, setBalikanDataKelompok);
    return data;
  };

  useEffect(() => {
    const loadData = async () => {
      if (dataBalikan?.balikanLogin?.user) {
        if (dataBalikan.balikanLogin.user.akses_daerah) {
          await loadDesaData(dataBalikan.balikanLogin.user.akses_daerah);
        }
        if (dataBalikan.balikanLogin.user.akses_desa) {
          await loadKelompokData(dataBalikan.balikanLogin.user.akses_desa);
        }
      }
    };

    loadData();
  }, []);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {({ isSubmitting, setFieldValue, values }) => (
        <Form>
          <div
            className={`max-w-4xl mx-auto ${THEME_COLORS.background.card} rounded-xl shadow-lg`}
          >
            {loadingData && (
              <div
                className={`fixed inset-0 z-50 flex items-center justify-center ${THEME_COLORS.background.card} bg-opacity-75 dark:bg-opacity-75`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400"
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
                  <span className={`text-sm ${THEME_COLORS.text.secondary}`}>
                    Menyimpan data...
                  </span>
                </div>
              </div>
            )}

            {/* Header */}
            <div
              className={`flex items-center gap-3 p-4 border-b-2 ${THEME_COLORS.border.default}`}
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2
                  className={`text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Tambah User Baru
                </h2>
                <p className={`text-sm ${THEME_COLORS.text.muted}`}>
                  Lengkapi form untuk menambahkan user baru
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex flex-col gap-4 p-4">
              {/* Informasi Akun */}
              <div className="space-y-4">
                <h3
                  className={`text-sm font-semibold ${THEME_COLORS.text.primary} border-b ${THEME_COLORS.border.default} pb-2`}
                >
                  Informasi Akun
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="nama_lengkap"
                      name="nama_lengkap"
                      placeholder="Contoh: John Doe"
                    />
                    <ErrorMessage
                      name="nama_lengkap"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Username <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Contoh: johndoe"
                    />
                    <ErrorMessage
                      name="username"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as={Input}
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Contoh: johndoe@example.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-600 text-sm mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Minimal 6 karakter"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Konfirmasi Password{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="password"
                      id="password_confirmation"
                      name="password_confirmation"
                      placeholder="Ulangi password"
                    />
                    <ErrorMessage
                      name="password_confirmation"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Status */}
              <div className="space-y-4">
                <h3
                  className={`text-sm font-semibold ${THEME_COLORS.text.primary} border-b ${THEME_COLORS.border.default} pb-2`}
                >
                  Role & Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Role <span className="text-red-500">*</span>
                    </label>
                    <Select
                      id="role_id"
                      name="role_id"
                      value={
                        dataBalikan?.fetchDataRoles?.find(
                          (opt: any) => opt.value === values.role_id,
                        ) || null
                      }
                      options={dataBalikan?.fetchDataRoles || []}
                      onChange={(option: any) =>
                        setFieldValue("role_id", option?.value || "")
                      }
                      placeholder="Pilih role"
                      isClearable
                    />
                    <ErrorMessage
                      name="role_id"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      id="status"
                      name="status"
                      value={
                        statusAkun.find((opt) => opt.value === values.status) ||
                        null
                      }
                      options={statusAkun}
                      onChange={(option: any) =>
                        setFieldValue("status", option?.value || "")
                      }
                      placeholder="Pilih status"
                      isClearable
                    />
                    <ErrorMessage
                      name="status"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Akses Lokasi */}
              <div className="space-y-4">
                <h3
                  className={`text-sm font-semibold ${THEME_COLORS.text.primary} border-b ${THEME_COLORS.border.default} pb-2`}
                >
                  Akses Lokasi
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={THEME_COLORS.text.label}>Daerah</label>
                    <Select
                      id="role_daerah"
                      name="role_daerah"
                      value={
                        dataBalikan?.fetchdataDearah?.find(
                          (opt: any) => opt.value === values.role_daerah,
                        ) || null
                      }
                      options={dataBalikan?.fetchdataDearah || []}
                      onChange={async (option: any) => {
                        setFieldValue("role_daerah", option?.value || "");
                        setFieldValue("role_desa", "");
                        setFieldValue("role_kelompok", "");
                        if (option?.value) {
                          await loadDesaData(option.value);
                        } else {
                          setBalikanDataDesa([]);
                          setBalikanDataKelompok([]);
                        }
                      }}
                      placeholder="Pilih daerah"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_daerah !== null
                      }
                      isClearable
                      isSearchable
                    />
                    <ErrorMessage
                      name="role_daerah"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>Desa</label>
                    <Select
                      id="role_desa"
                      name="role_desa"
                      value={
                        balikanDataDesa?.find(
                          (opt: any) => opt.value === values.role_desa,
                        ) || null
                      }
                      options={balikanDataDesa || []}
                      onChange={async (option: any) => {
                        setFieldValue("role_desa", option?.value || "");
                        setFieldValue("role_kelompok", "");
                        if (option?.value) {
                          await loadKelompokData(option.value);
                        } else {
                          setBalikanDataKelompok([]);
                        }
                      }}
                      placeholder="Pilih desa"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_desa !== null
                      }
                      isClearable
                      isSearchable
                    />
                    <ErrorMessage
                      name="role_desa"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>Kelompok</label>
                    <Select
                      id="role_kelompok"
                      name="role_kelompok"
                      value={
                        balikanDataKelompok?.find(
                          (opt: any) => opt.value === values.role_kelompok,
                        ) || null
                      }
                      options={balikanDataKelompok || []}
                      onChange={(option: any) =>
                        setFieldValue("role_kelompok", option?.value || "")
                      }
                      placeholder="Pilih kelompok"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_kelompok !== null
                      }
                      isClearable
                      isSearchable
                    />
                    <ErrorMessage
                      name="role_kelompok"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
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
                onClick={() => navigate("/auth/users", { replace: true })}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingData}>
                {loadingData ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CreateUsers;
