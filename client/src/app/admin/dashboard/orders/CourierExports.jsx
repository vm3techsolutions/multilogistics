import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourierExports, setPage } from "@/store/slices/courierExportSlice";

export default function CourierExports() {
  const dispatch = useDispatch();
  const { list = [], loading, error, currentPage = 1, perPage = 5 } = useSelector(
    (state) => state.courierExports || {}
  );

  useEffect(() => {
    dispatch(fetchCourierExports());
  }, [dispatch]);

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const currentExports = list.slice(start, end);
  const totalPages = Math.ceil(list.length / perPage);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 primaryText">Courier Exports</h2>

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
                  <td className="border p-2">{new Date(exp.booking_date).toLocaleDateString()}</td>
                  <td className="border p-2">{exp.document_type}</td>
                  <td className="border p-2">{exp.items?.length || 0}</td>
                  <td className="border p-2">{exp.amount}</td>
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
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => dispatch(setPage(currentPage + 1))}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
