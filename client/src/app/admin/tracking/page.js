"use client";

import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackFedexShipment, resetTrackingState } from "@/store/slices/trackingSlice";

export default function TrackPage() {
  const dispatch = useDispatch();
  const { trackingDetails, loading, error } = useSelector((s) => s.tracking);
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = () => {
    if (!trackingNumber) return alert("Enter tracking number");
    dispatch(trackFedexShipment(trackingNumber));
  };

  // ⭐ Utility to safely show values even if they come as objects
  const safe = (v) => {
    if (!v) return "N/A";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/40 p-8 rounded-3xl shadow-xl border border-white/30"
      >
        <h1 className="text-3xl font-bold text-purple-800 text-center">
          FedEx Shipment Tracker
        </h1>

        <div className="flex gap-3 mt-6">
          <input
            type="text"
            placeholder="Enter Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="flex-1 text-gray-800 border rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={handleTrack}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl shadow-md transition"
          >
            Track
          </button>
        </div>

        <button
          className="mt-3 text-gray-600 underline text-sm"
          onClick={() => dispatch(resetTrackingState())}
        >
          Clear
        </button>
      </motion.div>

      {loading && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-purple-600 text-center">
          Fetching tracking info...
        </motion.p>
      )}

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-red-600 text-center">
          {error}
        </motion.p>
      )}

      <AnimatePresence>
        {trackingDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 bg-white shadow-xl rounded-3xl p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-3">Shipment Details</h2>

            <span
              className={`inline-block px-3 py-1 text-sm rounded-full mb-3 
                ${
                  safe(trackingDetails.status) === "Delivered"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
            >
              {safe(trackingDetails.status)}
            </span>

            <p><b>Tracking No:</b> {safe(trackingDetails.trackingNumber)}</p>
            <p><b>Last Update:</b> {safe(trackingDetails.lastUpdate)}</p>
            <p><b>Location:</b> {safe(trackingDetails.location)}</p>
            <p><b>Estimated Delivery:</b> {safe(trackingDetails.estimatedDelivery)}</p>

            {/* Timeline */}
            <h3 className="font-semibold mt-6 mb-2">Tracking Timeline</h3>

            <div className="relative border-l-2 border-purple-300 pl-5">
              {trackingDetails.events?.map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="mb-5"
                >
                  <div className="absolute -left-3 top-1.5 w-3 h-3 bg-purple-600 rounded-full"></div>

                  <p className="font-semibold text-purple-700">{safe(ev.date)}</p>
                  <p className="text-gray-800">{safe(ev.description)}</p>
                  <p className="text-gray-500 text-sm">
                    {safe(ev.city)}, {safe(ev.country)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
