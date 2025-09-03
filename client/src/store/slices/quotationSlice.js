// src/redux/slices/quotationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ✅ Create quotation
export const createQuotation = createAsyncThunk(
  "quotation/createQuotation",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/createQuotation", formData);
      return response.data; // { success, message, data: {...} }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Something went wrong" });
    }
  }
);

// ✅ Get all quotations
export const getAllQuotations = createAsyncThunk(
  "quotation/getAllQuotations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/getAllQuotations");
      return response.data; // { success, message, data: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to fetch quotations" });
    }
  }
);

const quotationSlice = createSlice({
  name: "quotation",
  initialState: {
    quotations: [],
    loading: false,
    success: false,
    error: null,
    lastCreated: null,
  },
  reducers: {
    resetQuotationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.lastCreated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create quotation
      .addCase(createQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lastCreated = action.payload.data; // store the created quotation summary
        // ❌ Don't push to quotations here since it's partial
        // ✅ Instead re-fetch list with getAllQuotations after creation
      })
      .addCase(createQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create quotation";
        state.success = false;
      })

      // Get all quotations
      .addCase(getAllQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.quotations = action.payload.data || [];
      })
      .addCase(getAllQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch quotations";
      });
  },
});

export const { resetQuotationState } = quotationSlice.actions;
export default quotationSlice.reducer;
