"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStats } from "@/store/slices/exportStatSlice";
import StatsCard from "@/components/StatsCard";
import { Package, Truck, Timer, Bell } from "lucide-react";
import RecentShipments from "./RecentShipments";

export default function Overview() {
  const dispatch = useDispatch();
  const { totalShipments, activeShipments, avgDeliveryTime, loading } =
    useSelector((state) => state.exportStat);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  if (loading) {
    return <p className="text-center mt-10">Loading stats...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Row 1 - Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Shipments"
          value={totalShipments}
          icon={Package}
          color="bg-blue-500"
        />
        <StatsCard
          title="Active Shipments"
          value={activeShipments}
          icon={Truck}
          color="bg-green-500"
        />
        <StatsCard
          title="Avg Delivery Time"
          value={`${avgDeliveryTime} days`}
          icon={Timer}
          color="bg-orange-500"
        />
      </div>

      {/* Row 2 - Recent Shipments + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Recent Shipments (70%) */}
        <div className="lg:col-span-7">
          <RecentShipments />
        </div>

        {/* Notifications (30%) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Notifications
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="p-3 bg-gray-50 rounded-lg border">
              🚚 Shipment <b>AWB5678</b> is now{" "}
              <span className="text-yellow-600">In Transit</span>.
            </li>
            <li className="p-3 bg-gray-50 rounded-lg border">
              📦 New shipment <b>AWB9101</b> created and pending dispatch.
            </li>
            <li className="p-3 bg-gray-50 rounded-lg border">
              ✅ Shipment <b>AWB1234</b> delivered successfully.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
