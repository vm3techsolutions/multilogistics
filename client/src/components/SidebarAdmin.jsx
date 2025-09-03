"use client";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab } from "@/store/slices/dashboardSlice";

export default function SidebarAdmin() {
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

  return (
    <div className="w-74 border-r border-gray-300 primaryText flex flex-col px-12 py-8">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => dispatch(setActiveTab(item))}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              activeTab === item
                ? "primaryBg font-semibold text-white"
                : "hover:text-blue-400 cursor"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}
