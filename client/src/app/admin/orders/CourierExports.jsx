// // admin/orders/CourierExports.jsx
"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourierExports, setPage } from "@/store/slices/courierExportSlice";
import CreateCourierExport from "./CreateCourierExport";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CourierExports() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { list = [], loading, error, currentPage = 1, perPage = 10 } = useSelector(
    (state) => state.courierExports || {}
  );

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchCourierExports());
  }, [dispatch]);

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const currentExports = list.slice(start, end);
  const totalPages = Math.ceil(list.length / perPage);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold primaryText">Courier Exports</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Export
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-left">
          <thead className="bg-gray-100 text-gray-900">
            <tr>
              <th className="border p-2">AWB Number</th>
              <th className="border p-2">Shipper</th>
              <th className="border p-2">Consignee</th>
              <th className="border p-2">Booking Date</th>
              <th className="border p-2">Document Type</th>
              <th className="border p-2">Items Count</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentExports.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No courier exports found.
                </td>
              </tr>
            ) : (
              currentExports.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="border p-2">{exp.awb_number}</td>
                  <td className="border p-2">{exp.shipper_name}</td>
                  <td className="border p-2">{exp.consignee_name}</td>
                  <td className="border p-2">
                    {new Date(exp.booking_date).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{exp.document_type}</td>
                  <td className="border p-2">{exp.items?.length || 0}</td>
                  <td className="border p-2">{exp.amount}</td>

                  <td className="border p-2 text-center">
                    <button
                      onClick={() => router.push(`/admin/orders/courier-exports/${exp.id}`)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {list.length > perPage && (
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => dispatch(setPage(currentPage - 1))}
            className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-900">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => dispatch(setPage(currentPage + 1))}
            className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Export Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
            <CreateCourierExport onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
