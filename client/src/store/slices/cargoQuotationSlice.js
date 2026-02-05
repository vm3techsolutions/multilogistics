import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

/* =====================================================
   CREATE CARGO QUOTATION
===================================================== */
export const createCargoQuotation = createAsyncThunk(
  "cargoQuotation/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/create-cargo-quotation",
        payload
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   GET ALL CARGO QUOTATIONS
===================================================== */
export const getAllCargoQuotations = createAsyncThunk(
  "cargoQuotation/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        "/get-all-cargo-quotations"
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   GET CARGO QUOTATION BY ID
===================================================== */
export const getCargoQuotationById = createAsyncThunk(
  "cargoQuotation/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/get-cargo-quotation/${id}`
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   GET CARGO QUOTATION BY QUOTE NO (PUBLIC)
===================================================== */
export const getCargoQuotationByQuoteNo = createAsyncThunk(
  "cargoQuotation/getByQuoteNo",
  async (quoteNo, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/get-cargo-quotation-by-quote-no/${quoteNo}`
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   UPDATE CARGO QUOTATION
===================================================== */
export const updateCargoQuotation = createAsyncThunk(
  "cargoQuotation/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/update-cargo-quotations/${id}`,
        payload
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   UPDATE CARGO QUOTATION STATUS
===================================================== */
export const updateCargoQuotationStatus = createAsyncThunk(
  "cargoQuotation/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/approve-cargo-quotation/${id}`,
        { status }
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   SEND CARGO QUOTATION EMAIL
===================================================== */
export const sendCargoQuotationEmail = createAsyncThunk(
  "cargoQuotation/sendEmail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `/cargo-quotation/send-email/${id}`
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/* =====================================================
   SLICE
===================================================== */
const cargoQuotationSlice = createSlice({
  name: "cargoQuotation",
  initialState: {
    loading: false,
    success: false,
    error: null,
    successMessage: null,
    quotations: [],
    quotation: null,
    quotationByQuoteNo: null,
  },

  reducers: {
    resetCargoQuotationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.successMessage = null;
      state.quotation = null;
      state.quotationByQuoteNo = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= CREATE ================= */
      .addCase(createCargoQuotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCargoQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.quotation = action.payload.data;
      })
      .addCase(createCargoQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= GET ALL ================= */
      .addCase(getAllCargoQuotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllCargoQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload.data;
      })
      .addCase(getAllCargoQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= GET BY ID ================= */
      .addCase(getCargoQuotationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCargoQuotationById.fulfilled, (state, action) => {
        state.loading = false;
        state.quotation = action.payload.data;
      })
      .addCase(getCargoQuotationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= GET BY QUOTE NO ================= */
      .addCase(getCargoQuotationByQuoteNo.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCargoQuotationByQuoteNo.fulfilled, (state, action) => {
        state.loading = false;
        state.quotationByQuoteNo = action.payload.data;
      })
      .addCase(getCargoQuotationByQuoteNo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= UPDATE ================= */
      .addCase(updateCargoQuotation.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCargoQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.quotation = action.payload.data;
      })
      .addCase(updateCargoQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= UPDATE STATUS ================= */
      .addCase(updateCargoQuotationStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCargoQuotationStatus.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;
  state.successMessage = action.payload.message;

  const { quotationId, status } = action.payload.data;

  const index = state.quotations.findIndex(
    (q) => q.id === quotationId
  );

  if (index !== -1) {
    state.quotations[index].status = status;
  }
})
      .addCase(updateCargoQuotationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  

/* ================= SEND EMAIL ================= */
.addCase(sendCargoQuotationEmail.pending, (state) => {
  state.loading = true;
})
.addCase(sendCargoQuotationEmail.fulfilled, (state, action) => {
  state.loading = false;
  state.successMessage = action.payload.message;

  const quotationId = action.payload.data.quotationId;
  const index = state.quotations.findIndex(
    (q) => q.id === quotationId
  );

  if (index !== -1) {
    state.quotations[index].status = "sent";
  }
})
.addCase(sendCargoQuotationEmail.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});

},
});

export const { resetCargoQuotationState } = cargoQuotationSlice.actions;
export default cargoQuotationSlice.reducer;