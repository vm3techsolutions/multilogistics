import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // your axios instance

// ✅ Fetch all courier exports
export const fetchCourierExports = createAsyncThunk(
  "courierExports/fetchCourierExports",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/courier-exports-all");
      return res.data.courier_exports || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Create a new courier export
export const createCourierExport = createAsyncThunk(
  "courierExports/createCourierExport",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/courier-exports", formData);
      return res.data.courier_export; // return the created export object
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Slice
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
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
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

      // Create export
      .addCase(createCourierExport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourierExport.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload); // add new export to the top
      })
      .addCase(createCourierExport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPage, setPerPage } = courierExportSlice.actions;
export default courierExportSlice.reducer;
