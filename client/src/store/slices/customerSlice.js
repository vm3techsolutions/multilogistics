import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

/* -------------------------------------------------------
   ✅ 1. FETCH ALL CUSTOMERS
------------------------------------------------------- */
export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/getCustomers");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch customers");
    }
  }
);

/* -------------------------------------------------------
   ✅ 2. FETCH CUSTOMER BY ID
------------------------------------------------------- */
export const fetchCustomerById = createAsyncThunk(
  "customers/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/get-customer/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch customer");
    }
  }
);

/* -------------------------------------------------------
   ✅ 3. CREATE CUSTOMER + MULTI KYC UPLOAD
------------------------------------------------------- */
export const addCustomer = createAsyncThunk(
  "customers/add",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/addCustomer", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add customer");
    }
  }
);

/* -------------------------------------------------------
   ✅ 4. EDIT CUSTOMER + MULTI KYC UPLOAD
------------------------------------------------------- */
export const editCustomer = createAsyncThunk(
  "customers/edit",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/editCustomer/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update customer");
    }
  }
);

/* -------------------------------------------------------
   ✅ 5. FETCH CUSTOMER’S KYC DOCUMENTS
------------------------------------------------------- */
export const getKycDocuments = createAsyncThunk(
  "customers/getKycDocuments",
  async (customerId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/kyc/${customerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return { customerId, documents: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch KYC documents");
    }
  }
);

/* -------------------------------------------------------
   ✅ 6. UPDATE CUSTOMER STATUS (Active / Inactive)
------------------------------------------------------- */
export const updateCustomerStatus = createAsyncThunk(
  "customers/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/update-status/${id}`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update customer status");
    }
  }
);

/* -------------------------------------------------------
   ✅ SLICE
------------------------------------------------------- */
const customerSlice = createSlice({
  name: "customers",
  initialState: {
    list: [],
    selectedCustomer: null,
    loading: false,
    error: null,
    success: false,
    message: null,
    kycDocuments: {}, // 🔹 per-customer KYC store: { [id]: [docs] }
  },
  reducers: {
    resetCustomerState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
      state.selectedCustomer = null;
      state.kycDocuments = {};
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* -------------------------------------------------------
         🔹 FETCH CUSTOMERS
      ------------------------------------------------------- */
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------------------------------------------------------
         🔹 FETCH CUSTOMER BY ID
      ------------------------------------------------------- */
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------------------------------------------------------
         🔹 CREATE CUSTOMER (with KYC)
      ------------------------------------------------------- */
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.list.unshift(action.payload.customer);
        if (action.payload.uploaded_docs?.length) {
          state.kycDocuments[action.payload.customer.id] = action.payload.uploaded_docs;
        }
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------------------------------------------------------
         🔹 EDIT CUSTOMER (with KYC)
      ------------------------------------------------------- */
      .addCase(editCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;

        const updated = action.payload.customer;
        const index = state.list.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.list[index] = updated;

        if (action.payload.uploaded_docs?.length) {
          state.kycDocuments[updated.id] = action.payload.uploaded_docs;
        }
      })
      .addCase(editCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------------------------------------------------------
         🔹 GET KYC DOCUMENTS
      ------------------------------------------------------- */
      .addCase(getKycDocuments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getKycDocuments.fulfilled, (state, action) => {
        state.loading = false;
        const { customerId, documents } = action.payload;
        state.kycDocuments[customerId] = documents;
      })
      .addCase(getKycDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------------------------------------------------------
         🔹 UPDATE STATUS
      ------------------------------------------------------- */
      .addCase(updateCustomerStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCustomerStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.customer;
        const index = state.list.findIndex((c) => c.id === updated.id);
        if (index !== -1) state.list[index] = updated;
        state.message = action.payload.message;
      })
      .addCase(updateCustomerStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetCustomerState, clearSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
