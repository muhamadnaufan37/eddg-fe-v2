import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

import { scrollToTop } from "@/utils/scrollTop";

const ScrollToTop = () => {
  const location = useLocation();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    scrollToTop("auto");
  }, [location.pathname, location.search, location.hash]);

  if (!showButton) return null;

  return (
    <button
      type="button"
      aria-label="Scroll ke atas"
      title="Scroll ke atas"
      onClick={() => scrollToTop("smooth")}
      className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500 bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 transition-all duration-200 hover:-translate-y-1 hover:bg-cyan-500 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTop;
