import { Fragment } from "react";
import { X } from "lucide-react";

type FilterModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

const FilterModal = ({ open, onClose, title, children }: FilterModalProps) => {
  if (!open) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-10 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-10">
        <div
          className="
            bg-white dark:bg-gray-900 w-full md:max-w-lg rounded-t-2xl md:rounded-2xl
            max-h-[90dvh] flex flex-col
            animate-slideUp md:animate-scaleIn
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>

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
