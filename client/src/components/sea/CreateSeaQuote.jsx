"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createSeaQuotation,
  updateSeaQuotation,
  resetSeaQuotationState,
} from "@/store/slices/seaQuotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";

export default function CreateSeaQuote({
  mode = "create", // create | edit
  initialData = null,
  onSuccess,
  onClose,
}) {
  const dispatch = useDispatch();

  const { loading, success, error } = useSelector(
    (state) => state.seaQuotation,
  );
  const { list: customers = [] } = useSelector((state) => state.customers);
  const { agents = [] } = useSelector((state) => state.agents);
  const { id: created_by } = useSelector((state) => state.auth);

  const [currency, setCurrency] = useState("USD");

  const [shipmentMode, setShipmentMode] = useState("LCL");

  /* ================= BASIC ================= */
  const [subject, setSubject] = useState("");
  const [customer_id, setCustomerId] = useState("");
  const [agent_id, setAgentId] = useState("");
  const [address, setAddress] = useState("");
  const [attention, setAttention] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [actual_weight, setActualWeight] = useState("");
  const [exchange_rate, setExchangeRate] = useState("");

  /* ================= CUSTOMER SEARCH ================= */
  const [searchCustomer, setSearchCustomer] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const customerRef = useRef(null);

  /* ================= AGENT SEARCH ================= */
  const [searchAgent, setSearchAgent] = useState("");
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const agentRef = useRef(null);

  /* ================= PACKAGES ================= */
  const [packages, setPackages] = useState([]);
  const [showPackages, setShowPackages] = useState(false);

  const toNum = (v) => (Number(v) > 0 ? Number(v) : 0);

  /* -------- SEA CBM -------- */
  const totalCBM = useMemo(() => {
    return packages.reduce((t, p) => {
      const cbm =
        (toNum(p.length) *
          toNum(p.width) *
          toNum(p.height) *
          toNum(p.same_size)) /
        1000000;
      return t + cbm;
    }, 0);
  }, [packages]);

  const cbmWeightKg = useMemo(() => totalCBM * 1000, [totalCBM]);

  /* ================= CHARGES ================= */
  const [charges, setCharges] = useState([
    {
      id: 1,
      charge_name: "Ocean Freight",
      type: "freight",
      rate_per_kg: "",
      currency: "USD",
      isDefault: true,
    },
    {
      id: 2,
      charge_name: "Regulatory Filing",
      type: "freight",
      rate_per_kg: "",
      currency: "USD",
      isDefault: true,
    },
    {
      id: 3,
      charge_name: "B/L",
      type: "origin",
      amount: "",
      isDefault: true,
    },
    {
      id: 4,
      charge_name: "THC",
      type: "origin",
      amount: "",
      isDefault: true,
    },
    {
      id: 5,
      charge_name: "EX Work Charges",
      type: "origin",
      amount: "",
      isDefault: true,
    },
    {
      id: 6,
      charge_name: "Certificate Charges",
      type: "origin",
      amount: "",
      isDefault: true,
    },
    {
      id: 7,
      charge_name: "Any incedential Charges",
      type: "origin",
      amount: "",
      isDefault: true,
    },
    {
      id: 8,
      charge_name: "CFS Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 9,
      charge_name: "THC",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 10,
      charge_name: "Union Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 11,
      charge_name: "Documentation Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 12,
      charge_name: "Passing Charges/Examine",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 13,
      charge_name: "Forklift Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 14,
      charge_name: "D.O Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 15,
      charge_name: "Agency Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 16,
      charge_name: "Passing Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 17,
      charge_name: "BL Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 18,
      charge_name: "Transport Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
  ]);

  /* ================= FETCH ================= */
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  /* ================= EDIT PREFILL ================= */
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setSubject(initialData.subject || "");
      setShipmentMode(initialData.mode || "LCL");
      setCustomerId(initialData.customer_id || "");
      setAgentId(initialData.agent_id || "");
      setAddress(initialData.address || "");
      setAttention(initialData.attention || "");
      setPol(initialData.pol || "");
      setPod(initialData.pod || "");
      setIncoterms(initialData.incoterms || "");
      setActualWeight(initialData.actual_weight || "");
      setCurrency(initialData.currency || "USD");
      setExchangeRate(initialData.exchange_rate || "");

      setSearchCustomer(initialData.customer_name || "");
      setSearchAgent(initialData.agent_name || "");

      setPackages(initialData.packages || []);
      setShowPackages(initialData.packages?.length > 0);

      setCharges(
        initialData.charges?.map((c) => ({
          id: Date.now() + Math.random(),
          charge_name: c.charge_name,
          type: c.type,
          rate_per_kg: c.rate_per_kg ?? "",
          amount: c.amount ?? "",
          currency: c.currency || "USD",
          isDefault: true,
        })) || [],
      );
    }
  }, [mode, initialData]);

  /* ================= FILTER ================= */
  useEffect(() => {
    if (!searchCustomer.trim()) return setCustomerSuggestions([]);
    setCustomerSuggestions(
      customers.filter((c) =>
        c.name?.toLowerCase().includes(searchCustomer.toLowerCase()),
      ),
    );
  }, [searchCustomer, customers]);

  useEffect(() => {
    if (!searchAgent.trim()) return setAgentSuggestions([]);
    setAgentSuggestions(
      agents.filter((a) =>
        a.name?.toLowerCase().includes(searchAgent.toLowerCase()),
      ),
    );
  }, [searchAgent, agents]);

  /* ================= PACKAGES ================= */
  const addPackage = () => {
    setShowPackages(true);
    setPackages((p) => [
      ...p,
      { length: "", width: "", height: "", same_size: 1 },
    ]);
  };

  const updatePackage = (i, k, v) => {
    const arr = [...packages];
    arr[i][k] = v;
    setPackages(arr);
  };

  const removePackage = (i) =>
    setPackages(packages.filter((_, idx) => idx !== i));

  /* ================= CHARGES ================= */
  const handleChargeChange = (id, key, value) => {
    setCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
    );
  };

  const addCharge = (type) => {
    setCharges((prev) => [
      ...prev,
      {
        id: Date.now(),
        charge_name: "",
        type,
        rate_per_kg: "",
        amount: "",
        currency: type === "freight" ? "USD" : "INR",
        isDefault: false,
      },
    ]);
  };

  const removeCharge = (id) =>
    setCharges((prev) => prev.filter((c) => c.id !== id));

  /* ================= SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!customer_id || !agent_id || !created_by) {
      alert("Customer, Agent & Login required");
      return;
    }

    const payload = {
      subject,
      mode: shipmentMode,
      customer_id: Number(customer_id),
      agent_id: Number(agent_id),
      address,
      attention,
      pol,
      pod,
      incoterms,
      actual_weight: Number(actual_weight),
      exchange_rate: Number(exchange_rate),
      created_by: Number(created_by),

      packages: packages.map((p) => ({
        length: Number(p.length),
        width: Number(p.width),
        height: Number(p.height),
        same_size: Number(p.same_size),
      })),

      charges: charges.map((c) => ({
        charge_name: c.charge_name,
        type: c.type,
        currency: c.currency,
        ...(c.type === "freight"
          ? { rate_per_kg: Number(c.rate_per_kg) }
          : { amount: Number(c.amount) }),
      })),
    };

    if (mode === "edit") {
      dispatch(updateSeaQuotation({ id: initialData.id, payload }));
    } else {
      dispatch(createSeaQuotation(payload));
    }
  };

  /* ================= SUCCESS ================= */
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(resetSeaQuotationState());
        onSuccess?.();
        if (mode === "edit") onClose?.();
      }, 1500);
    }
  }, [success]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handler = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target))
        setCustomerSuggestions([]);
      if (agentRef.current && !agentRef.current.contains(e.target))
        setAgentSuggestions([]);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* ================= UI ================= */
  return (
    <div className="px-6 max-w-6xl mx-auto mt-10">
      <h2 className="text-base font-medium mb-4">
        {mode === "edit" ? "Edit Sea Quotation" : "Create Sea Quotation"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Subject */}
  <div className="md:col-span-3">
    <input
      className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
      placeholder="Subject"
    />
  </div>

  {/* Shipment Mode */}
  <div>
    <select
      className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
      value={shipmentMode}
      onChange={(e) => setShipmentMode(e.target.value)}
    >
      <option value="LCL">LCL</option>
      <option value="FCL">FCL</option>
      <option value="20GP">20 GP</option>
      <option value="40GP">40 GP</option>
      <option value="40HC">40 HC</option>
      <option value="FLAT_RACK">Flat Rack</option>
    </select>
  </div>
</div>
        
        {/* ================= CUSTOMER + AGENT ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CUSTOMER */}
          <div className="md:col-span-2 relative" ref={customerRef}>
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
              value={searchCustomer}
              onChange={(e) => {
                setSearchCustomer(e.target.value);
                setCustomerId(""); // 🔥 reset selected ID
              }}
              placeholder="Customer Name"
            />

            {customerSuggestions.length > 0 && (
              <ul className="absolute bg-white border w-full z-50 rounded-md max-h-60 overflow-auto">
                {customerSuggestions.map((c) => (
                  <li
                    key={c.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setCustomerId(c.id);
                      setSearchCustomer(c.name);
                      setAddress(c.address || "");
                      setCustomerSuggestions([]);
                    }}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AGENT */}
          <div className="relative" ref={agentRef}>
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
              value={searchAgent}
              onChange={(e) => {
                setSearchAgent(e.target.value);
                setAgentId(""); // 🔥 reset selected ID
              }}
              placeholder="Agent Name"
            />

            {agentSuggestions.length > 0 && (
              <ul className="absolute bg-white border w-full z-50 rounded-md max-h-60 overflow-auto">
                {agentSuggestions.map((a) => (
                  <li
                    key={a.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setAgentId(a.id);
                      setSearchAgent(a.name);
                      setAgentSuggestions([]);
                    }}
                  >
                    {a.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ================= ADDRESS ================= */}
        <textarea
          className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
        />

        {/* POL / POD */}
        <div className="grid grid-cols-4 gap-4">
          <input
            className="bg-[#F3F9FF] rounded-lg py-2 px-3"
            value={pol}
            onChange={(e) => setPol(e.target.value)}
            placeholder="POL"
          />
          <input
            className="bg-[#F3F9FF] rounded-lg py-2 px-3"
            value={pod}
            onChange={(e) => setPod(e.target.value)}
            placeholder="POD"
          />
          <input
            className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
            value={attention}
            onChange={(e) => setAttention(e.target.value)}
            placeholder="Attention"
          />
          <input
            className="bg-[#F3F9FF] rounded-lg py-2 px-3"
            value={incoterms}
            onChange={(e) => setIncoterms(e.target.value)}
            placeholder="Incoterms"
          />
        </div>

        {/* ================= WEIGHT + CURRENCY ================= */}
<div className="grid grid-cols-5 gap-4">
  {/* Actual Weight */}
  <input
    className="bg-[#F3F9FF] rounded-lg py-2 px-3"
    value={actual_weight}
    onChange={(e) => setActualWeight(e.target.value)}
    placeholder="Actual Weight (KG)"
  />

  {/* CBM Weight (Readonly) */}
  <input
    disabled
    value={` ${totalCBM.toFixed(2)} (${cbmWeightKg.toFixed(2)} kg)`}
    className="bg-[#F3F9FF] rounded-lg py-2 px-3"
    placeholder="CBM "
  />

  {/* Currency */}
  <select
    className="bg-[#F3F9FF] rounded-lg py-2 px-3"
    value={currency}
    onChange={(e) => setCurrency(e.target.value)}
  >
    <option value="USD">USD</option>
    <option value="EUR">EURO</option>
    <option value="GBP">GBP</option>
  </select>

  {/* Exchange Rate */}
  <input
    className="bg-[#F3F9FF] rounded-lg py-2 px-3"
    value={exchange_rate}
    onChange={(e) => setExchangeRate(e.target.value)}
    placeholder={`${currency} → INR Rate`}
  />

  {/* Packages */}
  <button
    type="button"
    onClick={addPackage}
    className="bg-[#0A3A5F] text-white rounded-md px-4 py-2"
  >
    Add Packages
  </button>
</div>

{/* PACKAGES */}
          {showPackages &&
            packages.map((pkg, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-lg shadow-sm"
              >
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.length}
                  onChange={(e) => updatePackage(i, "length", e.target.value)}
                  placeholder="Length"
                />
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.width}
                  onChange={(e) => updatePackage(i, "width", e.target.value)}
                  placeholder="Width"
                />
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.height}
                  onChange={(e) => updatePackage(i, "height", e.target.value)}
                  placeholder="Height"
                />
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.same_size}
                  onChange={(e) =>
                    updatePackage(i, "same_size", e.target.value)
                  }
                  placeholder="Qty"
                />
                <button
                  className="bg-red-500 text-white rounded-md px-3 py-2"
                  onClick={() => removePackage(i)}
                >
                  Remove
                </button>
              </div>
            ))}

        {/* =================OCEAN FREIGHT CHARGES ================= */}
        <h3 className="font-semibold text-base mt-6">Freight Charges</h3>

        {charges
          .filter((c) => c.type === "freight")
          .map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm"
            >
              <input
                className="bg-[#F3F9FF] rounded-lg py-2 px-3 md:col-span-2"
                value={item.charge_name}
                disabled={item.isDefault}
                placeholder="Charge Name"
                onChange={(e) =>
                  handleChargeChange(item.id, "charge_name", e.target.value)
                }
              />

              <input
                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                value={item.rate_per_kg}
                onChange={(e) =>
                  handleChargeChange(item.id, "rate_per_kg", e.target.value)
                }
                placeholder={`Rate (${currency})`}
              />

              {!item.isDefault && (
                <button
                  type="button"
                  className="bg-red-500 text-white rounded-md px-3 py-2"
                  onClick={() => removeCharge(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

        <button
          type="button"
          onClick={() => addCharge("freight")}
          className="bg-[#0A3A5F] text-white px-4 py-2 rounded-md text-sm mt-2"
        >
          + Add Freight Charge
        </button>

        {/* ================= ORIGIN CHARGES ================= */}
        <h3 className="font-semibold text-base mt-6">Origin Charges</h3>

        {charges
          .filter((c) => c.type === "origin")
          .map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm"
            >
              <input
                className="bg-[#F3F9FF] rounded-lg py-2 px-3 md:col-span-2"
                value={item.charge_name}
                disabled={item.isDefault}
                onChange={(e) =>
                  handleChargeChange(item.id, "charge_name", e.target.value)
                }
                placeholder="Charge Name"
              />

              <input
                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                value={item.amount}
                onChange={(e) =>
                  handleChargeChange(item.id, "amount", e.target.value)
                }
                placeholder="Amount (INR)"
              />

              {!item.isDefault && (
                <button
                  type="button"
                  className="bg-red-500 text-white rounded-md px-3 py-2"
                  onClick={() => removeCharge(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

        <button
          type="button"
          onClick={() => addCharge("origin")}
          className="bg-[#0A3A5F] text-white px-4 py-2 rounded-md text-sm mt-2"
        >
          + Add Origin Charge
        </button>

        {/* ================= DESTINATION CHARGES ================= */}
        <h3 className="font-semibold text-base mt-6">Destination Charges</h3>

        {charges
          .filter((c) => c.type === "destination")
          .map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm"
            >
              <input
                className="bg-[#F3F9FF] rounded-lg py-2 px-3 md:col-span-2"
                value={item.charge_name}
                disabled={item.isDefault}
                onChange={(e) =>
                  handleChargeChange(item.id, "charge_name", e.target.value)
                }
                placeholder="Charge Name"
              />

              <input
                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                value={item.amount}
                onChange={(e) =>
                  handleChargeChange(item.id, "amount", e.target.value)
                }
                placeholder="Amount (INR)"
              />

              {!item.isDefault && (
                <button
                  type="button"
                  className="bg-red-500 text-white rounded-md px-3 py-2"
                  onClick={() => removeCharge(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

        <button
          type="button"
          onClick={() => addCharge("destination")}
          className="bg-[#0A3A5F] text-white px-4 py-2 rounded-md text-sm mt-2"
        >
          + Add Destination Charge
        </button>

        {/* SUBMIT */}
        <div className="flex justify-center gap-3">
          <button
            disabled={loading}
            className="bg-[#0A3A5F] text-white px-6 py-2 rounded-md"
          >
            {loading ? "Saving..." : "Save Quotation"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 px-6 py-2 rounded-md"
          >
            Close
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center">{error.message || "Error"}</p>
        )}
      </form>
    </div>
  );
}
