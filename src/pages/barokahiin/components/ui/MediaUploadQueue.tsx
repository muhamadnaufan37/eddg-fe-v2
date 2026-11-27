import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Film,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  parseBarokahiinError,
  uploadConsoleMedia,
  type BarokahiinMedia,
  type MediaOwnerType,
} from "@/services/barokahiin";

interface QueueEntry {
  localId: string;
  file: File;
  tipe: "foto" | "video";
  previewUrl: string;
  progress: number;
  status: "queued" | "compressing" | "uploading" | "paused" | "done" | "error";
  error?: string;
  uploaded?: BarokahiinMedia;
}

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 350 * 1024) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    bitmap.close();
    if (!blob || blob.size >= file.size) return file;
    const nextName = file.name.replace(/\.[^.]+$/, ".jpg");
    return new File([blob], nextName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function MediaUploadQueue({
  ownerType,
  ownerUuid,
  fallbackOwner,
  acceptVideo = false,
  checkId,
  guideLabel,
  buttonLabel = "Ambil foto atau pilih berkas",
  onUploaded,
}: {
  ownerType: MediaOwnerType;
  ownerUuid: string;
  fallbackOwner?: { ownerType: MediaOwnerType; ownerUuid: string } | null;
  acceptVideo?: boolean;
  checkId?: string | number;
  guideLabel?: string;
  buttonLabel?: string;
  onUploaded: (media: BarokahiinMedia) => void;
}) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runUpload = async (entry: QueueEntry) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.localId === entry.localId
          ? { ...q, status: "compressing", error: undefined, progress: 5 }
          : q,
      ),
    );

    try {
      const processedFile =
        entry.tipe === "foto"
          ? await compressImageIfNeeded(entry.file)
          : entry.file;

      if (entry.tipe === "video" && processedFile.size > 100 * 1024 * 1024) {
        throw new Error("Ukuran video melebihi batas maksimal 100 MB.");
      }

      setQueue((prev) =>
        prev.map((q) =>
          q.localId === entry.localId
            ? { ...q, status: "uploading", progress: 15 }
            : q,
        ),
      );

      const doUpload = (targetType: MediaOwnerType, targetUuid: string) =>
        uploadConsoleMedia(
          {
            owner_type: targetType,
            owner_uuid: targetUuid,
            tipe: entry.tipe,
            file: processedFile,
            alt: guideLabel || processedFile.name,
            check_id: checkId,
          },
          (percent) => {
            setQueue((prev) =>
              prev.map((q) =>
                q.localId === entry.localId ? { ...q, progress: percent } : q,
              ),
            );
          },
        );

      let uploaded: BarokahiinMedia;
      try {
        uploaded = await doUpload(ownerType, ownerUuid);
      } catch (primaryErr) {
        const parsedPrimary = parseBarokahiinError(primaryErr);
        if (
          parsedPrimary.status === 404 &&
          fallbackOwner?.ownerUuid &&
          (fallbackOwner.ownerType !== ownerType ||
            fallbackOwner.ownerUuid !== ownerUuid)
        ) {
          uploaded = await doUpload(
            fallbackOwner.ownerType,
            fallbackOwner.ownerUuid,
          );
        } else {
          throw primaryErr;
        }
      }

      setQueue((prev) =>
        prev.map((q) =>
          q.localId === entry.localId
            ? { ...q, status: "done", progress: 100, uploaded }
            : q,
        ),
      );
      onUploaded(uploaded);
    } catch (err) {
      const parsed = parseBarokahiinError(err, "Gagal mengunggah berkas.");
      setQueue((prev) =>
        prev.map((q) =>
          q.localId === entry.localId
            ? { ...q, status: "error", error: parsed.message }
            : q,
        ),
      );
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!ownerUuid) return;

    const newEntries: QueueEntry[] = Array.from(fileList).map((file) => {
      const isVideo = file.type.startsWith("video/");
      return {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        tipe: isVideo ? "video" : "foto",
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "queued",
      };
    });

    setQueue((prev) => [...newEntries, ...prev]);
    newEntries.forEach((entry) => {
      void runUpload(entry);
    });
  };

  const pauseEntry = (localId: string) => {
    setQueue((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, status: "paused" } : q)),
    );
  };

  const removeEntry = (localId: string) => {
    setQueue((prev) => {
      const target = prev.find((q) => q.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((q) => q.localId !== localId);
    });
  };

  return (
    <div className="space-y-3">
      {guideLabel && (
        <p className="text-xs font-medium" style={{ color: "var(--muted-brk)" }}>
          Panduan media: {guideLabel}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept={acceptVideo ? "image/*,video/*" : "image/*"}
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptVideo ? "image/*,video/*" : "image/*"}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          className="brk-btn brk-btn-primary"
          disabled={!ownerUuid}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="size-4" aria-hidden="true" />
          <span>{buttonLabel}</span>
        </button>

        <button
          type="button"
          className="brk-btn brk-btn-secondary"
          disabled={!ownerUuid}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden="true" />
          <span>Pilih dari galeri</span>
        </button>
      </div>

      {!ownerUuid && (
        <p className="text-xs" style={{ color: "var(--peringatan-teks)" }}>
          Simpan draf terlebih dahulu agar media dapat diunggah dan tertaut.
        </p>
      )}

      {queue.length > 0 && (
        <ul className="space-y-2" aria-label="Antrean unggah media">
          {queue.map((item) => (
            <li
              key={item.localId}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
              style={{
                backgroundColor: "var(--putih)",
                borderColor:
                  item.status === "error" ? "var(--bahaya)" : "var(--garis)",
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {item.tipe === "foto" ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: "var(--indigo-muda)",
                      color: "var(--indigo)",
                    }}
                  >
                    <Film className="size-5" aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="brk-num" style={{ color: "var(--muted-brk)" }}>
                      {item.status === "compressing" && "Mengompres foto..."}
                      {item.status === "uploading" &&
                        `Mengunggah ${item.progress}%`}
                      {item.status === "paused" && "Dijeda"}
                      {item.status === "done" &&
                        "Tersimpan (EXIF/GPS dihapus server)"}
                      {item.status === "error" && (item.error || "Gagal unggah")}
                    </span>
                  </div>
                  {(item.status === "uploading" ||
                    item.status === "compressing") && (
                    <div
                      className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--indigo-muda)" }}
                      role="progressbar"
                      aria-valuenow={item.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor: "var(--indigo)",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {item.status === "done" && (
                  <CheckCircle2
                    className="size-5"
                    style={{ color: "var(--daun)" }}
                    aria-label="Selesai"
                  />
                )}
                {item.status === "uploading" && (
                  <button
                    type="button"
                    aria-label="Jeda unggah"
                    onClick={() => pauseEntry(item.localId)}
                    className="flex size-11 items-center justify-center rounded-md border"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <Pause className="size-4" aria-hidden="true" />
                  </button>
                )}
                {(item.status === "paused" || item.status === "error") && (
                  <button
                    type="button"
                    aria-label="Ulangi unggah"
                    onClick={() => void runUpload(item)}
                    className="flex size-11 items-center justify-center rounded-md border"
                    style={{
                      borderColor: "var(--indigo)",
                      color: "var(--indigo)",
                    }}
                  >
                    {item.status === "paused" ? (
                      <Play className="size-4" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="size-4" aria-hidden="true" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Hapus dari antrean"
                  onClick={() => removeEntry(item.localId)}
                  className="flex size-11 items-center justify-center rounded-md border"
                  style={{
                    borderColor: "var(--garis)",
                    color: "var(--muted-brk)",
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
