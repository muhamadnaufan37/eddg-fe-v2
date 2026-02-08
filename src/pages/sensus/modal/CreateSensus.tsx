import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ArrowLeft, ArrowRight, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { axiosServices } from "@/services/axios";
import { handleApiError, handleApiResponse } from "@/utils/errorUtils";
import { fetchDesa, fetchKelompok } from "@/utils/locationUtils";
import { Button, Input, Label, Select, Stepper } from "@/components/global";
import type { Step } from "@/components/global";
import { LoadingOverlay } from "@/components/global/Spinner";
import {
  JENIS_KELAMIN_OPTIONS,
  IS_ATLET_ASAD_OPTIONS,
} from "@/constants/formOptions";
import { cn } from "@/lib/utils";

const CreateSensus = () => {
  const [balikanDataDesa, setBalikanDataDesa] = useState<any[]>([]);
  const [balikanDataKelompok, setBalikanDataKelompok] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

  const steps: Step[] = [
    { id: 1, label: "Data Pribadi", description: "Informasi Personal" },
    { id: 2, label: "Data Keluarga", description: "Keluarga & Detail" },
    { id: 3, label: "Data Tambahan", description: "Lokasi & Foto" },
  ];

  const validationSchemas = [
    // Step 1: Personal Information
    Yup.object().shape({
      nama_lengkap: Yup.string().required("Nama Lengkap harus diisi"),
      nama_panggilan: Yup.string().required("Nama Panggilan harus diisi"),
      tempat_lahir: Yup.string().required("Tempat Lahir harus diisi"),
      tanggal_lahir: Yup.date()
        .required("Tanggal Lahir harus diisi")
        .max(new Date(), "Tanggal lahir tidak boleh di masa depan"),
      jenis_kelamin: Yup.string().required("Jenis Kelamin harus diisi"),
      no_telepon: Yup.string()
        .nullable()
        .matches(/^[0-9]+$/, "Nomor telepon hanya boleh berisi angka")
        .min(8, "Nomor telepon minimal 8 digit")
        .max(15, "Nomor telepon maksimal 15 digit"),
    }),
    // Step 2: Family Information
    Yup.object().shape({
      alamat: Yup.string().required("Alamat harus diisi"),
      nama_ayah: Yup.string().required("Nama Bapak harus diisi"),
      nama_ibu: Yup.string().required("Nama Ibu harus diisi"),
      hoby: Yup.string().required("Hoby harus diisi"),
      pekerjaan: Yup.string().required("Pekerjaan harus diisi"),
    }),
    // Step 3: Additional Information
    Yup.object().shape({
      status_atlet_asad: Yup.mixed().required("Status Atlet ASAD harus diisi"),
      tmpt_daerah: Yup.mixed().required("Nama Daerah harus diisi"),
      tmpt_desa: Yup.mixed().required("Nama Desa harus diisi"),
      tmpt_kelompok: Yup.mixed().required("Nama Kelompok harus diisi"),
    }),
  ];

  const initialValues = {
    nama_lengkap: "",
    nama_panggilan: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    jenis_kelamin: "",
    no_telepon: "",
    nama_ayah: "",
    nama_ibu: "",
    hoby: "",
    pekerjaan: "",
    usia_menikah: "",
    kriteria_pasangan: "",
    status_atlet_asad: "",
    tmpt_daerah: dataBalikan?.balikanLogin?.user?.akses_daerah || "",
    tmpt_desa: dataBalikan?.balikanLogin?.user?.akses_desa || "",
    tmpt_kelompok: dataBalikan?.balikanLogin?.user?.akses_kelompok || "",
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

  const handleSubmit = async (values: any) => {
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
      const response = await axiosServices().post(
        "/api/v1/data_peserta",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      handleApiResponse(
        response,
        (responseData) => {
          toast.success("Sukses", {
            description: responseData.message || "Data berhasil disimpan",
            duration: 3000,
          });
          setTimeout(() => {
            navigate("/sensus", { replace: true });
          }, 1500);
        },
        () => {
          setLoadingData(false);
        },
      );
    } catch (error: any) {
      setLoadingData(false);
      handleApiError(error, { showToast: true });
    }
  };

  const loadDesaData = async (id: any) => {
    await fetchDesa(
      dataBalikan?.balikanLogin?.user?.akses_daerah || id,
      setBalikanDataDesa,
    );
  };

  const loadKelompokData = async (desaId: any) => {
    await fetchKelompok(
      dataBalikan?.balikanLogin?.user?.akses_desa || desaId,
      setBalikanDataKelompok,
    );
  };

  useEffect(() => {
    const loadData = async () => {
      if (dataBalikan?.balikanLogin?.user?.akses_daerah) {
        await loadDesaData(dataBalikan.balikanLogin.akses_daerah);
      }
      if (dataBalikan?.balikanLogin?.user?.akses_desa) {
        await loadKelompokData(dataBalikan.balikanLogin.akses_desa);
      }
    };

    loadData();
  }, [
    dataBalikan?.balikanLogin?.user?.akses_daerah,
    dataBalikan?.balikanLogin?.user?.akses_desa,
  ]);

  const handleNext = async (validateForm: any) => {
    const errors = await validateForm();
    const stepFields = getStepFields(currentStep);
    const stepErrors = Object.keys(errors).filter((key) =>
      stepFields.includes(key),
    );

    if (stepErrors.length === 0) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    } else {
      toast.warning("Perhatian", {
        description: "Mohon lengkapi semua field yang wajib diisi",
        duration: 3000,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0:
        return [
          "nama_lengkap",
          "nama_panggilan",
          "tempat_lahir",
          "tanggal_lahir",
          "jenis_kelamin",
          "no_telepon",
        ];
      case 1:
        return ["alamat", "nama_ayah", "nama_ibu", "hoby", "pekerjaan"];
      case 2:
        return [
          "status_atlet_asad",
          "jenis_data",
          "tmpt_daerah",
          "tmpt_desa",
          "tmpt_kelompok",
        ];
      default:
        return [];
    }
  };

  return (
      <div className="max-w-5xl mx-auto">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchemas[currentStep]}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ errors, touched, values, setFieldValue, validateForm }) => (
            <Form>
              {loadingData && <LoadingOverlay />}

              {/* Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate("/sensus", { replace: true })}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </button>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Create Sensus
                  </h1>
                  <div className="w-24" /> {/* Spacer for alignment */}
                </div>

                {/* Info Alert */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                      Jika ada data sensus yang ingin melakukan tambah data,
                      harap diperhatikan lagi data yang akan ditambahkan
                    </p>
                  </div>
                </div>

                {/* Stepper */}
                <div className="px-6 pb-6">
                  <Stepper
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    allowNavigation={false}
                  />
                </div>
              </div>

              {/* Form Content */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {/* Step 1: Personal Information */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Data Pribadi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="nama_lengkap">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          id="nama_lengkap"
                          name="nama_lengkap"
                          placeholder="Contoh: Dina A.K.A"
                          className={cn(
                            errors.nama_lengkap &&
                              touched.nama_lengkap &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="nama_lengkap"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nama_panggilan">
                          Nama Panggilan <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          id="nama_panggilan"
                          name="nama_panggilan"
                          placeholder="Contoh: Dina"
                          className={cn(
                            errors.nama_panggilan &&
                              touched.nama_panggilan &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="nama_panggilan"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tempat_lahir">
                          Tempat Lahir <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          id="tempat_lahir"
                          name="tempat_lahir"
                          placeholder="Contoh: Jakarta"
                          className={cn(
                            errors.tempat_lahir &&
                              touched.tempat_lahir &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="tempat_lahir"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tanggal_lahir">
                          Tanggal Lahir <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          type="date"
                          id="tanggal_lahir"
                          name="tanggal_lahir"
                          max={new Date().toISOString().split("T")[0]}
                          className={cn(
                            errors.tanggal_lahir &&
                              touched.tanggal_lahir &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="tanggal_lahir"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="jenis_kelamin">
                          Jenis Kelamin <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="jenis_kelamin"
                          name="jenis_kelamin"
                          value={
                            JENIS_KELAMIN_OPTIONS.find(
                              (opt) => opt.value === values.jenis_kelamin,
                            ) || null
                          }
                          options={JENIS_KELAMIN_OPTIONS}
                          onChange={(option: any) => {
                            setFieldValue("jenis_kelamin", option?.value || "");
                          }}
                          placeholder="Pilih jenis kelamin"
                          isClearable
                          className={cn(
                            errors.jenis_kelamin &&
                              touched.jenis_kelamin &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="jenis_kelamin"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="no_telepon">Kontak Hp / WA</Label>
                        <Field
                          as={Input}
                          id="no_telepon"
                          name="no_telepon"
                          placeholder="Contoh: 08123456789"
                          className={cn(
                            errors.no_telepon &&
                              touched.no_telepon &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="no_telepon"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Family Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Data Keluarga & Detail
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Label htmlFor="alamat">
                          Alamat <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as="textarea"
                          id="alamat"
                          name="alamat"
                          rows={3}
                          placeholder="Masukkan alamat lengkap"
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                            errors.alamat && touched.alamat && "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="alamat"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nama_ayah">
                          Nama Bapak <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          id="nama_ayah"
                          name="nama_ayah"
                          placeholder="Masukkan nama bapak"
                          className={cn(
                            errors.nama_ayah &&
                              touched.nama_ayah &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="nama_ayah"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nama_ibu">
                          Nama Ibu <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          id="nama_ibu"
                          name="nama_ibu"
                          placeholder="Masukkan nama ibu"
                          className={cn(
                            errors.nama_ibu &&
                              touched.nama_ibu &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="nama_ibu"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hoby">
                          Hoby <span className="text-red-500">*</span>
                        </Label>
                        <Field
                          as={Input}
                          id="hoby"
                          name="hoby"
                          placeholder="Masukkan hoby"
                          className={cn(
                            errors.hoby && touched.hoby && "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="hoby"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pekerjaan">
                          Pekerjaan <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="pekerjaan"
                          name="pekerjaan"
                          value={
                            (dataBalikan?.dataPekerjaan || []).find(
                              (opt: any) => opt.value === values.pekerjaan,
                            ) || null
                          }
                          options={dataBalikan?.dataPekerjaan || []}
                          onChange={(option: any) => {
                            setFieldValue("pekerjaan", option?.value || "");
                          }}
                          placeholder="Pilih pekerjaan"
                          isClearable
                          className={cn(
                            errors.pekerjaan &&
                              touched.pekerjaan &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="pekerjaan"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="usia_menikah">
                          Usia Menikah{" "}
                          <span className="text-gray-500 text-xs">
                            (Opsional)
                          </span>
                        </Label>
                        <Field
                          as={Input}
                          type="number"
                          id="usia_menikah"
                          name="usia_menikah"
                          placeholder="Contoh: 25"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="kriteria_pasangan">
                          Kriteria Pasangan{" "}
                          <span className="text-gray-500 text-xs">
                            (Opsional)
                          </span>
                        </Label>
                        <Field
                          as="textarea"
                          id="kriteria_pasangan"
                          name="kriteria_pasangan"
                          rows={3}
                          placeholder="Masukkan kriteria pasangan"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Data Tambahan
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="status_atlet_asad">
                          Status Atlet Asad{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="status_atlet_asad"
                          name="status_atlet_asad"
                          value={
                            IS_ATLET_ASAD_OPTIONS.find(
                              (opt: any) =>
                                opt.value === values.status_atlet_asad,
                            ) || null
                          }
                          options={IS_ATLET_ASAD_OPTIONS}
                          onChange={(option: any) => {
                            setFieldValue(
                              "status_atlet_asad",
                              option?.value ?? false,
                            );
                          }}
                          placeholder="Pilih status"
                          isClearable
                          className={cn(
                            errors.status_atlet_asad &&
                              touched.status_atlet_asad &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="status_atlet_asad"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tmpt_daerah">
                          Nama Daerah <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="tmpt_daerah"
                          name="tmpt_daerah"
                          value={
                            (dataBalikan?.fetchdataDearah || []).find(
                              (opt: any) => opt.value === values.tmpt_daerah,
                            ) || null
                          }
                          options={dataBalikan?.fetchdataDearah || []}
                          onChange={async (option: any) => {
                            setFieldValue("tmpt_daerah", option?.value || "");
                            setFieldValue("tmpt_desa", "");
                            setFieldValue("tmpt_kelompok", "");
                            if (option?.value) {
                              await fetchDesa(option.value, setBalikanDataDesa);
                            } else {
                              setBalikanDataDesa([]);
                              setBalikanDataKelompok([]);
                            }
                          }}
                          placeholder="Pilih daerah"
                          isClearable
                          isDisabled={
                            dataBalikan?.balikanLogin?.user?.akses_daerah !==
                            null
                          }
                          className={cn(
                            errors.tmpt_daerah &&
                              touched.tmpt_daerah &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="tmpt_daerah"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tmpt_desa">
                          Nama Desa <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="tmpt_desa"
                          name="tmpt_desa"
                          value={
                            balikanDataDesa.find(
                              (opt: any) => opt.value === values.tmpt_desa,
                            ) || null
                          }
                          options={balikanDataDesa}
                          onChange={async (option: any) => {
                            setFieldValue("tmpt_desa", option?.value || "");
                            setFieldValue("tmpt_kelompok", "");
                            if (option?.value) {
                              await fetchKelompok(
                                option.value,
                                setBalikanDataKelompok,
                              );
                            } else {
                              setBalikanDataKelompok([]);
                            }
                          }}
                          placeholder="Pilih desa"
                          isClearable
                          isDisabled={
                            !values.tmpt_daerah ||
                            dataBalikan?.balikanLogin?.user?.akses_desa !== null
                          }
                          className={cn(
                            errors.tmpt_desa &&
                              touched.tmpt_desa &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="tmpt_desa"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tmpt_kelompok">
                          Nama Kelompok <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          id="tmpt_kelompok"
                          name="tmpt_kelompok"
                          value={
                            balikanDataKelompok.find(
                              (opt: any) => opt.value === values.tmpt_kelompok,
                            ) || null
                          }
                          options={balikanDataKelompok}
                          onChange={(option: any) => {
                            setFieldValue("tmpt_kelompok", option?.value || "");
                          }}
                          placeholder="Pilih kelompok"
                          isClearable
                          isDisabled={
                            !values.tmpt_desa ||
                            dataBalikan?.balikanLogin?.user?.akses_kelompok !==
                              null
                          }
                          className={cn(
                            errors.tmpt_kelompok &&
                              touched.tmpt_kelompok &&
                              "border-red-500",
                          )}
                        />
                        <ErrorMessage
                          name="tmpt_kelompok"
                          component="div"
                          className="text-xs text-red-500 mt-1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="img">
                          Foto Peserta{" "}
                          <span className="text-gray-500 text-xs">
                            (Format: JPG/PNG, Max: 5MB)
                          </span>
                        </Label>
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
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Sebelumnya
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => handleNext(validateForm)}
                      className="inline-flex items-center gap-2"
                    >
                      Selanjutnya
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loadingData}
                      className="inline-flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {loadingData ? "Menyimpan..." : "Simpan Data"}
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
  );
};

export default CreateSensus;
