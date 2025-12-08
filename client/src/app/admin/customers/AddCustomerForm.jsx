"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCustomer, editCustomer } from "@/store/slices/customerSlice";

export default function AddCustomerForm({ onClose, editData }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.customers);

  const [newCustomer, setNewCustomer] = useState({
  name: "",
  company_name: "",
  email: "",
  email1: "",
  email2: "",
  email3: "",
  phone: "",
  phone1: "",
  address: "",
});

  const [documents, setDocuments] = useState([{ type: "", file: null }]);
  const [errors, setErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  // ✅ Prefill data for edit
  useEffect(() => {
    if (editData) {
      setNewCustomer({
        name: editData.name || "",
        company_name: editData.company_name || "",
        email: editData.email || "",
        email1: editData.email1 || "",
      email2: editData.email2 || "",
      email3: editData.email3 || "",
        phone: editData.phone || "",
        phone1: editData.phone1 || "",
        address: editData.address || "",
      });

      if (editData.documents?.length) {
        setDocuments(
          editData.documents.map((doc) => ({
            type: doc.type || "",
            file: null, // Existing files won't be editable, user can re-upload
          }))
        );
      }
    }
  }, [editData]);

  const validate = () => {
    let tempErrors = [];

    if (!newCustomer.name.trim()) tempErrors.push("Name is required.");
    if (!newCustomer.company_name.trim()) tempErrors.push("Company name is required.");
    if (!newCustomer.email.trim()) tempErrors.push("Email is required.");
    else if (!/\S+@\S+\.\S+/.test(newCustomer.email))
      tempErrors.push("Invalid email format.");
    if (!newCustomer.phone.trim()) tempErrors.push("Phone is required.");
    else if (!/^\d{10}$/.test(newCustomer.phone))
      tempErrors.push("Phone must be 10 digits only.");
    if (!newCustomer.address.trim()) tempErrors.push("Address is required.");

    // ✅ Document validation ONLY for new customers
  if (!editData) {
    documents.forEach((doc, i) => {
      if (!doc.type.trim()) tempErrors.push(`Document type for row ${i + 1} required.`);
      if (!doc.file) tempErrors.push(`Document file for row ${i + 1} required.`);
    });
  }

    setErrors(tempErrors);
    return tempErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", newCustomer.name);
    formData.append("company_name", newCustomer.company_name);
    formData.append("email", newCustomer.email);
    formData.append("email1", newCustomer.email1);
formData.append("email2", newCustomer.email2);
formData.append("email3", newCustomer.email3);
    formData.append("phone", newCustomer.phone);
    formData.append("phone1", newCustomer.phone1);
    formData.append("address", newCustomer.address);

    documents.forEach((doc) => {
      formData.append("document_type", doc.type);
      if (doc.file) formData.append("document", doc.file);
    });

    let res;
    if (editData) {
      // ✅ Update existing customer
      res = await dispatch(editCustomer({ id: editData.id, formData }));
    } else {
      // ✅ Create new customer
      res = await dispatch(addCustomer(formData));
    }

    if (res.meta.requestStatus === "fulfilled") {
      setErrors([]);
      setSuccessMsg(editData ? "✅ Customer updated successfully!" : "✅ Customer added successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        onClose?.();
      }, 1500);
    }
  };

  const addDocumentField = () => {
    setDocuments([...documents, { type: "", file: null }]);
  };

  const removeDocumentField = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-lg">
      <h2 className="text-xl font-semibold mb-4 primaryText">
        {editData ? "Edit Customer" : "Add New Customer"}
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
          placeholder="Name"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />
        <input
          type="text"
          placeholder="Company Name"
          value={newCustomer.company_name}
          onChange={(e) => setNewCustomer({ ...newCustomer, company_name: e.target.value })}
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />
        <input
          type="email"
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />
        <input
  type="email"
  placeholder="Alternate Email 1"
  value={newCustomer.email1}
  onChange={(e) => setNewCustomer({ ...newCustomer, email1: e.target.value })}
  className="border p-2 rounded w-full bg-[#F7FCFE]"
/>

<input
  type="email"
  placeholder="Alternate Email 2"
  value={newCustomer.email2}
  onChange={(e) => setNewCustomer({ ...newCustomer, email2: e.target.value })}
  className="border p-2 rounded w-full bg-[#F7FCFE]"
/>

<input
  type="email"
  placeholder="Alternate Email 3"
  value={newCustomer.email3}
  onChange={(e) => setNewCustomer({ ...newCustomer, email3: e.target.value })}
  className="border p-2 rounded w-full bg-[#F7FCFE]"
/>

        <input
          type="tel"
          placeholder="Phone"
          value={newCustomer.phone}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />
        <input
  type="tel"
  placeholder="Alternate Phone"
  value={newCustomer.phone1}
  onChange={(e) => setNewCustomer({ ...newCustomer, phone1: e.target.value })}
  className="border p-2 rounded w-full bg-[#F7FCFE]"
/>
        <input
          type="text"
          placeholder="Address"
          value={newCustomer.address}
          onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
          className="border p-2 rounded w-full bg-[#F7FCFE]"
        />

        {/* 🧾 KYC Documents */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">KYC Documents</label>
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

        <button
          type="submit"
          disabled={loading}
          className={`primaryBg w-full text-white px-6 py-2 rounded-lg font-semibold shadow-md ${
            loading ? "opacity-70" : "hover:bg-green-700"
          } transition`}
        >
          {loading ? "Saving..." : editData ? "Update Customer" : "Add New Customer"}
        </button>

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
