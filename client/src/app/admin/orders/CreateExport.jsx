
// // "use client";
// // import React, { useState, useEffect, useRef } from "react";
// // import axios from "axios";
// // import Swal from "sweetalert2";
// // import { Search } from "lucide-react";

// // const API_BASE_URL = "http://localhost:5000/api";

// // export default function CreateExport() {
// //   const [quotationNo, setQuotationNo] = useState("");
// //   const [allQuotations, setAllQuotations] = useState([]);
// //   const [suggestions, setSuggestions] = useState([]);
// //   const [showDropdown, setShowDropdown] = useState(false);
// //   const [loading, setLoading] = useState(false);

// //   const dropdownRef = useRef(null);

// //   const [formData, setFormData] = useState({
// //     quotation_id: "",
// //     booking_date: "",
// //     document_type: "",
// //     shipper_name: "",
// //     shipper_email: "",
// //     shipper_address: "",
// //     shipper_mobile: "",
// //     consignee_name: "",
// //     consignee_email: "",
// //     consignee_address: "",
// //     consignee_mobile: "",
// //     place_of_delivery: "",
// //     forwarding_company: "",
// //     correspondence_number: "",
// //     length: "",
// //     width: "",
// //     height: "",
// //     weight: "",
// //     package_count: "",
// //     amount: "",
// //     items: [
// //       { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
// //     ],
// //   });

// //   // ✅ Fetch all quotations
// //   useEffect(() => {
// //     const fetchAll = async () => {
// //       try {
// //         const token = localStorage.getItem("token");
// //         const res = await axios.get(`${API_BASE_URL}/getAllQuotations`, {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         if (res.data && Array.isArray(res.data.data)) {
// //           setAllQuotations(res.data.data);
// //         }
// //       } catch (err) {
// //         console.error(err);
// //       }
// //     };
// //     fetchAll();
// //   }, []);

// //   // ✅ Suggestions Filter
// //   useEffect(() => {
// //     if (!quotationNo.trim()) {
// //       setSuggestions([]);
// //       setShowDropdown(false);
// //       return;
// //     }

// //     const q = quotationNo.toLowerCase();
// //     const matched = allQuotations
// //       .filter((item) => item.quote_no?.toLowerCase().includes(q))
// //       .slice(0, 10);

// //     setSuggestions(matched);
// //     setShowDropdown(matched.length > 0);
// //   }, [quotationNo, allQuotations]);

// //   // ✅ Click outside close
// //   useEffect(() => {
// //     const handleClickOutside = (e) => {
// //       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
// //         setShowDropdown(false);
// //       }
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   // ✅ Reset form before loading new quotation
// //   const resetForm = () => {
// //     setFormData({
// //       quotation_id: "",
// //       booking_date: "",
// //       document_type: "",
// //       shipper_name: "",
// //       shipper_email: "",
// //       shipper_address: "",
// //       shipper_mobile: "",
// //       consignee_name: "",
// //       consignee_email: "",
// //       consignee_address: "",
// //       consignee_mobile: "",
// //       place_of_delivery: "",
// //       forwarding_company: "",
// //       correspondence_number: "",
// //       length: "",
// //       width: "",
// //       height: "",
// //       weight: "",
// //       package_count: "",
// //       amount: "",
// //       items: [
// //         { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
// //       ],
// //     });
// //   };

// //   // ✅ On select quotation
// //   const handleSelectSuggestion = async (quote_no) => {
// //     setQuotationNo(quote_no);
// //     setShowDropdown(false);

// //     try {
// //       setLoading(true);
// //       resetForm();

// //       const token = localStorage.getItem("token");
// //       const res = await axios.get(
// //         `${API_BASE_URL}/number/${encodeURIComponent(quote_no)}`,
// //         {
// //           headers: { Authorization: `Bearer ${token}` },
// //         }
// //       );

// //       if (res.data?.success && res.data.data) {
// //         const q = res.data.data;
// //         const pkg = q.packages?.[0] || {};

// //         setFormData((prev) => ({
// //           ...prev,
// //           quotation_id: q.id,

// //           // ✅ Auto-Fill SHIPPER from CUSTOMER
// //           shipper_name: q.customer?.name || "",
// //           shipper_email: q.customer?.email || "",
// //           shipper_address: q.customer?.address || "",
// //           shipper_mobile: q.customer?.phone || "",

