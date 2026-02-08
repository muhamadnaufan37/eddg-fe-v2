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
import { axiosServices } from "../services/axios";
import { toast } from "sonner";

type TData = {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  name?: string;
  token?: string;
  token_expire?: string;
};

type TAuthContext = {
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialised: boolean;
  user: TData | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const initialState = {
  isLoggedIn: false,
  isLoading: false,
  isInitialised: false,
  user: null,
};

const AuthContext = createContext<TAuthContext>({
  ...initialState,
  login: async () => {},
  logout: () => {},
});

const verifyToken = (serviceToken: any): boolean => {
  if (!serviceToken) {
    return false;
  } else {
    return true;
  }
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

  const logout = async () => {
    dispatch({ type: IS_LOADING, payload: { isLoading: true } });

    try {
      const response = await axiosServices().post(`/api/v1/logout`);

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
      console.log(error);
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

        if (stored?.token && verifyToken(stored.token)) {
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

  // if (!state.isInitialised) {
  //   return <div>Gagal init</div>;
  // }
  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
