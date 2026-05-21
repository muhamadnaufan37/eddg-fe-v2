import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/global";

const GlobalImagePreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      setSrc(detail.src || "");
      setTitle(detail.title || "Preview");
      setIsOpen(true);
    };

    window.addEventListener("global-image-preview", handler as EventListener);
    return () =>
      window.removeEventListener(
        "global-image-preview",
        handler as EventListener,
      );
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={title}
      size="xl"
    >
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <img
            src={src}
            alt={title}
            className="max-h-[70vh] w-full object-contain"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GlobalImagePreview;
