// components/BottomSheet.tsx
import { useEffect, useState, type ReactNode } from "react";
import { THEME_COLORS } from "@/config/theme";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const BottomSheet = ({ open, onClose, children }: Props) => {
  const [visible, setVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setTimeout(() => setIsOpen(true), 10);
    } else {
      setIsOpen(false);
    }
  }, [open]);

  const handleTransitionEnd = () => {
    if (!open) setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        onTransitionEnd={handleTransitionEnd}
        className={`fixed bottom-0 left-0 right-0 z-50 ${THEME_COLORS.background.card} rounded-t-2xl p-4 pb-safe transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        <div
          className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mb-4 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          onClick={onClose}
        />
        {children}
      </div>
    </>
  );
};

export default BottomSheet;
