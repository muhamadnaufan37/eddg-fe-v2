import { Fragment } from "react";
import { X } from "lucide-react";

type FilterModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
};

const FilterModal = ({
  open,
  onClose,
  title,
  children,
  size = "md",
}: FilterModalProps) => {
  if (!open) return null;

  const maxWidthClass =
    size === "xl"
      ? "md:max-w-4xl"
      : size === "lg"
        ? "md:max-w-2xl"
        : "md:max-w-lg";

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-20 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-20">
        <div
          className={`relative mx-auto flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white dark:bg-gray-900 md:rounded-2xl ${maxWidthClass} animate-slideUp md:animate-scaleIn ${
            size === "xl"
              ? "border border-gray-200 shadow-2xl shadow-gray-900/10 dark:border-gray-700 dark:shadow-black/40"
              : ""
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 ${
              size === "xl" ? "bg-gray-50/80 dark:bg-gray-950/40 sm:px-6" : ""
            }`}
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              type="button"
              aria-label="Tutup"
              className="rounded-full p-1 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto px-4 py-3 ${
              size === "xl" ? "sm:px-6 sm:py-5" : ""
            }`}
          >
            {children}
          </div>

          {/* Footer */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-2">
            <button
              className="text-xs w-full sm:w-auto text-gray-700 dark:text-gray-300"
              onClick={onClose}
            >
              <i className="pi pi-filter text-sm"></i>
              <span>Filter Lanjutan</span>
            </button>
          </div> */}
        </div>
      </div>
    </Fragment>
  );
};

export default FilterModal;
