import { configureStore } from '@reduxjs/toolkit';
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import exportStatSliceReducer from "./slices/exportStatSlice";
import recentShipmentsReducer from "./slices/recentShipmentsSlice";
import customerReducer from "./slices/customerSlice";   
import quotationReducer from "./slices/quotationSlice";  
import agentReducer from "./slices/agentSlice";  

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    exportStat: exportStatSliceReducer,
    recentShipments: recentShipmentsReducer, 
    customers: customerReducer, 
    quotation: quotationReducer,  
    agents: agentReducer,
  },
});
