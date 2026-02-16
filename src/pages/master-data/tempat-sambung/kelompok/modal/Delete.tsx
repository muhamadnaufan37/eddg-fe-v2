import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { handleApiError } from "@/utils/errorUtils";
import { Button, Input } from "@/components/global";
import { toast } from "sonner";

interface DeleteProps {
  fetchData: () => void;
  onHide: () => void;
  detailData: any | null;
}

const Delete: React.FC<DeleteProps> = ({ fetchData, onHide, detailData }) => {
  const validationSchema = Yup.object().shape({
    id: Yup.string().required("ID harus diisi"),
  });

  const initialValues = {
    id: detailData?.id,
  };

  const handleSubmit = async ({ setSubmitting }: any) => {
    try {
      const response = await axiosServices().delete(
        `/api/v1/kelompok/${detailData?.id}`,
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
            <div className="hidden">
              <Field
                as={Input}
                id="id"
                name="id"
                className={`w-full ${
                  errors.id && touched.id ? "p-invalid" : ""
                }`}
                disabled
              />
              <ErrorMessage name="id" component="div" className="p-error" />
            </div>
            <div className="flex flex-col gap-4 p-2">
              <div>
                Apakah Anda yakin ingin <b>Menghapus data tersebut?</b>
              </div>
              <div className="flex gap-3">
                <Button onClick={onHide} variant="outline" className="flex-1">
                  Tutup
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Hapus Data
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default Delete;
