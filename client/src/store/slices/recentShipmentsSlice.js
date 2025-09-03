import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // use your configured axios instance

// Async thunk to fetch recent shipments
export const fetchRecentShipments = createAsyncThunk(
  "recentShipments/fetchRecentShipments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/recent-shipments"); 
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch recent shipments" }
      );
    }
  }
);

const recentShipmentsSlice = createSlice({
  name: "recentShipments",
  initialState: {
    shipments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentShipments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentShipments.fulfilled, (state, action) => {
        state.loading = false;
        state.shipments = action.payload;
      })
      .addCase(fetchRecentShipments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || action.error.message || "Something went wrong";
      });
  },
});

export default recentShipmentsSlice.reducer;
