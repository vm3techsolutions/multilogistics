// "use client";

// import { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   createQuotation,
//   getAllQuotations,
// } from "@/store/slices/quotationSlice";
// import { fetchCustomers } from "@/store/slices/customerSlice";
// import { getAgents } from "@/store/slices/agentSlice";
// import { Printer } from "lucide-react";

// export default function Quotation() {
//   const dispatch = useDispatch();

//   // ✅ Add default empty arrays to prevent "undefined.length" error
 

//   const { list: customerSuggestions = [] } = useSelector(
//     (state) => state.customers || {}
//   );

//   const { list: agentSuggestions = [] } = useSelector(
//     (state) => state.agents || {}
//   );

//   const [formData, setFormData] = useState({
//     subject: "",
//     customer_id: "",
//     agent_id: "",
//     address: "",
//     origin: "",
//     destination: "",
//     actual_weight: "",
//     volumeWeight: "",
//     packages: [],
//     freightCharges: [
//       { name: "Courier Charges", price: 0.0 },
//       { name: "FSC", price: 0.0 },
//     ],
//     destinationCharges: [{ name: "Export Clearance Agency", price: 0.0 }],
//   });

//   const [quoteNo, setQuoteNo] = useState("");
//   const [customerQuery, setCustomerQuery] = useState("");
//   const [agentQuery, setAgentQuery] = useState("");

//   // Auto generate Quote No
//   useEffect(() => {
//     const newQuoteNo = `Q-${Date.now().toString().slice(-6)}`;
//     setQuoteNo(newQuoteNo);
//   }, []);

//   // Fetch quotations
//   useEffect(() => {
//     dispatch(getAllQuotations());
//   }, [dispatch]);

//   // Fetch customers when typing
//   useEffect(() => {
//     if (customerQuery.length > 1) {
//       dispatch(fetchCustomers(customerQuery));
//     }
//   }, [customerQuery, dispatch]);

//   // Fetch agents when typing
//   useEffect(() => {
//     if (agentQuery.length > 1) {
//       dispatch(getAgents(agentQuery));
//     }
//   }, [agentQuery, dispatch]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     if (name === "customer_id") setCustomerQuery(value);
//     if (name === "agent_id") setAgentQuery(value);
//   };

//   const handleSaveQuote = () => {
//     const payload = { quote_no: quoteNo, ...formData };
//     dispatch(createQuotation(payload));
//   };

//   const handleCancel = () => {
//     setFormData({
//       subject: "",
//       customer_id: "",
//       agent_id: "",
//       address: "",
//       origin: "",
//       destination: "",
//       actual_weight: "",
//       volumeWeight: "",
//       packages: [],
//       freightCharges: [
//         { name: "Courier Charges", price: 0.0 },
//         { name: "FSC", price: 0.0 },
//       ],
//       destinationCharges: [{ name: "Export Clearance Agency", price: 0.0 }],
//     });
//     setCustomerQuery("");
//     setAgentQuery("");
//   };

//   return (
//     <div className="max-w-6xl mx-auto relative">
//       {/* ---------------- Form ---------------- */}
//       <div className="bg-white px-6 py-8 rounded-2xl shadow border border-gray-200">
//         <h2 className="text-2xl font-semibold mb-6 border-b pb-2 text-gray-700">
//           Create Export Quotation
//         </h2>

//         <div className="grid grid-cols-2 gap-6">
//           {/* Quote No */}
//           <div>
//             <label className="block text-sm font-medium text-gray-800">Quote No.</label>
//             <input
//               type="text"
//               value={quoteNo}
//               readOnly
//               className="w-full mt-1 p-2 border rounded bg-gray-100"
//             />
//           </div>

//           {/* Subject */}
//           <div>
//             <label className="block text-sm font-medium">Subject</label>
//             <input
//               type="text"
//               name="subject"
//               value={formData.subject}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//             />
//           </div>

//           {/* Customer Autocomplete */}
//           <div className="relative">
//             <label className="block text-sm font-medium">Customer Name</label>
//             <input
//               type="text"
//               name="customer_id"
//               value={customerQuery}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//               placeholder="Type to search customer..."
//             />
//             {customerSuggestions?.length > 0 && (
//               <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto">
//                 {customerSuggestions.map((cust) => (
//                   <li
//                     key={cust.id}
//                     onClick={() => {
//                       setFormData((prev) => ({
//                         ...prev,
//                         customer_id: cust.id,
//                       }));
//                       setCustomerQuery(cust.name);
//                     }}
//                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                   >
//                     {cust.name}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           {/* Agent Autocomplete */}
//           <div className="relative">
//             <label className="block text-sm font-medium">Agent</label>
//             <input
//               type="text"
//               name="agent_id"
//               value={agentQuery}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//               placeholder="Type to search agent..."
//             />
//             {agentSuggestions?.length > 0 && (
//               <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto">
//                 {agentSuggestions.map((agent) => (
//                   <li
//                     key={agent.id}
//                     onClick={() => {
//                       setFormData((prev) => ({
//                         ...prev,
//                         agent_id: agent.id,
//                       }));
//                       setAgentQuery(agent.name);
//                     }}
//                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
//                   >
//                     {agent.name}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           {/* Address */}
//           <div className="col-span-2">
//             <label className="block text-sm font-medium">Address</label>
//             <textarea
//               name="address"
//               value={formData.address}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//             />
//           </div>

