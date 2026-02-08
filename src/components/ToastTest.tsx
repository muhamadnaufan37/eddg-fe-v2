import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Toast Test Component
 * Gunakan component ini untuk testing semua jenis toast
 * Import di halaman manapun untuk mencoba toast
 */
export function ToastTest() {
  return (
    <Card className="max-w-2xl mx-auto m-6">
      <CardHeader>
        <CardTitle>Toast Examples & Testing</CardTitle>
        <CardDescription>
          Klik tombol di bawah untuk melihat berbagai jenis toast notification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Success Toast</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() =>
                toast.success("Berhasil!", {
                  description: "Data berhasil disimpan ke database",
                })
              }
            >
              Success Simple
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Login Berhasil", {
                  description: "Selamat datang kembali, John Doe!",
                  duration: 5000,
                })
              }
            >
              Success Login
            </Button>
          </div>
        </div>

        {/* Error Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Error Toast</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="destructive"
              onClick={() =>
                toast.error("Terjadi Kesalahan", {
                  description: "Gagal menyimpan data. Silakan coba lagi.",
                })
              }
            >
              Error Simple
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("Validasi Gagal", {
                  description: "Email dan password harus diisi dengan benar",
                })
              }
            >
              Error Validation
            </Button>
          </div>
        </div>

        {/* Warning Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Warning Toast</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() =>
                toast.warning("Peringatan", {
                  description: "Data yang Anda masukkan sudah ada di sistem",
                })
              }
            >
              Warning Simple
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.warning("Perhatian!", {
                  description: "File yang Anda upload melebihi 5MB",
                  duration: 7000,
                })
              }
            >
              Warning File Size
            </Button>
          </div>
        </div>

        {/* Info Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Info Toast</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() =>
                toast.info("Informasi", {
                  description: "Sistem akan maintenance pada pukul 22:00 WIB",
                })
              }
            >
              Info Simple
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Update Tersedia", {
                  description:
                    "Versi baru aplikasi sudah tersedia untuk diunduh",
                })
              }
            >
              Info Update
            </Button>
          </div>
        </div>

        {/* Loading Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Loading Toast</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                const toastId = toast.loading("Sedang memproses...", {
                  description: "Mohon tunggu sebentar",
                });

                // Simulate async operation
                setTimeout(() => {
                  toast.success("Selesai!", {
                    id: toastId,
                    description: "Proses berhasil diselesaikan",
                  });
                }, 3000);
              }}
            >
              Loading → Success
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const toastId = toast.loading("Mengupload file...", {
                  description: "File sedang diproses",
                });

                setTimeout(() => {
                  toast.error("Upload Gagal", {
                    id: toastId,
                    description: "Koneksi terputus, silakan coba lagi",
                  });
                }, 3000);
              }}
            >
              Loading → Error
            </Button>
          </div>
        </div>

        {/* Action Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Toast with Actions</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() =>
                toast("Konfirmasi Diperlukan", {
                  description: "Apakah Anda yakin ingin menghapus data ini?",
                  action: {
                    label: "Hapus",
                    onClick: () => toast.success("Data dihapus!"),
                  },
                  cancel: {
                    label: "Batal",
                    onClick: () => toast.info("Aksi dibatalkan"),
                  },
                })
              }
            >
              Confirmation
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Item ditambahkan", {
                  description: "Produk telah ditambahkan ke keranjang",
                  action: {
                    label: "Lihat Keranjang",
                    onClick: () => toast.info("Navigasi ke keranjang..."),
                  },
                })
              }
            >
              With Action Button
            </Button>
          </div>
        </div>

        {/* Promise Toast */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Promise Toast (Auto)</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                const promise = new Promise((resolve) => {
                  setTimeout(() => resolve({ count: 42 }), 2000);
                });

                toast.promise(promise, {
                  loading: "Mengambil data...",
                  success: (data: any) =>
                    `Berhasil! ${data.count} data berhasil dimuat`,
                  error: "Gagal! Tidak dapat mengambil data",
                });
              }}
            >
              Promise Success
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const promise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error("Network error")), 2000);
                });

                toast.promise(promise, {
                  loading: "Menyimpan data...",
                  success: "Tersimpan! Data berhasil disimpan",
                  error: "Gagal! Koneksi bermasalah",
                });
              }}
            >
              Promise Error
            </Button>
          </div>
        </div>

        {/* Multiple Toasts */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Multiple Toasts</h3>
          <Button
            onClick={() => {
              toast.info("Notifikasi 1", {
                description: "Ini notifikasi pertama",
              });
              setTimeout(() => {
                toast.success("Notifikasi 2", {
                  description: "Ini notifikasi kedua",
                });
              }, 500);
              setTimeout(() => {
                toast.warning("Notifikasi 3", {
                  description: "Ini notifikasi ketiga",
                });
              }, 1000);
            }}
          >
            Show Multiple
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
