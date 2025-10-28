// src/redux/slices/quotationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

/* -------------------------------------------------------------------------- */
/* ✅ New Features: Fetch all quotations + Fetch by number (with token)       */
/* -------------------------------------------------------------------------- */
export const fetchAllQuotations = createAsyncThunk(
  "quotation/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/getAllQuotations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch quotations"
      );
    }
  }
);

export const fetchQuotationByNumber = createAsyncThunk(
  "quotation/fetchByNumber",
  async (quote_no, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/number/${encodeURIComponent(quote_no)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch quotation details"
      );
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Existing CRUD Features                                                  */
/* -------------------------------------------------------------------------- */

// ✅ Create quotation
export const createQuotation = createAsyncThunk(
  "quotation/createQuotation",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/createQuotation", formData);
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to update status" }
      );
    }
  }
);

// ✅ Trigger quotation email
export const triggerQuotationEmail = createAsyncThunk(
  "quotation/triggerQuotationEmail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/quotation/send-email/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to trigger email" }
      );
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Slice                                                                  */
/* -------------------------------------------------------------------------- */
const quotationSlice = createSlice({
  name: "quotation",
  initialState: {
    quotations: [],
    quotation: null,
    selectedQuotation: null,
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
      state.selectedQuotation = null;
    },
    clearSelectedQuotation: (state) => {
      state.selectedQuotation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ------------------ New fetchAll / fetchByNumber ------------------ */
      .addCase(fetchAllQuotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;
      })
      .addCase(fetchAllQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchQuotationByNumber.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQuotationByNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedQuotation = action.payload;
      })
      .addCase(fetchQuotationByNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* --------------------------- Create --------------------------- */
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
        state.error =
          action.payload?.message || "Failed to create quotation";
        state.success = false;
      })

      /* --------------------------- Get All --------------------------- */
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
        state.error =
          action.payload?.message || "Failed to fetch quotations";
      })

      /* --------------------------- Get by ID --------------------------- */
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

      /* --------------------------- Update --------------------------- */
      .addCase(updateQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lastUpdated = action.payload.data || null;

        const index = state.quotations.findIndex(
          (q) => q.id === action.payload.data?.id
        );
        if (index !== -1) {
          state.quotations[index] = action.payload.data;
        }
      })
      .addCase(updateQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to update quotation";
        state.success = false;
      })

      /* --------------------------- Update Status --------------------------- */
      .addCase(updateQuotationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuotationStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const { quotationId, status } = action.payload.data;
        const index = state.quotations.findIndex((q) => q.id === quotationId);
        if (index !== -1) {
          state.quotations[index].status = status;
        }
      })
      .addCase(updateQuotationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to update quotation status";
      })

      /* --------------------------- Send Email --------------------------- */
      .addCase(triggerQuotationEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerQuotationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lastEmailMessage = action.payload.message || null;

        const quotationId = action.payload.data?.quotationId;
        if (quotationId) {
          const index = state.quotations.findIndex((q) => q.id === quotationId);
          if (index !== -1) {
            state.quotations[index].status = "pending";
          }
        }
      })
      .addCase(triggerQuotationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to trigger email";
      });
  },
});

export const { resetQuotationState, clearSelectedQuotation } =
  quotationSlice.actions;

export default quotationSlice.reducer;

