import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // use your configured axios instance

// Async thunk to fetch export stats
export const fetchStats = createAsyncThunk(
  "stats/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/courier-exports/stats");
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch stats" }
      );
    }
  }
);

const exportStatSlice = createSlice({
  name: "stats",
  initialState: {
    totalShipments: 0,
    activeShipments: 0,
    avgDeliveryTime: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.totalShipments = action.payload.totalShipments || 0;
        state.activeShipments = action.payload.activeShipments || 0;
        state.avgDeliveryTime = action.payload.avgDeliveryTime || 0;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || action.error.message || "Something went wrong";
      });
  },
});

export default exportStatSlice.reducer;
