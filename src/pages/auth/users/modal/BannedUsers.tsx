import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { handleApiError } from "@/utils/errorUtils";
import { Button, Input } from "@/components/global";
import { toast } from "sonner";
import { Textarea } from "@/components/global/Input";

interface BannedUsersProps {
  fetchData: () => void;
  onHide: () => void;
  detailData: any | null;
}

const BannedUsers: React.FC<BannedUsersProps> = ({
  fetchData,
  onHide,
  detailData,
}) => {
  const validationSchema = Yup.object().shape({
    uuid: Yup.string().required("ID harus diisi"),
    reason_ban: Yup.string().required("Alasan banned harus diisi"),
  });

  const initialValues = {
    uuid: detailData?.uuid,
    reason_ban: "",
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const response = await axiosServices().post(
        `/api/v1/users/${detailData?.uuid}/ban`,
        { reason_ban: values.reason_ban },
      );

      // Check if delete was successful (status 200-299)
      if (response.status >= 200 && response.status < 300) {
        toast.success("Berhasil!", {
          description: response.data?.message || "Data berhasil dihapus",
          duration: 3000,
        });
        setTimeout(() => {
          onHide();
          fetchData();
        }, 500);
      } else {
        throw new Error(response.data?.message || "Gagal menghapus data");
      }
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <div className="flex flex-col gap-3">
              <div>
                <Field
                  as={Input}
                  id="uuid"
                  name="uuid"
                  className={`w-full ${
                    errors.uuid && touched.uuid ? "border border-red-500" : ""
                  }`}
                  disabled
                />
                <ErrorMessage
                  name="uuid"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>
              <div>
                <Field
                  as={Textarea}
                  id="reason_ban"
                  name="reason_ban"
                  className={`w-full ${
                    errors.reason_ban && touched.reason_ban
                      ? "border border-red-500"
                      : ""
                  }`}
                />
                <ErrorMessage
                  name="reason_ban"
                  component="div"
                  className="text-red-500 text-xs"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 p-2">
              <div className="flex gap-3">
                <Button onClick={onHide} variant="outline" className="flex-1">
                  Tutup
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Blokir Pengguna
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default BannedUsers;
