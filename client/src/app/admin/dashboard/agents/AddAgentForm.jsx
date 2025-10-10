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

  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    let tempErrors = [];

    // Name validation (only letters & spaces)
    if (!formData.name) {
      tempErrors.push("Agent name is required.");
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      tempErrors.push("Agent name must contain only letters.");
    }

    // Email validation
    if (!formData.email) {
      tempErrors.push("Email is required.");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.push("Invalid email format.");
    }

    // Contact Person Name validation
    if (!formData.contact_person_name) {
      tempErrors.push("Contact person name is required.");
    } else if (!/^[A-Za-z\s]+$/.test(formData.contact_person_name)) {
      tempErrors.push("Contact person name must contain only letters.");
    }

    // Phone validation (digits only, 10–15 length as example)
    if (!formData.phone) {
      tempErrors.push("Phone number is required.");
    } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
      tempErrors.push("Phone number must be 10–15 digits.");
    }

    // Country validation
    if (!formData.country) {
      tempErrors.push("Country is required.");
    }

    setErrors(tempErrors);
    return tempErrors.length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    dispatch(createAgent(formData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setFormData({
          name: "",
          email: "",
          contact_person_name: "",
          phone: "",
          country: "",
          type: "import",
        });
        setErrors([]);
        onClose?.();
      }
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-4 primaryText">Add New Agent</h2>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
        <input
          type="text"
          name="name"
          placeholder="Agent Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
        />
        <input
          type="email"
          name="email"
          placeholder="Agent Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
        />
        <input
          type="text"
          name="contact_person_name"
          placeholder="Contact Person Name"
          value={formData.contact_person_name}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
        />
        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-[#F7FCFE]"
        >
          <option value="import">Import</option>
          <option value="export">Export</option>
        </select>

       

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add New Agent"}
        </button>

         {/* 🚨 Show all errors together at bottom */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded text-sm space-y-1">
            {errors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddAgentForm;
