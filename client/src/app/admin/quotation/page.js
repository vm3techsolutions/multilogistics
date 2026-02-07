"use client";
import React, { useState } from "react";
import CreateQuotation from "./QuotationForm";
import QuotationList from "./QuotationList";
import CreateCargoQuote from "@/components/cargo/CreateCargoQuote";
import CargoQuoteList from "@/components/cargo/CargoQuoteList";
import CreateSeaQuote from "@/components/sea/CreateSeaQuote";

export default function QuotationPage() {
  const [formType, setFormType] = useState(""); // "Sea", "Cargo", "Courier"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // courier | cargo | sea

  const openForm = (type) => {
    setFormType(type);
  };

  const closeForm = () => {
    setFormType("");
  };

  const refreshList = () => {
  dispatch(getAllCargoQuotations()); // or getAllQuotations()
};

  return (
    <div className="p-5 font-sans">
      {/* Search & Filter */}
      {/* Search & Filter */}
<div className="flex items-center gap-3 mb-5 px-4 py-6 bg-white rounded-xl shadow-sm">
  {/* Search Input */}
  <div className="flex items-center flex-1 bg-[#F3F9FF] rounded-lg px-3 py-3">
    <svg
      className="w-5 h-5 text-gray-400 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
      />
    </svg>
    <input
      type="text"
      placeholder="Search By ID / Name"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-transparent placeholder:font-bold outline-none text-sm"
    />
  </div>

  {/* Type Dropdown */}
  <select
    value={typeFilter}
    onChange={(e) => setTypeFilter(e.target.value)}
    className="px-3 py-3 text-sm bg-[#F3F9FF] rounded-lg focus:outline-none"
  >
    {/* <option value="">All Types</option> */}
    <option value="courier">Courier</option>
    <option value="cargo">Cargo</option>
    {/* <option value="sea">Sea</option> */}
  </select>

  {/* Status Dropdown */}
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="px-3 py-3 text-sm bg-[#F3F9FF] rounded-lg focus:outline-none"
  >
    <option value="">All Status</option>
    <option value="draft">Draft</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>
</div>



      {/* Quotation List */}
      {formType === "" && (
  <div className="bg-white rounded-xl p-5 mb-5 min-h-[300px]">
    {typeFilter === "cargo" ? (
      <CargoQuoteList
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />
    ) : (
      <QuotationList
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />
    )}
  </div>
)}

      {/* Action Buttons (Right aligned) */}
      <div className="flex justify-end gap-3 mb-5">
        <button
          onClick={() => openForm("Sea")}
          className="px-4 py-2 primaryBtn text-white rounded-md "
        >
          New Sea Quote
        </button>
        <button
          onClick={() => openForm("Cargo")}
          className="px-4 py-2 primaryBtn text-white rounded-md "
        >
          New Cargo Quote
        </button>
        <button
          onClick={() => openForm("Courier")}
          className="px-4 py-2 primaryBtn text-white rounded-md "
        >
          New Courier Quote
        </button>
      </div>

      {/* Render Form Component Directly */}
      {formType === "Courier" && (
        <div className="border rounded-lg p-5 mb-5 bg-white shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold"> Courier Quotation</h3>
            <button
              onClick={closeForm}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
          <CreateQuotation />
        </div>
      )}

      {formType === "Cargo" && (
        <div className="border rounded-lg p-5 mb-5 bg-white shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold"> Cargo Quotation</h3>
            <button
              onClick={closeForm}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
          <CreateCargoQuote mode="create" onSuccess={refreshList} />
        </div>
      )}

      {formType === "Sea" && (
        <div className="border rounded-lg p-5 mb-5 bg-white shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold"> Sea Quotation</h3>
            <button
              onClick={closeForm}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
          <CreateSeaQuote mode="create" onSuccess={refreshList} />
        </div>
      )}
    </div>
  );
}
