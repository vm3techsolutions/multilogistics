"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourierExportById,
  clearSelectedExport,
} from "@/store/slices/courierExportSlice";
import { Loader2 } from "lucide-react";

export default function CourierExportDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedExport: exp, loading, error } = useSelector(
    (state) => state.courierExports
  );

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

  const data = exp.courier_export || exp; // Support both older and new structure

  return (
    <div className="max-w-5xl mx-auto bg-white shadow p-6 rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Courier Export #{data.id} — {data.correspondence_number || "N/A"}
      </h2>

      {/* --- Summary --- */}
      <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
        <div>
          <strong>Status:</strong> {data.status || "Pending"}
        </div>
        <div>
          <strong>Tracking Number:</strong> {data.tracking_number || "Not Assigned"}
        </div>
        <div>
          <strong>Forwarding Company:</strong> {data.forwarding_company || "—"}
        </div>
        <div>
          <strong>Booking Date:</strong>{" "}
          {data.booking_date
            ? new Date(data.booking_date).toLocaleDateString()
            : "—"}
        </div>
      </div>

      {/* --- Shipper --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">
        Shipper Details
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <p>
          <strong>Name:</strong> {data.shipper_name}
        </p>
        <p>
          <strong>Email:</strong> {data.shipper_email}
        </p>
        <p>
          <strong>Mobile:</strong> {data.shipper_mobile}
        </p>
        <p>
          <strong>Address:</strong> {data.shipper_address}
        </p>
      </div>

      {/* --- Consignee --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">
        Consignee Details
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <p>
          <strong>Name:</strong> {data.consignee_name}
        </p>
        <p>
          <strong>Email:</strong> {data.consignee_email}
        </p>
        <p>
          <strong>Mobile:</strong> {data.consignee_mobile}
        </p>
        <p>
          <strong>Address:</strong> {data.consignee_address}
        </p>
      </div>

      {/* --- Shipment Info --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">
        Shipment Info
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <p>
          <strong>Place of Delivery:</strong> {data.place_of_delivery}
        </p>
        <p>
          <strong>Package Count:</strong> {data.package_count}
        </p>
        <p>
          <strong>Total Weight:</strong> {data.weight}
        </p>
        <p>
          <strong>Dimensions:</strong> {data.length} × {data.width} × {data.height}
        </p>
        <p>
          <strong>Amount:</strong> ₹{data.amount}
        </p>
      </div>

      {/* --- Items --- */}
      <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">
        Items
      </h3>
      {data.items && data.items.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300 mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Weight</th>
              <th className="border p-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
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
        <p className="text-gray-500 mb-4">No items found.</p>
      )}

      {/* --- Quotation Packages --- */}
      {data.quotation_packages && data.quotation_packages.length > 0 && (
        <>
          <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">
            Quotation Packages
          </h3>
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Length</th>
                <th className="border p-2">Width</th>
                <th className="border p-2">Height</th>
                <th className="border p-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {data.quotation_packages.map((pkg, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{pkg.length}</td>
                  <td className="border p-2">{pkg.width}</td>
                  <td className="border p-2">{pkg.height}</td>
                  <td className="border p-2">{pkg.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* --- Quotation Charges --- */}
      {data.quotation_charges && data.quotation_charges.length > 0 && (
        <>
          <h3 className="font-semibold text-lg mb-2 text-gray-800 border-b pb-1">
            Quotation Charges
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Charge Name</th>
                <th className="border p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.quotation_charges.map((ch, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{ch.charge_name}</td>
                  <td className="border p-2">₹{ch.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
