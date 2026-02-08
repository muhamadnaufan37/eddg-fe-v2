import { ACCOUNT_INITIALISE, IS_LOADING, LOGIN, LOGOUT } from "./actions";

interface User {
  // Define the properties of the user object
  // For example, the user's name and email
  email: string;
  id: number;
  name: string;
  role: string;
  token: string;
  token_expire: string;
  username: string;
}

interface AccountState {
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialised: boolean;
  user: User | null;
}

interface AccountAction {
  type: string;
  payload: {
    isLoggedIn?: boolean;
    isLoading?: boolean;
    user?: User | null;
  };
}

const initialState: AccountState = {
  isLoggedIn: false,
  isLoading: false,
  isInitialised: false,
  user: null,
};

const accountReducer = (
  state: AccountState = initialState,
  action: AccountAction
): AccountState => {
  switch (action.type) {
    case ACCOUNT_INITIALISE: {
      const { isLoggedIn, user } = action.payload;
      return {
        ...state,
        isLoggedIn: isLoggedIn ?? state.isLoggedIn,
        isInitialised: true,
        user: user ?? state.user,
      };
    }
    case LOGIN: {
      const { user } = action.payload;
      return {
        ...state,
        isLoggedIn: true,
        user: user ?? state.user,
      };
    }
    case LOGOUT: {
      return {
        ...state,
        isLoggedIn: false,
        user: null,
      };
    }
    case IS_LOADING: {
      return {
        ...state,
        isLoading: action.payload.isLoading ?? state.isLoading,
      };
    }
    default: {
      return state;
    }
  }
};

export default accountReducer;
