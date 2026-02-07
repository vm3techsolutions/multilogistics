import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

/* ================= CREATE ================= */
export const createSeaQuotation = createAsyncThunk(
  "seaQuotation/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/create-sea-quotation",
        payload
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= GET ALL ================= */
export const fetchAllSeaQuotations = createAsyncThunk(
  "seaQuotation/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        "/get-all-sea-quotations"
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= GET BY ID ================= */
export const fetchSeaQuotationById = createAsyncThunk(
  "seaQuotation/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/get-sea-quotation/${id}`
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= GET BY QUOTE NO ================= */
export const fetchSeaQuotationByQuoteNo = createAsyncThunk(
  "seaQuotation/getByQuoteNo",
  async (quoteNo, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/get-sea-quotation-by-quote-no/${quoteNo}`
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= UPDATE ================= */
export const updateSeaQuotation = createAsyncThunk(
  "seaQuotation/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/update-sea-quotations/${id}`,
        payload
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= APPROVE ================= */
export const approveSeaQuotation = createAsyncThunk(
  "seaQuotation/approve",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/approve-sea-quotation/${id}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= SEND EMAIL ================= */
export const sendSeaQuotationEmail = createAsyncThunk(
  "seaQuotation/sendEmail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `/sea-quotation/send-email/${id}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ================= SLICE ================= */
const seaQuotationSlice = createSlice({
  name: "seaQuotation",
  initialState: {
    loading: false,
    list: [],
    current: null,
    success: false,
    error: null,
  },
  reducers: {
    resetSeaQuotationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* CREATE */
      .addCase(createSeaQuotation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSeaQuotation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.current = action.payload.data;
      })
      .addCase(createSeaQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* GET ALL */
      .addCase(fetchAllSeaQuotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSeaQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllSeaQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* GET BY ID */
      .addCase(fetchSeaQuotationById.fulfilled, (state, action) => {
        state.current = action.payload;
      })

      /* GET BY QUOTE NO */
      .addCase(fetchSeaQuotationByQuoteNo.fulfilled, (state, action) => {
        state.current = action.payload;
      })

      /* UPDATE */
      .addCase(updateSeaQuotation.fulfilled, (state) => {
        state.success = true;
      })

      /* APPROVE */
      .addCase(approveSeaQuotation.fulfilled, (state) => {
        state.success = true;
      })

      /* SEND EMAIL */
      .addCase(sendSeaQuotationEmail.fulfilled, (state) => {
        state.success = true;
      });
  },
});

export const { resetSeaQuotationState } = seaQuotationSlice.actions;
export default seaQuotationSlice.reducer;