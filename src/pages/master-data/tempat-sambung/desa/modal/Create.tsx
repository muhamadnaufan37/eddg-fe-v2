import { useState } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/utils/errorUtils";
import { Button } from "@/components/global";
import { Select, Input } from "@/components/global";
import { THEME_COLORS } from "@/config/theme";
import { LucideWorkflow } from "lucide-react";
import { Textarea } from "@/components/global/Input";

const CreateDesa = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const statusOption = [
    { value: "1", label: "Aktif" },
    { value: "0", label: "Tidak Aktif" },
  ];

  const validationSchema = Yup.object().shape({
    nama_desa: Yup.string()
      .max(255, "Daerah Max. 255 karakter")
      .required("Daerah harus diisi"),
    alamat: Yup.string().max(255, "Alamat Max. 255 karakter"),
    latitude: Yup.string().max(255, "Latitude Max. 255 karakter"),
    longitude: Yup.string().max(255, "Longitude Max. 255 karakter"),
  });

  const initialValues = {
    daerah_id: "",
    nama_desa: "",
    alamat: "",
    latitude: "",
    longitude: "",
    is_active: "1",
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Error!", {
          description: "File harus berformat JPG atau PNG",
          duration: 3000,
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Error!", {
          description: "Ukuran file maksimal 5MB",
          duration: 3000,
        });
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);
    const formData = new FormData();

    // Append all form values
    Object.keys(values).forEach((key) => {
      if (
        values[key] !== null &&
        values[key] !== undefined &&
        values[key] !== ""
      ) {
        formData.append(key, values[key]);
      }
    });

    // Append the image file if selected
    if (selectedImage) {
      formData.append("img", selectedImage);
    }

    try {
      const response = await axiosServices().post("/api/v1/desa", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const responseDatamessage = response.data;
      if (responseDatamessage.success === true) {
        toast.success("Sukses", {
          description: responseDatamessage.message,
          duration: 3000,
        });
        setTimeout(() => {
          navigate("/master-data/tempat-sambung/desa", { replace: true });
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
                    Menyimpan data...
                  </span>
                </div>
              </div>
            )}

            {/* Header */}
            <div
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 sm:p-6 border-b-2 ${THEME_COLORS.border.default}`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                <LucideWorkflow className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={`text-base sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Tambah Desa Baru
                </h2>
                <p
                  className={`text-xs sm:text-sm ${THEME_COLORS.text.muted} line-clamp-1`}
                >
                  Lengkapi form untuk menambahkan desa baru
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
              {/* Informasi Roles */}
              <div className="space-y-4">
                <h3
                  className={`text-sm font-semibold ${THEME_COLORS.text.primary} border-b ${THEME_COLORS.border.default} pb-2`}
                >
                  Informasi Desa
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Daerah Asal
                    </label>
                    <Select
                      id="daerah_id"
                      name="daerah_id"
                      value={
                        dataBalikan?.fetchdataDearah?.find(
                          (opt: any) => opt.value === values.daerah_id,
                        ) || null
                      }
                      options={dataBalikan?.fetchdataDearah || []}
                      onChange={async (option: any) => {
                        setFieldValue("daerah_id", option?.value || "");
                      }}
                      placeholder="Pilih daerah"
                      isClearable
                      isSearchable
                    />
                    <ErrorMessage
                      name="daerah_id"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Nama Desa <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="nama_desa"
                      name="nama_desa"
                      placeholder="Contoh: Jakarta"
                    />
                    <ErrorMessage
                      name="nama_desa"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>Alamat</label>
                    <Field
                      as={Textarea}
                      type="text"
                      id="alamat"
                      name="alamat"
                      placeholder="Contoh: Jakarta"
                    />
                    <ErrorMessage
                      name="alamat"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Koordinat Lat
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="latitude"
                      name="latitude"
                      placeholder="Contoh: Jakarta"
                    />
                    <ErrorMessage
                      name="latitude"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Koordinat Long
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="longitude"
                      name="longitude"
                      placeholder="Contoh: Jakarta"
                    />
                    <ErrorMessage
                      name="longitude"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>

                  <div>
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
                        setFieldValue("is_active", option?.value || "")
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

                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Foto Tempat{" "}
                      <span className="text-gray-500 text-xs">
                        (Format: JPG/PNG, Max: 5MB)
                      </span>
                    </label>
                    <input
                      type="file"
                      id="img"
                      name="img"
                      accept="image/jpeg,image/png"
                      onChange={handleImageSelect}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
                    />
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              className={`flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 p-4 sm:p-6 ${THEME_COLORS.background.tableHeader} rounded-b-xl border-t ${THEME_COLORS.border.default}`}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  navigate("/master-data/tempat-sambung/desa", {
                    replace: true,
                  })
                }
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loadingData}
                className="w-full sm:w-auto"
              >
                {loadingData ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CreateDesa;
