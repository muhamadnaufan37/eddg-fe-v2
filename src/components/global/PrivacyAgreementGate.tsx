import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Modal, Button } from "@/components/global";
import useAuth from "@/hooks/useAuth";
import {
  getLocalStorage,
  setLocalStorage,
} from "@/services/localStorageService";
import { THEME_COLORS } from "@/config/theme";
import { axiosServices } from "@/services/axios";

const buildAgreementKey = (userId?: string, username?: string) =>
  `privacy-agreement:${userId || username || "unknown"}`;

const PrivacyAgreementGate = () => {
  const { isLoggedIn, user, setNdaAccepted } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storageKey = useMemo(
    () => buildAgreementKey(user?.id, user?.username),
    [user?.id, user?.username],
  );

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setIsOpen(false);
      setIsChecked(false);
      return;
    }

    if (String(user.status_nda) !== "0") {
      setIsOpen(false);
      setIsChecked(false);
      return;
    }

    const accepted = getLocalStorage(storageKey);
    if (!accepted?.accepted) {
      setIsOpen(true);
      setIsChecked(false);
    } else {
      setIsOpen(false);
    }
  }, [isLoggedIn, storageKey, user]);

  const handleAgree = async () => {
    if (!isChecked) {
      toast.error("Silakan centang persetujuan terlebih dahulu.");
      return;
    }

    if (!user?.id) {
      toast.error("Data user tidak ditemukan.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosServices().post(`/api/v1/users/${user.id}/status-nda`, {
        status_nda: 1,
      });

      setLocalStorage(storageKey, {
        accepted: true,
        accepted_at: new Date().toISOString(),
        id: user?.id,
        username: user?.username,
      });

      setNdaAccepted(user.id);
      setIsOpen(false);
      toast.success("Persetujuan kerahasiaan berhasil disimpan.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Gagal menyimpan persetujuan kerahasiaan.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="PERJANJIAN KERAHASIAAN DATA PRIBADI"
      size="xl"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p className={`text-sm leading-7 ${THEME_COLORS.text.secondary}`}>
          Perjanjian ini mengikat Anda ("Pihak Penerima Akses") untuk mematuhi
          kewajiban kerahasiaan atas Informasi Rahasia yang dikelola di dalam
          aplikasi ini.
        </p>

        <ol
          className={`list-decimal space-y-3 pl-5 text-sm leading-7 ${THEME_COLORS.text.secondary}`}
        >
          <li>
            Definisi Informasi Rahasia: Informasi Rahasia mencakup segala bentuk
            Data Pribadi wajib pajak yang terdapat di dalam aplikasi, termasuk
            namun tidak terbatas pada nama lengkap, NIK, alamat domisili, nomor
            telepon, alamat email, dan data operasional lainnya.
          </li>
          <li>
            Kewajiban Pihak Penerima Akses:
            <div className="pl-4">
              <div>
                a. Melindungi Informasi Rahasia menggunakan standar keamanan
                terbaik.
              </div>
              <div>
                b. Mengakses dan menggunakan Informasi Rahasia hanya untuk
                tujuan yang diizinkan oleh sistem pengelola.
              </div>
              <div>
                c. Dilarang menyalin, memperbanyak, mendistribusikan, atau
                memindahtangankan Informasi Rahasia kepada pihak yang tidak
                berwenang.
              </div>
            </div>
          </li>
          <li>
            Larangan Penggunaan Pribadi dan Komersial: Informasi Rahasia tidak
            boleh digunakan untuk kepentingan pribadi, dijual, disewakan, atau
            digunakan untuk strategi pemasaran di luar instruksi resmi.
          </li>
          {/* <li>
            Sanksi Pelanggaran: Apabila Pihak Penerima Akses terbukti melanggar
            ketentuan kerahasiaan ini, baik secara sengaja maupun akibat
            kelalaian, maka pengelola aplikasi berhak mencabut akses, menuntut
            ganti rugi, dan melakukan proses hukum sesuai regulasi yang berlaku.
          </li> */}
        </ol>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(event) => setIsChecked(event.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
            <span className={THEME_COLORS.text.primary}>
              Ya, saya menyetujui pernyataan di atas.
            </span>
          </label>
        </div>

        <p className={`text-sm leading-7 ${THEME_COLORS.text.secondary}`}>
          Dengan ini Anda mengakui telah membaca, memahami, dan sepakat untuk
          tunduk pada Perjanjian Kerahasiaan ini tanpa paksaan dari pihak mana
          pun.
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="primary"
            onClick={handleAgree}
            disabled={!isChecked || isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Saya Setuju dan Lanjutkan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyAgreementGate;
