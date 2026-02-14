import { useState } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleApiError } from "@/utils/errorUtils";
import { Button } from "@/components/global";
import { Input, Textarea } from "@/components/global/Input";
import { THEME_COLORS } from "@/config/theme";
import { ShieldBan } from "lucide-react";

const CreateRoles = () => {
  const [loadingData, setLoadingData] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .max(255, "Role Max. 255 karakter")
      .required("Role harus diisi"),
    guard_name: Yup.string()
      .max(255, "Guard Max. 255 karakter")
      .required("Guard harus diisi"),
    description: Yup.string().required("Description harus diisi"),
  });

  const initialValues = {
    name: "",
    guard_name: "",
    description: "",
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);
    try {
      const response = await axiosServices().post("/api/v1/roles", values);
      const responseDatamessage = response.data;
      if (responseDatamessage.success === true) {
        toast.success("Sukses", {
          description: responseDatamessage.message,
          duration: 3000,
        });
        setTimeout(() => {
          navigate("/auth/roles", { replace: true });
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
      {({ isSubmitting }) => (
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
                <ShieldBan className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className={`text-base sm:text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Tambah Role Baru
                </h2>
                <p
                  className={`text-xs sm:text-sm ${THEME_COLORS.text.muted} line-clamp-1`}
                >
                  Lengkapi form untuk menambahkan role baru
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
                  Informasi Roles
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Contoh: admin"
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Guard Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Input}
                      type="text"
                      id="guard_name"
                      name="guard_name"
                      placeholder="Contoh: John Doe"
                    />
                    <ErrorMessage
                      name="guard_name"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className={THEME_COLORS.text.label}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as={Textarea}
                      type="text"
                      id="description"
                      name="description"
                      placeholder="Contoh: Deskripsi role"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-600 text-sm mt-1"
                    />
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
                onClick={() => navigate("/auth/roles", { replace: true })}
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

export default CreateRoles;
