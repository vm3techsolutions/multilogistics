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

//   const {
//     quotations: allQuotations,
//     selectedQuotation,
//     loading: quotationLoading,
//   } = useSelector((state) => state.quotation);

//   const { loading: exportLoading, success, error } = useSelector(
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
//     items: [
//       { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
//     ],
//   });

//   // ✅ Fetch quotations initially
//   useEffect(() => {
//     dispatch(fetchAllQuotations());
//   }, [dispatch]);

//   // ✅ Autofill only key quotation-related fields (not package dimensions)
//   useEffect(() => {
//     if (selectedQuotation) {
//       const q = selectedQuotation;

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
//         amount:
//           q.charges?.reduce((t, x) => t + Number(x.amount || 0), 0) || "",
//       }));

//       Swal.fire({
//         icon: "success",
//         title: "Quotation Loaded",
//         text: "Quotation details auto-filled successfully.",
//         timer: 1200,
//         showConfirmButton: false,
//       });
//     }
//   }, [selectedQuotation]);

//   // ✅ Filter quotation suggestions
//   useEffect(() => {
//     if (!quotationNo.trim()) {
//       setSuggestions([]);
//       setShowDropdown(false);
//       return;
//     }
//     const matched = allQuotations
//       ?.filter((item) =>
//         item.quote_no?.toLowerCase().includes(quotationNo.toLowerCase())
//       )
//       .slice(0, 10);
//     setSuggestions(matched);
//     setShowDropdown(matched?.length > 0);
//   }, [quotationNo, allQuotations]);

//   // ✅ Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ✅ Input handlers
//   const handleChange = (e) =>
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

//   const handleItemChange = (i, e) => {
//     const updated = [...formData.items];
//     updated[i][e.target.name] = e.target.value;
//     setFormData({ ...formData, items: updated });
//   };

//   const addItem = () =>
//     setFormData({
//       ...formData,
//       items: [
//         ...formData.items,
//         { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
//       ],
//     });

//   const removeItem = (i) =>
//     setFormData({
//       ...formData,
//       items: formData.items.filter((_, idx) => idx !== i),
//     });

//   const handleSelectSuggestion = (quote_no) => {
//     setQuotationNo(quote_no);
//     setShowDropdown(false);
//     dispatch(fetchQuotationByNumber(quote_no));
//   };

//   // ✅ Submit form
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

//   // ✅ Show success or duplicate quotation error
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
//         items: [
//           { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
//         ],
//       });
//       dispatch(clearSelectedQuotation());
//       dispatch(resetCourierExportState());
//     }

//     if (error && error.includes("already exists")) {
//       Swal.fire({
//         icon: "error",
//         title: "Duplicate Quotation",
//         text: "Courier export already exists for this quotation!",
//       });
//       dispatch(resetCourierExportState());
//     }
//   }, [success, error, dispatch]);

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

//           <input name="shipper_name" value={formData.shipper_name} onChange={handleChange} placeholder="Shipper Name" className="border p-3 rounded" />
//           <input name="shipper_email" value={formData.shipper_email} onChange={handleChange} placeholder="Shipper Email" className="border p-3 rounded" />
//           <input name="shipper_address" value={formData.shipper_address} onChange={handleChange} placeholder="Shipper Address" className="border p-3 rounded" />
//           <input name="shipper_mobile" value={formData.shipper_mobile} onChange={handleChange} placeholder="Shipper Mobile" className="border p-3 rounded" />

//           <input name="consignee_name" value={formData.consignee_name} onChange={handleChange} placeholder="Consignee Name" className="border p-3 rounded" />
//           <input name="consignee_email" value={formData.consignee_email} onChange={handleChange} placeholder="Consignee Email" className="border p-3 rounded" />
//           <input name="consignee_address" value={formData.consignee_address} onChange={handleChange} placeholder="Consignee Address" className="border p-3 rounded" />
//           <input name="consignee_mobile" value={formData.consignee_mobile} onChange={handleChange} placeholder="Consignee Mobile" className="border p-3 rounded" />

//           <input name="place_of_delivery" value={formData.place_of_delivery} onChange={handleChange} placeholder="Place of Delivery" className="border p-3 rounded" />
//           <input name="forwarding_company" value={formData.forwarding_company} onChange={handleChange} placeholder="Forwarding Company" className="border p-3 rounded" />
//           <input name="correspondence_number" value={formData.correspondence_number} onChange={handleChange} placeholder="Correspondence Number" className="border p-3 rounded" />
//         </div>

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


