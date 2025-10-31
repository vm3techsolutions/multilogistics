import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

const API_BASE_URL = "http://localhost:5000/api";

/* ------------------------- FETCH ALL COURIER EXPORTS ------------------------- */
export const fetchCourierExports = createAsyncThunk(
  "courierExports/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get(`/courier-exports-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.courier_exports || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch courier exports");
    }
  }
);

/* ------------------------- FETCH COURIER EXPORTS BY ID------------------------- */
export const fetchCourierExportById = createAsyncThunk(
  "courierExports/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get(`/courier-exports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.courier_export;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courier export details"
      );
    }
  }
);

/* --------------------------- CREATE COURIER EXPORT --------------------------- */
export const createCourierExport = createAsyncThunk(
  "courierExports/create",
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.post(`/courier-exports`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.courier_export || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create courier export");
    }
  }
);

/* ------------------------------- SLICE SETUP ------------------------------- */
const courierExportSlice = createSlice({
  name: "courierExports",
  initialState: {
    list: [],
    selectedExport: null,
    loading: false,
    success: false,
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
      state.currentPage = 1;
    },
    resetCourierExportState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    clearSelectedExport: (state) => {
      state.selectedExport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch all courier exports
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
      })

      // ✅ Fetch single courier export
      .addCase(fetchCourierExportById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedExport = null;
      })
      .addCase(fetchCourierExportById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedExport = action.payload;
      })
      .addCase(fetchCourierExportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Create courier export
      .addCase(createCourierExport.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createCourierExport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.list.unshift(action.payload); // add new export to top
      })
      .addCase(createCourierExport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* ----------------------------- EXPORT ACTIONS ----------------------------- */
export const { setPage, setPerPage, resetCourierExportState, clearSelectedExport } = courierExportSlice.actions;
export default courierExportSlice.reducer;
