"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCargoQuotation,
  updateCargoQuotation,
  resetCargoQuotationState,
} from "@/store/slices/cargoQuotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";

export default function CreateCargoQuote({
  mode = "create", // "create" | "edit"
  initialData = null, // cargo quotation object (edit only)
  onSuccess,
  onClose,
}) {
  const dispatch = useDispatch();

  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { loading, success, error } = useSelector(
    (state) => state.cargoQuotation,
  );
  const { list: customers = [] } = useSelector((state) => state.customers);
  const { agents = [] } = useSelector((state) => state.agents);
  const { id: created_by } = useSelector((state) => state.auth);

  /* ================= BASIC FIELDS ================= */
  const [subject, setSubject] = useState("");
  const [customer_id, setCustomerId] = useState("");
  const [agent_id, setAgentId] = useState("");
  const [address, setAddress] = useState("");
  const [attention, setAttention] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [actual_weight, setActualWeight] = useState("");

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

  const totalVolumeWeight = useMemo(() => {
    return packages.reduce((total, p) => {
      const vol = (toNum(p.length) * toNum(p.width) * toNum(p.height)) / 6000;
      return total + vol * toNum(p.same_size);
    }, 0);
  }, [packages]);

  /* ================= CHARGES (COURIER STYLE) ================= */
  const [charges, setCharges] = useState([
    {
      id: 1,
      charge_name: "Airfreight Charges",
      type: "freight",
      amount: "",
      isDefault: true,
    },
    {
      id: 2,
      charge_name: "Exworks",
      type: "freight",
      amount: "",
      isDefault: true,
    },
    {
      id: 3,
      charge_name: "Delivery Order fee - as actual",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 4,
      charge_name: "Airline Charges",
      type: "destination",
      amount: "",
      isDefault: true,
    },
    {
      id: 5,
      charge_name: "Clearance agency",
      type: "clearance",
      amount: "",
      isDefault: true,
    },
    {
      id: 6,
      charge_name: "CMC",
      type: "clearance",
      amount: "",
      isDefault: true,
    },
    {
      id: 7,
      charge_name: "Transportation Charges",
      type: "clearance",
      amount: "",
      isDefault: true,
    },
  ]);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  /* ================= PREFILL EDIT MODE ================= */
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setSubject(initialData.subject || "");
      setCustomerId(initialData.customer_id || "");
      setAgentId(initialData.agent_id || "");
      setAddress(initialData.address || "");
      setAttention(initialData.attention || "");
      setPol(initialData.pol || "");
      setPod(initialData.pod || "");
      setIncoterms(initialData.incoterms || "");
      setActualWeight(initialData.actual_weight || "");

      setSearchCustomer(initialData.customer_name || "");
      setSearchAgent(initialData.agent_name || "");

      setPackages(
        initialData.packages?.map((p) => ({
          length: p.length,
          width: p.width,
          height: p.height,
          same_size: p.same_size,
        })) || [],
      );
      setShowPackages(initialData.packages?.length > 0);

      setCharges(
        initialData.charges?.map((c) => ({
          id: Date.now() + Math.random(),
          charge_name: c.charge_name,
          type: c.type,
          amount: c.rate_per_kg ?? c.amount ?? "",
          isDefault: true,
        })) || [],
      );
    }
  }, [mode, initialData]);

  /* ================= FILTER CUSTOMER ================= */
  useEffect(() => {
    if (!searchCustomer.trim()) return setCustomerSuggestions([]);
    setCustomerSuggestions(
      customers.filter((c) =>
        c.name?.toLowerCase().includes(searchCustomer.toLowerCase()),
      ),
    );
  }, [searchCustomer, customers]);

  /* ================= FILTER AGENT ================= */
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

  /* ================= CHARGES HANDLERS ================= */
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
        amount: "",
        isDefault: false,
      },
    ]);
  };

  const removeCharge = (id) =>
    setCharges((prev) => prev.filter((c) => c.id !== id));

  /* ================= SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!customer_id) {
      alert("Please select a customer from the dropdown");
      return;
    }

    if (!agent_id) {
      alert("Please select an agent from the dropdown");
      return;
    }

    if (!created_by) {
      alert("User not logged in");
      return;
    }

    const payload = {
      subject,
      customer_id: Number(customer_id),
      agent_id: Number(agent_id),
      address,
      attention,
      pol,
      pod,
      incoterms,
      actual_weight: Number(actual_weight),
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
        ...(c.type === "freight"
          ? { rate_per_kg: Number(c.amount) }
          : { amount: Number(c.amount) }),
      })),
    };

    if (mode === "edit") {
      dispatch(updateCargoQuotation({ id: initialData.id, payload }));
    } else {
      dispatch(createCargoQuotation(payload));
    }
    // dispatch(createCargoQuotation(payload));
    if (mode === "edit" && initialData?.status === "approved") {
      alert("Approved quotations cannot be edited");
      return;
    }
  };

  /* ================= RESET ================= */
  /* ================= SUCCESS ================= */
  useEffect(() => {
    if (success) {
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        dispatch(resetCargoQuotationState());
        onSuccess?.();
        if (mode === "edit") onClose?.();
      }, 2000);
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
        {mode === "edit" ? "Edit Cargo Quotation" : "Create Cargo Quotation"}
      </h2>

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SUBJECT */}
          <input
            className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />

          {/* CUSTOMER + AGENT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative" ref={customerRef}>
              <input
                className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
                value={searchCustomer}
                onChange={(e) => {
                  setSearchCustomer(e.target.value);
                  setCustomerId(""); // 🔥 reset ID
                }}
                placeholder="Customer Name"
              />
              {customerSuggestions.length > 0 && (
                <ul className="absolute bg-white border w-full z-50 rounded-md">
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

            <div className="relative" ref={agentRef}>
              <input
                className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
                value={searchAgent}
                onChange={(e) => {
                  setSearchAgent(e.target.value);
                  setAgentId(""); // 🔥 reset ID
                }}
                placeholder="Agent Name"
              />
              {agentSuggestions.length > 0 && (
                <ul className="absolute bg-white border w-full z-50 rounded-md">
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

          {/* ADDRESS */}
          <textarea
            className="bg-[#F3F9FF] rounded-lg py-3 px-4 w-full"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
          />

          {/* POL / POD / INCOTERMS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4"
              value={pol}
              onChange={(e) => setPol(e.target.value)}
              placeholder="POL"
            />
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4"
              value={pod}
              onChange={(e) => setPod(e.target.value)}
              placeholder="POD"
            />
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4"
              value={incoterms}
              onChange={(e) => setIncoterms(e.target.value)}
              placeholder="Incoterms"
            />
          </div>

          {/* WEIGHT + PACKAGES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              className="bg-[#F3F9FF] rounded-lg py-2 px-3"
              value={actual_weight}
              onChange={(e) => setActualWeight(e.target.value)}
              placeholder="Actual Weight"
            />

            <input
              disabled
              value={`${totalVolumeWeight.toFixed(2)} kg`}
              className="bg-[#F3F9FF] rounded-lg py-2 px-3"
              placeholder="Volumetric Weight"
            />

            <input
              disabled
              value={packages.length}
              className="bg-[#F3F9FF] rounded-lg py-2 px-3"
              placeholder="Packages"
            />

            <button
              type="button"
              onClick={addPackage}
              className="bg-[#0A3A5F] text-white rounded-md px-4 py-2 text-sm"
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

          {/* ================= FREIGHT CHARGES ================= */}
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
                  value={item.amount}
                  onChange={(e) =>
                    handleChargeChange(item.id, "amount", e.target.value)
                  }
                  placeholder="Rate per KG"
                />
                {!item.isDefault && (
                  <button
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
                  placeholder="Amount"
                />
                {!item.isDefault && (
                  <button
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

          {/* ================= CLEARANCE CHARGES ================= */}
          <h3 className="font-semibold text-base mt-6">Clearance Charges</h3>

          {charges
            .filter((c) => c.type === "clearance")
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
                  placeholder="Amount"
                />
                {!item.isDefault && (
                  <button
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
            onClick={() => addCharge("clearance")}
            className="bg-[#0A3A5F] text-white px-4 py-2 rounded-md text-sm mt-2"
          >
            + Add Clearance Charge
          </button>

          {/* SUBMIT */}
          <div className="flex justify-center">
            <button
              disabled={loading}
              className="bg-[#0A3A5F] text-white px-6 py-2 rounded-md"
            >
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update Quotation"
                  : "Save Quotation"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md ml-2"
            >
              Close
            </button>
          </div>

          {showSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm">
              ✅ Cargo quotation created successfully
            </div>
          )}

          {error && (
            <p className="text-red-600 text-center mt-2">
              {error.message || "Something went wrong"}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
