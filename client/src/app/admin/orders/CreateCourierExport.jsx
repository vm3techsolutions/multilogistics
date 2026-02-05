"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  createCourierExport,
  resetCourierExportState,
  updateCourierExport,
} from "@/store/slices/courierExportSlice";
import {
  getQuotationByQuoteNo,
  resetQuotationState,
} from "@/store/slices/quotationSlice";
import {
  fetchCustomerById,
  clearSelectedCustomer,
  fetchCustomers,
} from "@/store/slices/customerSlice";
import { Trash2, RefreshCw } from "lucide-react";
import { getAgents } from "@/store/slices/agentSlice";

const CreateCourierExportPage = ({
  mode = "create",
  initialData = null,
  exportId = null,
}) => {
  const dispatch = useDispatch();
  const { singleQuotation } = useSelector((state) => state.quotation);
  const { list: customers, selectedCustomer } = useSelector(
    (state) => state.customers,
  );
  const { loading, success, error, existingExports, successMessage } =
    useSelector((state) => state.courierExports);
  const { agents } = useSelector((state) => state.agents); // get all agents

  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const [formData, setFormData] = useState({
    quote_no: "",
    quotation_id: "",
    customer_id: "",
    export_type: "",
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
    chargeable_weight: "",
    package_count: "",
    final_total: "",
    items: [],
  });

  // Get all agents
  useEffect(() => {
    dispatch(getAgents());
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Fetch quotation when quotation_id changes
  useEffect(() => {
    if (formData.quote_no.trim()) {
      dispatch(getQuotationByQuoteNo(formData.quote_no.trim()));
    } else {
      dispatch(resetQuotationState());
      dispatch(clearSelectedCustomer());
    }
  }, [formData.quote_no, dispatch]);

  // Fetch customer when quotation is loaded
  useEffect(() => {
    if (singleQuotation?.customer_id) {
      dispatch(fetchCustomerById(singleQuotation.customer_id));
    } else {
      dispatch(clearSelectedCustomer());
    }
  }, [singleQuotation, dispatch]);

  // For Edit Mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        quote_no: initialData.quote_no || "",
        quotation_id: initialData.quotation_id || "",
        customer_id: initialData.customer_id || "",
        export_type: initialData.export_type || "",
        booking_date: initialData.booking_date?.split("T")[0] || "",
        document_type: initialData.document_type || "document",

        shipper_name: initialData.shipper_name || "",
        shipper_email: initialData.shipper_email || "",
        shipper_address: initialData.shipper_address || "",
        shipper_mobile: initialData.shipper_mobile || "",

        consignee_name: initialData.consignee_name || "",
        consignee_email: initialData.consignee_email || "",
        consignee_address: initialData.consignee_address || "",
        consignee_mobile: initialData.consignee_mobile || "",

        place_of_delivery: initialData.place_of_delivery || "",
        forwarding_company: initialData.forwarding_company || "",
        correspondence_number: initialData.correspondence_number || "",

        length: initialData.length ?? "",
        width: initialData.width ?? "",
        height: initialData.height ?? "",
        chargeable_weight: initialData.weight ?? "",
        package_count: initialData.package_count ?? "",
        final_total: initialData.amount ?? "",

        items:
          initialData.export_type === "individual" &&
          Array.isArray(initialData.items)
            ? initialData.items
            : [],
      });
    }
  }, [mode, initialData]);

  // 1️⃣ Update form with quotation packages & weight
  useEffect(() => {
    if (singleQuotation) {
      const agent = agents.find((a) => a.id === singleQuotation.agent_id);

      setFormData((prev) => ({
        ...prev,
        quotation_id: singleQuotation.id,
        customer_id: singleQuotation.customer_id,
        export_type: singleQuotation.export_type ?? prev.export_type,
        place_of_delivery: singleQuotation.destination || "",
        // ✅ FORCE STRING FOR INPUTS
        chargeable_weight:
          singleQuotation.chargeable_weight !== null &&
          singleQuotation.chargeable_weight !== undefined
            ? String(singleQuotation.chargeable_weight)
            : "",
        package_count: singleQuotation.packages?.length,
        final_total:
          singleQuotation.final_total !== null &&
          singleQuotation.final_total !== undefined
            ? String(singleQuotation.final_total)
            : "",
        forwarding_company: agent?.name || "",
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

  // Filter customer suggestions when typing
  useEffect(() => {
    // FIX: ensure customers is an array
    if (!Array.isArray(customers)) {
      setFilteredCustomers([]);
      return;
    }

    if (!formData.quote_no) {
      if (customerSearch.trim().length > 0) {
        const result = customers.filter((c) =>
          c.name?.toLowerCase().includes(customerSearch.toLowerCase()),
        );
        setFilteredCustomers(result);
      } else {
        setFilteredCustomers([]);
      }
    } else {
      setFilteredCustomers([]);
    }
  }, [customerSearch, customers, formData.quote_no]);

  // On Selecting Customer → Auto-fill Shipper Details
  const selectCustomer = (cust) => {
    setCustomerSearch(cust.name);

    dispatch(fetchCustomerById(cust.id));

    setFilteredCustomers([]);

    setFormData((prev) => ({
      ...prev,
      customer_id: cust.id,
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...formData.items];
    newItems[index][e.target.name] = e.target.value;
    const qty = Number(newItems[index].item_quantity);
    const rate = Number(newItems[index].rate);

    if (!isNaN(qty) && !isNaN(rate)) {
      newItems[index].amount = (qty * rate).toString();
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_name: "",
          item_quantity: "",
          rate: "",
          amount: "",
          hsn_code: "",
        },
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
      quotation_id: formData.quotation_id
        ? Number(formData.quotation_id)
        : null,

      quote_no: formData.export_type === "corporate" ? formData.quote_no : null,
      booking_date: formData.booking_date,
      document_type: formData.document_type,
      export_type: formData.export_type,
      customer_id: formData.customer_id ? Number(formData.customer_id) : null,

      shipper_name: formData.shipper_name,
      shipper_email: formData.shipper_email,
      shipper_address: formData.shipper_address,
      shipper_mobile: formData.shipper_mobile,

      consignee_name: formData.consignee_name,
      consignee_email: formData.consignee_email,
      consignee_address: formData.consignee_address,
      consignee_mobile: formData.consignee_mobile,

      place_of_delivery: formData.place_of_delivery || null,
      forwarding_company: formData.forwarding_company || null,
      correspondence_number: formData.correspondence_number || null,

      length: Number(formData.length),
      width: Number(formData.width),
      height: Number(formData.height),
      weight: Number(formData.chargeable_weight),
      package_count: Number(formData.package_count),
      amount: Number(formData.final_total),

      items: formData.items.map((item) => ({
        item_name: item.item_name,
        item_quantity: Number(item.item_quantity),
        rate: Number(item.rate),
        amount: Number(item.amount),
        hsn_code: item.hsn_code || null,
      })),
    };

    if (mode === "edit") {
      dispatch(updateCourierExport({ id: exportId, formData: submitData }))
        .unwrap()
        .then(() => {
          setTimeout(() => {
            dispatch(clearSuccessMessage());
          }, 3000);
        });
    } else {
      dispatch(createCourierExport({ formData: submitData, confirm }));
      if (success) {
        handleReset();
      }
    }
  };

  //   useEffect(() => {
  //   if (success) {
  //     handleReset();
  //   }
  // }, [success]);

  const handleReset = () => {
    setFormData({
      quote_no: "",
      quotation_id: "",
      customer_id: "",
      export_type: "",
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
      chargeable_weight: "",
      package_count: "",
      final_total: "",
      items: [
        {
          item_name: "",
          item_quantity: "",
          rate: "",
          amount: "",
          hsn_code: "",
        },
      ],
    });
    dispatch(resetCourierExportState());
    dispatch(resetQuotationState());
    dispatch(clearSelectedCustomer());
  };

  const itemsTotal = formData.items.reduce((sum, item) => {
    const amount = Number(item.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  useEffect(() => {
    if (formData.export_type === "individual") {
      setFormData((prev) => ({
        ...prev,
        final_total: itemsTotal.toString(),
      }));
    }
  }, [itemsTotal, formData.export_type]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {mode === "edit" ? "Edit Export" : "Create Export"}
        </h1>

        <div className="flex gap-3">
          {/* VIEW QUOTATION */}
          {(formData.quotation_id || formData.quote_no) && (
            <Link
              href={
                formData.quotation_id
                  ? `/admin/quotation/view/${formData.quotation_id}`
                  : `/admin/quotation/view?quote_no=${formData.quote_no}`
              }
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Quotation
            </Link>
          )}

          {/* BACK BUTTON */}
          <Link
            href="/admin/shipments"
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
          >
            Back To Export List
          </Link>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Quotation & Booking */}
        <div className="grid grid-cols-3 gap-4">
          <select
            name="export_type"
            value={formData.export_type}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border"
          >
            <option value="">Select Export Type</option>
            <option value="corporate">Corporate</option>
            <option value="individual">Individual</option>
          </select>

          {/* Enter Quotation Number */}
          {formData.export_type !== "individual" && (
            <input
              type="text"
              name="quote_no"
              placeholder="Enter Quotation Number"
              value={formData.quote_no}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-100 border"
            />
          )}

          {/* Hidden Quotation ID */}
          <input
            type="hidden"
            name="quotation_id"
            value={formData.quotation_id}
          />

          <input
            type="date"
            name="booking_date"
            placeholder="Booking Date"
            value={formData.booking_date}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-100 border border-gray-200"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="font-semibold">Docx</label>

          <input
            type="checkbox"
            name="document_type"
            checked={formData.document_type === "document"}
            onChange={(e) =>
              setFormData({
                ...formData,
                document_type: e.target.checked ? "document" : "non-document",
              })
            }
            className="w-5 h-5"
          />
        </div>

        {/* Shipper Details */}
        <p className="font-semibold mt-4">Shipper Details :</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* SHIPPER NAME WITH AUTOCOMPLETE */}
          <div className="relative">
            <input
              type="text"
              name="shipper_name"
              placeholder="Shipper Name"
              value={customerSearch || formData.shipper_name}
              onChange={(e) => {
                handleChange(e);
                setCustomerSearch(e.target.value); // Update search input
              }}
              autoComplete="off"
              className="p-2 rounded bg-gray-100 border border-gray-200 w-full"
            />

            {/* AUTOCOMPLETE LIST */}
            {!formData.quote_no && filteredCustomers.length > 0 && (
              <ul className="absolute w-full bg-white border shadow-lg rounded max-h-40 overflow-y-auto z-20">
                {filteredCustomers.map((cust) => (
                  <li
                    key={cust.id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => selectCustomer(cust)}
                  >
                    {cust.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            type="text"
            name="shipper_mobile"
            placeholder="Shipper Mobile No."
            value={formData.shipper_mobile}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="email"
            name="shipper_email"
            placeholder="Shipper Email"
            value={formData.shipper_email}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2"
          />
          <input
            type="text"
            name="shipper_address"
            placeholder="Shipper Address"
            value={formData.shipper_address}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2"
          />
        </div>

        {/* Consignee Details */}
        <p className="font-semibold mt-4">Consignee Details :</p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <input
            type="text"
            name="consignee_name"
            placeholder="Consignee Name"
            value={formData.consignee_name}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="text"
            name="consignee_mobile"
            placeholder="Consignee Mobile No."
            value={formData.consignee_mobile}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="email"
            name="consignee_email"
            placeholder="Consignee Email"
            value={formData.consignee_email}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2"
          />
          <input
            type="text"
            name="consignee_address"
            placeholder="Consignee Address"
            value={formData.consignee_address}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200 col-span-2"
          />
        </div>

        {/* Delivery & Package */}
        <div className="grid grid-cols-3 gap-4 mt-2">
          <input
            type="text"
            name="place_of_delivery"
            placeholder="Place of Delivery"
            value={formData.place_of_delivery}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
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

          <input
            type="text"
            name="correspondence_number"
            placeholder="Correspondance No."
            value={formData.correspondence_number}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-2">
          <input
            type="number"
            name="length"
            placeholder="Length"
            value={formData.length}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="number"
            name="width"
            placeholder="Width"
            value={formData.width}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="number"
            name="height"
            placeholder="Height"
            value={formData.height}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="number"
            name="chargeable_weight"
            placeholder="Weight"
            value={formData.chargeable_weight}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="number"
            name="package_count"
            placeholder="Packages"
            value={formData.package_count}
            onChange={handleChange}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
          <input
            type="number"
            name="final_total"
            placeholder="Amount"
            value={
              formData.export_type === "individual"
                ? itemsTotal
                : formData.final_total
            }
            onChange={handleChange}
            readOnly={formData.export_type === "individual"}
            className="p-2 rounded bg-gray-100 border border-gray-200"
          />
        </div>

        {/* Items */}

        {!singleQuotation && (
          <>
            <p className="font-semibold mt-4">Items :</p>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-6 gap-4 mb-2 items-center"
              >
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
                  name="rate"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, e)}
                  className="p-2 rounded bg-gray-100 border border-gray-200"
                />

                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={item.amount}
                  readOnly
                  className="p-2 rounded bg-gray-100 border border-gray-200"
                />

                <input
                  type="text"
                  name="hsn_code"
                  placeholder="HSN Code"
                  value={item.hsn_code}
                  onChange={(e) => handleItemChange(index, e)}
                  className="p-2 rounded bg-gray-100 border border-gray-200"
                />

                <div className="flex gap-2">
                  {/* Reset */}
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = [...formData.items];
                      newItems[index] = {
                        item_name: "",
                        item_quantity: "",
                        rate: "",
                        amount: "",
                        hsn_code: "",
                      };
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="p-1 bg-yellow-400 rounded hover:bg-yellow-500"
                  >
                    <RefreshCw className="w-5 h-5 text-white" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1 bg-red-600 rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update Courier Export"
                : "Create Courier Export"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          {/* Add Item Button */}
          {!singleQuotation && (
            <>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-blue-700 text-white rounded mt-2"
              >
                Add Item
              </button>
            </>
          )}
        </div>
      </form>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          <p>{error}</p>
          {existingExports?.length > 0 && (
            <div className="mt-2">
              <p>Existing exports linked to this quotation:</p>
              <ul className="list-disc pl-5">
                {existingExports.map((exp) => (
                  <li key={exp.id}>
                    {exp.awb_number} - {exp.quote_no}
                  </li>
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
          {mode === "edit"
            ? "Courier export updated successfully!"
            : "Courier export created successfully!"}

          {mode !== "edit" && (
            <button
              className="ml-2 text-blue-600 underline"
              onClick={handleReset}
            >
              Create new
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateCourierExportPage;
