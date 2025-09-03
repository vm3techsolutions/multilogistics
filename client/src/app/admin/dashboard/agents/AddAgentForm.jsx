"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAgent } from "@/store/slices/agentSlice";

const AddAgentForm = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.agents);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_person_name: "",
    phone: "",
    country: "",
    type: "import", // default value
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createAgent(formData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        onClose?.();
      }
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-4">Add New Agent</h2>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Agent Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Agent Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
          required
        />
        <input
          type="text"
          name="contact_person_name"
          placeholder="Contact Person Name"
          value={formData.contact_person_name}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
          required
        />
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
          required
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
          required
        >
          <option value="import">Import</option>
          <option value="export">Export</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Agent"}
        </button>
      </form>
    </div>
  );
};

export default AddAgentForm;
