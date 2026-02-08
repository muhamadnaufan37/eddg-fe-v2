import React from "react";

const ModalInvalidId: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="flex flex-col gap-4 bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-4">
        <div className="text-lg font-semibold text-red-600">
          Data Tidak Valid
        </div>
        <div className="text-sm text-gray-700 leading-6">
          Data tidak ditemukan atau ID tidak tersedia. Silakan periksa kembali.
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalInvalidId;
