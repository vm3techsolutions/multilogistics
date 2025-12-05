"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SidebarAdmin from "@/components/SidebarAdmin";
// import Topbar from "@/components/Topbar";

export default function AdminLayout({ children }) {
   const pathname = usePathname();

  // Hide sidebar when viewing quotation page
  const hideSidebar = pathname.includes("/quotations/") && pathname.split("/").length === 3;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      {!hideSidebar && (
        <aside className="w-68 shadow-md">
          <SidebarAdmin />
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        {/* <Topbar /> */}

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto lightBg ${hideSidebar ? "p-6" : "p-6"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
