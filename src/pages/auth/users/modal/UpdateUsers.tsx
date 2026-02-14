import { useState, useEffect } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { handleApiError } from "@/utils/errorUtils";
import { fetchDesa, fetchKelompok } from "@/utils/locationUtils";
import { Select, Button } from "@/components/global";
import { Input } from "@/components/global/Input";
import { THEME_COLORS } from "@/config/theme";

const UpdateUsers = () => {
  const [balikanDataDesa, setBalikanDataDesa] = useState<any[]>([]);
  const [balikanDataKelompok, setBalikanDataKelompok] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const validationSchema = () => {
    let validation = Yup.object().shape({
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
      role_id: Yup.string().required("Role harus diisi"),
      status: Yup.string().required("Status harus diisi"),
    });
    return validation;
  };

  const initialValues = {
    id: dataBalikan?.detailData?.id,
    uuid: dataBalikan?.detailData?.uuid,
    username: dataBalikan?.detailData?.username,
    email: dataBalikan?.detailData?.email,
    nama_lengkap: dataBalikan?.detailData?.nama_lengkap,
    role_id: dataBalikan?.detailData?.role_id,
    status: dataBalikan?.detailData?.status,
    role_daerah: dataBalikan?.detailData?.kd_daerah,
    role_desa: dataBalikan?.detailData?.kd_desa,
    role_kelompok: dataBalikan?.detailData?.kd_kelompok,
    reason_ban: dataBalikan?.detailData?.reason_ban,
  };

  const statusAkun = [
    { value: "1", label: "Aktif" },
    { value: "0", label: "Tidak Aktif" },
    { value: "-1", label: "Blokir Akun" },
  ];

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);
    try {
      const response = await axiosServices().put(
        `/api/v1/users/${values.uuid}`,
        values,
      );

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
    if (!dataBalikan || !dataBalikan?.detailData?.id) {
      setShowModal(true);
    }
  }, [dataBalikan]);

  useEffect(() => {
    const loadData = async () => {
      if (dataBalikan?.detailData) {
        // Load desa if daerah exists
        if (dataBalikan.detailData.kd_daerah) {
          await loadDesaData(dataBalikan.detailData.kd_daerah);
        }
        // Load kelompok if desa exists
        if (dataBalikan.detailData.kd_desa) {
          await loadKelompokData(dataBalikan.detailData.kd_desa);
        }
      }
    };

    loadData();
  }, [dataBalikan?.detailData?.id]); // Hanya trigger saat detail data berubah

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form>
            {showModal && <ModalInvalidId />}

            <div
              className={`max-w-4xl mx-auto ${THEME_COLORS.background.card} rounded-xl`}
            >
              {loadingData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div
                    className={`flex flex-col items-center space-y-4 ${THEME_COLORS.background.card} p-6 rounded-xl shadow-2xl`}
                  >
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
                      Memuat...
                    </span>
                  </div>
                </div>
              )}
              <div
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b-2 ${THEME_COLORS.border.default} gap-3`}
              >
                <div
                  className={`text-sm sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Update Users
                </div>
                <div className="shrink-0">
                  {String(dataBalikan?.detailData?.status) === "0" && (
                    <div className="text-xs sm:text-sm text-center font-normal leading-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg px-2.5 py-2">
                      Tidak Aktif
                    </div>
                  )}
                  {String(dataBalikan?.detailData?.status) === "1" && (
                    <div className="text-xs sm:text-sm text-center font-normal leading-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg px-2.5 py-2">
                      Aktif
                    </div>
                  )}
                  {String(dataBalikan?.detailData?.status) === "-1" && (
                    <div className="text-xs sm:text-sm text-center font-normal leading-4 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-2">
                      Banned
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 sm:p-6">
                <div>
                  <label className={THEME_COLORS.text.label}>UUID</label>

                  <Field
                    as={Input}
                    id="uuid"
                    name="uuid"
                    placeholder="-"
                    disabled
                  />

                  <ErrorMessage
                    name="uuid"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Nama Lengkap
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="nama_lengkap"
                      name="nama_lengkap"
                      placeholder="Contoh: Dina A .K .A"
                    />

                    <ErrorMessage
                      name="nama_lengkap"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>Username</label>

                  <Field
                    as={Input}
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Contoh: dina_aka"
                  />

                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>Email</label>

                  <Field
                    as={Input}
                    id="email"
                    name="email"
                    rows={3}
                    placeholder="Isi Alamat"
                  />

                  <ErrorMessage
                    name="Email"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className={THEME_COLORS.text.label}>Role</label>

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
                      placeholder="Pilih salah satu"
                      isClearable
                    />

                    <ErrorMessage
                      name="role_id"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className={THEME_COLORS.text.label}>Status</label>

                    <Select
                      id="status"
                      name="status"
                      value={
                        statusAkun.find(
                          (opt) => opt.value === String(values.status),
                        ) || null
                      }
                      options={statusAkun}
                      onChange={(option: any) =>
                        setFieldValue("status", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                    />

                    <ErrorMessage
                      name="status"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-3">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Nama Daerah
                    </label>

                    <Select
                      id="role_daerah"
                      name="role_daerah"
                      value={
                        dataBalikan.fetchdataDearah?.find(
                          (opt: any) => opt.value === values.role_daerah,
                        ) || null
                      }
                      options={dataBalikan.fetchdataDearah || []}
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
                      placeholder="Pilih salah satu"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_daerah !== null
                      }
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="role_daerah"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>Nama Desa</label>
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
                      placeholder="Pilih salah satu"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_desa !== null
                      }
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="role_desa"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Nama Kelompok
                    </label>

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
                      placeholder="Pilih salah satu"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_kelompok !== null
                      }
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="role_kelompok"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div
                className={`flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 p-4 sm:p-6 ${THEME_COLORS.background.tableHeader} rounded-b-lg`}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    navigate("/auth/users", {
                      replace: true,
                    })
                  }
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default UpdateUsers;
