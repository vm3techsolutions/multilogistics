"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllQuotations } from "@/store/slices/quotationSlice";
import Quotation from "./Quotation"; // reuse your form

const QuotationList = () => {
  const dispatch = useDispatch();
  const { quotations = [], loading, error } = useSelector(
    (state) => state.quotation || {}
  );

  const [editingQuotation, setEditingQuotation] = useState(null); // holds the quotation being edited
  const [showCreateForm, setShowCreateForm] = useState(false); // toggle create form

  useEffect(() => {
    dispatch(getAllQuotations());
  }, [dispatch]);

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
  };

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this quotation?")) {
//       dispatch(deleteQuotation(id));
//     }
//   };

  const handleCloseEdit = () => {
    setEditingQuotation(null);
  };

  return (
    <div className="p-6 bg-white shadow rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quotation Management</h2>

        {/* Toggle button for Create / Back to List */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {showCreateForm ? "Back to Quotation List" : "Create Quotation"}
        </button>
      </div>

      {/* Show Create Form */}
      {showCreateForm && (
        <div className="mb-6">
          <Quotation onClose={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* Show List only when not creating */}
      {!showCreateForm && (
        <>
          {error && <p className="text-red-500">{error}</p>}
          {loading && <p>Loading...</p>}

          {!loading && quotations.length === 0 && <p>No quotations found.</p>}

          {quotations.length > 0 && (
            <table className="w-full border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Quote No</th>
                  <th className="border p-2">Subject</th>
                  <th className="border p-2">Customer</th>
                  <th className="border p-2">Origin</th>
                  <th className="border p-2">Destination</th>
                  <th className="border p-2">Created By</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td className="border p-2">{q.quote_no}</td>
                    <td className="border p-2">{q.subject}</td>
                    <td className="border p-2">{q.customer_name}</td>
                    <td className="border p-2">{q.origin}</td>
                    <td className="border p-2">{q.destination}</td>
                    <td className="border p-2">{q.created_by_name}</td>
                    <td className="border p-2 space-x-2">
                      <button
                        onClick={() => handleEdit(q)}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Edit
                      </button>
                      {/* <button
                        onClick={() => handleDelete(q.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Edit Mode (Modal) */}
      {editingQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg p-6 w-3/4 h-[90%] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Quotation</h3>
              <button
                onClick={handleCloseEdit}
                className="text-gray-600 hover:text-black"
              >
                ✖
              </button>
            </div>
            {/* Reuse the form but pass editing data */}
            <Quotation existingQuotation={editingQuotation} onClose={handleCloseEdit} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationList;
