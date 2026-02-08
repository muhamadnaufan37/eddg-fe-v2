import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "@/components/theme-provider";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";
import { BASE_TITLE } from "@/store/actions";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EEEEEE] dark:bg-[#212121] p-5 transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-[#1F2121] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </button>

      <div className="flex flex-col 2xl:flex-row overflow-hidden transition-all duration-300 max-w-6xl bg-white rounded-2xl dark:bg-[#1F2121] w-full">
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
