import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Select } from "@/components/global";
import { Input, Textarea } from "@/components/global/Input";
import { handleApiError } from "@/utils/errorUtils";
import { createPengaduan } from "@/services/pengaduanService";
import { THEME_COLORS } from "@/config/theme";
import { MessageCirclePlus } from "lucide-react";

const JENIS_PENGADUAN_OPTIONS = [
  { value: "kritik_saran", label: "Kritik & Saran" },
  { value: "keluhan_data", label: "Keluhan Data" },
];

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

const CreatePengaduan = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    nama_lengkap: Yup.string().required("Nama lengkap wajib diisi"),
    kontak: Yup.string().required("Kontak wajib diisi"),
    jenis_pengaduan: Yup.string().required("Jenis pengaduan wajib dipilih"),
    subjek: Yup.string().required("Subjek wajib diisi"),
    isi_pengaduan: Yup.string().required("Isi pengaduan wajib diisi"),
    nama_kelompok: Yup.string().required("Nama kelompok wajib diisi"),
    lampiran: Yup.mixed()
      .required("Lampiran wajib diunggah")
      .test("fileFormat", "Format file harus png/jpeg/jpg", (value: any) => {
        if (!value) return false;
        return ALLOWED_TYPES.includes(value.type);
      })
      .test("fileSize", "Ukuran file maksimal 2MB", (value: any) => {
        if (!value) return false;
        return value.size <= FILE_SIZE_LIMIT;
      }),
  });

  const initialValues = {
    nama_lengkap: "",
    kontak: "",
    jenis_pengaduan: "",
    subjek: "",
    isi_pengaduan: "",
    nama_kelompok: "",
    lampiran: null as File | null,
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: any,
  ) => {
    setLoadingData(true);

    const formData = new FormData();
    formData.append("nama_lengkap", values.nama_lengkap);
    formData.append("kontak", values.kontak);
    formData.append("jenis_pengaduan", values.jenis_pengaduan);
    formData.append("subjek", values.subjek);
    formData.append("isi_pengaduan", values.isi_pengaduan);
    formData.append("nama_kelompok", values.nama_kelompok);

    if (values.lampiran) {
      formData.append("lampiran", values.lampiran);
    }

    try {
      const response = await createPengaduan(formData);

      toast.success("Sukses", {
        description: response?.message || "Pengaduan berhasil dibuat",
        duration: 3000,
      });

      setTimeout(() => {
        navigate("/pengaduan", { replace: true });
      }, 700);
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
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ isSubmitting, values, setFieldValue }) => (
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
                    Menyimpan pengaduan...
                  </span>
                </div>
              </div>
            )}

            <div
              className={`flex items-center gap-3 p-4 sm:p-6 border-b-2 ${THEME_COLORS.border.default}`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                <MessageCirclePlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={`text-base sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Buat Pengaduan
                </h2>
                <p className={`text-xs sm:text-sm ${THEME_COLORS.text.muted}`}>
                  Lengkapi data pengaduan dan unggah lampiran foto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6">
              <div>
                <label className={THEME_COLORS.text.label}>Nama Lengkap</label>
                <Field
                  as={Input}
                  id="nama_lengkap"
                  name="nama_lengkap"
                  placeholder="Masukkan nama lengkap"
                />
                <ErrorMessage
                  name="nama_lengkap"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div>
                <label className={THEME_COLORS.text.label}>Kontak</label>
                <Field
                  as={Input}
                  id="kontak"
                  name="kontak"
                  placeholder="No HP / kontak"
                />
                <ErrorMessage
                  name="kontak"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div>
                <label className={THEME_COLORS.text.label}>
                  Jenis Pengaduan
                </label>
                <Select
                  id="jenis_pengaduan"
                  name="jenis_pengaduan"
                  value={
                    JENIS_PENGADUAN_OPTIONS.find(
                      (opt) => opt.value === values.jenis_pengaduan,
                    ) || null
                  }
                  options={JENIS_PENGADUAN_OPTIONS}
                  onChange={(option: any) =>
                    setFieldValue("jenis_pengaduan", option?.value || "")
                  }
                  placeholder="Pilih jenis pengaduan"
                  isClearable
                />
                <ErrorMessage
                  name="jenis_pengaduan"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div>
                <label className={THEME_COLORS.text.label}>Nama Kelompok</label>
                <Field
                  as={Input}
                  id="nama_kelompok"
                  name="nama_kelompok"
                  placeholder="Masukkan nama kelompok"
                />
                <ErrorMessage
                  name="nama_kelompok"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className={THEME_COLORS.text.label}>Subjek</label>
                <Field
                  as={Input}
                  id="subjek"
                  name="subjek"
                  placeholder="Subjek pengaduan"
                />
                <ErrorMessage
                  name="subjek"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className={THEME_COLORS.text.label}>Isi Pengaduan</label>
                <Field
                  as={Textarea}
                  rows={4}
                  id="isi_pengaduan"
                  name="isi_pengaduan"
                  placeholder="Tuliskan isi pengaduan"
                />
                <ErrorMessage
                  name="isi_pengaduan"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className={THEME_COLORS.text.label}>
                  Lampiran (png/jpeg/jpg, max 2MB)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className={`w-full px-3 py-2 text-sm ${THEME_COLORS.background.input} border ${THEME_COLORS.border.input} rounded-md ${THEME_COLORS.text.primary}`}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setFieldValue("lampiran", file);
                    setPreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                <ErrorMessage
                  name="lampiran"
                  component="div"
                  className="text-red-600 text-sm mt-1"
                />

                {preview && (
                  <img
                    src={preview}
                    alt="Preview lampiran"
                    className="mt-3 max-h-52 rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                )}
              </div>
            </div>

            <div
              className={`flex items-center justify-end gap-3 p-4 sm:p-6 border-t ${THEME_COLORS.border.default}`}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/pengaduan", { replace: true })}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Simpan
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CreatePengaduan;
