import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User, AuthTokens } from "../../types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; tokens: AuthTokens }>
    ) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = true;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateUser, updateTokens, logout } =
  authSlice.actions;
export const logoutAction = logout; // Export with alias for clarity
export default authSlice.reducer;