// //           // ✅ Auto-Fill CONSIGNEE from AGENT
// //           consignee_name: q.agent?.name || "",
// //           consignee_email: q.agent?.email || "",
// //           consignee_address: q.agent?.address || "",
// //           consignee_mobile: q.agent?.mobile || "",

// //           place_of_delivery: q.destination || "",
// //           weight: q.actual_weight || pkg.weight || "",
// //           package_count: q.packages_count || "",
// //           length: pkg.length || "",
// //           width: pkg.width || "",
// //           height: pkg.height || "",

// //           // ✅ Total amount auto-sum
// //           amount:
// //             q.charges?.reduce((t, x) => t + Number(x.amount || 0), 0) || "",
// //         }));

// //         Swal.fire({
// //           icon: "success",
// //           title: "Quotation Loaded",
// //           text: "Details auto-filled successfully",
// //           timer: 1200,
// //           showConfirmButton: false,
// //         });
// //       }
// //     } catch (error) {
// //       Swal.fire("Error", "Unable to fetch quotation", "error");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // ✅ Input change
// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData((p) => ({ ...p, [name]: value }));
// //   };

// //   // ✅ Items change
// //   const handleItemChange = (i, e) => {
// //     const updated = [...formData.items];
// //     updated[i][e.target.name] = e.target.value;
// //     setFormData({ ...formData, items: updated });
// //   };

// //   const addItem = () =>
// //     setFormData({
// //       ...formData,
// //       items: [
// //         ...formData.items,
// //         { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
// //       ],
// //     });

// //   const removeItem = (i) =>
// //     setFormData({
// //       ...formData,
// //       items: formData.items.filter((_, index) => index !== i),
// //     });

// //   // ✅ Submit
// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     try {
// //       const token = localStorage.getItem("token");

// //       const prepared = {
// //         ...formData,
// //         package_count: Number(formData.package_count),
// //         weight: Number(formData.weight),
// //         amount: Number(formData.amount),
// //         length: Number(formData.length),
// //         width: Number(formData.width),
// //         height: Number(formData.height),
// //         items: formData.items.map((x) => ({
// //           ...x,
// //           item_quantity: Number(x.item_quantity),
// //           item_weight: Number(x.item_weight),
// //         })),
// //       };

// //       await axios.post(`${API_BASE_URL}/courier-exports`, prepared, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       Swal.fire("Success", "Export created successfully!", "success");

// //       setQuotationNo("");
// //       resetForm();
// //     } catch (err) {
// //       Swal.fire("Error", "Failed to create export", "error");
// //     }
// //   };

// //   return (
// //     <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl">
// //       {/* Search */}
// //       <div className="relative mb-6" ref={dropdownRef}>
// //         <label className="font-semibold mb-1 block">Search Quotation</label>
// //         <div className="flex items-center">
// //           <Search className="mr-2" />
// //           <input
// //             className="border p-2 w-full rounded"
// //             value={quotationNo}
// //             onChange={(e) => setQuotationNo(e.target.value)}
// //             placeholder="Type quotation number..."
// //           />
// //         </div>

// //         {showDropdown && suggestions.length > 0 && (
// //           <ul className="absolute w-full bg-white border shadow z-50 max-h-60 overflow-auto">
// //             {suggestions.map((s, i) => (
// //               <li
// //                 key={i}
// //                 onClick={() => handleSelectSuggestion(s.quote_no)}
// //                 className="p-2 cursor-pointer hover:bg-gray-100"
// //               >
// //                 <div className="font-semibold">{s.quote_no}</div>
// //                 <div className="text-xs text-gray-500">{s.subject}</div>
// //               </li>
// //             ))}
// //           </ul>
// //         )}
// //       </div>

// //       {/* ✅ Form is always visible */}
// //       <form onSubmit={handleSubmit} className="space-y-4">
// //         <h2 className="text-xl font-bold">Courier Export Details</h2>

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //           <input type="date" name="booking_date" value={formData.booking_date} onChange={handleChange} className="border p-3 rounded" />

// //           <select name="document_type" value={formData.document_type} onChange={handleChange} className="border p-3 rounded">
// //             <option value="">Select Document Type</option>
// //             <option value="document">Document</option>
// //             <option value="non-document">Non-Document</option>
// //           </select>

