import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Add new agent
export const createAgent = createAsyncThunk(
  "agents/create",
  async (agentData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/addAgent", agentData);
      return data.agent;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Get all agents
export const getAgents = createAsyncThunk(
  "agents/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/getAgents");
      return data.agents;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const agentSlice = createSlice({
  name: "agents",
  initialState: {
    loading: false,
    agents: [],
    createdAgent: null,
    success: false,
    error: null,
  },
  reducers: {
    resetAgentState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.createdAgent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createAgent.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.createdAgent = action.payload;
        state.agents.push(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get all
      .addCase(getAgents.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(getAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAgentState } = agentSlice.actions;
export default agentSlice.reducer;
