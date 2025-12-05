"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourierExports } from "@/store/slices/courierExportSlice";

const ShipmentList = ({ searchQuery }) => {
  const dispatch = useDispatch();

  //Modal
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { list, loading, error } = useSelector(
    (state) => state.courierExports
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    dispatch(fetchCourierExports());
  }, [dispatch]);

  // Filter shipments by search
  const filteredShipments = list.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.awb_number?.toLowerCase().includes(q) ||
      s.shipper_name?.toLowerCase().includes(q) ||
      s.consignee_name?.toLowerCase().includes(q) ||
      s.forwarding_company?.toLowerCase().includes(q)
    );
  });

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredShipments.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredShipments.length / rowsPerPage);

  if (loading) return <p>Loading shipments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-5">
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
          <thead className="lightBg">
            <tr className="text-center">
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">AWB No</th>
              <th className="px-4 py-2 border">Shipper Name</th>
              <th className="px-4 py-2 border">Consignee Name</th>
              <th className="px-4 py-2 border">Delivery Place</th>
              <th className="px-4 py-2 border">Forwarding Company</th>
              <th className="px-4 py-2 border">Correspondence No</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {currentRows.map((ship) => (
              <tr key={ship.id} className="text-center hover:bg-gray-50">
                <td className="px-4 py-2 border">
                  {new Date(ship.booking_date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-2 border text-blue-600">{ship.awb_number}</td>
                <td className="px-4 py-2 border">{ship.shipper_name}</td>
                <td className="px-4 py-2 border">{ship.consignee_name}</td>
                <td className="px-4 py-2 border">{ship.place_of_delivery}</td>
                <td className="px-4 py-2 border">{ship.forwarding_company}</td>
                <td className="px-4 py-2 border">{ship.correspondence_number}</td>

                <td className="px-4 py-2 border">
                  <button
  className="px-3 py-1 bg-blue-600 text-white rounded-md"
  onClick={() => {
    setSelectedShipment(ship);
    setShowModal(true);
  }}
>
  View
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center mt-4 gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`px-3 py-1 rounded ${
              currentPage === p
                ? "primaryBg text-white"
                : "bg-gray-300 hover:bg-blue-400"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* // */}

      {showModal && selectedShipment && (
  <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg shadow-lg relative">

      <h2 className="text-xl font-semibold mb-4">Shipment Details</h2>

      <div className="space-y-2">
        <p><strong>AWB No:</strong> {selectedShipment.awb_number}</p>
        <p><strong>Shipper Name:</strong> {selectedShipment.shipper_name}</p>
        <p><strong>Consignee Name:</strong> {selectedShipment.consignee_name}</p>
        <p><strong>Delivery Place:</strong> {selectedShipment.place_of_delivery}</p>
        <p><strong>Forwarding Company:</strong> {selectedShipment.forwarding_company}</p>
        <p><strong>Correspondence No:</strong> {selectedShipment.correspondence_number}</p>
        <p><strong>Date:</strong> {new Date(selectedShipment.booking_date).toLocaleDateString("en-GB")}</p>
      </div>

      <button
        onClick={() => setShowModal(false)}
        className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded"
      >
        ✕
      </button>

    </div>
  </div>
)}

    </div>
  );
};

export default ShipmentList;
