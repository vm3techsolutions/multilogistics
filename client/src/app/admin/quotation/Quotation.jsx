"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createQuotation,
  resetQuotationState,
  updateQuotation,
} from "@/store/slices/quotationSlice";
import {
  fetchCustomers,
  fetchCustomerById,
  clearSelectedCustomer,
} from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import { toast } from "react-toastify";

const Quotation = ({ existingQuotation = null, onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const { list: customers = [], selectedCustomer } = useSelector(
    (state) => state.customers || {}
  );
  const { loading, success, error } = useSelector(
    (state) => state.quotation || {}
  );
  const { user } = useSelector((state) => state.auth || {});
  const { agents = [] } = useSelector((state) => state.agents || {});

  const isEditMode = !!existingQuotation;
  const [mounted, setMounted] = useState(false);

  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    quote_no: "",
    subject: "",
    customer_id: "",
    customer_name: "",
    agent_id: "",
    agent_name: "",
    address: "",
    origin: "",
    destination: "",
    actual_weight: 0,
    created_by: user?.id || "",
    created_by_name: user?.name || "Admin",
    packages: [
      { length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 },
    ],
    charges: [{ charge_name: "", type: "", amount: 0, description: "" }],
  });

  // Mounting
  useEffect(() => setMounted(true), []);

  // ✅ Ensure blank form when creating new quotation
useEffect(() => {
  if (!isEditMode) {
    setFormData({
      quote_no: "",
      subject: "",
      customer_id: "",
      customer_name: "",
      agent_id: "",
      agent_name: "",
      address: "",
      origin: "",
      destination: "",
      actual_weight: 0,
      created_by: user?.id || "",
      created_by_name: user?.name || "Admin",
      packages: [
        { length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 },
      ],
      charges: [{ charge_name: "", type: "", amount: 0, description: "" }],
    });

    // Clear selected customer globally
    dispatch(clearSelectedCustomer());
  }
}, [isEditMode, dispatch, user]);


  useEffect(() => {
    if (!mounted) return;
    dispatch(clearSelectedCustomer());
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch, mounted]);

  // Populate existing quotation
  useEffect(() => {
    if (existingQuotation && formData.quote_no === "") {
      const updatedData = {
        ...formData,
        ...existingQuotation,
        packages:
          existingQuotation.packages?.length > 0
            ? existingQuotation.packages.map((pkg) => ({
                length: pkg.length || 0,
                width: pkg.width || 0,
                height: pkg.height || 0,
                weight: pkg.weight || 0,
                volumetric_weight: pkg.volumetric_weight || 0,
              }))
            : formData.packages,
        charges:
          existingQuotation.charges?.length > 0
            ? existingQuotation.charges.map((chg) => ({
                charge_name: chg.charge_name || "",
                type: chg.type || "",
                amount: chg.amount || 0,
                description: chg.description || "",
              }))
            : formData.charges,
        actual_weight: existingQuotation.actual_weight || 0,
        customer_name: "",
        agent_name: "",
      };

      // Fetch customer info if needed
      if (existingQuotation.customer_id) {
        const customer = customers.find(
          (c) => c.id === existingQuotation.customer_id
        );
        if (customer) {
          updatedData.customer_name = customer.name || "";
          updatedData.address = customer.address || "";
        } else {
          dispatch(fetchCustomerById(existingQuotation.customer_id));
        }
      }

      // Fetch agent info if needed
      if (existingQuotation.agent_id) {
        const agent = agents.find((a) => a.id === existingQuotation.agent_id);
        if (agent) updatedData.agent_name = agent.name || "";
      }

      setFormData(updatedData);
    }
  }, [existingQuotation, customers, agents]);

  // Update customer selection
  // Auto-fill when creating a new quotation