// //            {/* SHIPPER SECTION */}
// //           <input placeholder="Shipper Name" name="shipper_name" value={formData.shipper_name} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Shipper Email" name="shipper_email" value={formData.shipper_email} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Shipper Address" name="shipper_address" value={formData.shipper_address} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Shipper Mobile" name="shipper_mobile" value={formData.shipper_mobile} onChange={handleChange} className="border p-3 rounded" />

     
// //           <input placeholder="Consignee Name" name="consignee_name" value={formData.consignee_name} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Consignee Email" name="consignee_email" value={formData.consignee_email} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Consignee Address" name="consignee_address" value={formData.consignee_address} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Consignee Mobile" name="consignee_mobile" value={formData.consignee_mobile} onChange={handleChange} className="border p-3 rounded" />

// //           <input placeholder="Place of Delivery" name="place_of_delivery" value={formData.place_of_delivery} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Forwarding Company" name="forwarding_company" value={formData.forwarding_company} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Correspondence Number" name="correspondence_number" value={formData.correspondence_number} onChange={handleChange} className="border p-3 rounded" />
// //         </div>

// //         {/* package dims */}
// //         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// //           <input placeholder="Length" name="length" value={formData.length} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Width" name="width" value={formData.width} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Height" name="height" value={formData.height} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Weight" name="weight" value={formData.weight} onChange={handleChange} className="border p-3 rounded" />
// //         </div>

// //         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
// //           <input placeholder="Package Count" name="package_count" value={formData.package_count} onChange={handleChange} className="border p-3 rounded" />
// //           <input placeholder="Amount" name="amount" value={formData.amount} onChange={handleChange} className="border p-3 rounded" />
// //         </div>

// //         {/* Items */}
// //         <div className="border p-4 rounded">
// //           <h3 className="font-semibold mb-3">Items</h3>

// //           {formData.items.map((item, i) => (
// //             <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
// //               <input name="item_name" value={item.item_name} placeholder="Name" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
// //               <input name="item_quantity" value={item.item_quantity} placeholder="Qty" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
// //               <input name="item_weight" value={item.item_weight} placeholder="Weight" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
// //               <input name="item_description" value={item.item_description} placeholder="Description" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />

// //               {formData.items.length > 1 && (
// //                 <button type="button" className="text-red-600" onClick={() => removeItem(i)}>Remove</button>
// //               )}
// //             </div>
// //           ))}

// //           <button type="button" onClick={addItem} className="bg-blue-600 text-white px-3 py-2 rounded">
// //             + Add Item
// //           </button>
// //         </div>

// //         <button type="submit" className="w-full bg-green-600 text-white py-3 rounded">
// //           {loading ? "Processing..." : "Create Export"}
// //         </button>
// //       </form>
// //     </div>
// //   );
// // }


// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Swal from "sweetalert2";
// import { Search } from "lucide-react";
// import {
//   fetchAllQuotations,
//   fetchQuotationByNumber,
//   clearSelectedQuotation,
// } from "@/store/slices/quotationSlice";
// import {
//   createCourierExport,
//   resetCourierExportState,
// } from "@/store/slices/courierExportSlice";

// export default function CreateCourierExport() {
//   const dispatch = useDispatch();
//   const dropdownRef = useRef(null);

//   const { list: allQuotations, selected, loading: quotationLoading } = useSelector(
//     (state) => state.quotations
//   );
//   const { loading: exportLoading, success } = useSelector(
//     (state) => state.courierExports
//   );

//   const [quotationNo, setQuotationNo] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [showDropdown, setShowDropdown] = useState(false);

//   const [formData, setFormData] = useState({
//     quotation_id: "",
//     booking_date: "",
//     document_type: "",
//     shipper_name: "",
//     shipper_email: "",
//     shipper_address: "",
//     shipper_mobile: "",
//     consignee_name: "",
//     consignee_email: "",
//     consignee_address: "",
//     consignee_mobile: "",
//     place_of_delivery: "",
//     forwarding_company: "",
//     correspondence_number: "",
//     length: "",
//     width: "",
//     height: "",
//     weight: "",
//     package_count: "",
//     amount: "",
//     items: [{ item_name: "", item_quantity: "", item_weight: "", item_description: "" }],
//   });

//   // ✅ Fetch quotations initially
//   useEffect(() => {
//     dispatch(fetchAllQuotations());
//   }, [dispatch]);

//   // ✅ Auto-fill on quotation selection
//   useEffect(() => {
//     if (selected) {
//       const q = selected;
//       const pkg = q.packages?.[0] || {};

