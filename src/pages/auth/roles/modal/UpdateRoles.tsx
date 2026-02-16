import { useState, useEffect } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { handleApiError } from "@/utils/errorUtils";
import { Button } from "@/components/global";
import { Input } from "@/components/global/Input";
import { THEME_COLORS } from "@/config/theme";

const UpdateRoles = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const validationSchema = () => {
    let validation = Yup.object().shape({
      name: Yup.string()
        .max(255, "Nama Max. 255 karakter")
        .required("Nama harus diisi"),
      guard_name: Yup.string()
        .max(255, "Guard Max. 255 karakter")
        .required("Guard harus diisi"),
      description: Yup.string()
        .max(255, "Description Max. 255 karakter")
        .required("Description harus diisi"),
    });
    return validation;
  };

  const initialValues = {
    id: dataBalikan?.detailData?.id,
    uuid: dataBalikan?.detailData?.uuid,
    name: dataBalikan?.detailData?.name,
    guard_name: dataBalikan?.detailData?.guard_name,
    description: dataBalikan?.detailData?.description,
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);
    try {
      const response = await axiosServices().put(
        `/api/v1/roles/${values.uuid}`,
        values,
      );

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
        {({ isSubmitting }) => (
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
                  Update Roles
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

                <div>
                  <label className={THEME_COLORS.text.label}>Roles</label>

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
                    className="text-red-600 text-sm"
                  />
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>Guard</label>

                  <Field
                    as={Input}
                    type="text"
                    id="guard_name"
                    name="guard_name"
                    placeholder="Contoh: admin"
                  />

                  <ErrorMessage
                    name="guard_name"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div>
                  <label className={THEME_COLORS.text.label}>Description</label>

                  <Field
                    as={Input}
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Isi deskripsi disini..."
                  />

                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-red-600 text-sm"
                  />
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
                    navigate("/auth/roles", {
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

export default UpdateRoles;
