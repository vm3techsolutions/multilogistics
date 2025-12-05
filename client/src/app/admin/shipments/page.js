"use client";
import React, { useState } from "react";
// import ShipmentList from "./ShipmentList";
import ShipmentList from "./Shipments";

export default function ShipmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
      </div>

      {/* Shipment List */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <ShipmentList searchQuery={searchQuery} />
      </div>
    </div>
  );
}