//       setFormData((prev) => ({
//         ...prev,
//         quotation_id: q.id,
//         shipper_name: q.customer?.name || "",
//         shipper_email: q.customer?.email || "",
//         shipper_address: q.customer?.address || "",
//         shipper_mobile: q.customer?.phone || "",
//         consignee_name: q.agent?.name || "",
//         consignee_email: q.agent?.email || "",
//         consignee_address: q.agent?.address || "",
//         consignee_mobile: q.agent?.mobile || "",
//         place_of_delivery: q.destination || "",
//         weight: q.actual_weight || pkg.weight || "",
//         package_count: q.packages_count || "",
//         length: pkg.length || "",
//         width: pkg.width || "",
//         height: pkg.height || "",
//         amount: q.charges?.reduce((t, x) => t + Number(x.amount || 0), 0) || "",
//       }));

//       Swal.fire({
//         icon: "success",
//         title: "Quotation Loaded",
//         text: "Details auto-filled successfully",
//         timer: 1200,
//         showConfirmButton: false,
//       });
//     }
//   }, [selected]);

//   // ✅ Suggestions filter
//   useEffect(() => {
//     if (!quotationNo.trim()) {
//       setSuggestions([]);
//       setShowDropdown(false);
//       return;
//     }
//     const matched = allQuotations
//       .filter((item) => item.quote_no?.toLowerCase().includes(quotationNo.toLowerCase()))
//       .slice(0, 10);
//     setSuggestions(matched);
//     setShowDropdown(matched.length > 0);
//   }, [quotationNo, allQuotations]);

//   // ✅ Click outside dropdown
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ✅ Input Handlers
//   const handleChange = (e) =>
//     setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

//   const handleItemChange = (i, e) => {
//     const updated = [...formData.items];
//     updated[i][e.target.name] = e.target.value;
//     setFormData({ ...formData, items: updated });
//   };

//   const addItem = () =>
//     setFormData({
//       ...formData,
//       items: [...formData.items, { item_name: "", item_quantity: "", item_weight: "", item_description: "" }],
//     });

//   const removeItem = (i) =>
//     setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) });

//   // ✅ Select Quotation
//   const handleSelectSuggestion = (quote_no) => {
//     setQuotationNo(quote_no);
//     setShowDropdown(false);
//     dispatch(fetchQuotationByNumber(quote_no));
//   };

//   // ✅ Submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const prepared = {
//       ...formData,
//       package_count: Number(formData.package_count),
//       weight: Number(formData.weight),
//       amount: Number(formData.amount),
//       length: Number(formData.length),
//       width: Number(formData.width),
//       height: Number(formData.height),
//       items: formData.items.map((x) => ({
//         ...x,
//         item_quantity: Number(x.item_quantity),
//         item_weight: Number(x.item_weight),
//       })),
//     };

//     await dispatch(createCourierExport(prepared));
//   };

//   // ✅ Success alert after submission
//   useEffect(() => {
//     if (success) {
//       Swal.fire("Success", "Courier Export created successfully!", "success");
//       setQuotationNo("");
//       setFormData({
//         quotation_id: "",
//         booking_date: "",
//         document_type: "",
//         shipper_name: "",
//         shipper_email: "",
//         shipper_address: "",
//         shipper_mobile: "",
//         consignee_name: "",
//         consignee_email: "",
//         consignee_address: "",
//         consignee_mobile: "",
//         place_of_delivery: "",
//         forwarding_company: "",
//         correspondence_number: "",
//         length: "",
//         width: "",
//         height: "",
//         weight: "",
//         package_count: "",
//         amount: "",
//         items: [{ item_name: "", item_quantity: "", item_weight: "", item_description: "" }],
//       });
//       dispatch(clearSelectedQuotation());
//       dispatch(resetCourierExportState());
//     }
//   }, [success, dispatch]);

//   return (
//     <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl">
//       {/* 🔍 Search Quotation */}
//       <div className="relative mb-6" ref={dropdownRef}>
//         <label className="font-semibold mb-1 block">Search Quotation</label>
//         <div className="flex items-center">
//           <Search className="mr-2" />
//           <input
//             className="border p-2 w-full rounded"
//             value={quotationNo}
//             onChange={(e) => setQuotationNo(e.target.value)}
//             placeholder="Type quotation number..."
//           />
//         </div>

