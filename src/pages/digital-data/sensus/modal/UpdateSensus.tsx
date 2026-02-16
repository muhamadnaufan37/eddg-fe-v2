import { useState, useEffect } from "react";
import { axiosServices } from "@/services/axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { handleApiError } from "@/utils/errorUtils";
import { fetchDesa, fetchKelompok } from "@/utils/locationUtils";
import {
  JENIS_KELAMIN_OPTIONS,
  IS_ATLET_ASAD_OPTIONS,
  STATUS_PERNIKAHAN_OPTIONS,
  STATUS_SAMBUNG_OPTIONS,
  JENIS_DATA_OPTIONS,
} from "@/constants/formOptions";
import { Select, Button } from "@/components/global";
import { Input, Textarea } from "@/components/global/Input";

const UpdateSensus = () => {
  const [balikanDataDesa, setBalikanDataDesa] = useState<any[]>([]);
  const [balikanDataKelompok, setBalikanDataKelompok] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    nama_lengkap: Yup.string().required("Nama Lengkap harus diisi"),
    nama_panggilan: Yup.string().required("Nama Panggilan harus diisi"),
    tempat_lahir: Yup.string().required("Tampat Lahir harus diisi"),
    tanggal_lahir: Yup.date().required("Tanggal Lahir harus diisi"),
    alamat: Yup.string().required("Alamat harus diisi"),
    jenis_kelamin: Yup.string().required("Jenis Kelamin harus diisi"),
    no_telepon: Yup.string()
      .nullable()
      .matches(/^[0-9]+$/, "Nomor telepon hanya boleh berisi angka")
      .min(8, "Nomor telepon harus terdiri dari minimal 8 digit")
      .max(15, "Nomor telepon harus terdiri dari maksimal 15 digit"),
    nama_ayah: Yup.string().required("Nama Bapak harus diisi"),
    nama_ibu: Yup.string().required("Nama Ibu harus diisi"),
    hoby: Yup.string().required("Hoby harus diisi"),
    pekerjaan: Yup.number().required("Pekerjaan harus diisi"),
    status_pernikahan: Yup.string().required("Status Pernikahan harus diisi"),
    status_sambung: Yup.string().required("Status Sambung harus diisi"),
    status_atlet_asad: Yup.string().required("Data harus diisi"),
  });

  const initialValues = {
    id: dataBalikan?.detailData?.id,
    kode_cari_data: dataBalikan?.detailData?.kode_cari_data,
    nama_lengkap: dataBalikan?.detailData?.nama_lengkap,
    nama_panggilan: dataBalikan?.detailData?.nama_panggilan,
    tempat_lahir: dataBalikan?.detailData?.tempat_lahir,
    tanggal_lahir: dataBalikan?.detailData?.tanggal_lahir,
    alamat: dataBalikan?.detailData?.alamat,
    usia: dataBalikan?.detailData?.umur,
    jenis_kelamin: dataBalikan?.detailData?.jenis_kelamin,
    no_telepon: dataBalikan?.detailData?.no_telepon,
    nama_ayah: dataBalikan?.detailData?.nama_ayah,
    nama_ibu: dataBalikan?.detailData?.nama_ibu,
    hoby: dataBalikan?.detailData?.hoby,
    pekerjaan: dataBalikan?.detailData?.kd_pekerjaan,
    usia_menikah: dataBalikan?.detailData?.usia_menikah,
    kriteria_pasangan: dataBalikan?.detailData?.kriteria_pasangan,
    tmpt_daerah: dataBalikan?.detailData?.kd_daerah,
    tmpt_desa: dataBalikan?.detailData?.kd_desa,
    tmpt_kelompok: dataBalikan?.detailData?.kd_kelompok,
    status_pernikahan: dataBalikan?.detailData?.status_pernikahan,
    status_sambung: dataBalikan?.detailData?.status_sambung,
    status_kelas: dataBalikan?.detailData?.kelas_label,
    status_atlet_asad: dataBalikan?.detailData?.status_atlet_asad,
    jenis_data: dataBalikan?.detailData?.jenis_data,
    user_id: dataBalikan?.detailData?.id_petugas_input,
    img: null,
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setLoadingData(true);

    const formData = new FormData();
    formData.append("_method", "PUT");

    Object.keys(values).forEach((key) => {
      if (key === "img") return;

      const value = values[key];
      if (value === null || value === undefined) return;

      formData.append(key, String(value));
    });

    // ✅ img hanya jika benar-benar File
    if (values.img instanceof File) {
      formData.append("img", values.img);
    }

    try {
      const response = await axiosServices().post(
        `/api/v1/data_peserta/${values.kode_cari_data}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const responseDatamessage = response.data;
      if (responseDatamessage.success === true) {
        toast.success("Sukses", {
          description: responseDatamessage.message,
          duration: 3000,
        });
        setTimeout(() => {
          navigate("/sensus", { replace: true });
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

            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl">
              {loadingData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75">
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
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Memuat...
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center p-3 border-b-2 border-gray-200 dark:border-gray-700 gap-2">
                <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
                  Update Sensus
                </div>
                {dataBalikan?.detailData?.status_sambung === 0 && (
                  <div className="text-[14px] text-center font-normal leading-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg p-2.5">
                    Tidak Sambung
                  </div>
                )}
                {dataBalikan?.detailData?.status_sambung === 1 && (
                  <div className="text-[14px] text-center font-normal leading-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg p-2.5">
                    Sambung
                  </div>
                )}
                {dataBalikan?.detailData?.status_sambung === 2 && (
                  <div className="text-[14px] text-center font-normal leading-4 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg p-2.5">
                    Pindah Sambung
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-2">
                  <label className="text-gray-900 dark:text-white">
                    Foto Peserta
                  </label>
                  {dataBalikan?.detailData?.img_url !== null ? (
                    <img
                      src={dataBalikan?.detailData?.img_url}
                      alt="Foto Peserta"
                      className="w-20 h-15 object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <span className="font-semibold text-xs italic w-full text-gray-700 dark:text-gray-300">
                        *data si bro ini belum upload foto
                        &#128511;&#128511;&#128511;
                      </span>
                    </>
                  )}

                  <ErrorMessage
                    name="img"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div>
                  <label className="text-gray-900 dark:text-white">
                    Nomor Induk Peserta
                  </label>

                  <Field
                    as={Input}
                    id="kode_cari_data"
                    name="kode_cari_data"
                    placeholder="-"
                    disabled
                  />

                  <ErrorMessage
                    name="kode_cari_data"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
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

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Panggilan
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="nama_panggilan"
                      name="nama_panggilan"
                      placeholder="Contoh: Dina"
                    />

                    <ErrorMessage
                      name="nama_panggilan"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Tempat Lahir
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="tempat_lahir"
                      name="tempat_lahir"
                      placeholder="Contoh: London"
                    />

                    <ErrorMessage
                      name="tempat_lahir"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Tanggal Lahir
                    </label>

                    <Field
                      as={Input}
                      type="date"
                      id="tanggal_lahir"
                      name="tanggal_lahir"
                    />

                    <ErrorMessage
                      name="tanggal_lahir"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-900 dark:text-white">
                    Usia Saat Ini
                  </label>

                  <Field
                    as={Input}
                    type="text"
                    id="usia"
                    name="usia"
                    placeholder="Contoh: 25"
                    disabled
                  />

                  <ErrorMessage
                    name="usia"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div>
                  <label className="text-gray-900 dark:text-white">
                    Alamat
                  </label>

                  <Field
                    as={Textarea}
                    id="alamat"
                    name="alamat"
                    rows={3}
                    placeholder="Isi Alamat"
                  />

                  <ErrorMessage
                    name="alamat"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Jenis Kelamin
                    </label>

                    <Select
                      id="jenis_kelamin"
                      name="jenis_kelamin"
                      value={
                        JENIS_KELAMIN_OPTIONS.find(
                          (opt) => opt.value === values.jenis_kelamin,
                        ) || null
                      }
                      options={JENIS_KELAMIN_OPTIONS}
                      onChange={(option: any) =>
                        setFieldValue("jenis_kelamin", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                    />

                    <ErrorMessage
                      name="jenis_kelamin"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Kontak Hp / WA
                    </label>

                    <Field
                      as={Input}
                      type="tel"
                      id="no_telepon"
                      name="no_telepon"
                      placeholder="Contoh: 08945XXXX"
                    />

                    <ErrorMessage
                      name="no_telepon"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Bapak
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="nama_ayah"
                      name="nama_ayah"
                      placeholder="Contoh Bpk. Erik"
                    />

                    <ErrorMessage
                      name="nama_ayah"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Ibu
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="nama_ibu"
                      name="nama_ibu"
                      placeholder="Contoh: Ibu Erika"
                    />

                    <ErrorMessage
                      name="nama_ibu"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Hoby
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="hoby"
                      name="hoby"
                      placeholder="Contoh: Menyanyi / Berkebun / DLL"
                    />

                    <ErrorMessage
                      name="hoby"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Pekerjaan
                    </label>

                    <Select
                      id="pekerjaan"
                      name="pekerjaan"
                      value={
                        dataBalikan?.dataPekerjaan?.find(
                          (opt: any) => opt.value === values.pekerjaan,
                        ) || null
                      }
                      options={dataBalikan?.dataPekerjaan || []}
                      onChange={(option: any) =>
                        setFieldValue("pekerjaan", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="pekerjaan"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Usia Menikah &nbsp;
                      <span className="font-semibold text-red-600">
                        <i>*Tidak Wajib Diisi</i>
                      </span>
                    </label>

                    <Field
                      as={Input}
                      type="number"
                      id="usia_menikah"
                      name="usia_menikah"
                      placeholder="Contoh: 25"
                    />

                    <ErrorMessage
                      name="usia_menikah"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Kriteria Pasangan &nbsp;
                      <span className="font-semibold text-red-600">
                        <i>*Tidak Wajib Diisi</i>
                      </span>
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="kriteria_pasangan"
                      name="kriteria_pasangan"
                      placeholder="Contoh: baik / faham / lancar 5 bab / DLL"
                    />

                    <ErrorMessage
                      name="kriteria_pasangan"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-900 dark:text-white">
                    Status Atlet Asad &nbsp;
                    <span className="font-semibold text-red-600">
                      <i>*Tidak Wajib Diisi</i>
                    </span>
                  </label>

                  <Select
                    id="status_atlet_asad"
                    name="status_atlet_asad"
                    value={
                      IS_ATLET_ASAD_OPTIONS.find(
                        (opt) => opt.value === values.status_atlet_asad,
                      ) || null
                    }
                    options={IS_ATLET_ASAD_OPTIONS}
                    onChange={(option: any) =>
                      setFieldValue("status_atlet_asad", option?.value || "")
                    }
                    placeholder="Pilih salah satu"
                    isClearable
                    isSearchable
                  />

                  <ErrorMessage
                    name="status_atlet_asad"
                    component="div"
                    className="text-red-600 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Daerah
                    </label>

                    <Select
                      id="tmpt_daerah"
                      name="tmpt_daerah"
                      value={
                        dataBalikan?.fetchdataDearah?.find(
                          (opt: any) => opt.value === values.tmpt_daerah,
                        ) || null
                      }
                      options={dataBalikan?.fetchdataDearah || []}
                      onChange={async (option: any) => {
                        setFieldValue("tmpt_daerah", option?.value || "");
                        setFieldValue("tmpt_desa", "");
                        setFieldValue("tmpt_kelompok", "");
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
                      name="tmpt_daerah"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Desa
                    </label>
                    <Select
                      id="tmpt_desa"
                      name="tmpt_desa"
                      value={
                        balikanDataDesa?.find(
                          (opt: any) => opt.value === values.tmpt_desa,
                        ) || null
                      }
                      options={balikanDataDesa || []}
                      onChange={async (option: any) => {
                        setFieldValue("tmpt_desa", option?.value || "");
                        setFieldValue("tmpt_kelompok", "");
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
                      name="tmpt_desa"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Kelompok
                    </label>

                    <Select
                      id="tmpt_kelompok"
                      name="tmpt_kelompok"
                      value={
                        balikanDataKelompok?.find(
                          (opt: any) => opt.value === values.tmpt_kelompok,
                        ) || null
                      }
                      options={balikanDataKelompok || []}
                      onChange={(option: any) =>
                        setFieldValue("tmpt_kelompok", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isDisabled={
                        dataBalikan?.balikanLogin?.user?.akses_kelompok !== null
                      }
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="tmpt_kelompok"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Status Sambung
                    </label>

                    <Select
                      id="status_sambung"
                      name="status_sambung"
                      value={
                        STATUS_SAMBUNG_OPTIONS.find(
                          (opt) => opt.value === values.status_sambung,
                        ) || null
                      }
                      options={STATUS_SAMBUNG_OPTIONS}
                      onChange={(option: any) =>
                        setFieldValue("status_sambung", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="status_sambung"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Status Pernikahan
                    </label>

                    <Select
                      id="status_pernikahan"
                      name="status_pernikahan"
                      value={
                        STATUS_PERNIKAHAN_OPTIONS.find(
                          (opt) => opt.value === values.status_pernikahan,
                        ) || null
                      }
                      options={STATUS_PERNIKAHAN_OPTIONS}
                      onChange={(option: any) =>
                        setFieldValue("status_pernikahan", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="status_pernikahan"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Jenis Entry Data
                    </label>

                    <Select
                      id="jenis_data"
                      name="jenis_data"
                      value={
                        JENIS_DATA_OPTIONS.find(
                          (opt) => opt.value === values.jenis_data,
                        ) || null
                      }
                      options={JENIS_DATA_OPTIONS}
                      onChange={(option: any) =>
                        setFieldValue("jenis_data", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                      isSearchable
                    />

                    <ErrorMessage
                      name="jenis_data"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Status Kelas
                    </label>

                    <Field
                      as={Input}
                      type="text"
                      id="status_kelas"
                      name="status_kelas"
                      disabled
                    />

                    <ErrorMessage
                      name="status_kelas"
                      component="div"
                      className="text-red-600 text-sm"
                    />
                  </div>

                  {dataBalikan?.balikanLogin?.role_id ===
                    "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
                    <div>
                      <label className="text-gray-900 dark:text-white">
                        Diinput Oleh
                      </label>

                      <Select
                        id="user_id"
                        name="user_id"
                        value={
                          dataBalikan?.fetchDataUsersSensus?.find(
                            (opt: any) => opt.value === values.user_id,
                          ) || null
                        }
                        options={dataBalikan?.fetchDataUsersSensus || []}
                        onChange={(option: any) =>
                          setFieldValue("user_id", option?.value || "")
                        }
                        placeholder="Pilih salah satu"
                        isDisabled={
                          (dataBalikan?.balikanLogin?.user?.akses_desa !==
                            null &&
                            dataBalikan?.balikanLogin?.user?.akses_kelompok !==
                              null) ||
                          dataBalikan?.balikanLogin?.role_id !==
                            "219bc0dd-ec72-4618-b22d-5d5ff612dcaf"
                        }
                        isClearable
                        isSearchable
                      />

                      <ErrorMessage
                        name="user_id"
                        component="div"
                        className="text-red-600 text-sm"
                      />
                    </div>
                  )}
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

              <div className="flex justify-end items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-b-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate("/sensus", {
                      replace: true,
                    })
                  }
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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

export default UpdateSensus;