useEffect(() => {
  if (selectedCustomer && !existingQuotation && selectedCustomer.id) {
    setFormData(prev => ({
      ...prev,
      customer_name: selectedCustomer.name || "",
      customer_id: selectedCustomer.id || "",
      address: selectedCustomer.address || "",
      agent_id: selectedCustomer.agent_id || "",
    }));

    // Auto-fill agent name if agent exists
    const agent = agents.find(a => a.id === selectedCustomer.agent_id);
    if (agent) {
      setFormData(prev => ({
        ...prev,
        agent_name: agent.name || "",
      }));
    }
  }
}, [selectedCustomer, agents, existingQuotation]);


  // Generic input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        e.target.type === "number" ? parseFloat(value) || 0 : value || "",
    }));
  };

  // Customer input
 const handleCustomerInput = (e) => {
  const value = e.target.value || "";
  setFormData((prev) => ({ ...prev, customer_name: value, customer_id: "" }));

  if (value.trim()) {
    const filtered = customers.filter((c) =>
      c.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setShowCustomerSuggestions(true);
  } else {
    setFilteredCustomers([]);
    setShowCustomerSuggestions(false);
  }
};

const handleSelectCustomer = (customer) => {
  setFormData((prev) => ({
    ...prev,
    customer_name: customer.name,
    customer_id: customer.id,
    address: customer.address,
    agent_id: customer.agent_id,
  }));

  // Auto-fill agent if exists
  const agent = agents.find((a) => a.id === customer.agent_id);
  if (agent) setFormData((prev) => ({ ...prev, agent_name: agent.name }));

  setShowCustomerSuggestions(false);
};



  // Agent input
  const handleAgentInput = (e) => {
    const value = e.target.value || "";
    setFormData((prev) => ({ ...prev, agent_name: value, agent_id: "" }));

    if (value.trim()) {
      const filtered = agents.filter((a) =>
        a.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAgents(filtered);
      setShowAgentSuggestions(true);
    } else {
      setFilteredAgents([]);
      setShowAgentSuggestions(false);
    }
  };

  const handleSelectAgent = (agent) => {
  setFormData(prev => ({
    ...prev,
    agent_name: agent.name || "",
    agent_id: agent.id || "",
  }));
  setShowAgentSuggestions(false);
};


  // Package handlers
  const handlePackageChange = (index, e) => {
    const { name, value } = e.target;
    const updated = formData.packages.map((pkg, i) =>
      i === index
        ? {
            ...pkg,
            [name]: parseFloat(value) || 0,
            volumetric_weight:
              ["length", "width", "height"].includes(name)
                ? parseFloat(
                    (
                      ((name === "length"
                        ? parseFloat(value)
                        : pkg.length) *
                        (name === "width" ? parseFloat(value) : pkg.width) *
                        (name === "height" ? parseFloat(value) : pkg.height)) /
                      5000
                    ).toFixed(2)
                  )
                : pkg.volumetric_weight,
          }
        : pkg
    );
    setFormData((prev) => ({ ...prev, packages: updated }));
  };

  const addPackage = () =>
    setFormData((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        { length: 0, width: 0, height: 0, weight: 0, volumetric_weight: 0 },
      ],
    }));

  const removePackage = (index) =>
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));

  // Charges handlers
  const handleChargeChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.charges];
    updated[index][name] = name === "amount" ? parseFloat(value) || 0 : value || "";
    setFormData((prev) => ({ ...prev, charges: updated }));
  };

  const addCharge = () =>
    setFormData((prev) => ({
      ...prev,
      charges: [
        ...prev.charges,
        { charge_name: "", type: "", amount: 0, description: "" },
      ],
    }));

  const removeCharge = (index) =>
    setFormData((prev) => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index),
    }));

  // Submit
  // Submit
const handleSubmit = async (e) => {
  e.preventDefault();

  // Map packages
  const packagesPayload = formData.packages.map((pkg) => ({
    length: Number(pkg.length) || 0,
    width: Number(pkg.width) || 0,
    height: Number(pkg.height) || 0,
    weight: Number(pkg.weight) || 0,
    volumetric_weight: Number(pkg.volumetric_weight) || 0,
  }));

  // Map charges
  const chargesPayload = formData.charges.map((chg) => ({
    charge_name: chg.charge_name || "",
    type: chg.type || "",
    amount: Number(chg.amount) || 0,
    description: chg.description || "",
  }));

  const payload = {
    packages: packagesPayload,
    charges: chargesPayload,
  };

  try {
    if (isEditMode) {
      const resultAction = await dispatch(
        updateQuotation({ id: existingQuotation.id, data: payload })
      );

      if (updateQuotation.fulfilled.match(resultAction)) {
  // ✅ Call onSuccess callback if provided
  if (onSuccess) {
    await onSuccess(updatedQuotation); // Pass updated quotation
  } else {
    // fallback
    setFormData((prev) => ({
      ...prev,
      status: "draft",
    }));
    toast.success("Quotation updated successfully ✅");
    onClose?.();
  }
} else {
  const errMsg = resultAction.payload?.message || "Failed to update quotation";
  toast.error(errMsg);
}

    } else {
      // For creation, send full formData
      const creationPayload = {
        ...formData,
        packages: packagesPayload,
        charges: chargesPayload,
      };
      await dispatch(createQuotation(creationPayload));
      alert("Quotation created successfully ✅");
    }
  } catch (err) {
    console.error("Error saving quotation:", err);
    alert("Something went wrong! ❌");
  }
};


  if (!mounted) return null;

  const isMainFieldDisabled = isEditMode;

  return (
    <div className="max-w-full mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">
        {isEditMode ? "Edit Quotation" : "Create Quotation"}
      </h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* Quote No */}
        <div>
          <label className="block text-sm font-medium mb-1">Quote No</label>
          <input
            type="text"
            name="quote_no"
            value={formData.quote_no || ""}
            className="form-input bg-gray-100"
            readOnly
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject || ""}
            onChange={handleChange}
            className="form-input"
            disabled={isMainFieldDisabled}
            required
          />
        </div>

        {/* Customer */}
        {/* Customer */}
