import { createContext, useEffect, useReducer, type ReactNode } from "react";
import accountReducer from "../store/accountReducer";
import {
  ACCOUNT_INITIALISE,
  IS_LOADING,
  LOGIN,
  LOGOUT,
} from "../store/actions";
import {
  getLocalStorage,
  setLocalStorage,
} from "../services/localStorageService";
import { AUTH_UNAUTHORIZED_EVENT, axiosServices } from "../services/axios";
import { toast } from "sonner";

type TData = any;

type TAuthContext = {
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialised: boolean;
  user: TData | null;
  isNdaPending: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (keterangan?: string) => void;
  setNdaAccepted: (userId?: string) => void;
};

const initialState = {
  isLoggedIn: false,
  isLoading: false,
  isInitialised: false,
  user: null,
};

const AuthContext = createContext<TAuthContext>({
  ...initialState,
  isNdaPending: false,
  login: async () => {},
  logout: () => {},
  setNdaAccepted: () => {},
});

const verifyToken = (serviceToken: any, expiresAt?: string): boolean => {
  if (!serviceToken) {
    return false;
  }

  if (!expiresAt) return true;

  const expirationTime = Date.parse(expiresAt);
  return !Number.isFinite(expirationTime) || expirationTime > Date.now();
};

const setSession = (data: any) => {
  if (data) {
    setLocalStorage("userData", {
      token: data.token,
      expires_at: data.expires_at,
      user: data.user,
    });

    axiosServices().defaults.headers.common["Authorization"] = data.token;
  } else {
    localStorage.removeItem("userData");
    delete axiosServices().defaults.headers.common["Authorization"];
  }
};

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(accountReducer, initialState);

  const isNdaPending = Boolean(
    (state.user && (state.user as any).status_nda === 0) ||
    (state.user && String((state.user as any).status_nda) === "0"),
  );

  const setNdaAccepted = (userId?: string) => {
    try {
      const stored = getLocalStorage("userData");
      if (!stored || !stored.user) return;

      // update user object
      const updatedUser = { ...stored.user, status_nda: 1 };

      // update localStorage
      setLocalStorage("userData", {
        ...stored,
        user: updatedUser,
      });

      // update reducer state
      dispatch({
        type: LOGIN,
        payload: { user: updatedUser, isLoggedIn: true },
      });
    } catch (err) {
      // silent
    }
  };

  const login = async (username: string, password: string) => {
    dispatch({
      type: IS_LOADING,
      payload: {
        isLoading: true,
      },
    });
    try {
      const response = await axiosServices().post(`/api/v1/login`, {
        username: username,
        password: password,
      });

      if (response.data.data.token) {
        let dataUser = response.data.data.user;
        const token = response.data.data.token;

        setSession({
          token,
          expires_at: response.data.data.expires_at,
          user: dataUser,
        });

        dispatch({
          type: LOGIN,
          payload: { user: dataUser, isLoggedIn: true },
        });

        toast.success("Login Berhasil", {
          description: `Selamat datang kembali, ${dataUser.nama_lengkap || ""}!`,
        });
      } else {
        toast.error("Login Gagal", {
          description: "Username atau kata sandi yang Anda masukkan salah",
        });
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Tidak dapat terhubung ke server";
      toast.error("Terjadi Kesalahan", {
        description: errorMessage,
      });
    }
    dispatch({
      type: IS_LOADING,
      payload: {
        isLoading: false,
      },
    });
  };

  const logout = async (keterangan?: string) => {
    dispatch({ type: IS_LOADING, payload: { isLoading: true } });

    try {
      const response = await axiosServices().post(`/api/v1/logout`, {
        ...(keterangan?.trim() ? { keterangan: keterangan.trim() } : {}),
      });

      if (response.data.success) {
        setSession({});
        localStorage.removeItem("userData");
        dispatch({ type: LOGOUT, payload: { isLoggedIn: false, user: null } });
        toast.success("Logout Berhasil", {
          description: "Anda telah keluar dari sistem",
        });
      } else {
        toast.error("Logout Gagal", {
          description: response.data.message || "Terjadi kesalahan saat logout",
        });
      }
      dispatch({ type: LOGOUT, payload: { isLoggedIn: false, user: null } });
    } catch (error: any) {
      toast.error("Logout Gagal", {
        description: "Terjadi kesalahan, tetapi Anda akan tetap dikeluarkan",
      });
    }

    dispatch({ type: IS_LOADING, payload: { isLoading: false } });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const stored = getLocalStorage("userData");

        if (stored?.token && verifyToken(stored.token, stored.expires_at)) {
          axiosServices().defaults.headers.common["Authorization"] =
            stored.token;

          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: true,
              user: stored.user,
            },
          });
        } else {
          if (stored?.token) setSession(null);

          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: false,
              user: null,
            },
          });
        }
      } catch (err) {
        dispatch({
          type: ACCOUNT_INITIALISE,
          payload: {
            isLoggedIn: false,
            user: null,
          },
        });
      }
    };

    init();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      const stored = getLocalStorage("userData");
      if (!stored?.token) return;

      setSession(null);
      dispatch({ type: LOGOUT, payload: { isLoggedIn: false, user: null } });
      toast.warning("Sesi Berakhir", {
        description: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  // if (!state.isInitialised) {
  //   return <div>Gagal init</div>;
  // }
  return (
    <AuthContext.Provider
      value={{ ...state, isNdaPending, login, logout, setNdaAccepted }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
