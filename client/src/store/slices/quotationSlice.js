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

// ✅ Get quotation by ID
export const getQuotationById = createAsyncThunk(
  "quotation/getQuotationById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/getQuotationById/${id}`);
      return response.data; // { success, message, data: {...} }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to fetch the quotation" });
    }
  }
);

// ✅ Update quotation
export const updateQuotation = createAsyncThunk(
  "quotation/updateQuotation",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/updateQuotation/${id}`, formData);
      return response.data; // { success, message, data: {...} }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to update quotation" });
    }
  }
);

const quotationSlice = createSlice({
  name: "quotation",
  initialState: {
    quotations: [],
    quotation: null,
    loading: false,
    success: false,
    error: null,
    lastCreated: null,
    lastUpdated: null,
  },
  reducers: {
    resetQuotationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.lastCreated = null;
      state.lastUpdated = null;
      state.quotation = null;
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
        console.log("Quotations API Response:", action.payload);
        state.loading = false;
        state.success = true;
        state.quotations = action.payload.data || [];
      })
      .addCase(getAllQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch quotations";
      })

      // Get quotation by ID
      .addCase(getQuotationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotationById.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.quotation = action.payload.data;
      })
      .addCase(getQuotationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch the quotation";
      })

      // Update quotation
      .addCase(updateQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lastUpdated = action.payload.data;
        // Optionally update the quotation in the list if it exists
        const index = state.quotations.findIndex(q => q.id === action.payload.data.id);
        if (index !== -1) {
          state.quotations[index] = action.payload.data;
        }
      })
      .addCase(updateQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update quotation";
        state.success = false;
      });
  },
});

export const { resetQuotationState } = quotationSlice.actions;
export default quotationSlice.reducer;
