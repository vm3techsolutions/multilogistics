"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { setActiveTab } from "@/store/slices/dashboardSlice";

export default function SidebarAdmin({ username }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = useSelector((state) => state.dashboard.activeTab);

  const menuItems = [
    "Overview",
    "Orders",
    "Quotation",
    "Customers",
    "Agents"
    // "Invoice",
    // "Receipt"
  ];

  // ✅ Update tab + URL on click
  const handleItemClick = (item) => {
    dispatch(setActiveTab(item));
    const path = `/admin/${item.toLowerCase()}`;
    router.push(path); // updates the URL
  };

  // ✅ Keep state in sync if user visits URL directly
  React.useEffect(() => {
    const currentTab = pathname.split("/").pop(); // get last part of path
    const formattedTab = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    if (menuItems.includes(formattedTab)) {
      dispatch(setActiveTab(formattedTab));
    }
  }, [pathname]);

  return (
    <div className="h-full border-r border-gray-300 bg-white text-gray-800 flex flex-col px-4 py-6">
      {/* ✅ Logo at the top */}
      <div className="flex justify-center mb-6">
        <img
          src="/assets/logo/logo.png"
          alt="Multilogistic Logo"
          className="h-16 w-auto object-contain"
        />
      </div>

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
