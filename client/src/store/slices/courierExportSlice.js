import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // import your axios instance

// ✅ Async thunk to fetch all courier exports
export const fetchCourierExports = createAsyncThunk(
  "courierExports/fetchCourierExports",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/courier-exports-all"); // adjust API endpoint if needed
      return res.data.courier_exports || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const courierExportSlice = createSlice({
  name: "courierExports",
  initialState: {
    list: [],
    loading: false,
    error: null,
    currentPage: 1,
    perPage: 5,
  },
  reducers: {
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPerPage: (state, action) => {
      state.perPage = action.payload;
      state.currentPage = 1; // reset page when perPage changes
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourierExports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourierExports.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCourierExports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPage, setPerPage } = courierExportSlice.actions;

export default courierExportSlice.reducer;
