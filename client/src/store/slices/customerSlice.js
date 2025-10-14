import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ✅ Fetch all customers
export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/getCustomers");
      return res.data; // backend returns array of customers
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch customers");
    }
  }
);

// ✅ Fetch single customer by ID
export const fetchCustomerById = createAsyncThunk(
  "customers/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/get-customer/${id}`);
      return res.data; // backend returns single customer object
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch customer");
    }
  }
);

// ✅ Add new customer
export const addCustomer = createAsyncThunk(
  "customers/add",
  async (customerData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/addCustomer", customerData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // JWT token
        },
      });
      return res.data.customer; // backend returns { customer }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add customer");
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    list: [],
    selectedCustomer: null, // for getCustomerById
    loading: false,
    error: null,
    success: false,
    message: null,
  },
  reducers: {
    // ✅ Reset complete customer state
    resetCustomerState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
      state.selectedCustomer = null;
    },

    // ✅ Clear only selected customer (used when creating a new quotation)
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch Customers
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

      // 🔹 Fetch Customer by ID
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedCustomer = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedCustomer = null;
      })

      // 🔹 Add Customer
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = "Customer added successfully";
        state.list.unshift(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

// ✅ Export both actions
export const { resetCustomerState, clearSelectedCustomer } = customerSlice.actions;

export default customerSlice.reducer;
