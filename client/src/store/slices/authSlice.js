// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ✅ Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/login", { email, password });
      const data = res.data;

      if (data.token) localStorage.setItem("token", data.token);

      if (data.admin) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.admin.id,
            role: data.admin.role,
            username: data.admin.name,
          })
        );
      }

      return {
        id: data.admin?.id || null,
        token: data.token,
        role: data.admin?.role || null,
        username: data.admin?.name || null,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid credentials"
      );
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState: {
    token:
      typeof window !== "undefined" ? localStorage.getItem("token") : null,
      id:
  typeof window !== "undefined" && localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).id
    : null,
    role:
      typeof window !== "undefined" && localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")).role
        : null,
    username:
      typeof window !== "undefined" && localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")).username
        : null,
    isAuthenticated:
      typeof window !== "undefined" && localStorage.getItem("token")
        ? true
        : false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.username = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    loadUser: (state) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const user =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user"))
          : null;

      if (token) {
        state.token = token;
        state.id = user?.id || null;  
        state.role = user?.role || null;
        state.username = user?.username || null;
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
  state.loading = false;
  state.id = action.payload.id;
  state.token = action.payload.token;
  state.role = action.payload.role;
  state.username = action.payload.username;
  state.isAuthenticated = true;
})

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, loadUser } = authSlice.actions;
export default authSlice.reducer;
