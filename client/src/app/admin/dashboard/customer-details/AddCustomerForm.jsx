"use client";
import { useState } from "react";

export default function AddCustomerForm({ onSubmit, onCancel }) {
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(newCustomer);
    setNewCustomer({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full shadow-xl mt-6 border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Add New Customer</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={newCustomer.name}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, name: e.target.value })
          }
          className="border p-2 rounded w-full mb-2"
          required
        />
        <input
          type="text"
          placeholder="Company Name"
          value={newCustomer.company_name}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, company_name: e.target.value })
          }
          className="border p-2 rounded w-full mb-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, email: e.target.value })
          }
          className="border p-2 rounded w-full mb-2"
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={newCustomer.phone}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, phone: e.target.value })
          }
          className="border p-2 rounded w-full mb-2"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={newCustomer.address}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, address: e.target.value })
          }
          className="border p-2 rounded w-full mb-2"
          required
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
