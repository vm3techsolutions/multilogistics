"use client";
import { useState } from "react";

export default function AddCustomerForm({ onSubmit }) {
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState([]);

  const validate = () => {
    let tempErrors = [];

    if (!newCustomer.name) {
      tempErrors.push("Name is required.");
    } else if (!/^[A-Za-z\s]+$/.test(newCustomer.name)) {
      tempErrors.push("Name must contain only letters.");
    }

    if (!newCustomer.company_name) {
      tempErrors.push("Company name is required.");
    }

    if (!newCustomer.email) {
      tempErrors.push("Email is required.");
    } else if (!/\S+@\S+\.\S+/.test(newCustomer.email)) {
      tempErrors.push("Invalid email format.");
    }

    if (!newCustomer.phone) {
      tempErrors.push("Phone is required.");
    } else if (!/^\d{10}$/.test(newCustomer.phone)) {
      tempErrors.push("Phone must be 10 digits only.");
    }

    if (!newCustomer.address) {
      tempErrors.push("Address is required.");
    }

    setErrors(tempErrors);
    return tempErrors.length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit(newCustomer);

    setNewCustomer({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
    });
    setErrors([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-4 primaryText">
        Add New Customer
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
        <input
          type="text"
          placeholder="Name"
          value={newCustomer.name}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, name: e.target.value })
          }
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />

        <input
          type="text"
          placeholder="Company Name"
          value={newCustomer.company_name}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, company_name: e.target.value })
          }
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />

        <input
          type="email"
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, email: e.target.value })
          }
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />

        <input
          type="text"
          placeholder="Phone"
          value={newCustomer.phone}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, phone: e.target.value })
          }
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />

        <input
          type="text"
          placeholder="Address"
          value={newCustomer.address}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, address: e.target.value })
          }
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />

        {/* ✅ Button */}
        <div className="flex w-full mt-4">
          <button
            type="submit"
            className="primaryBg w-full text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-green-700 transition"
          >
            Add New Customer
          </button>
        </div>

        {/* 🚨 Error Box (same style as AgentForm) */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded text-sm mt-3 space-y-1">
            {errors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