//         {showDropdown && (
//           <ul className="absolute w-full bg-white border shadow z-50 max-h-60 overflow-auto">
//             {suggestions.map((s, i) => (
//               <li
//                 key={i}
//                 onClick={() => handleSelectSuggestion(s.quote_no)}
//                 className="p-2 cursor-pointer hover:bg-gray-100"
//               >
//                 <div className="font-semibold">{s.quote_no}</div>
//                 <div className="text-xs text-gray-500">{s.subject}</div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* 📦 Form */}
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <h2 className="text-xl font-bold">Courier Export Details</h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input type="date" name="booking_date" value={formData.booking_date} onChange={handleChange} className="border p-3 rounded" />
//           <select name="document_type" value={formData.document_type} onChange={handleChange} className="border p-3 rounded">
//             <option value="">Select Document Type</option>
//             <option value="document">Document</option>
//             <option value="non-document">Non-Document</option>
//           </select>

//           {/* shipper */}
//           <input name="shipper_name" value={formData.shipper_name} onChange={handleChange} placeholder="Shipper Name" className="border p-3 rounded" />
//           <input name="shipper_email" value={formData.shipper_email} onChange={handleChange} placeholder="Shipper Email" className="border p-3 rounded" />
//           <input name="shipper_address" value={formData.shipper_address} onChange={handleChange} placeholder="Shipper Address" className="border p-3 rounded" />
//           <input name="shipper_mobile" value={formData.shipper_mobile} onChange={handleChange} placeholder="Shipper Mobile" className="border p-3 rounded" />

//           {/* consignee */}
//           <input name="consignee_name" value={formData.consignee_name} onChange={handleChange} placeholder="Consignee Name" className="border p-3 rounded" />
//           <input name="consignee_email" value={formData.consignee_email} onChange={handleChange} placeholder="Consignee Email" className="border p-3 rounded" />
//           <input name="consignee_address" value={formData.consignee_address} onChange={handleChange} placeholder="Consignee Address" className="border p-3 rounded" />
//           <input name="consignee_mobile" value={formData.consignee_mobile} onChange={handleChange} placeholder="Consignee Mobile" className="border p-3 rounded" />

//           <input name="place_of_delivery" value={formData.place_of_delivery} onChange={handleChange} placeholder="Place of Delivery" className="border p-3 rounded" />
//           <input name="forwarding_company" value={formData.forwarding_company} onChange={handleChange} placeholder="Forwarding Company" className="border p-3 rounded" />
//           <input name="correspondence_number" value={formData.correspondence_number} onChange={handleChange} placeholder="Correspondence Number" className="border p-3 rounded" />
//         </div>

//         {/* package dims */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           <input name="length" value={formData.length} onChange={handleChange} placeholder="Length" className="border p-3 rounded" />
//           <input name="width" value={formData.width} onChange={handleChange} placeholder="Width" className="border p-3 rounded" />
//           <input name="height" value={formData.height} onChange={handleChange} placeholder="Height" className="border p-3 rounded" />
//           <input name="weight" value={formData.weight} onChange={handleChange} placeholder="Weight" className="border p-3 rounded" />
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//           <input name="package_count" value={formData.package_count} onChange={handleChange} placeholder="Package Count" className="border p-3 rounded" />
//           <input name="amount" value={formData.amount} onChange={handleChange} placeholder="Amount" className="border p-3 rounded" />
//         </div>

//         {/* items */}
//         <div className="border p-4 rounded">
//           <h3 className="font-semibold mb-3">Items</h3>

//           {formData.items.map((item, i) => (
//             <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
//               <input name="item_name" value={item.item_name} placeholder="Name" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
//               <input name="item_quantity" value={item.item_quantity} placeholder="Qty" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
//               <input name="item_weight" value={item.item_weight} placeholder="Weight" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
//               <input name="item_description" value={item.item_description} placeholder="Description" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
//               {formData.items.length > 1 && (
//                 <button type="button" className="text-red-600" onClick={() => removeItem(i)}>Remove</button>
//               )}
//             </div>
//           ))}

//           <button type="button" onClick={addItem} className="bg-blue-600 text-white px-3 py-2 rounded">
//             + Add Item
//           </button>
//         </div>

//         <button type="submit" disabled={exportLoading || quotationLoading} className="w-full bg-green-600 text-white py-3 rounded">
//           {exportLoading ? "Processing..." : "Create Export"}
//         </button>
//       </form>
//     </div>
//   );
// }
