"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addCustomer } from "@/store/slices/customerSlice"; // ✅ update path if needed

export default function AddCustomerForm() {
  const dispatch = useDispatch();

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [documents, setDocuments] = useState([{ type: "", file: null }]);
  const [errors, setErrors] = useState([]);

  // ✅ Validation
  const validate = () => {
    let tempErrors = [];

    if (!newCustomer.name.trim()) tempErrors.push("Name is required.");
    if (!newCustomer.company_name.trim())
      tempErrors.push("Company name is required.");
    if (!newCustomer.email.trim()) tempErrors.push("Email is required.");
    else if (!/\S+@\S+\.\S+/.test(newCustomer.email))
      tempErrors.push("Invalid email format.");
    if (!newCustomer.phone.trim()) tempErrors.push("Phone is required.");
    else if (!/^\d{10}$/.test(newCustomer.phone))
      tempErrors.push("Phone must be 10 digits only.");
    if (!newCustomer.address.trim()) tempErrors.push("Address is required.");

    // Validate documents
    documents.forEach((doc, index) => {
      if (!doc.type) tempErrors.push(`Document type for row ${index + 1} required.`);
      if (!doc.file) tempErrors.push(`Document file for row ${index + 1} required.`);
    });

    setErrors(tempErrors);
    return tempErrors.length === 0;
  };

  // ✅ Add new document row
  const addDocumentField = () => {
    setDocuments([...documents, { type: "", file: null }]);
  };

  // ✅ Remove document row
  const removeDocumentField = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  // ✅ Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", newCustomer.name);
    formData.append("company_name", newCustomer.company_name);
    formData.append("email", newCustomer.email);
    formData.append("phone", newCustomer.phone);
    formData.append("address", newCustomer.address);

    // Append multiple document types & files
    documents.forEach((doc) => {
      formData.append("document_type", doc.type);
      formData.append("document", doc.file);
    });

    // ✅ Dispatch Redux thunk to backend
    dispatch(addCustomer(formData));

    // Reset form
    setNewCustomer({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
    });
    setDocuments([{ type: "", file: null }]);
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

        {/* 🧾 Dynamic Document Fields */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            KYC Documents
          </label>
          {documents.map((doc, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                placeholder="Document Type (e.g. PAN, GST)"
                value={doc.type}
                onChange={(e) => {
                  const newDocs = [...documents];
                  newDocs[index].type = e.target.value;
                  setDocuments(newDocs);
                }}
                className="border p-2 rounded w-full bg-[#F7FCFE]"
              />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const newDocs = [...documents];
                  newDocs[index].file = e.target.files[0];
                  setDocuments(newDocs);
                }}
                className="border p-2 rounded w-full bg-[#F7FCFE]"
              />
              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDocumentField(index)}
                  className="text-red-500 font-bold self-start"
                >
                  ✕
                </button>
              )}
            </div>

          ))}
          <button
            type="button"
            onClick={addDocumentField}
            className="text-blue-600 text-sm mt-1"
          >
            + Add another document
          </button>
        </div>

        {/* ✅ Submit Button */}
        <div className="flex w-full mt-4">
          <button
            type="submit"
            className="primaryBg w-full text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-green-700 transition"
          >
            Add New Customer
          </button>
        </div>

        {/* 🚨 Error Box */}
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
