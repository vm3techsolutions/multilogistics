"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createQuotation,
  resetQuotationState,
  updateQuotation,
} from "@/store/slices/quotationSlice";
import { fetchCustomers, fetchCustomerById, clearSelectedCustomer  } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";

const Quotation = ({ existingQuotation = null, onClose }) => {
  const dispatch = useDispatch();
  const { list: customers = [], selectedCustomer } = useSelector(
    (state) => state.customers || {}
  );
  const { loading, success, error, lastCreated } = useSelector(
    (state) => state.quotation || {}
  );
  const { user } = useSelector((state) => state.auth || {});
  const { agents = [] } = useSelector((state) => state.agents || {});


  const isEditMode = !!existingQuotation;
  const [mounted, setMounted] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filteredAgents, setFilteredAgents] = useState([]);
const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);


  useEffect(() => setMounted(true), []);

  // Initialize form data
  const [formData, setFormData] = useState({
    quote_no: "",
    subject: "",
    customer_id: "",
    customer_name: "",
    agent_id: "",
    address: "",
    origin: "",
    destination: "",
    actual_weight: 0,
    created_by: user?.id || "",
    created_by_name: user?.name || "Admin",
    packages: [{ length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 }],
    charges: [{ charge_name: "", type: "", amount: 0, description: "" }],
  });

  // Fetch customers on mount
  useEffect(() => {
    if (!mounted) return;
    dispatch(clearSelectedCustomer()); 
    dispatch(fetchCustomers());
    dispatch(getAgents());
    setFormData((prev) => ({
      ...prev,
      created_by: user?.id || "",
      created_by_name: user?.name || "Admin",
    }));
  }, [dispatch, mounted, user]);

  // Prefill form when editing
  useEffect(() => {
    if (existingQuotation) {
      setFormData({
        quote_no: existingQuotation.quote_no || "",
        subject: existingQuotation.subject || "",
        customer_id: existingQuotation.customer_id || "",
        customer_name: existingQuotation.customer_name || "",
        agent_id: existingQuotation.agent_id || "",
        address: existingQuotation.address || "",
        origin: existingQuotation.origin || "",
        destination: existingQuotation.destination || "",
        actual_weight: existingQuotation.actual_weight || 0,
        created_by: existingQuotation.created_by || user?.id || "",
        created_by_name: existingQuotation.created_by_name || user?.name || "Admin",
        packages:
          existingQuotation.packages?.length > 0
            ? existingQuotation.packages.map((p) => ({
                length: p.length || 0,
                width: p.width || 0,
                height: p.height || 0,
                weight: p.weight || 0,
                volumetric_weight:
                  p.volumetric_weight ||
                  (p.length && p.width && p.height
                    ? ((p.length * p.width * p.height) / 5000).toFixed(2)
                    : 0),
              }))
            : [{ length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 }],
        charges:
          existingQuotation.charges?.length > 0
            ? existingQuotation.charges.map((c) => ({
                charge_name: c.charge_name || "",
                type: c.type || "",
                amount: c.amount || 0,
                description: c.description || "",
              }))
            : [{ charge_name: "", type: "", amount: 0, description: "" }],
      });

      if (existingQuotation.customer_id) {
        dispatch(fetchCustomerById(existingQuotation.customer_id));
      }
    }
  }, [existingQuotation, user, dispatch]);

   // ✅ Clear form when creating a new quotation
  useEffect(() => {
    if (mounted && !isEditMode) {
      setFormData({
        quote_no: "",
        subject: "",
        customer_id: "",
        customer_name: "",
        agent_id: "",
        address: "",
        origin: "",
        destination: "",
        actual_weight: 0,
        created_by: user?.id || "",
        created_by_name: user?.name || "Admin",
        packages: [{ length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 }],
        charges: [{ charge_name: "", type: "", amount: 0, description: "" }],
      });
      dispatch(clearSelectedCustomer());
    }
  }, [isEditMode, mounted, dispatch, user]);

  // Sync selected customer
  useEffect(() => {
    if (selectedCustomer?.id) {
      setFormData((prev) => ({
        ...prev,
        customer_name: selectedCustomer.name || prev.customer_name,
        address: selectedCustomer.address || prev.address,
        agent_id: selectedCustomer.agent_id || prev.agent_id,
        customer_id: selectedCustomer.id || prev.customer_id,
      }));
    }
  }, [selectedCustomer]);

  // Reset form after creation
  useEffect(() => {
    if (success && !isEditMode && lastCreated) {
      alert("Quotation created successfully ✅");
      setFormData({
        ...formData,
        quote_no: lastCreated.quote_no || "",
        subject: "",
        customer_id: "",
        customer_name: "",
        agent_id: "",
        address: "",
        origin: "",
        destination: "",
        actual_weight: 0,
        packages: [{ length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 }],
        charges: [{ charge_name: "", type: "", amount: 0, description: "" }],
      });
      dispatch(resetQuotationState());
    }
  }, [success, lastCreated, dispatch]);

  if (!mounted) return null;

  // ---------------- Input Handlers ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerInput = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customer_name: value, customer_id: "" }));

    if (value.trim()) {
      const filtered = customers.filter((c) =>
        (c.name || "").toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCustomers([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: customer.name || "",
      customer_id: customer.id || "",
      address: customer.address || "",
      agent_id: customer.agent_id || "",
    }));
    setShowSuggestions(false);
  };

  // ---------------- Packages Handlers ----------------
  const handlePackageChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.packages];
    updated[index][name] = parseFloat(value) || 0;

    const { length: L, width: W, height: H } = updated[index];
    updated[index].volumetric_weight =
      L && W && H ? parseFloat(((L * W * H) / 5000).toFixed(2)) : 0;

    setFormData((prev) => ({ ...prev, packages: updated }));
  };

  const addPackage = () =>
    setFormData((prev) => ({
      ...prev,
      packages: [...prev.packages, { length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 }],
    }));

  const removePackage = (index) =>
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));

  // ---------------- Charges Handlers ----------------
  const handleChargeChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.charges];
    updated[index][name] = name === "amount" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, charges: updated }));
  };

  const addCharge = () =>
    setFormData((prev) => ({
      ...prev,
      charges: [...prev.charges, { charge_name: "", type: "", amount: 0, description: "" }],
    }));

  const removeCharge = (index) =>
    setFormData((prev) => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index),
    }));

  // ---------------- Submit Handler ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData }; // already numeric fields converted
      if (isEditMode) {
        await dispatch(updateQuotation({ id: existingQuotation.id, data: payload }));
        alert("Quotation updated successfully ✅");
        onClose?.();
      } else {
        await dispatch(createQuotation(payload));
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  // ---------------- JSX ----------------
  return (
    <div className="max-w-full mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">{isEditMode ? "Edit Quotation" : "Create Quotation"}</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input type="text" name="quote_no" value={formData.quote_no} placeholder="Quote No" className="form-input bg-gray-100" readOnly />
        <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" className="form-input" required />

        <div className="relative">
          <input type="text" name="customer_name" value={formData.customer_name} onChange={handleCustomerInput} placeholder="Customer Name" className="form-input" autoComplete="off" required />
          {showSuggestions && filteredCustomers.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
              {filteredCustomers.map((c) => (
                <li key={c.id} onClick={() => handleSelectCustomer(c)} className="p-2 cursor-pointer hover:bg-gray-100">{c.name}</li>
              ))}
            </ul>
          )}
        </div>

        {/* <input type="text" name="agent_id" value={formData.agent_id} onChange={handleChange} placeholder="Agent ID" className="form-input" /> */}
        <div className="relative">
  <input
    type="text"
    name="agent_name"
    value={formData.agent_name || ""}
    onChange={(e) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, agent_name: value, agent_id: "" }));

      if (value.trim()) {
        const filtered = agents.filter((a) =>
          (a.name || "").toLowerCase().includes(value.toLowerCase())
        );
        setFilteredAgents(filtered);
        setShowAgentSuggestions(true);
      } else {
        setFilteredAgents([]);
        setShowAgentSuggestions(false);
      }
    }}
    placeholder="Agent Name"
    className="form-input"
    autoComplete="off"
  />
  {showAgentSuggestions && filteredAgents.length > 0 && (
    <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
      {filteredAgents.map((a) => (
        <li
          key={a.id}
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              agent_name: a.name,
              agent_id: a.id,
            }));
            setShowAgentSuggestions(false);
          }}
          className="p-2 cursor-pointer hover:bg-gray-100"
        >
          {a.name}
        </li>
      ))}
    </ul>
  )}
