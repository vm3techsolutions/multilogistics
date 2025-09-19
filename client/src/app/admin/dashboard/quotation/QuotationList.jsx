"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllQuotations } from "@/store/slices/quotationSlice";
import { fetchCustomerById } from "@/store/slices/customerSlice";
import Quotation from "./Quotation";
import { Edit, Eye, Trash2 } from "lucide-react"; // Lucide icons

const QuotationList = () => {
  const dispatch = useDispatch();
  const { quotations = [], loading, error } = useSelector(
    (state) => state.quotation || {}
  );

  const [editingQuotation, setEditingQuotation] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customerMap, setCustomerMap] = useState({});

  useEffect(() => {
    dispatch(getAllQuotations());
  }, [dispatch]);

  // Fetch customer name by ID
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
  const handleView = (quotation) => alert(JSON.stringify(quotation, null, 2));
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      console.log("Delete quotation ID:", id);
      // Dispatch delete action here if implemented
    }
  };
  const handleCloseEdit = () => setEditingQuotation(null);

  return (
    <div className="p-6 bg-white shadow rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold primaryText">Quotation Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {showCreateForm ? "Back to Quotation List" : "Create Quotation"}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <Quotation onClose={() => setShowCreateForm(false)} />
        </div>
      )}

      {!showCreateForm && (
        <>
          {error && <p className="text-red-500">{error}</p>}
          {loading && <p>Loading...</p>}
          {!loading && quotations.length === 0 && <p>No quotations found.</p>}

          {quotations.length > 0 && (
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
                {quotations.map((q) => (
                  <tr key={q.id} className="text-gray-700">
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
                      >
                        <title>Edit</title>
                      </Edit>

                      <Eye
                        className="cursor-pointer text-gray-600"
                        size={20}
                        onClick={() => handleView(q)}
                      >
                        <title>View</title>
                      </Eye>

                      <Trash2
                        className="cursor-pointer text-red-600"
                        size={20}
                        onClick={() => handleDelete(q.id)}
                      >
                        <title>Delete</title>
                      </Trash2>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {editingQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 h-[90%] overflow-y-auto">
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
    </div>
  );
};

export default QuotationList;
