import { useContext, useEffect, useState } from "react";
import AuthContext from "./../../contexts/AuthContext";
import { THEME_COLORS } from "@/config/theme";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoutModal = ({ isOpen, onClose }: LogoutModalProps) => {
  const { logout } = useContext(AuthContext);
  const [show, setShow] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    let timeout: number;

    if (isOpen) {
      setShow(true);
      timeout = setTimeout(() => setIsOpening(true), 10);
    } else {
      setIsOpening(false);
      timeout = setTimeout(() => setShow(false), 300);
    }

    return () => clearTimeout(timeout);
  }, [isOpen]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center transition-all duration-300 ease-in-out ${
        isOpening
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-4 w-full max-w-md transform rounded-xl border ${THEME_COLORS.background.primary} p-4 shadow-2xl transition-all duration-300 ease-in-out ${THEME_COLORS.border.default} sm:p-6 ${
          isOpening
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-90 -translate-y-4 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
            Keluar dari akun
          </h2>
        </div>

        {/* Body */}
        <p className={`mb-6 text-sm ${THEME_COLORS.text.secondary}`}>
          Apakah Anda yakin untuk keluar dari akun ini?
        </p>

        {/* Footer Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={onClose}
            className={`w-full rounded-lg border-2 ${THEME_COLORS.border.input} px-6 py-2.5 text-sm font-semibold ${THEME_COLORS.text.secondary} transition-all duration-300 ${THEME_COLORS.hover.item} sm:w-auto`}
          >
            Kembali
          </button>
          <button
            onClick={logout}
            className={`w-full transform rounded-lg px-6 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:w-auto ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText}`}
          >
            Ya, saya yakin
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
