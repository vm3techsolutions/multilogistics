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
      return rejectWithValue(
        err.response?.data || { message: "Something went wrong" }
      );
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
      return rejectWithValue(
        err.response?.data || { message: "Failed to fetch quotations" }
      );
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
      return rejectWithValue(
        err.response?.data || { message: "Failed to fetch the quotation" }
      );
    }
  }
);

// ✅ Update quotation
export const updateQuotation = createAsyncThunk(
  "quotation/updateQuotation",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/updateQuotation/${id}`, data);
      return response.data; // { success, message, data: {...} }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to update quotation" }
      );
    }
  }
);

// ✅ Update quotation status (approve / reject)
export const updateQuotationStatus = createAsyncThunk(
  "quotation/updateQuotationStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/approveQuotation/${id}`, {
        status,
      });
      return response.data; // { success, message, data: { quotationId, status } }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to update status" }
      );
    }
  }
);
// src/redux/slices/quotationSlice.js
export const triggerQuotationEmail = createAsyncThunk(
  "quotation/triggerQuotationEmail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/quotation/send-email/${id}`);
      return response.data; // { success, message, data: { quotationId } }
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to trigger email" }
      );
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
    lastEmailMessage: null,
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
        state.lastCreated = action.payload.data || null;
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
      })

      // Get quotation by ID
      .addCase(getQuotationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotationById.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.quotation = action.payload.data || null;
      })
      .addCase(getQuotationById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch the quotation";
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
  state.lastUpdated = action.payload.data || null;

  // Optional: if you want to update only some fields locally,
  // you can find the quotation by ID and update what is returned
  const quotationId = action.payload.data?.quotationId;
  if (quotationId) {
    const index = state.quotations.findIndex(q => q.id === quotationId);
    if (index !== -1) {
      // Only update fields you know (here just marking it as updated)
      state.quotations[index] = {
        ...state.quotations[index],
        updated_at: new Date().toISOString() // mark locally updated timestamp
      };
    }
  }
})
.addCase(updateQuotation.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload?.message || "Failed to update quotation";
  state.success = false;
})

      // Trigger quotation email
      // Trigger quotation email
      .addCase(triggerQuotationEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerQuotationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lastEmailMessage = action.payload.message || null;

        // Update the quotation status locally
        const quotationId = action.payload.data?.quotationId;
        if (quotationId) {
          const index = state.quotations.findIndex((q) => q.id === quotationId);
          if (index !== -1) {
            state.quotations[index].status = "pending"; // after sending email
          }
        }
      })
      .addCase(triggerQuotationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to trigger email";
      });
  },
});

export const { resetQuotationState } = quotationSlice.actions;
export default quotationSlice.reducer;
