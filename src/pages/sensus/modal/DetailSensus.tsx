import { useState, useEffect } from "react";
import { Formik, Form, ErrorMessage, Field } from "formik";
import { useLocation, useNavigate } from "react-router-dom";
import ModalInvalidId from "@/components/modal/ModalInvalidId";
import { fetchDesa, fetchKelompok } from "@/utils/locationUtils";
import { Input, Textarea } from "@/components/global/Input";
import {
  JENIS_KELAMIN_OPTIONS,
  IS_ATLET_ASAD_OPTIONS,
  STATUS_PERNIKAHAN_OPTIONS,
  STATUS_SAMBUNG_OPTIONS,
  JENIS_DATA_OPTIONS,
} from "@/constants/formOptions";
import { Button, Select } from "@/components/global";

const DetailSensus = () => {
  const [balikanDataDesa, setBalikanDataDesa] = useState<any[]>([]);
  const [balikanDataKelompok, setBalikanDataKelompok] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const dataBalikan = location?.state;
  const navigate = useNavigate();

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
    nm_petugas_input: dataBalikan?.detailData?.id_petugas_input,
    img_url: dataBalikan?.detailData?.img_url,
  };

  const loadDesaData = async () => {
    if (dataBalikan?.detailData?.kd_daerah) {
      await fetchDesa(dataBalikan.detailData.kd_daerah, setBalikanDataDesa);
    }
  };

  const loadKelompokData = async () => {
    if (dataBalikan?.detailData?.kd_desa) {
      await fetchKelompok(
        dataBalikan.detailData.kd_desa,
        setBalikanDataKelompok,
      );
    }
  };

  const handleSubmit = async () => {};

  useEffect(() => {
    if (!dataBalikan || !dataBalikan?.detailData?.id) {
      setShowModal(true);
    }
  }, [dataBalikan]);

  useEffect(() => {
    const loadData = async () => {
      if (dataBalikan?.detailData) {
        await loadDesaData();
        await loadKelompokData();
      }
    };

    loadData();
  }, [dataBalikan?.detailData?.kd_daerah, dataBalikan?.detailData?.kd_desa]);

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={""}
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ values, setFieldValue }) => (
          <Form>
            {showModal && <ModalInvalidId />}

            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl">
              <div className="flex justify-between items-center p-3 border-b-2 border-gray-200 dark:border-gray-700 gap-2">
                <div className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
                  Detail Sensus
                </div>
                {dataBalikan?.detailData?.status_sambung === 0 && (
                  <div className="text-sm text-center font-normal leading-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-2.5">
                    Tidak Sambung
                  </div>
                )}
                {dataBalikan?.detailData?.status_sambung === 1 && (
                  <div className="text-sm text-center font-normal leading-4 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg p-2.5">
                    Sambung
                  </div>
                )}
                {dataBalikan?.detailData?.status_sambung === 2 && (
                  <div className="text-sm text-center font-normal leading-4 border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg p-2.5">
                    Pindah Sambung
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 p-4">
                <label className="text-gray-900 dark:text-white">
                  Foto Peserta
                </label>
                <div className="flex flex-col gap-3">
                  {dataBalikan?.detailData?.img_url !== null ? (
                    <img
                      src={dataBalikan?.detailData?.img_url}
                      alt="Foto Peserta"
                      className="w-20 h-15 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      {dataBalikan?.detailData?.jenis_kelamin ===
                      "LAKI-LAKI" ? (
                        <img
                          src="/eddg/empty-img-sensus-male.svg"
                          alt="Default Male"
                          className="w-20 h-15 object-cover rounded-md"
                        />
                      ) : (
                        <img
                          src="/eddg/empty-img-sensus-female.svg"
                          alt="Default Female"
                          className="w-20 h-15 object-cover rounded-md"
                        />
                      )}
                      <span className="font-semibold text-xs italic w-full text-gray-600 dark:text-gray-400">
                        *data si bro ini belum upload foto
                        &#128511;&#128511;&#128511;
                      </span>
                    </>
                  )}

                  <ErrorMessage
                    name="img"
                    component="div"
                    className="p-error"
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
                    className="p-error"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Lengkap
                    </label>

                    <Field
                      as={Input}
                      id="nama_lengkap"
                      name="nama_lengkap"
                      placeholder="Contoh: Dina A .K .A"
                      disabled
                    />

                    <ErrorMessage
                      name="nama_lengkap"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Panggilan
                    </label>

                    <Field
                      as={Input}
                      id="nama_panggilan"
                      name="nama_panggilan"
                      placeholder="Contoh: Dina"
                      disabled
                    />

                    <ErrorMessage
                      name="nama_panggilan"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Tempat Lahir
                    </label>

                    <Field
                      as={Input}
                      id="tempat_lahir"
                      name="tempat_lahir"
                      placeholder="Contoh: London"
                      disabled
                    />

                    <ErrorMessage
                      name="tempat_lahir"
                      component="div"
                      className="p-error"
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
                      disabled
                    />

                    <ErrorMessage
                      name="tanggal_lahir"
                      component="div"
                      className="p-error"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-900 dark:text-white">
                    Usia Saat Ini
                  </label>

                  <Field
                    as={Input}
                    type="number"
                    id="usia"
                    name="usia"
                    placeholder="Contoh: 25"
                    disabled
                  />

                  <ErrorMessage
                    name="usia"
                    component="div"
                    className="p-error"
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
                    placeholder="Isi Alamat"
                    rows={3}
                    disabled
                  />

                  <ErrorMessage
                    name="alamat"
                    component="div"
                    className="p-error"
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
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="jenis_kelamin"
                      component="div"
                      className="p-error"
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
                      disabled
                    />

                    <ErrorMessage
                      name="no_telepon"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Bapak
                    </label>

                    <Field
                      as={Input}
                      id="nama_ayah"
                      name="nama_ayah"
                      placeholder="Contoh Bpk. Erik"
                      disabled
                    />

                    <ErrorMessage
                      name="nama_ayah"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Nama Ibu
                    </label>

                    <Field
                      as={Input}
                      id="nama_ibu"
                      name="nama_ibu"
                      placeholder="Contoh: Ibu Erika"
                      disabled
                    />

                    <ErrorMessage
                      name="nama_ibu"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Hoby
                    </label>

                    <Field
                      as={Input}
                      id="hoby"
                      name="hoby"
                      placeholder="Contoh: Menyanyi / Berkebun / DLL"
                      disabled
                    />

                    <ErrorMessage
                      name="hoby"
                      component="div"
                      className="p-error"
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
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="pekerjaan"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Usia Menikah &nbsp;
                      <span className="font-semibold p-error">
                        <i>*Tidak Wajib Diisi</i>
                      </span>
                    </label>

                    <Field
                      as={Input}
                      type="number"
                      id="usia_menikah"
                      name="usia_menikah"
                      placeholder="Contoh: 25"
                      disabled
                    />

                    <ErrorMessage
                      name="usia_menikah"
                      component="div"
                      className="p-error"
                    />
                  </div>

                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Kriteria Pasangan &nbsp;
                      <span className="font-semibold p-error">
                        <i>*Tidak Wajib Diisi</i>
                      </span>
                    </label>

                    <Field
                      as={Input}
                      id="kriteria_pasangan"
                      name="kriteria_pasangan"
                      placeholder="Contoh: baik / faham / lancar 5 bab / DLL"
                      disabled
                    />

                    <ErrorMessage
                      name="kriteria_pasangan"
                      component="div"
                      className="p-error"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-900 dark:text-white">
                    Status Atlet Asad &nbsp;
                    <span className="font-semibold p-error">
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
                      setFieldValue("status_atlet_asad", option?.value ?? false)
                    }
                    placeholder="Pilih salah satu"
                    isClearable
                    isDisabled={true}
                  />

                  <ErrorMessage
                    name="status_atlet_asad"
                    component="div"
                    className="p-error"
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
                        if (option?.value) {
                          await fetchDesa(option.value, setBalikanDataDesa);
                        }
                      }}
                      placeholder="Pilih salah satu"
                      isClearable
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="tmpt_daerah"
                      component="div"
                      className="p-error"
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
                        balikanDataDesa.find(
                          (opt: any) => opt.value === values.tmpt_desa,
                        ) || null
                      }
                      options={balikanDataDesa}
                      onChange={async (option: any) => {
                        setFieldValue("tmpt_desa", option?.value || "");
                        if (option?.value) {
                          await fetchKelompok(
                            option.value,
                            setBalikanDataKelompok,
                          );
                        }
                      }}
                      placeholder="Pilih salah satu"
                      isClearable
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="tmpt_desa"
                      component="div"
                      className="p-error"
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
                        balikanDataKelompok.find(
                          (opt: any) => opt.value === values.tmpt_kelompok,
                        ) || null
                      }
                      options={balikanDataKelompok}
                      onChange={(option: any) =>
                        setFieldValue("tmpt_kelompok", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="tmpt_kelompok"
                      component="div"
                      className="p-error"
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
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="status_sambung"
                      component="div"
                      className="p-error"
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
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="status_pernikahan"
                      component="div"
                      className="p-error"
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
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="jenis_data"
                      component="div"
                      className="p-error"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-gray-900 dark:text-white">
                      Diinput Oleh
                    </label>

                    <Select
                      id="nm_petugas_input"
                      name="nm_petugas_input"
                      value={
                        dataBalikan?.fetchDataUsersSensus?.find(
                          (opt: any) => opt.value === values.nm_petugas_input,
                        ) || null
                      }
                      options={dataBalikan?.fetchDataUsersSensus || []}
                      onChange={(option: any) =>
                        setFieldValue("nm_petugas_input", option?.value || "")
                      }
                      placeholder="Pilih salah satu"
                      isClearable
                      isDisabled={true}
                    />

                    <ErrorMessage
                      name="nm_petugas_input"
                      component="div"
                      className="p-error"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
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
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default DetailSensus;