//           {/* Origin & Destination */}
//           <div>
//             <label className="block text-sm font-medium">Origin</label>
//             <input
//               type="text"
//               name="origin"
//               value={formData.origin}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Destination</label>
//             <input
//               type="text"
//               name="destination"
//               value={formData.destination}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//             />
//           </div>

//           {/* Weights */}
//           <div>
//             <label className="block text-sm font-medium">Actual Weight</label>
//             <input
//               type="number"
//               name="actual_weight"
//               value={formData.actual_weight}
//               onChange={handleInputChange}
//               className="w-full mt-1 p-2 border rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Volume Weight</label>
//             <input
//               type="number"
//               name="volumeWeight"
//               value={formData.volumeWeight}
//               readOnly
//               className="w-full mt-1 p-2 border rounded bg-gray-100"
//             />
//           </div>
//         </div>

//         {/* Freight Charges */}
//         <div className="mt-6">
//           <h3 className="font-semibold mb-2">Freight Charges :</h3>
//           {formData.freightCharges.map((fc, index) => (
//             <div key={index} className="grid grid-cols-2 gap-4 mb-2">
//               <input
//                 type="text"
//                 value={fc.name}
//                 readOnly
//                 className="p-2 border rounded bg-gray-100"
//               />
//               <input
//                 type="number"
//                 value={fc.price}
//                 className="p-2 border rounded"
//                 onChange={(e) => {
//                   const updated = [...formData.freightCharges];
//                   updated[index].price = e.target.value;
//                   setFormData((prev) => ({
//                     ...prev,
//                     freightCharges: updated,
//                   }));
//                 }}
//               />
//             </div>
//           ))}
//           <button
//             onClick={() =>
//               setFormData((prev) => ({
//                 ...prev,
//                 freightCharges: [
//                   ...prev.freightCharges,
//                   { name: "", price: 0 },
//                 ],
//               }))
//             }
//             className="bg-green-600 text-white px-4 py-2 rounded"
//           >
//             + Add Freight Charge
//           </button>
//         </div>

//         {/* Destination Charges */}
//         <div className="mt-6">
//           <h3 className="font-semibold mb-2">Destination Charges :</h3>
//           {formData.destinationCharges.map((dc, index) => (
//             <div key={index} className="grid grid-cols-2 gap-4 mb-2">
//               <input
//                 type="text"
//                 value={dc.name}
//                 className="p-2 border rounded"
//                 onChange={(e) => {
//                   const updated = [...formData.destinationCharges];
//                   updated[index].name = e.target.value;
//                   setFormData((prev) => ({
//                     ...prev,
//                     destinationCharges: updated,
//                   }));
//                 }}
//               />
//               <input
//                 type="number"
//                 value={dc.price}
//                 className="p-2 border rounded"
//                 onChange={(e) => {
//                   const updated = [...formData.destinationCharges];
//                   updated[index].price = e.target.value;
//                   setFormData((prev) => ({
//                     ...prev,
//                     destinationCharges: updated,
//                   }));
//                 }}
//               />
//             </div>
//           ))}
//           <button
//             onClick={() =>
//               setFormData((prev) => ({
//                 ...prev,
//                 destinationCharges: [
//                   ...prev.destinationCharges,
//                   { name: "", price: 0 },
//                 ],
//               }))
//             }
//             className="bg-green-600 text-white px-4 py-2 rounded"
//           >
//             + Add Charge
//           </button>
//         </div>

//         {/* Actions */}
//         <div className="flex gap-4 mt-8">
//           <button
//             onClick={handleSaveQuote}
//             className="bg-blue-600 text-white px-6 py-2 rounded"
//           >
//             Save Quote
//           </button>
//           <button
//             onClick={handleCancel}
//             className="bg-gray-400 text-white px-6 py-2 rounded"
//           >
//             Cancel Quote
//           </button>
//           <button className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded">
//             <Printer className="w-4 h-4 mr-2" /> Print
//           </button>
//         </div>

//         {loading && <p className="mt-4">Saving...</p>}
//         {error && <p className="mt-4 text-red-600">{error}</p>}
//         {success && (
//           <p className="mt-4 text-green-600">
//             Quotation created successfully
//           </p>
//         )}
//       </div>

//     </div>
//   );
// }
