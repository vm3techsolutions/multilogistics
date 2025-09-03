import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ✅ Fetch all customers
export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/getCustomers");
      return res.data; // assuming backend returns array of customers
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch customers");
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
      return res.data.customer; // assuming backend returns { success, message, customer }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add customer");
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    list: [],
    loading: false,
    error: null,
    success: false,
    message: null,
  },
  reducers: {
    resetCustomerState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null;
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
        state.list.unshift(action.payload); // add new customer at top
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetCustomerState } = customerSlice.actions;
export default customerSlice.reducer;
