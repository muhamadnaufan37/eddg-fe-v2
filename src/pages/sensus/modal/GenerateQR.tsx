import { useRef } from "react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";

interface AddProps {
  detailData: any;
}

const GenerateQR: React.FC<AddProps> = ({ detailData }) => {
  const elementRef = useRef(null);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="flex items-center justify-center py-6"
      >
        {/* QR Code container with white background for scannability */}
        <div className="p-6 bg-white dark:bg-white rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
          <QRCode
            ref={elementRef}
            value={detailData?.kode_cari_data || "QR Code Tidak Tersedia"}
            size={200}
            level="H"
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>
      </motion.div>

      {/* Display kode_cari_data below QR code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{
          duration: 0.3,
          delay: 0.1,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="text-center mt-4 mb-2"
      >
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Kode: {detailData?.kode_cari_data || "-"}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default GenerateQR;
