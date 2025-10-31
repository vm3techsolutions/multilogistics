"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourierExportById, clearSelectedExport } from "@/store/slices/courierExportSlice";
import { Loader2 } from "lucide-react";

export default function CourierExportDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedExport: exp, loading, error } = useSelector((state) => state.courierExports);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchCourierExportById(id));

    return () => {
      dispatch(clearSelectedExport());
    };
  }, [id, dispatch]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-500" size={40} />
      </div>
    );

  if (error)
    return <p className="text-center text-red-600 mt-10">Error: {error}</p>;

  if (!exp)
    return <p className="text-center text-gray-600 mt-10">Export not found.</p>;

  return (
    <div className="max-w-5xl mx-auto bg-white shadow p-6 rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Courier Export #{exp.id} — {exp.correspondence_number || "N/A"}
      </h2>

      {/* --- Summary --- */}
      <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
        <div><strong>Status:</strong> {exp.status || "Pending"}</div>
        <div><strong>Tracking Number:</strong> {exp.tracking_number || "Not Assigned"}</div>
        <div><strong>Forwarding Company:</strong> {exp.forwarding_company || "—"}</div>
        <div><strong>Booking Date:</strong> {exp.booking_date ? new Date(exp.booking_date).toLocaleDateString() : "—"}</div>
      </div>

      {/* --- Shipper --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">Shipper Details</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <p><strong>Name:</strong> {exp.shipper_name}</p>
        <p><strong>Email:</strong> {exp.shipper_email}</p>
        <p><strong>Mobile:</strong> {exp.shipper_mobile}</p>
        <p><strong>Address:</strong> {exp.shipper_address}</p>
      </div>

      {/* --- Consignee --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">Consignee Details</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <p><strong>Name:</strong> {exp.consignee_name}</p>
        <p><strong>Email:</strong> {exp.consignee_email}</p>
        <p><strong>Mobile:</strong> {exp.consignee_mobile}</p>
        <p><strong>Address:</strong> {exp.consignee_address}</p>
      </div>

      {/* --- Package Details --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">Package Details</h3>
      {exp.packages && exp.packages.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300 mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Length (cm)</th>
              <th className="border p-2">Width (cm)</th>
              <th className="border p-2">Height (cm)</th>
              <th className="border p-2">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {exp.packages.map((pkg, index) => (
              <tr key={index}>
                <td className="border p-2">{pkg.length}</td>
                <td className="border p-2">{pkg.width}</td>
                <td className="border p-2">{pkg.height}</td>
                <td className="border p-2">{pkg.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 mb-4">No package details found.</p>
      )}

      {/* --- Shipment Info --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">Shipment Info</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <p><strong>Place of Delivery:</strong> {exp.place_of_delivery}</p>
        <p><strong>Package Count:</strong> {exp.package_count}</p>
        <p><strong>Total Weight:</strong> {exp.weight}</p>
        <p><strong>Dimensions:</strong> {exp.length} × {exp.width} × {exp.height}</p>
        <p><strong>Amount:</strong> ₹{exp.amount}</p>
      </div>

      {/* --- Items --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">Items</h3>
      {exp.items && exp.items.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Weight</th>
              <th className="border p-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {exp.items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">{item.item_name}</td>
                <td className="border p-2">{item.item_quantity}</td>
                <td className="border p-2">{item.item_weight}</td>
                <td className="border p-2">{item.item_description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No items found.</p>
      )}
    </div>
  );
}
