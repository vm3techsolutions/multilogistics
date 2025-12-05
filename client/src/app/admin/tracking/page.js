// "use client";

// import { useDispatch, useSelector } from "react-redux";
// import { useState } from "react";
// import { trackFedexShipment, resetTrackingState } from "@/store/slices/trackingSlice";

// export default function TrackPage() {
//   const dispatch = useDispatch();
//   const { trackingDetails, loading, error } = useSelector((s) => s.tracking);

//   const [trackingNumber, setTrackingNumber] = useState("");

//   const handleTrack = () => {
//     if (!trackingNumber) return alert("Enter tracking number");
//     dispatch(trackFedexShipment(trackingNumber));
//   };

//   return (
//     <div className="max-w-xl mx-auto mt-20 bg-white p-8 rounded-2xl shadow-lg">
//       <h1 className="text-2xl font-bold text-center mb-6">FedEx Shipment Tracker</h1>

//       <div className="flex gap-2">
//         <input
//           type="text"
//           placeholder="Enter Tracking Number"
//           value={trackingNumber}
//           onChange={(e) => setTrackingNumber(e.target.value)}
//           className="flex-1 border rounded-lg p-3"
//         />

//         <button
//           onClick={handleTrack}
//           className="bg-blue-600 text-white px-4 rounded-lg"
//         >
//           Track
//         </button>
//       </div>

//       <button
//         className="mt-3 text-gray-500 underline text-sm"
//         onClick={() => dispatch(resetTrackingState())}
//       >
//         Clear
//       </button>

//       {loading && <p className="mt-4 text-blue-600">Fetching tracking info...</p>}

//       {error && <p className="mt-4 text-red-600">{error}</p>}

//       {trackingDetails && (
//         <div className="mt-6 border p-4 rounded-lg bg-gray-50">
//           <h2 className="font-semibold text-lg mb-2">Shipment Details</h2>

//           <p><b>Status:</b> {trackingDetails.status}</p>
//           <p><b>Last Update:</b> {trackingDetails.lastUpdate}</p>
//           <p><b>Location:</b> {trackingDetails.location}</p>
//           <p><b>Estimated Delivery:</b> {trackingDetails.estimatedDelivery}</p>

//           <h3 className="font-semibold mt-4">Tracking Events:</h3>
//           <ul className="list-disc ml-5">
//             {trackingDetails.events?.map((ev, i) => (
//               <li key={i} className="mt-1">
//                 <b>{ev.date}</b> — {ev.description} ({ev.city}, {ev.country})
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }


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

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6">
      
      {/* Glass Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/40 p-8 rounded-3xl shadow-xl border border-white/30"
      >
        <h1 className="text-3xl font-bold text-purple-800 text-center">
          FedEx Shipment Tracker
        </h1>

        {/* Input Section */}
        <div className="flex gap-3 mt-6">
          <input
            type="text"
            placeholder="Enter Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="flex-1 border rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-purple-400"
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

      {/* Loading */}
      {loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 text-purple-600 text-center"
        >
          Fetching tracking info...
        </motion.p>
      )}

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 text-red-600 text-center"
        >
          {error}
        </motion.p>
      )}

      {/* Tracking Card */}
      <AnimatePresence>
        {trackingDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 bg-white shadow-xl rounded-3xl p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-3">Shipment Details</h2>

            {/* Status Badge */}
            <span
              className={`inline-block px-3 py-1 text-sm rounded-full mb-3 
              ${
                trackingDetails.status === "Delivered"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {trackingDetails.status}
            </span>

            <p><b>Tracking No:</b> {trackingDetails.trackingNumber}</p>
            <p><b>Last Update:</b> {trackingDetails.lastUpdate}</p>
            <p><b>Location:</b> {trackingDetails.location}</p>
            <p><b>Estimated Delivery:</b> {trackingDetails.estimatedDelivery}</p>

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

                  <p className="font-semibold text-purple-700">{ev.date}</p>
                  <p className="text-gray-800">{ev.description}</p>
                  <p className="text-gray-500 text-sm">
                    {ev.city}, {ev.country}
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
