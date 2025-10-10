"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllQuotations } from "@/store/slices/quotationSlice";
import { fetchCustomerById } from "@/store/slices/customerSlice";
import Quotation from "./Quotation";
import { Edit, Eye, Trash2, Search } from "lucide-react";

const QuotationList = () => {
  const dispatch = useDispatch();
  const { quotations = [], loading, error } = useSelector(
    (state) => state.quotation || {}
  );

  const [editingQuotation, setEditingQuotation] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [customerMap, setCustomerMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(getAllQuotations());
  }, [dispatch]);

  const getCustomerName = async (id) => {
    if (!id) return "N/A";
    if (customerMap[id]) return customerMap[id];

    try {
      const res = await dispatch(fetchCustomerById(id)).unwrap();
      setCustomerMap((prev) => ({ ...prev, [id]: res.name }));
      return res.name;
    } catch (err) {
      console.error("Error fetching customer", err);
      return `ID: ${id}`;
    }
  };

  useEffect(() => {
    quotations.forEach((q) => {
      if (q.customer_id && !customerMap[q.customer_id]) {
        getCustomerName(q.customer_id);
      }
    });
  }, [quotations]);

  const handleEdit = (quotation) => setEditingQuotation(quotation);
  const handleView = (quotation) => setViewQuotation(quotation);
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      console.log("Delete quotation ID:", id);
    }
  };
  const handleCloseEdit = () => setEditingQuotation(null);
  const handleCloseView = () => setViewQuotation(null);

  const filteredQuotations = quotations.filter((q) => {
    const customerName = customerMap[q.customer_id] || "";
    return (
      q.quote_no.toString().includes(searchTerm.trim()) ||
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-full mx-auto">
      {/* Full-width Search Bar */}
      <div className="p-4 bg-white rounded-xl w-full mb-6 relative shadow-sm">
        <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by Quote No, Subject or Customer"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 p-3 rounded-xl border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-800"
        />
      </div>

      <div className="p-6 bg-white shadow rounded-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold primaryText">Quotation Management</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
            >
              {showCreateForm ? "Back to Quotation List" : "Create Quotation"}
            </button>
          </div>
        </div>

        {/* Create Quotation Form */}
        {showCreateForm && (
          <div className="mb-6">
            <Quotation onClose={() => setShowCreateForm(false)} />
          </div>
        )}

        {/* Quotation Table */}
        {!showCreateForm && (
          <>
            {error && <p className="text-red-500">{error}</p>}
            {loading && <p>Loading...</p>}
            {!loading && filteredQuotations.length === 0 && <p>No quotations found.</p>}

            {filteredQuotations.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="border p-2">Quote No</th>
                      <th className="border p-2">Subject</th>
                      <th className="border p-2">Customer</th>
                      <th className="border p-2">Origin</th>
                      <th className="border p-2">Destination</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.map((q) => (
                      <tr key={q.id} className="text-gray-700 hover:bg-gray-50 transition">
                        <td className="border p-2">{q.quote_no}</td>
                        <td className="border p-2">{q.subject}</td>
                        <td className="border p-2">
                          {customerMap[q.customer_id] || "Loading..."}
                        </td>
                        <td className="border p-2">{q.origin}</td>
                        <td className="border p-2">{q.destination}</td>
                        <td className="border p-2 flex space-x-3 justify-center">
                          <Edit
                            className="cursor-pointer text-blue-600"
                            size={20}
                            onClick={() => handleEdit(q)}
                          />
                          <Eye
                            className="cursor-pointer text-gray-600"
                            size={20}
                            onClick={() => handleView(q)}
                          />
                          {/* <Trash2
                            className="cursor-pointer text-red-600"
                            size={20}
                            onClick={() => handleDelete(q.id)}
                          /> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Edit Quotation Modal */}
        {editingQuotation && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 h-[90%] overflow-y-auto relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold primaryText">Edit Quotation</h3>
                <button
                  onClick={handleCloseEdit}
                  className="text-gray-600 hover:text-black"
                >
                  ✖
                </button>
              </div>
              <Quotation existingQuotation={editingQuotation} onClose={handleCloseEdit} />
            </div>
          </div>
        )}

  {/* View Quotation Modal */}
    {viewQuotation && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg p-6 w-2/3 max-h-[80%] overflow-y-auto relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold primaryText">Quotation Details</h3>
                  <button
                    onClick={handleCloseView}
                    className="text-gray-600 hover:text-black"
                  >
                    ✖
                  </button>
                </div>
                
       {/* Table Layout */}
                    <table className="w-full border-collapse border text-sm">
                      <tbody>
                        {Object.entries(viewQuotation).map(([key, value]) => {
                          if (!value) return null; // skip empty fields

                          let displayValue = value;

                          // ✅ Convert objects/arrays into readable format
                          if (typeof value === "object") {
                            if (Array.isArray(value)) {
                              displayValue = (
                                <div className="space-y-2">
                                  {value.map((item, i) => (
                                    <div key={i} className="mb-2">
                                      <strong>Item {i + 1}:</strong>
                                      <div className="ml-4">
                                        {Object.entries(item).map(([k, v]) => {
                                          let formattedValue = v;

                                          // ✅ Add "kg" if key = weight
                                          if (k.toLowerCase() === "weight") {
                                            formattedValue = `${v} kg`;
                                          }

                                          // ✅ Add "₹" if key = amount
                                          if (k.toLowerCase() === "amount") {
                                            formattedValue = `₹${v}`;
                                          }

                                          return (
                                            <div key={k}>
                                              {k}: {formattedValue}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              displayValue = (
                                <div>
                                  {Object.entries(value).map(([k, v]) => {
                                    let formattedValue = v;

                                    if (k.toLowerCase() === "weight") {
                                      formattedValue = `${v} kg`;
                                    }
                                    if (k.toLowerCase() === "amount") {
                                      formattedValue = `₹${v}`;
                                    }

                                    return (
                                      <div key={k}>
                                        {k}: {formattedValue}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                          }

                          return (
                            <tr key={key}>
                              <td className="border p-2 font-semibold capitalize">
                                {key.replace(/_/g, " ")}
                              </td>
                              <td className="border p-2">
                                {key === "customer_id"
                                  ? customerMap[value] || "Loading..."
                                  : displayValue}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
              </div>
            </div>
            )}

      </div>
    </div>
  );
};

export default QuotationList;
