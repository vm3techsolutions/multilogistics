"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateQuotation, clearQuotationMessages } from "@/store/slices/quotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";

export default function EditQuotation({ quotationData, onClose }) {
    const dispatch = useDispatch();
    const { loading, error, successMessage } = useSelector((state) => state.quotation);
    const { list: customers = [] } = useSelector((state) => state.customers);
    const { agents = [] } = useSelector((state) => state.agents);

    const [quote_no, setQuoteNo] = useState("");
    const [subject, setSubject] = useState("");
    const [customer_id, setCustomerId] = useState("");
    const [agent_id, setAgentId] = useState("");
    const [address, setAddress] = useState("");
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [actual_weight, setActualWeight] = useState("");

    const [searchName, setSearchName] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchAgent, setSearchAgent] = useState("");
    const [agentSuggestions, setAgentSuggestions] = useState([]);

    const customerRef = useRef(null);
    const agentRef = useRef(null);

    const [packages, setPackages] = useState([]);
    const [showPackages, setShowPackages] = useState(false);

    const [charges, setCharges] = useState([]);

    // Fetch customers and agents
    useEffect(() => {
        dispatch(fetchCustomers());
        dispatch(getAgents());
    }, [dispatch]);

    // Initialize data from `quotationData`
    useEffect(() => {
        if (quotationData) {
            setQuoteNo(quotationData.quote_no || "");
            setSubject(quotationData.subject || "");
            setCustomerId(quotationData.customer_id || "");
            setAgentId(quotationData.agent_id || "");
            setAddress(quotationData.address || "");
            setOrigin(quotationData.origin || "");
            setDestination(quotationData.destination || "");
            setActualWeight(quotationData.actual_weight || "");
            setPackages(quotationData.packages || []);
            setShowPackages((quotationData.packages || []).length > 0);

            // Initialize charges (freight + destination)
            setCharges(
                quotationData.charges?.map((c, index) => ({
                    id: c.id || Date.now() + index,
                    charge_name: c.charge_name,
                    type: c.type,
                    amount: c.amount || "",            // for FSC / general amount
                    rate_per_kg: c.rate_per_kg || "",
                    description: c.description || "",
                    isDefault: ["Courier Charges", "FSC", "Export Clearance Agency"].includes(c.charge_name),

                })) || [
                    { id: 1, charge_name: "Courier Charges", type: "freight", amount: "", isDefault: true },
                    { id: 2, charge_name: "FSC", type: "freight", amount: "", isDefault: true },
                    { id: 3, charge_name: "Export Clearance Agency", type: "destination", amount: "", isDefault: true },
                ]
            );

            const customer = customers.find((c) => c.id === quotationData.customer_id);
            setSearchName(customer?.name || "");

            const agent = agents.find((a) => a.id === quotationData.agent_id);
            setSearchAgent(agent?.name || "");
        }
    }, [quotationData, customers, agents]);

    // Customer autocomplete
    useEffect(() => {
        if (!searchName.trim()) return setSuggestions([]);
        setSuggestions(
            customers.filter((c) => c.name?.toLowerCase().includes(searchName.toLowerCase()))
        );
    }, [searchName, customers]);

    // Agent autocomplete
    useEffect(() => {
        if (!searchAgent.trim()) return setAgentSuggestions([]);
        setAgentSuggestions(
            agents.filter((a) => a.name?.toLowerCase().includes(searchAgent.toLowerCase()))
        );
    }, [searchAgent, agents]);

    // Click outside to close suggestions
    useEffect(() => {
        const handler = (e) => {
            if (customerRef.current && !customerRef.current.contains(e.target)) setSuggestions([]);
            if (agentRef.current && !agentRef.current.contains(e.target)) setAgentSuggestions([]);
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    // Packages handlers
    const addPackage = () => {
        setShowPackages(true);
        setPackages((prev) => [...prev, { length: "", width: "", height: "", same_size: 1 }]);
    };
    const updatePackage = (i, k, v) => {
        const arr = [...packages];
        arr[i][k] = v;
        setPackages(arr);
    };
    const removePackage = (i) => setPackages(packages.filter((_, idx) => idx !== i));

    // Charges handlers
    const handleChargeChange = (id, key, value) => {
        setCharges((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
        );
    };
    const addCharge = (type) => {
        setCharges((prev) => [
            ...prev,
            { id: Date.now(), charge_name: "", type, amount: "", isDefault: false },
        ]);
    };
    const removeCharge = (id) => setCharges((prev) => prev.filter((item) => item.id !== id));

    // Weight calculations
    const toNum = (v) => (Number(v) > 0 ? Number(v) : 0);
    const totalVolumeWeight = useMemo(() => {
        return packages.reduce((total, p) => {
            const vol = (toNum(p.length) * toNum(p.width) * toNum(p.height)) / 5000;
            return total + vol * toNum(p.same_size);
        }, 0);
    }, [packages]);

    const chargeableWeight = useMemo(
        () => Math.max(toNum(actual_weight), totalVolumeWeight).toFixed(2),
        [actual_weight, totalVolumeWeight]
    );

    // Submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            subject,
            customer_id: Number(customer_id),
            agent_id: Number(agent_id),
            address,
            origin,
            destination,
            actual_weight: Number(actual_weight),
            packages: packages.map((p) => ({
                length: Number(p.length),
                width: Number(p.width),
                height: Number(p.height),
                same_size: Number(p.same_size),
            })),
            charges: charges.map((c) => {
                const isFSC = c.charge_name.toLowerCase() === "fsc";
                const isFreight = c.type === "freight";

                return {
                    charge_name: c.charge_name,
                    type: c.type,

                    // FSC → send amount
                    ...(isFSC
                        ? { amount: Number(c.amount) }

                        // Freight but NOT FSC → send rate_per_kg
                        : isFreight
                            ? { rate_per_kg: Number(c.rate_per_kg) }

                            // Destination charges → send amount
                            : { amount: Number(c.amount) }
                    ),

                    description: c.description || null,
                };
            })
            ,
        };

        dispatch(updateQuotation({ id: quotationData.id, ...payload }));
    };

    // Clear messages
    useEffect(() => {
        if (successMessage || error) {
            const t = setTimeout(() => dispatch(clearQuotationMessages()), 4000);
            return () => clearTimeout(t);
        }
    }, [successMessage, error, dispatch]);

    const FieldLabel = ({ children }) => (
        <label className="block text-sm text-[#0f172a] mb-1">{children}</label>
    );

    if (!quotationData) return <p>Loading...</p>;

    return (
        <div className="px-6 max-w-6xl mx-auto mt-10">
            <h2 className="text-base font-medium mb-4">Edit Quotation</h2>
            <div className="border rounded-xl p-6 bg-white shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quote + Subject */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <FieldLabel>Quote No.</FieldLabel>
                            <input
                                disabled
                                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                                value={quote_no}
                                placeholder="Quote No."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FieldLabel>Subject</FieldLabel>
                            <input
                                className="w-full bg-[#F3F9FF] rounded-lg py-3 px-4"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subject"
                            />
                        </div>
                    </div>

                    {/* Customer + Agent */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2" ref={customerRef}>
                            <FieldLabel>Customer Name</FieldLabel>
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

                        <div ref={agentRef}>
                            <FieldLabel>Agent Name</FieldLabel>
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
                    <div>
                        <FieldLabel>Address</FieldLabel>
                        <textarea
                            className="w-full bg-[#F3F9FF] rounded-lg py-3 px-4"
                            rows={3}
                            value={address}
                            placeholder="Address"
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    {/* Origin / Destination */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Origin</FieldLabel>
                            <input
                                className="bg-[#F3F9FF] rounded-lg py-3 px-4"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                placeholder="Origin"
                            />
                        </div>
                        <div>
                            <FieldLabel>Destination</FieldLabel>
                            <input
                                className="bg-[#F3F9FF] rounded-lg py-3 px-4"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="Destination"
                            />
                        </div>
                    </div>

                    {/* Weight + Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <FieldLabel>Actual Weight</FieldLabel>
                            <input
                                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                                value={actual_weight}
                                onChange={(e) => setActualWeight(e.target.value)}
                                placeholder="Actual Weight"
                            />
                        </div>
                        <div>
                            <FieldLabel>Total Volume Weight</FieldLabel>
                            <input
                                disabled
                                value={`${totalVolumeWeight.toFixed(2)} kg`}
                                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                            />
                        </div>
                        <div>
                            <FieldLabel>Packages</FieldLabel>
                            <input
                                disabled
                                value={packages.length}
                                className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={addPackage}
                                className="bg-[#0A3A5F] text-white rounded-md px-4 py-2 text-sm"
                            >
                                Add Packages
                            </button>
                        </div>
                    </div>

                    {/* Packages List */}
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
                                    onChange={(e) => updatePackage(i, "same_size", e.target.value)}
                                    placeholder="Qty"
                                />
                                <button
                                    type="button"
                                    className="bg-red-500 text-white rounded-md px-3 py-2"
                                    onClick={() => removePackage(i)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                    {/* Freight Charges */}
                    <h3 className="font-semibold text-base mt-6">Freight Charges</h3>
                    {charges
                        .filter((c) => c.type === "freight")
                        .map((item) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm"
                            >
                                <div className="md:col-span-2">
                                    <FieldLabel>Charge Name</FieldLabel>
                                    <input
                                        className="bg-[#F3F9FF] rounded-lg py-2 px-3 w-full"
                                        value={item.charge_name}
                                        onChange={(e) =>
                                            handleChargeChange(item.id, "charge_name", e.target.value)
                                        }
                                        placeholder="Charge Name"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Amount / Rate</FieldLabel>
                                    <input
                                        className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                                        value={
                                            item.charge_name.toLowerCase() === "fsc"
                                                ? item.amount || ""
                                                : item.rate_per_kg || ""
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (item.charge_name.toLowerCase() === "fsc") {
                                                handleChargeChange(item.id, "amount", value);
                                            } else {
                                                handleChargeChange(item.id, "rate_per_kg", value);
                                            }
                                        }}
                                        placeholder={
                                            item.charge_name.toLowerCase() === "fsc" ? "FSC %" : "Rate per KG"
                                        }
                                    />

                                </div>
                                {!item.isDefault && (
                                    <button
                                        className="bg-red-500 text-white rounded-md px-3 py-2 mt-6"
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

                    {/* Destination Charges */}
                    <h3 className="font-semibold text-base mt-6">Destination Charges</h3>
                    {charges
                        .filter((c) => c.type === "destination")
                        .map((item) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm"
                            >
                                <div className="md:col-span-2">
                                    <FieldLabel>Charge Name</FieldLabel>
                                    <input
                                        className="bg-[#F3F9FF] rounded-lg py-2 px-3 w-full"
                                        value={item.charge_name}
                                        onChange={(e) =>
                                            handleChargeChange(item.id, "charge_name", e.target.value)
                                        }
                                        placeholder="Charge Name"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Amount</FieldLabel>
                                    <input
                                        className="bg-[#F3F9FF] rounded-lg py-2 px-3"
                                        value={item.amount}
                                        onChange={(e) =>
                                            handleChargeChange(item.id, "amount", e.target.value)
                                        }
                                        placeholder="Amount"
                                    />
                                </div>
                                {!item.isDefault && (
                                    <button
                                        className="bg-red-500 text-white rounded-md px-3 py-2 mt-6"
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

                    {/* Submit + Close */}
                    <div className="flex justify-center gap-6 mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#0A3A5F] text-white rounded-md px-6 py-2 text-sm"
                        >
                            {loading ? "Updating..." : "Update Quotation"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 text-gray-800 rounded-md px-6 py-2 text-sm"
                        >
                            Close
                        </button>
                    </div>

                    {successMessage && (
                        <p className="text-green-600 text-center mt-2">{successMessage}</p>
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
