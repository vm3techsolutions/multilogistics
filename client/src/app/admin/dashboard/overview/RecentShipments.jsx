import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchRecentShipments } from "@/store/slices/recentShipmentsSlice";

export default function RecentShipments() {
  const dispatch = useDispatch();
  const { shipments, loading } = useSelector((state) => state.recentShipments);

  useEffect(() => {
    dispatch(fetchRecentShipments());
  }, [dispatch]);

  return (
    <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Recent Shipments</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm text-gray-800">
              <th className="p-2">AWB No</th>
              <th className="p-2">Destination</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s, index) => (
              <tr key={index} className="border-b text-sm text-gray-600">
                <td className="p-2">{s.awb_no}</td>
                <td className="p-2">{s.destination}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
