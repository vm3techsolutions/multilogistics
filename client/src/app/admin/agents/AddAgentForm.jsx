"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAgent, updateAgent } from "@/store/slices/agentSlice";

const AddAgentForm = ({ onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.agents);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_person_name: "",
    phone: "",
    country: "",
    type: "import",
  });

  const [errors, setErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  // ✅ Prefill data when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        email: editData.email || "",
        contact_person_name: editData.contact_person_name || "",
        phone: editData.phone || "",
        country: editData.country || "",
        type: editData.type || "import",
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    let tempErrors = [];

    if (!formData.name.trim()) tempErrors.push("Agent name is required.");
    else if (!/^[A-Za-z\s]+$/.test(formData.name))
      tempErrors.push("Agent name must contain only letters.");

    if (!formData.email.trim()) tempErrors.push("Email is required.");
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      tempErrors.push("Invalid email format.");

    if (!formData.contact_person_name.trim())
      tempErrors.push("Contact person name is required.");
    else if (!/^[A-Za-z\s]+$/.test(formData.contact_person_name))
      tempErrors.push("Contact person name must contain only letters.");

    if (!formData.phone.trim()) tempErrors.push("Phone number is required.");
    else if (!/^[0-9]{10,15}$/.test(formData.phone))
      tempErrors.push("Phone number must be 10–15 digits.");

    if (!formData.country.trim()) tempErrors.push("Country is required.");

    setErrors(tempErrors);
    return tempErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");

    if (!validate()) return;

    let res;
    if (editData) {
      // ✅ Update existing agent
      res = await dispatch(updateAgent({ id: editData.id, updatedData: formData }));
    } else {
      // ✅ Create new agent
      res = await dispatch(createAgent(formData));
    }

    if (res.meta.requestStatus === "fulfilled") {
      setErrors([]);
      setSuccessMsg(editData ? "✅ Agent updated successfully!" : "✅ Agent added successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        onClose?.();
      }, 1500);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-[#1E123A]">
        {editData ? "Edit Agent" : "Add New Agent"}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 p-3 rounded mb-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-400 text-green-700 p-3 rounded mb-3 text-sm">
          {successMsg}
        </div>
      )}

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
          className={`w-full py-2 rounded text-white ${
            loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          } transition`}
        >
          {loading ? "Saving..." : editData ? "Update Agent" : "Add New Agent"}
        </button>

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
