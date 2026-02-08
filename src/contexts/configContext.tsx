import { createContext, useReducer, type ReactNode } from "react";

type TStateType = {
  theme: string;
  language: string;
  isRtl: boolean;
  isSidebarOpen: boolean;
  isMouseActive: boolean;
  kodeWilayah: string;
  namaWilayah: string;
};

type TActionType =
  | { type: "TOGGLE_THEME" }
  | { type: "TOGGLE_LANGUAGE" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_MOUSE_ACTIVE" }
  | { type: "SET_KODE_WILAYAH"; payload: string }
  | { type: "SET_NAMA_WILAYAH"; payload: string };

type TContextProps = {
  state: TStateType;
  dispatch: React.Dispatch<TActionType>;
};

type TConfigContextProviderProps = {
  children: ReactNode;
};

const initialState: TStateType = {
  theme: "light",
  language: "en",
  isRtl: false,
  isSidebarOpen: true,
  isMouseActive: false,
  kodeWilayah: "",
  namaWilayah: "19900 - KESELURUHAN/PUSAT",
};

export const ConfigContext = createContext<TContextProps>({
  state: initialState,
  dispatch: () => null,
});

const reducer = (state: TStateType, action: TActionType) => {
  switch (action.type) {
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };
    case "TOGGLE_LANGUAGE":
      return {
        ...state,
        language: state.language === "en" ? "ar" : "en",
        isRtl: !state.isRtl,
      };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    case "TOGGLE_MOUSE_ACTIVE":
      return {
        ...state,
        isMouseActive: !state.isMouseActive,
      };
    case "SET_KODE_WILAYAH":
      return {
        ...state,
        kodeWilayah: action.payload,
      };
    case "SET_NAMA_WILAYAH":
      return {
        ...state,
        namaWilayah: action.payload,
      };
    default:
      return state;
  }
};

export const ConfigContextProvider: React.FC<TConfigContextProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ConfigContext.Provider value={{ state, dispatch }}>
      {children}
    </ConfigContext.Provider>
  );
};
