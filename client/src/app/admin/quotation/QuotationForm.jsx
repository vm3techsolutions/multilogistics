"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createQuotation,
  clearQuotationMessages,
} from "@/store/slices/quotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";

export default function CreateQuotation() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector(
    (state) => state.quotation
  );
  const { list: customers = [] } = useSelector((state) => state.customers);
  const { agents = [] } = useSelector((state) => state.agents);

  // MAIN QUOTATION FIELDS
  const [quote_no, setQuoteNo] = useState("");
  const [subject, setSubject] = useState("");
  const [customer_id, setCustomerId] = useState("");
  const [agent_id, setAgentId] = useState("");
  const [address, setAddress] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [actual_weight, setActualWeight] = useState("");

  // SUGGESTIONS
  const [searchName, setSearchName] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [searchAgent, setSearchAgent] = useState("");
  const [agentSuggestions, setAgentSuggestions] = useState([]);

  const customerRef = useRef(null);
  const agentRef = useRef(null);

  const { id: created_by } = useSelector((state) => state.auth);

  //   const [created_by, setCreatedBy] = useState(() => {
  //   if (typeof window === "undefined") return null;
  //   const user = JSON.parse(localStorage.getItem("user") || "null");
  //   return user?.id || null;
  // });


  // Fetch customer + agents
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  // CUSTOMER FILTER
  useEffect(() => {
    if (!searchName.trim()) return setSuggestions([]);

    const filtered = customers.filter((c) =>
      c.name?.toLowerCase().includes(searchName.toLowerCase())
    );

    setSuggestions(filtered);
  }, [searchName, customers]);

  // AGENT FILTER
  useEffect(() => {
    if (!searchAgent.trim()) return setAgentSuggestions([]);

    const filtered = agents.filter((a) =>
      a.name?.toLowerCase().includes(searchAgent.toLowerCase())
    );

    setAgentSuggestions(filtered);
  }, [searchAgent, agents]);

  // PACKAGES ARRAY
  const [packages, setPackages] = useState([]);

  const [showPackages, setShowPackages] = useState(false);

  const addPackage = () => {
    setShowPackages(true);
    setPackages((prev) => [
      ...prev,
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

  // CHARGES SYSTEM
  const [charges, setCharges] = useState([
    {
      id: 1,
      charge_name: "Courier Charges",
      type: "freight",
      amount: "",
      isDefault: true,
    },
    {
      id: 2,
      charge_name: "FSC",
      type: "freight",
      amount: "",
      isDefault: true,
    },
    {
      id: 3,
      charge_name: "Export Clearance Agency",
      type: "destination",
      amount: "",
      isDefault: true,
    },
  ]);

  const handleChargeChange = (id, key, value) => {
    setCharges((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      )
    );
  };

  const addCharge = (type) => {
    setCharges((prev) => [
      ...prev,
      {
        id: Date.now(),
        charge_name: "",
        type: type,
        amount: "",
        isDefault: false,
      },
    ]);
  };

  const removeCharge = (id) =>
    setCharges((prev) => prev.filter((item) => item.id !== id));

  // WEIGHT CALCULATION
  const toNum = (v) => (Number(v) > 0 ? Number(v) : 0);

  const totalVolumeWeight = useMemo(() => {
    return packages.reduce((total, p) => {
      const vol =
        (toNum(p.length) * toNum(p.width) * toNum(p.height)) / 5000;
      return total + vol * toNum(p.same_size);
    }, 0);
  }, [packages]);

  const chargeableWeight = useMemo(() => {
    return Math.max(toNum(actual_weight), totalVolumeWeight).toFixed(2);
  }, [actual_weight, totalVolumeWeight]);

  // SUBMIT HANDLER
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!created_by) {
      alert("User not found. Please login.");
      return;
    }
    const payload = {
      subject,
      customer_id: Number(customer_id),
      agent_id: Number(agent_id),
      address,
      origin,
      destination,
      actual_weight: Number(actual_weight),
      created_by: Number(created_by),

      packages: packages.map((p) => ({
        length: Number(p.length),
        width: Number(p.width),
        height: Number(p.height),
        same_size: Number(p.same_size),
      })),

      charges: charges.map((c) => {
        const isFreight = c.type === "freight";
        const isFSC = c.charge_name.toLowerCase() === "fsc";

        return {
          charge_name: c.charge_name,
          type: c.type,

          // apply rate per kg only when it is freight and NOT FSC
          ...(isFreight && !isFSC
            ? { rate_per_kg: Number(c.amount) }
            : { amount: Number(c.amount) }),

          description: c.description || null,
        };
      }),
    };

    dispatch(createQuotation(payload));
  };

  useEffect(() => {
  if (successMessage) {
    // RESET ALL STATES HERE
    setQuoteNo("");
    setSubject("");
    setCustomerId("");
    setAgentId("");
    setAddress("");
    setOrigin("");
    setDestination("");
    setActualWeight("");

    setSearchName("");
    setSearchAgent("");

    setPackages([]);
    setShowPackages(false);

    setCharges([
      {
        id: 1,
        charge_name: "Courier Charges",
        type: "freight",
        amount: "",
        isDefault: true,
      },
      {
        id: 2,
        charge_name: "FSC",
        type: "freight",
        amount: "",
        isDefault: true,
      },
      {
        id: 3,
        charge_name: "Export Clearance Agency",
        type: "destination",
        amount: "",
        isDefault: true,
      },
    ]);
  }
}, [successMessage]);


  // CLEAR SUCCESS MESSAGE
  useEffect(() => {
    if (successMessage || error) {
      const t = setTimeout(() => {
        dispatch(clearQuotationMessages());
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage, error, dispatch]);

  // CLICK OUTSIDE HANDLER
  useEffect(() => {
    const handler = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target))
        setSuggestions([]);
      if (agentRef.current && !agentRef.current.contains(e.target))
        setAgentSuggestions([]);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const FieldLabel = ({ children }) => (
    <label className="block text-sm text-[#0f172a] mb-1">{children}</label>
  );

  return (
    <div className="px-6 max-w-6xl mx-auto mt-10">
      <h2 className="text-base font-medium mb-4">Courier Quotation</h2>

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quote + Subject */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              disabled
              className="bg-[#F3F9FF] rounded-lg py-2 px-3"
              value={quote_no}
              placeholder="Quote No."
            />

            <input
              className="md:col-span-2 bg-[#F3F9FF] rounded-lg py-3 px-4"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </div>

          {/* Customer + Agent */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative" ref={customerRef}>
                <input
                  className="w-full bg-[#F3F9FF] rounded-lg py-3 px-4"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Customer Name"
                />

                {suggestions.length > 0 && (
                  <ul className="absolute bg-white border w-full shadow-md z-50 rounded-md">
                    {suggestions.map((cust) => (
                      <li
                        key={cust.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setCustomerId(cust.id);
                          setSearchName(cust.name);
                          setAddress(cust.address || "");
                          setSuggestions([]);
                        }}
                      >
                        {cust.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div ref={agentRef}>
              <input
                className="w-full bg-[#F3F9FF] rounded-lg py-3 px-4"
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
                placeholder="Agent Name"
              />

              {agentSuggestions.length > 0 && (
                <ul className="absolute bg-white border w-full shadow-md z-50 rounded-md">
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

          {/* Address */}
          <textarea
            className="w-full bg-[#F3F9FF] rounded-lg py-3 px-4"
            rows={3}
            value={address}
            placeholder="Address"
            onChange={(e) => setAddress(e.target.value)}
          />

          {/* Origin / Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Origin"
            />
            <input
              className="bg-[#F3F9FF] rounded-lg py-3 px-4"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination"
            />
          </div>

          {/* Weight + Packages */}
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
            />

            <input
              disabled
              value={packages.length}
              className="bg-[#F3F9FF] rounded-lg py-2 px-3"
            />

            <button
              type="button"
              onClick={addPackage}
              className="bg-[#0A3A5F] text-white rounded-md px-4 py-2 text-sm"
            >
              Add Packages
            </button>
          </div>

          {/* PACKAGE LIST */}
          {showPackages &&
            packages.map((pkg, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-lg shadow-sm"
              >
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.length}
                  onChange={(e) =>
                    updatePackage(i, "length", e.target.value)
                  }
                  placeholder="Length"
                />
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.width}
                  onChange={(e) =>
                    updatePackage(i, "width", e.target.value)
                  }
                  placeholder="Width"
                />
                <input
                  className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                  value={pkg.height}
                  onChange={(e) =>
                    updatePackage(i, "height", e.target.value)
                  }
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

          {/* FREIGHT CHARGES */}
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
                  placeholder={
                    item.charge_name.toLowerCase() === "fsc"
                      ? "FSC %"
                      : "Rate per KG"
                  }
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

          {/* DESTINATION CHARGES */}
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

          {/* SUBMIT BUTTON */}
          <div className="flex justify-center gap-6 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0A3A5F] text-white rounded-md px-6 py-2 text-sm"
            >
              {loading ? "Saving..." : "Save Quote"}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white border rounded-full p-3 shadow"
            >
              🖨
            </button>
          </div>

          {successMessage && (
            <p className="text-green-600 text-center mt-2">{successMessage}</p>
          )}
          {error && (
            <p className="text-red-600 text-center mt-2">
              {error.message || error.error || "Something went wrong"}
            </p>
          )}

        </form>
      </div>
    </div>
  );
}
