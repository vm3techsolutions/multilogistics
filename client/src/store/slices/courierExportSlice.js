import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

/* ------------------------- CREATE COURIER EXPORT ------------------------- */
export const createCourierExport = createAsyncThunk(
  "courierExports/create",
  async ({ formData, confirm = false }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.post(`/courier-exports${confirm ? "?confirm=true" : ""}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.courier_export || res.data;
    } catch (error) {
      // Include full error data for handling 409 conflicts
      return rejectWithValue(error.response?.data || { message: "Failed to create courier export" });
    }
  }
);

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

/* ------------------------- FETCH COURIER EXPORT BY ID------------------------- */
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

/* ------------------------------- SLICE SETUP ------------------------------- */
const courierExportSlice = createSlice({
  name: "courierExports",
  initialState: {
    list: [],
    selectedExport: null,
    loading: false,
    success: false,
    error: null,
    existingExports: [], // For handling 409 conflict
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
      state.existingExports = [];
    },
    clearSelectedExport: (state) => {
      state.selectedExport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all exports
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

      // Fetch single export
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

      // Create export
      .addCase(createCourierExport.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.existingExports = [];
      })
      .addCase(createCourierExport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.list.unshift(action.payload);
      })
      .addCase(createCourierExport.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        // If backend returned 409 conflict with existing_exports
        if (action.payload?.existing_exports) {
          state.existingExports = action.payload.existing_exports;
          state.error = action.payload.message;
        } else {
          state.error = action.payload?.message || "Failed to create courier export";
        }
      });
  },
});

export const {
  setPage,
  setPerPage,
  resetCourierExportState,
  clearSelectedExport,
} = courierExportSlice.actions;
export default courierExportSlice.reducer;