"use client";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { Search } from "lucide-react";
import {
  fetchAllQuotations,
  fetchQuotationByNumber,
  clearSelectedQuotation,
} from "@/store/slices/quotationSlice";
import {
  createCourierExport,
  resetCourierExportState,
} from "@/store/slices/courierExportSlice";

export default function CreateCourierExport() {
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const userSelectedQuotation = useRef(false); // ✅ flag to detect manual selection

  const {
    quotations: allQuotations,
    selectedQuotation,
    loading: quotationLoading,
  } = useSelector((state) => state.quotation);

  const { loading: exportLoading, success, error } = useSelector(
    (state) => state.courierExports
  );

  const [quotationNo, setQuotationNo] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    quotation_id: "",
    booking_date: "",
    document_type: "",
    shipper_name: "",
    shipper_email: "",
    shipper_address: "",
    shipper_mobile: "",
    consignee_name: "",
    consignee_email: "",
    consignee_address: "",
    consignee_mobile: "",
    place_of_delivery: "",
    forwarding_company: "",
    correspondence_number: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    package_count: "",
    amount: "",
    items: [
      { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
    ],
  });

  // ✅ Fetch quotations initially
  useEffect(() => {
    dispatch(fetchAllQuotations());
  }, [dispatch]);

  // ✅ Autofill only when user manually selects a quotation
  useEffect(() => {
    if (selectedQuotation && userSelectedQuotation.current) {
      const q = selectedQuotation;

      setFormData((prev) => ({
        ...prev,
        quotation_id: q.id,
        shipper_name: q.customer?.name || "",
        shipper_email: q.customer?.email || "",
        shipper_address: q.customer?.address || "",
        shipper_mobile: q.customer?.phone || "",
        consignee_name: q.agent?.name || "",
        consignee_email: q.agent?.email || "",
        consignee_address: q.agent?.address || "",
        consignee_mobile: q.agent?.mobile || "",
        place_of_delivery: q.destination || "",
        amount:
          q.charges?.reduce((t, x) => t + Number(x.amount || 0), 0) || "",
      }));

      Swal.fire({
        icon: "success",
        title: "Quotation Loaded",
        text: "Quotation details auto-filled successfully.",
        timer: 1200,
        showConfirmButton: false,
      });

      userSelectedQuotation.current = false; // reset flag
    }
  }, [selectedQuotation]);

  // ✅ Filter quotation suggestions
  useEffect(() => {
    if (!quotationNo.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const matched = allQuotations
      ?.filter((item) =>
        item.quote_no?.toLowerCase().includes(quotationNo.toLowerCase())
      )
      .slice(0, 10);
    setSuggestions(matched);
    setShowDropdown(matched?.length > 0);
  }, [quotationNo, allQuotations]);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Input handlers
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleItemChange = (i, e) => {
    const updated = [...formData.items];
    updated[i][e.target.name] = e.target.value;
    setFormData({ ...formData, items: updated });
  };

  const addItem = () =>
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
      ],
    });

  const removeItem = (i) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== i),
    });

  // ✅ When user selects a suggestion
  const handleSelectSuggestion = (quote_no) => {
    setQuotationNo(quote_no);
    setShowDropdown(false);
    userSelectedQuotation.current = true; // mark manual selection
    dispatch(fetchQuotationByNumber(quote_no));
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const prepared = {
      ...formData,
      package_count: Number(formData.package_count),
      weight: Number(formData.weight),
      amount: Number(formData.amount),
      length: Number(formData.length),
      width: Number(formData.width),
      height: Number(formData.height),
      items: formData.items.map((x) => ({
        ...x,
        item_quantity: Number(x.item_quantity),
        item_weight: Number(x.item_weight),
      })),
    };

    await dispatch(createCourierExport(prepared));
  };

  // ✅ Show success or duplicate quotation error
  useEffect(() => {
    if (success) {
      Swal.fire("Success", "Courier Export created successfully!", "success");
      setQuotationNo("");
      setFormData({
        quotation_id: "",
        booking_date: "",
        document_type: "",
        shipper_name: "",
        shipper_email: "",
        shipper_address: "",
        shipper_mobile: "",
        consignee_name: "",
        consignee_email: "",
        consignee_address: "",
        consignee_mobile: "",
        place_of_delivery: "",
        forwarding_company: "",
        correspondence_number: "",
        length: "",
        width: "",
        height: "",
        weight: "",
        package_count: "",
        amount: "",
        items: [
          { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
        ],
      });
      dispatch(clearSelectedQuotation());
      dispatch(resetCourierExportState());
    }

    if (error && error.includes("already exists")) {
      Swal.fire({
        icon: "error",
        title: "Duplicate Quotation",
        text: "Courier export already exists for this quotation!",
      });
      dispatch(resetCourierExportState());
    }
  }, [success, error, dispatch]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl">
      {/* 🔍 Search Quotation */}
      <div className="relative mb-6" ref={dropdownRef}>
        <label className="font-semibold mb-1 block">Search Quotation</label>
        <div className="flex items-center">
          <Search className="mr-2" />
          <input
            className="border p-2 w-full rounded"
            value={quotationNo}
            onChange={(e) => setQuotationNo(e.target.value)}
            placeholder="Type quotation number..."
          />
        </div>

        {showDropdown && (
          <ul className="absolute w-full bg-white border shadow z-50 max-h-60 overflow-auto">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => handleSelectSuggestion(s.quote_no)}
                className="p-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="font-semibold">{s.quote_no}</div>
                <div className="text-xs text-gray-500">{s.subject}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 📦 Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">Courier Export Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" name="booking_date" value={formData.booking_date} onChange={handleChange} className="border p-3 rounded" />
          <select name="document_type" value={formData.document_type} onChange={handleChange} className="border p-3 rounded">
            <option value="">Select Document Type</option>
            <option value="document">Document</option>
            <option value="non-document">Non-Document</option>
          </select>

          <input name="shipper_name" value={formData.shipper_name} onChange={handleChange} placeholder="Shipper Name" className="border p-3 rounded" />
          <input name="shipper_email" value={formData.shipper_email} onChange={handleChange} placeholder="Shipper Email" className="border p-3 rounded" />
          <input name="shipper_address" value={formData.shipper_address} onChange={handleChange} placeholder="Shipper Address" className="border p-3 rounded" />
          <input name="shipper_mobile" value={formData.shipper_mobile} onChange={handleChange} placeholder="Shipper Mobile" className="border p-3 rounded" />

          <input name="consignee_name" value={formData.consignee_name} onChange={handleChange} placeholder="Consignee Name" className="border p-3 rounded" />
          <input name="consignee_email" value={formData.consignee_email} onChange={handleChange} placeholder="Consignee Email" className="border p-3 rounded" />
          <input name="consignee_address" value={formData.consignee_address} onChange={handleChange} placeholder="Consignee Address" className="border p-3 rounded" />
          <input name="consignee_mobile" value={formData.consignee_mobile} onChange={handleChange} placeholder="Consignee Mobile" className="border p-3 rounded" />

          <input name="place_of_delivery" value={formData.place_of_delivery} onChange={handleChange} placeholder="Place of Delivery" className="border p-3 rounded" />
          <input name="forwarding_company" value={formData.forwarding_company} onChange={handleChange} placeholder="Forwarding Company" className="border p-3 rounded" />
          <input name="correspondence_number" value={formData.correspondence_number} onChange={handleChange} placeholder="Correspondence Number" className="border p-3 rounded" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input name="length" value={formData.length} onChange={handleChange} placeholder="Length" className="border p-3 rounded" />
          <input name="width" value={formData.width} onChange={handleChange} placeholder="Width" className="border p-3 rounded" />
          <input name="height" value={formData.height} onChange={handleChange} placeholder="Height" className="border p-3 rounded" />
          <input name="weight" value={formData.weight} onChange={handleChange} placeholder="Weight" className="border p-3 rounded" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input name="package_count" value={formData.package_count} onChange={handleChange} placeholder="Package Count" className="border p-3 rounded" />
          <input name="amount" value={formData.amount} onChange={handleChange} placeholder="Amount" className="border p-3 rounded" />
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-3">Items</h3>
          {formData.items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <input name="item_name" value={item.item_name} placeholder="Name" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
              <input name="item_quantity" value={item.item_quantity} placeholder="Qty" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
              <input name="item_weight" value={item.item_weight} placeholder="Weight" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
              <input name="item_description" value={item.item_description} placeholder="Description" onChange={(e) => handleItemChange(i, e)} className="border p-3 rounded" />
              {formData.items.length > 1 && (
                <button type="button" className="text-red-600" onClick={() => removeItem(i)}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="bg-blue-600 text-white px-3 py-2 rounded">
            + Add Item
          </button>
        </div>

        <button type="submit" disabled={exportLoading || quotationLoading} className="w-full bg-green-600 text-white py-3 rounded">
          {exportLoading ? "Processing..." : "Create Export"}
        </button>
      </form>
    </div>
  );
}