<div className="relative">
  <label className="block text-sm font-medium mb-1">Customer Name</label>
  <input
    type="text"
    name="customer_name"
    value={formData.customer_name || ""}
    onChange={handleCustomerInput}
    className="form-input"
    disabled={isMainFieldDisabled}
    required
    autoComplete="off"
  />
  {showCustomerSuggestions && filteredCustomers.length > 0 && (
    <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-auto mt-1 rounded shadow">
      {filteredCustomers.map((c) => (
        <li
          key={c.id}
          onClick={() => handleSelectCustomer(c)}
          className="p-2 hover:bg-gray-100 cursor-pointer"
        >
          {c.name}
        </li>
      ))}
    </ul>
  )}
</div>

{/* Agent */}
<div className="relative">
  <label className="block text-sm font-medium mb-1">Agent Name</label>
  <input
    type="text"
    name="agent_name"
    value={formData.agent_name || ""}
    onChange={handleAgentInput}
    className="form-input"
    disabled={isMainFieldDisabled}
    autoComplete="off"
  />
  {showAgentSuggestions && filteredAgents.length > 0 && (
    <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-auto mt-1 rounded shadow">
      {filteredAgents.map((a) => (
        <li
          key={a.id}
          onClick={() => handleSelectAgent(a)}
          className="p-2 hover:bg-gray-100 cursor-pointer"
        >
          {a.name}
        </li>
      ))}
    </ul>
  )}
</div>


        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className="form-input"
            disabled={isMainFieldDisabled}
          />
        </div>

        {/* Origin */}
        <div>
          <label className="block text-sm font-medium mb-1">Origin</label>
          <input
            type="text"
            name="origin"
            value={formData.origin || ""}
            onChange={handleChange}
            className="form-input"
            disabled={isMainFieldDisabled}
          />
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input
            type="text"
            name="destination"
            value={formData.destination || ""}
            onChange={handleChange}
            className="form-input"
            disabled={isMainFieldDisabled}
          />
        </div>

        {/* Actual Weight */}
        <div>
          <label className="block text-sm font-medium mb-1">Actual Weight</label>
          <input
            type="number"
            name="actual_weight"
            value={formData.actual_weight || 0}
            onChange={handleChange}
            className="form-input"
            disabled={isMainFieldDisabled}
          />
        </div>

        {/* Created By */}
        <div>
          <label className="block text-sm font-medium mb-1">Created By</label>
          <input
            type="text"
            name="created_by_name"
            value={formData.created_by_name || ""}
            className="form-input bg-gray-100"
            readOnly
          />
        </div>

        {/* Packages */}
        <div className="col-span-2">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">Packages</h3>
            <button type="button" onClick={addPackage} className="text-blue-600">
              + Add Package
            </button>
          </div>
          {formData.packages.map((pkg, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2">
              {["length", "width", "height", "weight"].map((f, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium mb-1 capitalize">{f}</label>
                  <input
                    type="number"
                    name={f}
                    value={pkg[f] || 0}
                    onChange={(e) => handlePackageChange(i, e)}
                    className="form-input"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Vol. Weight</label>
                <input
                  type="text"
                  name="volumetric_weight"
                  value={pkg.volumetric_weight || 0}
                  className="form-input bg-gray-100"
                  readOnly
                />
              </div>
              {formData.packages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePackage(i)}
                  className="text-red-600 self-end"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Charges */}
        <div className="col-span-2">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">Charges</h3>
            <button type="button" onClick={addCharge} className="text-blue-600">
              + Add Charge
            </button>
          </div>
          {formData.charges.map((chg, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2">
              {["charge_name", "type", "amount", "description"].map((f, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {f.replace("_", " ")}
                  </label>
                  <input
                    type={f === "amount" ? "number" : "text"}
                    name={f}
                    value={chg[f] || (f === "amount" ? 0 : "")}
                    onChange={(e) => handleChargeChange(i, e)}
                    className="form-input"
                  />
                </div>
              ))}
              {formData.charges.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCharge(i)}
                  className="text-red-600 self-end"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="col-span-2 flex justify-end mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : isEditMode ? "Update Quotation" : "Create Quotation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Quotation;
