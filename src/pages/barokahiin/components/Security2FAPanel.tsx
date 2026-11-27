import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  confirm2fa,
  disable2fa,
  get2faStatus,
  parseBarokahiinError,
  setup2fa,
  verify2fa,
  type TwoFactorSetupResponse,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ErrorBanner,
  FieldWrapper,
  InfoBanner,
  LoadingSkeleton,
  StatusBadge,
} from "./ui/ConsoleUi";
import { formatDateId } from "./ui/utils";

export default function Security2FAPanel() {
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(
    null,
  );
  const [confirmCode, setConfirmCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const statusQuery = useQuery({
    queryKey: ["barokahiin", "auth", "2fa-status"],
    queryFn: get2faStatus,
  });

  const setupMut = useMutation({
    mutationFn: setup2fa,
    onSuccess: (data) => {
      setSetupData(data);
      setConfirmCode("");
      toast.success(
        "QR Code 2FA dibuat. Pindai dengan Google Authenticator / Authy lalu masukkan kode 6 digit.",
      );
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const confirmMut = useMutation({
    mutationFn: () => confirm2fa(confirmCode.trim()),
    onSuccess: () => {
      setSetupData(null);
      setConfirmCode("");
      toast.success("2FA TOTP berhasil diaktifkan!");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "auth", "2fa-status"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const verifyMut = useMutation({
    mutationFn: () => verify2fa(verifyCode.trim()),
    onSuccess: (res) => {
      setVerifyCode("");
      toast.success(
        res?.verified !== false
          ? "Kode 2FA valid dan terverifikasi."
          : "Verifikasi selesai.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "auth", "2fa-status"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const disableMut = useMutation({
    mutationFn: () => disable2fa(disableCode.trim()),
    onSuccess: () => {
      setDisableOpen(false);
      setDisableCode("");
      toast.success("2FA TOTP dinonaktifkan.");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "auth", "2fa-status"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  if (statusQuery.isLoading) return <LoadingSkeleton rows={3} />;
  if (statusQuery.error) {
    return (
      <ErrorBanner
        message={parseBarokahiinError(statusQuery.error).message}
        onRetry={() => void statusQuery.refetch()}
      />
    );
  }

  const status = statusQuery.data;
  const enabled = Boolean(status?.enabled);

  return (
    <div className="space-y-5">
      <ConsolePanel
        icon={ShieldCheck}
        title="Keamanan 2FA TOTP (PRD AUT-01)"
        description="Lindungi akun Admin dan Koordinator dengan autentikasi dua faktor menggunakan Google Authenticator, Authy, atau aplikasi TOTP lainnya."
      >
        <div className="space-y-4">
          <InfoBanner
            tone={enabled ? "success" : "warning"}
            title={
              enabled
                ? "2FA TOTP sudah aktif di akun Anda"
                : "2FA TOTP belum diaktifkan"
            }
            message={
              enabled
                ? `Diaktifkan pada ${formatDateId(status?.enabled_at)}. Sisa kode pemulihan (recovery codes): ${status?.recovery_codes_remaining ?? 0}.`
                : "Sangat disarankan mengaktifkan 2FA sebelum mengelola operasional toko, review barang, atau keuangan."
            }
            action={<StatusBadge value={enabled ? "aktif" : "draft"} />}
          />

          {!enabled && !setupData && (
            <button
              type="button"
              className="brk-btn brk-btn-primary"
              disabled={setupMut.isPending}
              onClick={() => setupMut.mutate()}
            >
              <KeyRound className="size-4" aria-hidden="true" />
              <span>
                {setupMut.isPending
                  ? "Menyiapkan 2FA..."
                  : "Mulai aktivasi 2FA TOTP"}
              </span>
            </button>
          )}

          {/* Setup flow: QR + Secret + Recovery Codes + Confirm 6-digit code */}
          {!enabled && setupData && (
            <div
              className="grid grid-cols-1 gap-5 rounded-2xl border p-4 lg:grid-cols-12"
              style={{
                backgroundColor: "var(--kertas)",
                borderColor: "var(--garis)",
              }}
            >
              <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-4 text-center lg:col-span-4">
                <QRCode value={setupData.otpauth_uri} size={180} />
                <p className="mt-2 text-xs font-semibold text-gray-700">
                  Pindai QR ini di Google Authenticator / Authy
                </p>
              </div>

              <div className="space-y-4 lg:col-span-8">
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                    Secret Key (jika tidak bisa pindai QR)
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code
                      className="brk-num flex-1 rounded-lg border px-3 py-2 text-xs font-bold break-all"
                      style={{
                        backgroundColor: "var(--putih)",
                        borderColor: "var(--garis)",
                      }}
                    >
                      {setupData.secret}
                    </code>
                    <button
                      type="button"
                      className="brk-btn brk-btn-neutral shrink-0"
                      onClick={() => {
                        void navigator.clipboard.writeText(setupData.secret);
                        toast.success("Secret key disalin");
                      }}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                      <span>Salin</span>
                    </button>
                  </div>
                </div>

                {setupData.recovery_codes &&
                  setupData.recovery_codes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-xs font-bold"
                          style={{ color: "var(--peringatan-teks)" }}
                        >
                          Simpan 8 kode pemulihan (sekali pakai)
                        </p>
                        <button
                          type="button"
                          className="brk-btn brk-btn-ghost min-h-8 px-2 text-xs"
                          onClick={() => {
                            void navigator.clipboard.writeText(
                              setupData.recovery_codes.join("\n"),
                            );
                            toast.success("Semua recovery code disalin");
                          }}
                        >
                          <Copy className="size-3.5" aria-hidden="true" />
                          <span>Salin semua</span>
                        </button>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {setupData.recovery_codes.map((rc) => (
                          <code
                            key={rc}
                            className="brk-num rounded-md border px-2 py-1.5 text-center text-xs font-bold"
                            style={{
                              backgroundColor: "var(--putih)",
                              borderColor: "var(--garis)",
                            }}
                          >
                            {rc}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                <form
                  className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end"
                  style={{ borderColor: "var(--garis)" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!confirmCode.trim()) return;
                    confirmMut.mutate();
                  }}
                >
                  <div className="flex-1">
                    <FieldWrapper
                      id="tfa-confirm-code"
                      label="Masukkan kode 6 digit dari aplikasi"
                      required
                    >
                      <input
                        id="tfa-confirm-code"
                        className="brk-input brk-num"
                        inputMode="numeric"
                        maxLength={8}
                        value={confirmCode}
                        onChange={(e) => setConfirmCode(e.target.value)}
                        placeholder="123456"
                        required
                      />
                    </FieldWrapper>
                  </div>
                  <button
                    type="submit"
                    className="brk-btn brk-btn-daun shrink-0"
                    disabled={confirmMut.isPending}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    <span>
                      {confirmMut.isPending
                        ? "Memverifikasi..."
                        : "Konfirmasi & aktifkan 2FA"}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Active 2FA actions: Verify test + Disable */}
          {enabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form
                className="space-y-3 rounded-xl border p-4"
                style={{ borderColor: "var(--garis)" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!verifyCode.trim()) return;
                  verifyMut.mutate();
                }}
              >
                <p className="text-sm font-bold">Uji verifikasi kode 2FA</p>
                <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                  Verifikasi kode 6 digit TOTP atau recovery code (XXXX-XXXX).
                  Terakhir diverifikasi: {formatDateId(status?.last_verified_at)}.
                </p>
                <input
                  className="brk-input brk-num"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="123456 atau XXXX-XXXX"
                  required
                />
                <button
                  type="submit"
                  className="brk-btn brk-btn-secondary w-full"
                  disabled={verifyMut.isPending}
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  <span>
                    {verifyMut.isPending ? "Memeriksa..." : "Verifikasi kode"}
                  </span>
                </button>
              </form>

              <div
                className="flex flex-col justify-between gap-3 rounded-xl border p-4"
                style={{ borderColor: "var(--garis)" }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--bahaya)" }}>
                    Nonaktifkan 2FA TOTP
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
                    Memerlukan kode 6 digit aktif dari aplikasi authenticator Anda.
                  </p>
                </div>
                <button
                  type="button"
                  className="brk-btn brk-btn-danger w-full"
                  onClick={() => {
                    setDisableCode("");
                    setDisableOpen(true);
                  }}
                >
                  <ShieldOff className="size-4" aria-hidden="true" />
                  <span>Nonaktifkan 2FA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </ConsolePanel>

      <ConfirmDialog
        open={disableOpen}
        title="Nonaktifkan 2FA TOTP"
        description="Masukkan kode 6 digit dari aplikasi authenticator Anda untuk menonaktifkan 2FA."
        consequences="Keamanan akun akan menurun jika 2FA dinonaktifkan."
        confirmLabel="Nonaktifkan 2FA"
        tone="danger"
        loading={disableMut.isPending}
        onCancel={() => setDisableOpen(false)}
        onConfirm={() => {
          if (!disableCode.trim()) {
            toast.error("Kode 6 digit wajib diisi.");
            return;
          }
          disableMut.mutate();
        }}
      >
        <FieldWrapper
          id="tfa-disable-code"
          label="Kode 6 digit authenticator"
          required
        >
          <div className="flex items-center gap-2">
            <ShieldAlert
              className="size-4 shrink-0"
              style={{ color: "var(--bahaya)" }}
              aria-hidden="true"
            />
            <input
              id="tfa-disable-code"
              className="brk-input brk-num"
              inputMode="numeric"
              maxLength={8}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="123456"
              required
            />
          </div>
        </FieldWrapper>
      </ConfirmDialog>
    </div>
  );
}
