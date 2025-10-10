"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createQuotation,
  resetQuotationState,
} from "@/store/slices/quotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { useParams } from 'react-router-dom';

const Quotation = () => {
  const dispatch = useDispatch();
  const { quotationId } = useParams(); // if using react-router
  const isEditMode = !!quotationId;

  // Redux state
  const { list: customers = [] } = useSelector((state) => state.customers || {});
  const { loading, success, error, quotation } = useSelector(
    (state) => state.quotation || {}
  );
  const { user } = useSelector((state) => state.auth || {});

  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    quote_no: "", // backend-generated; will populate from response after create
    subject: "",
    customer_id: "",
    customer_name: "",
    agent_id: "",
    address: "",
    origin: "",
    destination: "",
    actual_weight: "",
    created_by: user?.id || "",
    created_by_name: user?.name || "Admin",
    packages: [
      { length: "", width: "", height: "", weight: "", volumetric_weight: "" },
    ],
    charges: [{ charge_name: "", type: "", amount: "", description: "" }],
  });

  // Customer autocomplete state
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // On mount: fetch customers and prefill created_by
  useEffect(() => {
    if (!mounted) return;
    dispatch(fetchCustomers());
    setFormData((prev) => ({
      ...prev,
      created_by: user?.id || null,        // ✅ always ID
      created_by_name: user?.name || "Admin", // ✅ UI string
    }));
  }, [dispatch, mounted, user]);

  // After successful creation: show returned quote_no and reset other fields
  useEffect(() => {
    if (success && submitted) {
      // If backend returns the created quotation with quote_no, show it
      const newQuoteNo = quotation?.quote_no || "";
      alert("Quotation created successfully ✅");

      // reset form but keep created_by; show the last created quote_no (read-only)
      setFormData({
        quote_no: newQuoteNo,
        subject: "",
        customer_id: "",
        customer_name: "",
        agent_id: "",
        address: "",
        origin: "",
        destination: "",
        actual_weight: "",
        created_by: user?.id || "",           // ✅ send to backend
        created_by_name: user?.name || "Admin", // ✅ show in UI
        packages: [
          {
            length: "",
            width: "",
            height: "",
            weight: "",
            volumetric_weight: "",
          },
        ],
        charges: [
          { charge_name: "", type: "", amount: "", description: "" },
        ],
      });

      dispatch(resetQuotationState());
    }
  }, [success, quotation, dispatch, user]);

  if (!mounted) return null; // prevents hydration mismatch

  // Generic field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Customer typing handler (autocomplete)
  const handleCustomerInput = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customer_name: value, customer_id: "" }));

    if (value.trim().length > 0) {
      const filtered = customers.filter((c) =>
        (c.name || "")
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCustomers([]);
      setShowSuggestions(false);
    }
  };

  // Select customer from suggestions
  const handleSelectCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: customer.name || "",
      customer_id: customer.id || "",
      // optionally prefill address/agent if present on customer
      address: customer.address || prev.address,
      agent_id: customer.agent_id || prev.agent_id,
    }));
    setShowSuggestions(false);
  };

  // Package change with volumetric weight calculation
  const handlePackageChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.packages];
    updated[index][name] = value;

    const L = parseFloat(updated[index].length);
    const W = parseFloat(updated[index].width);
    const H = parseFloat(updated[index].height);

    if (!isNaN(L) && !isNaN(W) && !isNaN(H) && L > 0 && W > 0 && H > 0) {
      // Common IATA divisor (cm → kg). Adjust if your business rule differs.
      const vol = (L * W * H) / 5000;
      updated[index].volumetric_weight = vol.toFixed(2);
    } else {
      updated[index].volumetric_weight = "";
    }

    setFormData((prev) => ({ ...prev, packages: updated }));
  };

  const addPackage = () => {
    setFormData((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        { length: "", width: "", height: "", weight: "", volumetric_weight: "" },
      ],
    }));
  };

  const removePackage = (index) => {
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  };

  // Charges change/add/remove
  const handleChargeChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.charges];
    updated[index][name] = value;
    setFormData((prev) => ({ ...prev, charges: updated }));
  };

  const addCharge = () => {
    setFormData((prev) => ({
      ...prev,
      charges: [
        ...prev.charges,
        { charge_name: "", type: "", amount: "", description: "" },
      ],
    }));
  };

  const removeCharge = (index) => {
    setFormData((prev) => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index),
    }));
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    dispatch(createQuotation(formData));
  };

  return (
    <div className="max-w-full mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 primaryText">Create Quotation</h2>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* Quote No (backend-generated; shown when available) */}
        <input
          type="text"
          name="quote_no"
          value={formData.quote_no}
          placeholder="Quote No (from backend)"
          className="form-input text-gray-700 bg-gray-100"
          readOnly
        />

        {/* Subject */}
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Subject"
          className="form-input text-gray-700"
          required
        />

        {/* Customer - Autocomplete Input */}
        <div className="relative col-span-1">
          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleCustomerInput}
            placeholder="Customer Name"
            className="form-input text-gray-700"
            autoComplete="off"
            required
          />
          {showSuggestions && filteredCustomers.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
              {filteredCustomers.map((c) => (
                <li
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="p-2 cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Agent */}
        <input
          type="text"
          name="agent_id"
          value={formData.agent_id}
          onChange={handleChange}
          placeholder="Agent ID"
          className="form-input text-gray-700"
        />

        {/* Address */}
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
          className="form-input col-span-1 text-gray-700"
        />

        {/* Origin */}
        <input
          type="text"
          name="origin"
          value={formData.origin}
          onChange={handleChange}
          placeholder="Origin"
          className="form-input text-gray-700"
        />

        {/* Destination */}
        <input
          type="text"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          placeholder="Destination"
          className="form-input text-gray-700"
        />

        {/* Actual Weight */}
        <input
          type="number"
          name="actual_weight"
          value={formData.actual_weight}
          onChange={handleChange}
          placeholder="Actual Weight"
          className="form-input text-gray-700"
        />

       {/* Display Name (UI only) */}
<input
  type="text"
  name="created_by_name"
  value={formData.created_by_name}
  className="form-input bg-gray-100 text-gray-700"
  readOnly
/>

{/* Hidden field to send actual ID to backend */}
<input
  type="hidden"
  name="created_by"
  value={formData.created_by}
/>


        {/* Packages */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Packages</h3>
            <button type="button" onClick={addPackage} className="text-blue-600">
              + Add Package
            </button>
          </div>

          {formData.packages.map((pkg, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-center">
              <input
                type="number"
                name="length"
                value={pkg.length}
                onChange={(e) => handlePackageChange(i, e)}
                placeholder="Length (cm)"
                className="form-input text-gray-700"
              />
              <input
                type="number"
                name="width"
                value={pkg.width}
                onChange={(e) => handlePackageChange(i, e)}
                placeholder="Width (cm)"
                className="form-input text-gray-700"
              />
              <input
                type="number"
                name="height"
                value={pkg.height}
                onChange={(e) => handlePackageChange(i, e)}
                placeholder="Height (cm)"
                className="form-input text-gray-700"
              />
              <input
                type="number"
                name="weight"
                value={pkg.weight}
                onChange={(e) => handlePackageChange(i, e)}
                placeholder="Actual Wt (kg)"
                className="form-input text-gray-700"
              />
              <input
                type="text"
                name="volumetric_weight"
                value={pkg.volumetric_weight}
                placeholder="Vol. Wt (kg)"
                className="form-input bg-gray-100 text-gray-700"
                readOnly
              />
              <div className="flex justify-end">
                {formData.packages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePackage(i)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charges */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Charges</h3>
            <button type="button" onClick={addCharge} className="text-blue-600">
              + Add Charge
            </button>
          </div>

          {formData.charges.map((chg, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-center">
              <input
                type="text"
                name="charge_name"
                value={chg.charge_name}
                onChange={(e) => handleChargeChange(i, e)}
                placeholder="Charge Name"
                className="form-input text-gray-700"
              />
              <input
                type="text"
                name="type"
                value={chg.type}
                onChange={(e) => handleChargeChange(i, e)}
                placeholder="Type"
                className="form-input text-gray-700"
              />
              <input
                type="number"
                name="amount"
                value={chg.amount}
                onChange={(e) => handleChargeChange(i, e)}
                placeholder="Amount"
                className="form-input text-gray-700"
              />
              <input
                type="text"
                name="description"
                value={chg.description}
                onChange={(e) => handleChargeChange(i, e)}
                placeholder="Description"
                className="form-input text-gray-700"
              />
              <div className="flex justify-end">
                {formData.charges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCharge(i)}
                    className="text-red-600 text-gray-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Create Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Quotation;
