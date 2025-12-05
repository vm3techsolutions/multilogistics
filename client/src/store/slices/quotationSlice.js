import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // your axios instance

//--------------------------------------
//  API: Create Quotation
//--------------------------------------
export const createQuotation = createAsyncThunk(
  "quotation/createQuotation",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/createQuotation", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//--------------------------------------
//  API: Get All Quotations
//--------------------------------------
export const getAllQuotations = createAsyncThunk(
  "quotation/getAllQuotations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/getAllQuotations");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//--------------------------------------
//  API: Get Quotation By ID
//--------------------------------------
export const getQuotationById = createAsyncThunk(
  "quotation/getQuotationById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/getQuotationById/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//--------------------------------------
//  API: Get Quotation By Quote Number
//--------------------------------------
export const getQuotationByQuoteNo = createAsyncThunk(
  "quotation/getQuotationByQuoteNo",
  async (quote_no, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/number/${quote_no}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//--------------------------------------
//  API: Update Quotation
//--------------------------------------
export const updateQuotation = createAsyncThunk(
  "quotation/updateQuotation",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/updateQuotation/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//--------------------------------------
//  API: Approve Quotation
//--------------------------------------
export const approveQuotation = createAsyncThunk(
  "quotation/approveQuotation",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/approveQuotation/${id}`, { status });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


//--------------------------------------
//  API: Send Email
//--------------------------------------
export const sendQuotationEmail = createAsyncThunk(
  "quotation/sendQuotationEmail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/quotation/send-email/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//=======================================================
//  Slice
//=======================================================
const quotationSlice = createSlice({
  name: "quotation",
  initialState: {
    quotations: [],
    singleQuotation: null,
    loading: false,
    error: null,
    successMessage: null,
  },

  reducers: {
    clearQuotationMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    resetQuotationState(state) {
    state.quotations = [];
    state.singleQuotation = null;
    state.loading = false;
    state.error = null;
    state.successMessage = null;
  },
  },

  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createQuotation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createQuotation.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Quotation created successfully";
      })
      .addCase(createQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Something went wrong";

      })

      // GET ALL
      .addCase(getAllQuotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.quotations = action.payload;
      })
      .addCase(getAllQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET BY ID
      .addCase(getQuotationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuotationById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleQuotation = action.payload;
      })
      .addCase(getQuotationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET BY QUOTE NO
      .addCase(getQuotationByQuoteNo.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuotationByQuoteNo.fulfilled, (state, action) => {
        state.loading = false;
        state.singleQuotation = action.payload;
      })
      .addCase(getQuotationByQuoteNo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateQuotation.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateQuotation.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Quotation updated successfully";
      })
      .addCase(updateQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // APPROVE
      .addCase(approveQuotation.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveQuotation.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Quotation approved successfully";
      })
      .addCase(approveQuotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SEND EMAIL
      .addCase(sendQuotationEmail.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendQuotationEmail.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Quotation email sent successfully";
      })
      .addCase(sendQuotationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearQuotationMessages, resetQuotationState  } = quotationSlice.actions;
export default quotationSlice.reducer;