</div>


        <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="form-input" />
        <input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="Origin" className="form-input" />
        <input type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="Destination" className="form-input" />
        <input type="number" name="actual_weight" value={formData.actual_weight} onChange={handleChange} placeholder="Actual Weight" className="form-input" />
        <input type="text" name="created_by_name" value={formData.created_by_name} className="form-input bg-gray-100" readOnly />
        <input type="hidden" name="created_by" value={formData.created_by} />

        {/* Packages */}
        <div className="col-span-2">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">Packages</h3>
            <button type="button" onClick={addPackage} className="text-blue-600">+ Add Package</button>
          </div>
          {formData.packages.map((pkg, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2">
              {["length","width","height","weight"].map((field, idx) => (
                <input key={idx} type="number" name={field} value={pkg[field]} onChange={(e) => handlePackageChange(i, e)} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} className="form-input" />
              ))}
              <input type="text" name="volumetric_weight" value={pkg.volumetric_weight} placeholder="Vol. Wt" className="form-input bg-gray-100" readOnly />
              <div className="flex justify-end">
                {formData.packages.length > 1 && <button type="button" onClick={() => removePackage(i)} className="text-red-600">Remove</button>}
              </div>
            </div>
          ))}
        </div>

        {/* Charges */}
        <div className="col-span-2">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">Charges</h3>
            <button type="button" onClick={addCharge} className="text-blue-600">+ Add Charge</button>
          </div>
          {formData.charges.map((chg, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2">
              {["charge_name","type","amount","description"].map((field, idx) => (
                <input key={idx} type={field==="amount" ? "number" : "text"} name={field} value={chg[field]} onChange={(e) => handleChargeChange(i, e)} placeholder={field.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())} className="form-input" />
              ))}
              <div className="flex justify-end">
                {formData.charges.length > 1 && <button type="button" onClick={() => removeCharge(i)} className="text-red-600">Remove</button>}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="col-span-2 flex justify-end">
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
            {loading ? "Saving..." : isEditMode ? "Update Quotation" : "Create Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Quotation;
