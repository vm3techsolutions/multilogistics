"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCourierExport,
  resetCourierExportState,
} from "@/store/slices/courierExportSlice";
import {
  getQuotationByQuoteNo,
  resetQuotationState,
} from "@/store/slices/quotationSlice";
import {
  fetchCustomerById,
  clearSelectedCustomer,
} from "@/store/slices/customerSlice";
import { Trash2, RefreshCw } from "lucide-react"; 
import { getAgents } from "@/store/slices/agentSlice";

const CreateCourierExportPage = () => {
  const dispatch = useDispatch();
  const { singleQuotation } = useSelector((state) => state.quotation);
  const { selectedCustomer } = useSelector((state) => state.customers);
  const { loading, success, error, existingExports } = useSelector(
    (state) => state.courierExports
  );
  const { agents } = useSelector((state) => state.agents); // get all agents

  const [formData, setFormData] = useState({
    quotation_no: "", 
    quotation_id: "",
    booking_date: "",
    document_type: "document",
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
    items: [],
  });

  // Get all agents
  useEffect(() => {
  dispatch(getAgents());
}, [dispatch]);

  // Fetch quotation when quotation_id changes
  useEffect(() => {
    if (formData.quotation_no.trim()) {
      dispatch(getQuotationByQuoteNo(formData.quotation_no.trim()));
    } else {
      dispatch(resetQuotationState());
      dispatch(clearSelectedCustomer());
    }
  }, [formData.quotation_no, dispatch]);

  // Fetch customer when quotation is loaded
  useEffect(() => {
    if (singleQuotation?.customer_id) {
      dispatch(fetchCustomerById(singleQuotation.customer_id));
    } else {
      dispatch(clearSelectedCustomer());
    }
  }, [singleQuotation, dispatch]);

  // 1️⃣ Update form with quotation packages & weight
  useEffect(() => {
    if (singleQuotation) {
      const agent = agents.find(a => a.id === singleQuotation.agent_id);
      setFormData((prev) => ({
        ...prev,
        quotation_id: singleQuotation.id,
        place_of_delivery: singleQuotation.destination || "",
        weight: singleQuotation.chargeable_weight || "",
        package_count: singleQuotation.packages?.length || "",
        amount: singleQuotation.final_total || "",
        forwarding_company: agent ? agent.name : "",
      }));
    }
  }, [singleQuotation, agents]);

  // 2️⃣ Update shipper details when customer data is available
  useEffect(() => {
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        shipper_name: selectedCustomer.name || "",
        shipper_email: selectedCustomer.email || "",
        shipper_address: selectedCustomer.address || "",
        shipper_mobile: selectedCustomer.phone || "",
      }));
    }
  }, [selectedCustomer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...formData.items];
    newItems[index][e.target.name] = e.target.value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item_name: "", item_quantity: "", item_weight: "", item_description: "" },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (confirm = false) => {
    const submitData = {
    ...formData,
    quotation_id: singleQuotation?.id, // numeric id
    weight: formData.weight ? parseFloat(formData.weight) : 0,
    length: formData.length ? parseFloat(formData.length) : 0,
    width: formData.width ? parseFloat(formData.width) : 0,
    height: formData.height ? parseFloat(formData.height) : 0,
    package_count: formData.package_count ? parseInt(formData.package_count) : 0,
    amount: formData.amount ? parseFloat(formData.amount) : 0,
    items: formData.items.map(item => ({
      ...item,
      item_quantity: item.item_quantity ? parseInt(item.item_quantity) : 0,
      item_weight: item.item_weight ? parseFloat(item.item_weight) : 0,
    })),
  };
  dispatch(createCourierExport({ formData: submitData, confirm }));
  };

  const handleReset = () => {
    setFormData({
      quotation_id: "",
      booking_date: "",
      document_type: "document",
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
    dispatch(resetCourierExportState());
    dispatch(resetQuotationState());
    dispatch(clearSelectedCustomer());
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Export</h1>
        <button className="px-4 py-2 bg-blue-700 text-white rounded">Back To Export List</button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          <p>{error}</p>
          {existingExports?.length > 0 && (
            <div className="mt-2">
              <p>Existing exports linked to this quotation:</p>
              <ul className="list-disc pl-5">
                {existingExports.map((exp) => (
                  <li key={exp.id}>{exp.awb_number} - {exp.quote_no}</li>
                ))}
              </ul>
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => handleSubmit(true)}
              >
                Confirm to create another
              </button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          Courier export created successfully!
          <button className="ml-2 text-blue-600 underline" onClick={handleReset}>
            Create new
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Quotation & Booking */}
        <div className="grid grid-cols-2 gap-4">
          {/* Enter Quotation Number */}
        <input
          type="text"
          name="quotation_no"
          placeholder="Enter Quotation Number"
          value={formData.quotation_no}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-100 border"
        />

        {/* Hidden Quotation ID */}
        <input type="hidden" name="quotation_id" value={formData.quotation_id} />

          <input
            type="date"
            name="booking_date"
            placeholder="Booking Date"
            value={formData.booking_date}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-100 border border-gray-200"
          />
        </div>

        <input
          type="text"
          name="document_type"
          placeholder="Select Document Type"
          value={formData.document_type}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-100 border border-gray-200"
        />

        {/* Shipper Details */}
        <p className="font-semibold mt-4">Shipper Details :</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <input type="text" name="shipper_name" placeholder="Shipper Name" value={formData.shipper_name} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="text" name="shipper_mobile" placeholder="Shipper Mobile No." value={formData.shipper_mobile} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="email" name="shipper_email" placeholder="Shipper Email" value={formData.shipper_email} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2" />
          <input type="text" name="shipper_address" placeholder="Shipper Address" value={formData.shipper_address} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2" />
        </div>

        {/* Consignee Details */}
        <p className="font-semibold mt-4">Consignee Details :</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <input type="text" name="consignee_name" placeholder="Consignee Name" value={formData.consignee_name} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="text" name="consignee_mobile" placeholder="Consignee Mobile No." value={formData.consignee_mobile} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="email" name="consignee_email" placeholder="Consignee Email" value={formData.consignee_email} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2" />
          <input type="text" name="consignee_address" placeholder="Consignee Address" value={formData.consignee_address} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2" />
        </div>

        {/* Delivery & Package */}
        <div className="grid grid-cols-3 gap-4 mt-2">
          <input type="text" name="place_of_delivery" placeholder="Place of Delivery" value={formData.place_of_delivery} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <select
  name="forwarding_company"
  value={formData.forwarding_company}
  onChange={handleChange}
  className="p-2 rounded bg-gray-100 border border-gray-200"
>
  <option value="">Select Forwarding Company</option>
  {agents.map((agent) => (
    <option key={agent.id} value={agent.name}>
      {agent.name}
    </option>
  ))}
</select>

          <input type="text" name="correspondence_number" placeholder="Correspondance No." value={formData.correspondence_number} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-2">
          <input type="number" name="length" placeholder="Length" value={formData.length} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="number" name="width" placeholder="Width" value={formData.width} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="number" name="height" placeholder="Height" value={formData.height} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="number" name="weight" placeholder="Weight" value={formData.weight} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="number" name="package_count" placeholder="Packages" value={formData.package_count} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
          <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} className="p-2 rounded bg-gray-100 border border-gray-200" />
        </div>

       {/* Items */}


{formData.items.length > 0 && formData.items.map((item, index) => (
  <>
  <p className="font-semibold mt-4">Items :</p>
  <div key={index} className="grid grid-cols-5 gap-4 mb-2 items-center">
  
    <input
      type="text"
      name="item_name"
      placeholder="Name"
      value={item.item_name}
      onChange={(e) => handleItemChange(index, e)}
      className="p-2 rounded bg-gray-100 border border-gray-200"
    />
    <input
      type="number"
      name="item_quantity"
      placeholder="Qty"
      value={item.item_quantity}
      onChange={(e) => handleItemChange(index, e)}
      className="p-2 rounded bg-gray-100 border border-gray-200"
    />
    <input
      type="number"
      name="item_weight"
      placeholder="Weight"
      value={item.item_weight}
      onChange={(e) => handleItemChange(index, e)}
      className="p-2 rounded bg-gray-100 border border-gray-200"
    />
    <input
      type="text"
      name="item_description"
      placeholder="Description"
      value={item.item_description}
      onChange={(e) => handleItemChange(index, e)}
      className="p-2 rounded bg-gray-100 border border-gray-200"
    />

    {/* Icons: Reset & Delete */}
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          const newItems = [...formData.items];
          newItems[index] = { item_name: "", item_quantity: "", item_weight: "", item_description: "" };
          setFormData({ ...formData, items: newItems });
        }}
        className="p-1 bg-yellow-400 rounded hover:bg-yellow-500"
        title="Reset"
      >
        <RefreshCw className="w-5 h-5 text-white" />
      </button>

      <button
        type="button"
        onClick={() => removeItem(index)}
        className="p-1 bg-red-600 rounded hover:bg-red-700"
        title="Delete"
      >
        <Trash2 className="w-5 h-5 text-white" />
      </button>
    </div>
  </div>
  </>
))}

        {/* Actions */}
        <div className="flex gap-4 mt-4">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded">
            {loading ? "Creating..." : "Save Invoice"}
          </button>
          <button type="button" onClick={handleReset} className="px-6 py-2 bg-gray-300 rounded">
            Cancel Invoice
          </button>
          {/* Add Item Button */}
<button
  type="button"
  onClick={addItem}
  className="px-4 py-2 bg-blue-700 text-white rounded mt-2"
>
  Add Item
</button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourierExportPage;
