"use client";

import { useDispatch, useSelector } from "react-redux";
import { setActiveTab } from "@/store/slices/dashboardSlice";

export default function SidebarAdmin({ username }) {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.dashboard.activeTab);

  const menuItems = [
    "Overview",
    "Orders",
    "Shipments",
    "Agents",
    "Quotation",
    "Customers",
    "Invoice",
    "Receipt"
  ];

  const handleItemClick = (item) => {
    dispatch(setActiveTab(item));
  };

  return (
    <div className="w-64 border-r border-gray-300 bg-white text-gray-800 flex flex-col px-4 py-6">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => handleItemClick(item)}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === item
                ? "bg-blue-600 text-white font-semibold"
                : "hover:text-blue-500"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}
