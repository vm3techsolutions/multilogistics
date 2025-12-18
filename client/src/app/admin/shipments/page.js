"use client";
import React, { useState } from "react";
// import ShipmentList from "./ShipmentList";
import ShipmentList from "./Shipments";

export default function ShipmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exportType, setExportType] = useState("");

  return (
    <div className="p-5">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-5 px-4 py-4 bg-white rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Search by AWB/Shipper/Consignee"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-[#F3F9FF] rounded-lg outline-none"
        />
        {/* Export Type Dropdown */}
        <select
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          className="px-3 py-2 bg-[#F3F9FF] rounded-lg outline-none min-w-[180px]"
        >
          <option value="">All Export Types</option>
          <option value="individual">Individual</option>
          <option value="corporate">Corporate</option>
        </select>
      </div>

      {/* Shipment List */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <ShipmentList searchQuery={searchQuery} exportType={exportType} />
      </div>
    </div>
  );
}
