import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "@/components/theme-provider";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";
import { BASE_TITLE } from "@/store/actions";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { VersionDisplay } from "@/components/features/VersionDisplay";

interface LoginFormData {
  username: string;
  password: string;
}

const VALIDATION_RULES = {
  username: {
    required: "Username wajib diisi",
    minLength: {
      value: 3,
      message: "Username minimal 3 karakter",
    },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: "Username hanya boleh mengandung huruf, angka, dan underscore",
    },
  },
  password: {
    required: "Kata sandi wajib diisi",
    // minLength: {
    //   value: 6,
    //   message: "Kata sandi minimal 6 karakter",
    // },
  },
} as const;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login } = useAuth();
  const { theme, setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    document.title = `${BASE_TITLE}Login`;
  }, []);

  const onSubmit = (data: LoginFormData) => {
    login(data.username, data.password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-5">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 transition-colors duration-500">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-0 right-20 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-3000"></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-linear-to-br from-cyan-400/30 to-blue-500/30 dark:from-cyan-600/20 dark:to-blue-700/20 rounded-full filter blur-2xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-linear-to-br from-purple-400/30 to-pink-500/30 dark:from-purple-600/20 dark:to-pink-700/20 rounded-full filter blur-2xl animate-float animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-linear-to-br from-amber-400/30 to-orange-500/30 dark:from-amber-600/20 dark:to-orange-700/20 rounded-full filter blur-2xl animate-float animation-delay-2000"></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-4 right-4 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </button>

      <div className="flex flex-col 2xl:flex-row overflow-hidden transition-all duration-300 max-w-6xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full relative z-10">
        {/* IMAGE */}
        <div className="flex-1 transition-colors duration-300">
          <img
            className="object-cover w-full h-full rounded-xl"
            src="/assets/framer5.svg"
            alt="Login"
          />
        </div>

        {/* FORM SECTION */}
        <div className="flex flex-col items-center justify-center gap-3 flex-1 p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <div className="space-y-2">
              <h1 className="font-bold text-2xl text-gray-900 dark:text-white transition-colors duration-300">
                Selamat Datang
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                Silakan masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            {/* USERNAME FIELD */}
            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                {...register("username", VALIDATION_RULES.username)}
                placeholder="Masukkan username"
                autoComplete="username"
                disabled={isLoading}
                className={errors.username ? "border-destructive" : ""}
              />
              <FieldError errors={[errors.username]} />
            </Field>

            {/* PASSWORD FIELD */}
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", VALIDATION_RULES.password)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none disabled:opacity-50 transition-colors duration-200"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError errors={[errors.password]} />
            </Field>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Version Display */}
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <VersionDisplay variant="detailed" showBackend={true} />
          </div>
        </div>
      </div>

      {/* Version Display in Footer - Compact */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-lg">
          <VersionDisplay variant="compact" showBackend={true} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
