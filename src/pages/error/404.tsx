const PageNotFound = () => {
  const unLink = () => {
    window.location.href = "/";
  };

  document.title = "Page not found";

  return (
    <>
      <div className="relative flex flex-col justify-center items-center font-nunito">
        <div className="flex flex-col gap-3 p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl text-center">
          <img
            src="/assets/bg-404.svg"
            className="w-72 md:w-96 dark:opacity-80 mx-auto"
            alt="404 Not Found"
          />
          <p className="text-xl md:text-2xl font-bold mt-12 text-gray-900 dark:text-white">
            Oops! Halaman Tidak Ditemukan.
          </p>
          <p className="text-lg md:text-xl mt-4 text-center text-gray-700 dark:text-gray-300">
            Sepertinya Anda salah belok. Jangan khawatir, cukup kembali ke
            halaman home.
          </p>
          <div className="mt-5">
            <button
              onClick={unLink}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              Kembali ke Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageNotFound;
