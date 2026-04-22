import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { Button, Select } from "@/components/global";
import { Textarea } from "@/components/global/Input";
import { handleApiError } from "@/utils/errorUtils";
import {
  replyPengaduan,
  type PengaduanDetail,
} from "@/services/pengaduanService";
import { THEME_COLORS } from "@/config/theme";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const ReplyPengaduan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dataBalikan = location?.state as { detailData?: PengaduanDetail };
  const detailData = dataBalikan?.detailData;

  const initialValues = {
    balasan_admin: detailData?.balasan_admin || "",
    status_pengaduan: detailData?.status_pengaduan || "pending",
  };

  const validationSchema = Yup.object().shape({
    balasan_admin: Yup.string().required("Balasan admin wajib diisi"),
    status_pengaduan: Yup.string().required("Status pengaduan wajib dipilih"),
  });

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: any,
  ) => {
    if (!detailData?.uuid) {
      setSubmitting(false);
      return;
    }

    try {
      const response = await replyPengaduan(detailData.uuid, values);

      toast.success("Sukses", {
        description: response?.message || "Balasan pengaduan berhasil dikirim",
        duration: 3000,
      });

      setTimeout(() => {
        navigate("/pengaduan", { replace: true });
      }, 700);
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!detailData && <ModalInvalidId />}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form>
            <div
              className={`max-w-3xl mx-auto ${THEME_COLORS.background.card} rounded-xl shadow-lg`}
            >
              <div
                className={`p-4 sm:p-6 border-b-2 ${THEME_COLORS.border.default}`}
              >
                <h2
                  className={`text-base sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Balas Pengaduan
                </h2>
                <p className={`text-xs sm:text-sm ${THEME_COLORS.text.muted}`}>
                  Kirim balasan admin dan perbarui status pengaduan
                </p>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className={THEME_COLORS.text.label}>Pelapor</label>
                  <div className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {detailData?.nama_lengkap || "-"}
                  </div>
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>Subjek</label>
                  <div className={`text-sm ${THEME_COLORS.text.primary}`}>
                    {detailData?.subjek || "-"}
                  </div>
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>
                    Status Pengaduan
                  </label>
                  <Select
                    id="status_pengaduan"
                    name="status_pengaduan"
                    value={
                      STATUS_OPTIONS.find(
                        (opt) => opt.value === values.status_pengaduan,
                      ) || null
                    }
                    options={STATUS_OPTIONS}
                    onChange={(option: any) =>
                      setFieldValue("status_pengaduan", option?.value || "")
                    }
                    placeholder="Pilih status"
                    isClearable
                  />
                  <ErrorMessage
                    name="status_pengaduan"
                    component="div"
                    className="text-red-600 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>
                    Balasan Admin
                  </label>
                  <Field
                    as={Textarea}
                    rows={6}
                    id="balasan_admin"
                    name="balasan_admin"
                    placeholder="Tulis balasan untuk pengaduan ini"
                  />
                  <ErrorMessage
                    name="balasan_admin"
                    component="div"
                    className="text-red-600 text-sm mt-1"
                  />
                </div>
              </div>

              <div
                className={`flex justify-end gap-3 p-4 sm:p-6 border-t ${THEME_COLORS.border.default}`}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/pengaduan", { replace: true })}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || !detailData}>
                  Kirim Balasan
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default ReplyPengaduan;
