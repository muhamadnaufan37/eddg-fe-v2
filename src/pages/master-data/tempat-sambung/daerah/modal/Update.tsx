import { useState, useEffect } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { handleApiError } from "@/utils/errorUtils";
import { Button } from "@/components/global";
import { Input, Textarea } from "@/components/global/Input";
import { Select } from "@/components/global";
import { THEME_COLORS } from "@/config/theme";

const UpdateDaerah = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const statusOption = [
    { value: true, label: "Aktif" },
    { value: false, label: "Tidak Aktif" },
  ];

  const validationSchema = () => {
    let validation = Yup.object().shape({
      nama_daerah: Yup.string()
        .max(255, "Nama daerah Max. 255 karakter")
        .required("Nama daerah harus diisi"),
    });
    return validation;
  };

  const initialValues = {
    id: dataBalikan?.detailData?.id,
    nama_daerah: dataBalikan?.detailData?.nama_daerah ?? "",
    alamat: dataBalikan?.detailData?.alamat ?? "",
    latitude: dataBalikan?.detailData?.lat ?? "",
    longitude: dataBalikan?.detailData?.long ?? "",
    is_active: dataBalikan?.detailData?.is_active ?? false,
    img: null, // 🔥 PENTING: jangan isi url
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);

    const formData = new FormData();
    formData.append("_method", "PUT");

    Object.keys(values).forEach((key) => {
      if (key === "img") return;

      const value = values[key];
      if (value === null || value === undefined) return;

      if (key === "is_active") {
        formData.append("is_active", value ? "1" : "0"); // ✅ FIX
        return;
      }

      formData.append(key, String(value));
    });

    // ✅ img hanya jika benar-benar File
    if (values.img instanceof File) {
      formData.append("img", values.img);
    }

    try {
      const response = await axiosServices().post(
        `/api/v1/daerah/${values.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const res = response.data;

      if (res.success) {
        toast.success("Sukses", { description: res.message, duration: 3000 });
        setTimeout(() => {
          navigate("/master-data/tempat-sambung/daerah", { replace: true });
        }, 900);
      } else {
        toast.warning("Error", { description: res.message, duration: 3000 });
      }
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setLoadingData(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!dataBalikan || !dataBalikan?.detailData?.id) {
      setShowModal(true);
    }
  }, [dataBalikan]);

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
                className={`flex justify-between items-center p-4 sm:p-6 border-b-2 ${THEME_COLORS.border.default} gap-2`}
              >
                <div
                  className={`text-sm sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Update daerah
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 sm:p-6">
                <div className="flex flex-col gap-2">
                  <label
                    className={`text-xs font-medium ${THEME_COLORS.text.muted}`}
                  >
                    Foto
                  </label>
                  <div className="flex">
                    {dataBalikan?.detailData?.img_url !== null ? (
                      <img
                        src={dataBalikan?.detailData?.img_url}
                        alt="Foto Peserta"
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
                <div className="flex flex-col gap-2">
                  <label className={THEME_COLORS.text.label}>Nama daerah</label>

                  <Field
                    as={Input}
                    type="text"
                    id="nama_daerah"
                    name="nama_daerah"
                    placeholder="Contoh: admin"
                  />

                  <ErrorMessage
                    name="nama_daerah"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={THEME_COLORS.text.label}>Alamat</label>

                  <Field
                    as={Textarea}
                    type="text"
                    id="alamat"
                    name="alamat"
                    placeholder="Contoh: Jl. Contoh No.123, Kota Contoh, Provinsi Contoh"
                  />

                  <ErrorMessage
                    name="alamat"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={THEME_COLORS.text.label}>Latitude</label>

                  <Field
                    as={Input}
                    type="text"
                    id="latitude"
                    name="latitude"
                    placeholder="Contoh: -6.2088"
                  />

                  <ErrorMessage
                    name="latitude"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={THEME_COLORS.text.label}>Longitude</label>

                  <Field
                    as={Input}
                    type="text"
                    id="longitude"
                    name="longitude"
                    placeholder="Contoh: 106.8456"
                  />

                  <ErrorMessage
                    name="longitude"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={THEME_COLORS.text.label}>
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="is_active"
                    name="is_active"
                    value={
                      statusOption.find(
                        (opt) => opt.value === values.is_active,
                      ) || null
                    }
                    options={statusOption}
                    onChange={(option: any) =>
                      setFieldValue("is_active", option?.value ?? "")
                    }
                    placeholder="Pilih status"
                    isClearable
                  />
                  <ErrorMessage
                    name="is_active"
                    component="div"
                    className="text-red-600 text-sm mt-1"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Upload ulang Foto Peserta &nbsp;
                      <span className="font-semibold text-red-600">
                        <i>*jika foto tidak sesuai silahkan upload ulang</i>
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Error!", {
                              description: "File terlalu besar (max 5MB)",
                            });
                            return;
                          }
                          setFieldValue("img", file);
                        }
                      }}
                      className="block w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none p-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Di upload ketika foto tidak sesuai saja, jika sudah sesuai
                      tidak diwajibkan upload ulang foto
                    </p>

                    <ErrorMessage
                      name="img"
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
                    navigate("/master-data/tempat-sambung/daerah", {
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

export default UpdateDaerah;
