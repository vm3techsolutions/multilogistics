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
import Swal from "sweetalert2";

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
    charges: [
      { charge_name: "Courier Charges", type: "freight", amount: 0, description: "" },
      { charge_name: "FSC", type: "freight", amount: 0, description: "" },
      { charge_name: "Demo", type: "freight", amount: 0, description: "" },
    ],
    destination_charges: [
      { charge_name: "Export Clearance Agency", type: "destination", amount: 0, description: "" },
    ],
  });

  useEffect(() => {
    // ✅ Clear any previously selected customer immediately when modal opens
    if (!isEditMode) {
      dispatch(clearSelectedCustomer());
    }
  }, [dispatch, isEditMode]);

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
        charges: [
          { charge_name: "Courier Charges", type: "freight", amount: 0, description: "" },
          { charge_name: "FSC", type: "freight", amount: 0, description: "" },
          { charge_name: "Demo", type: "freight", amount: 0, description: "" },
        ],
        destination_charges: [
          { charge_name: "Export Clearance Agency", type: "destination", amount: 0, description: "" },
        ],
      });

      // Clear selected customer globally
      dispatch(clearSelectedCustomer());
    }
  }, [isEditMode, dispatch, user]);


  useEffect(() => {
    dispatch(clearSelectedCustomer()); // ✅ clear first to avoid autofill
    dispatch(fetchCustomers()).then(() => setMounted(true));
    dispatch(getAgents());
  }, [dispatch]);


  // Populate existing quotation
  useEffect(() => {
    if (!existingQuotation) return;

    if (isEditMode && existingQuotation?.customer_id && customers.length > 0) {
      const customer = customers.find(c => c.id === existingQuotation.customer_id);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customer_id: customer.id,
          customer_name: customer.name,   // ✅ show name in input
          address: customer.address,
        }));
      }
    }

    if (isEditMode && existingQuotation?.agent_id && agents.length > 0) {
      const agent = agents.find(a => a.id === existingQuotation.agent_id);
      if (agent) {
        setFormData(prev => ({
          ...prev,
          agent_id: agent.id,
          agent_name: agent.name,
        }));
      }
    }

    setFormData((prev) => {
      // Prevent reloading same quote multiple times
      if (prev.quote_no === existingQuotation.quote_no) return prev;

      const freightCharges =
        existingQuotation.charges
          ?.filter((chg) => chg.type?.toLowerCase() === "freight")
          .map((chg) => ({
            charge_name: chg.charge_name || "",
            type: "freight",
            amount: chg.amount || 0,
            description: chg.description || "",
          })) || [];

      const destinationCharges =
        existingQuotation.charges
          ?.filter((chg) => chg.type?.toLowerCase() === "destination")
          .map((chg) => ({
            charge_name: chg.charge_name || "",
            type: "destination",
            amount: chg.amount || 0,
            description: chg.description || "",
          })) || [];

      // ✅ Deduplicate destination charges
      const uniqueDest = Array.from(
        new Map(
          destinationCharges.map((chg) => [
            `${chg.charge_name.toLowerCase()}_${chg.type.toLowerCase()}`,
            chg,
          ])
        ).values()
      );

      // ✅ Ensure at least one destination charge exists
      const finalDestination =
        uniqueDest.length > 0
          ? uniqueDest
          : [
            {
              charge_name: "Export Clearance Agency",
              type: "destination",
              amount: 0,
              description: "",
            },
          ];

      const updatedData = {
        ...prev,
        ...existingQuotation,
        packages:
          existingQuotation.packages?.map((pkg) => ({
            length: pkg.length || 0,
            width: pkg.width || 0,
            height: pkg.height || 0,
            weight: pkg.weight || 0,
            volumetric_weight: pkg.volumetric_weight || 0,
          })) || prev.packages,
        charges: freightCharges.length ? freightCharges : prev.charges,
        destination_charges: finalDestination,
      };

      return updatedData;
    });
  }, [isEditMode, existingQuotation, customers, agents]);

  // Update customer selection
  // Auto-fill when creating a new quotation
  useEffect(() => {
    if (
      selectedCustomer &&
      selectedCustomer.id &&
      !isEditMode &&
      formData.customer_name === "" &&
      formData.quote_no !== "" // optional: ensure form initialized
    ) {
      // Auto-fill only if customer manually selected
      setFormData(prev => ({
        ...prev,
        customer_name: selectedCustomer.name || "",
        customer_id: selectedCustomer.id || "",
        address: selectedCustomer.address || "",
        agent_id: selectedCustomer.agent_id || "",
      }));

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

  const handleDestinationChargeChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...(formData.destination_charges || [])];
    updated[index][name] =
      name === "amount" ? (value === "" ? "" : parseFloat(value)) : value;
    setFormData((prev) => ({ ...prev, destination_charges: updated }));
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Prepare packages
    const packagesPayload = formData.packages.map((pkg) => ({
      length: Number(pkg.length) || 0,
      width: Number(pkg.width) || 0,
      height: Number(pkg.height) || 0,
      weight: Number(pkg.weight) || 0,
      volumetric_weight: Number(pkg.volumetric_weight) || 0,
    }));

    // 🔹 Prepare charges (clean and distinct)
    const freightCharges = (formData.charges || []).map((chg) => ({
      charge_name: chg.charge_name || "",
      type: "freight",
      amount: Number(chg.amount) || 0,
      description: chg.description || "",
    }));

    const destinationCharges = (formData.destination_charges || []).map((chg) => ({
      charge_name: chg.charge_name || "",
      type: "destination",
      amount: Number(chg.amount) || 0,
      description: chg.description || "",
    }));

    // 🔹 Combine all charges freshly (no merging with old state)
    const allCharges = [...freightCharges, ...destinationCharges];

    // 🔹 Create payload
    const payload = {
      ...formData,
      packages: packagesPayload,
      charges: allCharges,
    };

    try {
      if (isEditMode) {
        // 🔹 Update existing quotation (avoid duplication)
        const resultAction = await dispatch(
          updateQuotation({ id: existingQuotation.id, data: payload })
        );

        if (updateQuotation.fulfilled.match(resultAction)) {

          const updatedQuotation = resultAction.payload;

          // ✅ Immediately update local state to reflect changes
          setFormData((prev) => ({
            ...prev,
            ...updatedQuotation,
            charges: updatedQuotation.charges?.filter((c) => c.type === "freight") || [],
            destination_charges:
              updatedQuotation.charges?.filter((c) => c.type === "destination") || [],
          }));

          // ✅ If you have parent update callback, call it
          onSuccess?.(updatedQuotation);

          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Quotation updated successfully ✅",
            timer: 2000,
            showConfirmButton: false,
          });
          onSuccess?.(resultAction.payload);
          onClose?.();
        } else {
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text:
              resultAction.payload?.message ||
              "Failed to update the quotation. Try again!",
          });
        }
      } else {
        // 🔹 Create new quotation
        const resultAction = await dispatch(createQuotation(payload));

        if (createQuotation.fulfilled.match(resultAction)) {

          const createdQuotation = resultAction.payload;

          // ✅ Update local state immediately for new entry
          setFormData(createdQuotation);
          onSuccess?.(createdQuotation);

          Swal.fire({
            icon: "success",
            title: "Created!",
            text: "Quotation created successfully ✅",
            timer: 2000,
            showConfirmButton: false,
          });
          // onSuccess?.(resultAction.payload);
          onClose?.();
        } else {
          // 🔸 Handle duplicate quotation or backend error
          const errMsg =
            resultAction.payload?.message ||
            resultAction.error?.message ||
            "Failed to create quotation";

          if (errMsg.toLowerCase().includes("already") || errMsg.includes("exists")) {
            Swal.fire({
              icon: "error",
              title: "Duplicate Quotation!",
              text:
                "A quotation with this number or details already exists. Please check before creating again.",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: errMsg,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error saving quotation:", err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error!",
        text: "Something went wrong while saving the quotation ❌",
      });
    }
  };



  if (!mounted) return null;

  const isMainFieldDisabled = isEditMode;

  return (
    <div className="max-w-full mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-700">
        {isEditMode ? "Edit Quotation" : "Create Quotation"}
      </h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-gray-700">
        {/* Quote No */}
        <div>
          <label className="block text-sm font-medium mb-1 ">Quote No</label>
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
            <button
              type="button"
              onClick={addPackage}
              className="text-blue-600"
            >
              + Add Package
            </button>
          </div>

          {formData.packages.map((pkg, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2">
              {["length", "width", "height", "weight"].map((f, idx) => {
                const placeholderMap = {
                  length: "Length (cm)",
                  width: "Width (cm)",
                  height: "Height (cm)",
                  weight: "Weight (kg)",
                };

                return (
                  <div key={idx}>
                    <label className="block text-sm font-medium mb-1 capitalize">
                      {f}
                    </label>
                    <input
                      type="number"
                      name={f}
                      value={pkg[f] || ""}
                      onChange={(e) => handlePackageChange(i, e)}
                      placeholder={placeholderMap[f]}
                      className="form-input"
                    />
                  </div>
                );
              })}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Vol. Weight
                </label>
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
        {/* <div className="col-span-2">
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
        </div> */}

        {/* Charges Section */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Freight Charges */}
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="font-semibold text-gray-700">Freight Charges</h4>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      charges: [
                        ...prev.charges,
                        { charge_name: "", type: "Freight", amount: 0, description: "" },
                      ],
                    }))
                  }
                  className="text-blue-600 text-sm"
                >
                  + Add
                </button>
              </div>

              {formData.charges.map((chg, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2 items-end">
                  <div>
                    {/* <label className="block text-sm font-medium mb-1">Charge Name</label> */}
                    <input
                      type="text"
                      name="charge_name"
                      value={chg.charge_name || ""}
                      onChange={(e) => handleChargeChange(i, e)}
                      className="form-input"
                      placeholder="Charge Name"
                    />
                  </div>
                  <div>
                    {/* <label className="block text-sm font-medium mb-1">Type</label> */}
                    <input
                      type="text"
                      name="type"
                      value={chg.type || ""}
                      onChange={(e) => handleChargeChange(i, e)}
                      className="form-input"
                      placeholder="Type"
                    />
                  </div>
                  <div>
                    {/* <label className="block text-sm font-medium mb-1">Amount</label> */}
                    <input
                      type="number"
                      name="amount"
                      value={chg.amount || 0}
                      onChange={(e) => handleChargeChange(i, e)}
                      className="form-input"
                    />
                  </div>
                  {/* <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={chg.description || ""}
              onChange={(e) => handleChargeChange(i, e)}
              className="form-input"
            />
          </div> */}

                  {/* Show delete only for rows added after first 3 */}
                  {i > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          charges: prev.charges.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column - Destination Charges */}
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="font-semibold text-gray-700">Destination Charges</h4>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      destination_charges: [
                        ...(prev.destination_charges || []),
                        {
                          charge_name: "",
                          type: "Destination",
                          amount: 0,
                          description: "",
                        },
                      ],
                    }))
                  }
                  className="text-blue-600 text-sm"
                >
                  + Add
                </button>
              </div>

              {(formData.destination_charges || []).map((chg, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2 items-end">
                  <div>
                    {/* <label className="block text-sm font-medium mb-1">Charge Name</label> */}
                    <input
                      type="text"
                      name="charge_name"
                      value={chg.charge_name || ""}
                      onChange={(e) => handleDestinationChargeChange(i, e)}
                      className="form-input"
                      placeholder="Charge Name"
                    />
                  </div>
                  <div>
                    {/* <label className="block text-sm font-medium mb-1">Type</label> */}
                    <input
                      type="text"
                      name="type"
                      value={chg.type || ""}
                      onChange={(e) => handleDestinationChargeChange(i, e)}
                      className="form-input"

                    />
                  </div>
                  <div>
                    {/* <label className="block text-sm font-medium mb-1">Amount</label> */}
                    <input
                      type="number"
                      name="amount"
                      value={chg.amount === 0 ? 0 : chg.amount || ""}
                      onChange={(e) => handleDestinationChargeChange(i, e)} // ✅ Correct handler
                      className="form-input"
                    />

                  </div>
                  {/* <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={chg.description || ""}
              onChange={(e) => handleDestinationChargeChange(i, e)}
              className="form-input"
            />
          </div> */}

                  {/* Show delete only for rows after first 3 */}
                  {i > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          destination_charges: prev.destination_charges.filter(
                            (_, idx) => idx !== i
                          ),
                        }))
                      }
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
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
