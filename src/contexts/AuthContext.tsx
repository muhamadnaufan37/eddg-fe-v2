import { createContext, useEffect, useReducer, type ReactNode } from "react";
import accountReducer from "../store/accountReducer";
import type { User } from "../store/accountReducer";
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
import {
  AUTH_SESSION_UPDATED_EVENT,
  AUTH_UNAUTHORIZED_EVENT,
  axiosServices,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
} from "../services/axios";
import Swal from "sweetalert2";
import { toast } from "sonner";

type TAuthContext = {
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialised: boolean;
  user: User | null;
  isNdaPending: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (keterangan?: string) => void;
  setNdaAccepted: (_userId?: string) => void;
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
  login: async () => { },
  logout: () => { },
  setNdaAccepted: () => { },
});

const verifyToken = (expiresAt?: string): boolean => {
  if (!expiresAt) {
    return false;
  }

  const expirationTime = Date.parse(expiresAt);
  return Number.isFinite(expirationTime) && expirationTime > Date.now();
};

const setSession = (data?: {
  token?: string;
  expires_at?: string;
  user?: Record<string, unknown>;
} | null) => {
  if (data?.token) {
    setAccessToken(data.token);
    setLocalStorage("userData", {
      expires_at: data.expires_at,
      user: data.user,
    });
  } else {
    setAccessToken(null);
    localStorage.removeItem("userData");
  }
};

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(accountReducer, initialState);

  const isNdaPending = Boolean(
    state.user?.status_nda === 0 || String(state.user?.status_nda) === "0",
  );

  const setNdaAccepted = (_userId?: string) => {
    void _userId;

    try {
      const stored = getLocalStorage("userData");
      if (!stored || !stored.user) return;

      const updatedUser = { ...stored.user, status_nda: 1 };

      setLocalStorage("userData", {
        ...stored,
        user: updatedUser,
      });

      dispatch({
        type: LOGIN,
        payload: { user: updatedUser, isLoggedIn: true },
      });
    } catch {
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
        const dataUser = response.data.data.user;
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
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Tidak dapat terhubung ke server";
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
        setSession(null);
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
    } catch {
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
        const hasStoredUser = Boolean(stored?.user);

        if (!hasStoredUser) {
          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: false,
              user: null,
            },
          });
          return;
        }

        const currentToken = getAccessToken();
        if (currentToken && verifyToken(stored.expires_at)) {
          dispatch({
            type: ACCOUNT_INITIALISE,
            payload: {
              isLoggedIn: true,
              user: stored.user,
            },
          });
          return;
        }

        try {
          const refreshedToken = await refreshAccessToken();

          if (refreshedToken) {
            dispatch({
              type: ACCOUNT_INITIALISE,
              payload: {
                isLoggedIn: true,
                user: getLocalStorage("userData")?.user || stored.user,
              },
            });
            return;
          }
        } catch {
          // Continue to unauthorised cleanup when the refresh session is invalid.
        }

        setSession(null);
        dispatch({
          type: ACCOUNT_INITIALISE,
          payload: {
            isLoggedIn: false,
            user: null,
          },
        });
      } catch {
        setSession(null);
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
    const handleSessionUpdated = (event: Event) => {
      const updatedUser = (event as CustomEvent<{ user: User }>).detail?.user;
      if (!updatedUser) return;

      dispatch({
        type: LOGIN,
        payload: { user: updatedUser, isLoggedIn: true },
      });
    };

    const handleUnauthorized = async (e: Event) => {
      const stored = getLocalStorage("userData");
      if (!stored?.user) return;

      const detail = (e as CustomEvent)?.detail;
      const serverMessage: string | null = detail?.message || null;

      await Swal.fire({
        title: serverMessage ? "Anda Dikeluarkan" : "Sesi Berakhir",
        html: serverMessage
          ? `<p style="color:#374151;font-size:14px;">${serverMessage}</p>`
          : `<p style="color:#374151;font-size:14px;">Sesi Anda telah berakhir. Silakan login kembali.</p>`,
        icon: serverMessage ? "error" : "warning",
        confirmButtonText: "OK, Mengerti",
        confirmButtonColor: "#2563eb",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          container: "!z-[99999]",
        },
      });

      setSession(null);
      dispatch({ type: LOGOUT, payload: { isLoggedIn: false, user: null } });
    };

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdated);
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdated);
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, isNdaPending, login, logout, setNdaAccepted }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
