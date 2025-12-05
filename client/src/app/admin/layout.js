"use client";

import React from "react";
import SidebarAdmin from "@/components/SidebarAdmin";
// import Topbar from "@/components/Topbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-68 shadow-md">
        <SidebarAdmin />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        {/* <Topbar /> */}

        {/* Page content */}
        <main className="p-6 flex-1 overflow-y-auto lightBg">{children}</main>
      </div>
    </div>
  );
}
