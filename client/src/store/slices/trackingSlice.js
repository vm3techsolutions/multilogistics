import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ================== TRACK FEDEx SHIPMENT ==================
export const trackFedexShipment = createAsyncThunk(
  "tracking/trackFedexShipment",
  async (trackingNumber, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/track/${trackingNumber}`);
      return data; // trackingDetails object returned from backend
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// export const trackFedexShipment = createAsyncThunk(
//   "tracking/trackFedexShipment",
//   async (trackingNumber, { rejectWithValue }) => {
//     try {
//       // ⭐ FRONTEND MOCK MODE (no backend call)
//       if (!trackingNumber.startsWith("REAL")) {
//         return {
//           trackingNumber,
//           status: "In Transit",
//           lastUpdate: "2025-01-10T12:30:00Z",
//           location: "Mumbai",
//           estimatedDelivery: "2025-01-15",
//           events: [
//             {
//               description: "Shipment picked up",
//               date: "2025-01-10T10:00:00Z",
//               city: "Pune",
//               country: "IN",
//             },
//             {
//               description: "Arrived at facility",
//               date: "2025-01-10T14:00:00Z",
//               city: "Mumbai",
//               country: "IN",
//             }
//           ]
//         };
//       }

//       // REAL API CALL (when available)
//       const { data } = await axiosInstance.get(`/track/${trackingNumber}`);
//       return data;

//     } catch (err) {
//       return rejectWithValue(err.response?.data?.error || err.message);
//     }
//   }
// );


const trackingSlice = createSlice({
  name: "tracking",
  initialState: {
    loading: false,
    trackingDetails: null,
    error: null,
  },
  reducers: {
    resetTrackingState: (state) => {
      state.loading = false;
      state.trackingDetails = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(trackFedexShipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trackFedexShipment.fulfilled, (state, action) => {
        state.loading = false;
        state.trackingDetails = action.payload;
      })
      .addCase(trackFedexShipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetTrackingState } = trackingSlice.actions;
export default trackingSlice.reducer;
