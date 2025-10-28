// "use client";
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { createCourierExport } from "@/store/slices/courierExportSlice";

// const CreateCourierExport = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const { loading } = useSelector((state) => state.courierExports);

//   const [formData, setFormData] = useState({
//     quotation_id: "",
//     booking_date: "",
//     document_type: "document",
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
//     items: [],
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await dispatch(createCourierExport(formData)).unwrap();
//       alert("Courier Export created successfully ✅");
//       if (onClose) onClose();
//     } catch (err) {
//       alert("Error: " + err);
//     }
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow">
//       <h2 className="text-xl font-semibold mb-4">Create Courier Export</h2>
//       <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
//         <input name="quotation_id" placeholder="Quotation ID" onChange={handleChange} />
//         <input name="booking_date" type="date" onChange={handleChange} />
//         <select name="document_type" onChange={handleChange}>
//           <option value="document">Document</option>
//           <option value="non-document">Non-Document</option>
//         </select>
//         <input name="shipper_name" placeholder="Shipper Name" onChange={handleChange} />
//         <input name="shipper_email" placeholder="Shipper Email" onChange={handleChange} />
//         <input name="shipper_address" placeholder="Shipper Address" onChange={handleChange} />
//         <input name="shipper_mobile" placeholder="Shipper Mobile" onChange={handleChange} />
//         <input name="consignee_name" placeholder="Consignee Name" onChange={handleChange} />
//         <input name="consignee_email" placeholder="Consignee Email" onChange={handleChange} />
//         <input name="consignee_address" placeholder="Consignee Address" onChange={handleChange} />
//         <input name="consignee_mobile" placeholder="Consignee Mobile" onChange={handleChange} />
//         <input name="place_of_delivery" placeholder="Place of Delivery" onChange={handleChange} />
//         <input name="forwarding_company" placeholder="Forwarding Company" onChange={handleChange} />
//         <input name="correspondence_number" placeholder="Correspondence Number" onChange={handleChange} />
//         <input name="length" placeholder="Length" onChange={handleChange} />
//         <input name="width" placeholder="Width" onChange={handleChange} />
//         <input name="height" placeholder="Height" onChange={handleChange} />
//         <input name="weight" placeholder="Weight" onChange={handleChange} />
//         <input name="package_count" placeholder="Package Count" onChange={handleChange} />
//         <input name="amount" placeholder="Amount" onChange={handleChange} />

//         <button
//           type="submit"
//           className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//           disabled={loading}
//         >
//           {loading ? "Creating..." : "Create Courier Export"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default CreateCourierExport;
