import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeTab: "Overview",
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = dashboardSlice.actions;
export default dashboardSlice.reducer;
