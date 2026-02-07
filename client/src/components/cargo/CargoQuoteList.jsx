"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllCargoQuotations,
  updateCargoQuotationStatus,
  sendCargoQuotationEmail,
} from "@/store/slices/cargoQuotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import { useRouter } from "next/navigation";
import CreateCargoQuote from "@/components/cargo/CreateCargoQuote";

const CargoQuoteList = ({ searchQuery = "", statusFilter = "" }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [editingQuotation, setEditingQuotation] = useState(null);

  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const {
    quotations = [],
    loading,
    error,
  } = useSelector((state) => state.cargoQuotation);
  const { list: customers = [] } = useSelector((state) => state.customers);
  const { agents = [] } = useSelector((state) => state.agents);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    dispatch(getAllCargoQuotations());
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  /* ================= HELPERS ================= */
  const getCustomerName = (id) =>
    customers.find((c) => c.id === id)?.name || "Unknown";

  const getAgentName = (id) =>
    agents.find((a) => a.id === id)?.name || "Unknown";

  /* ================= FILTER ================= */
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quote_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCustomerName(q.customer_id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      getAgentName(q.agent_id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter ? q.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  /* ================= STATUS UPDATE ================= */
  const handleApprove = () => {
    dispatch(
      updateCargoQuotationStatus({
        id: selectedQuotation.id,
        status: "approved",
      }),
    ).then(() => {
      dispatch(getAllCargoQuotations());
      closePopup();
    });
  };

  const handleReject = () => {
    dispatch(
      updateCargoQuotationStatus({
        id: selectedQuotation.id,
        status: "rejected",
      }),
    ).then(() => {
      dispatch(getAllCargoQuotations());
      closePopup();
    });
  };

  //   Status Update
  const openStatusPopup = (quotation) => {
    setSelectedQuotation(quotation);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setSelectedQuotation(null);
    setIsPopupOpen(false);
  };

  const handleSendEmail = (id) => {
    dispatch(sendCargoQuotationEmail(id))
      .unwrap()
      .then(() => {
        alert("Cargo quotation email sent successfully!");
        dispatch(getAllCargoQuotations());
      })
      .catch((err) => {
        alert(
          "Failed to send email: " +
            (err?.message || err?.error || "Unknown error"),
        );
      });
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredQuotations.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredQuotations.length / rowsPerPage);

  if (loading)
    return <p className="text-gray-500">Loading cargo quotations...</p>;
  if (error) return <p className="text-red-500">{error.message || error}</p>;

  /* ================= UI ================= */
  return (
    <div className="w-full">
      {/* ================= EDIT MODE ================= */}
      {editingQuotation ? (
        <CreateCargoQuote
          mode="edit"
          initialData={editingQuotation}
          onSuccess={() => {
            dispatch(getAllCargoQuotations());
            setEditingQuotation(null);
          }}
          onClose={() => setEditingQuotation(null)}
        />
      ) : (
        <div className="overflow-x-auto">
          {filteredQuotations.length === 0 ? (
            <p>No cargo quotations found.</p>
          ) : (
            <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
              <thead className="lightBg">
                <tr className="text-center">
                  <th className="px-4 py-2 border">S.No</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Quotation No</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Agent</th>
                  <th className="px-4 py-2 border">POL</th>
                  <th className="px-4 py-2 border">POD</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-sm">
                {currentRows.map((q, index) => (
                  <tr key={q.id} className="text-center hover:bg-gray-50">
                    <td className="px-4 py-2 border font-medium">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>

                    <td className="px-4 py-2 border">
                      {new Date(q.created_at).toLocaleDateString("en-GB")}
                    </td>

                    <td
                      className="px-4 py-2 border text-blue-600 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/quotation/cargo/invoice/${q.id}`)
                      }
                    >
                      {q.quote_no}
                    </td>

                    <td className="px-4 py-2 border">
                      {getCustomerName(q.customer_id)}
                    </td>

                    <td className="px-4 py-2 border">
                      {getAgentName(q.agent_id)}
                    </td>

                    <td className="px-4 py-2 border">{q.pol}</td>
                    <td className="px-4 py-2 border">{q.pod}</td>

                    <td className="px-4 py-2 border">
                      <span
                        className={`px-2 py-1 rounded text-white text-sm ${
                          q.status === "approved"
                            ? "bg-green-600"
                            : q.status === "rejected"
                              ? "bg-red-600"
                              : "bg-yellow-500"
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>

                    <td className="px-4 py-2 border text-sm flex justify-center gap-2">
                      {/* Status Popup */}
                      <button
                        className="px-3 py-1 primaryBtn text-white rounded-md"
                        onClick={() => openStatusPopup(q)}
                      >
                        Status
                      </button>

                      {/* ✏️ Edit */}
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded-md"
                        onClick={() =>
                          setEditingQuotation({
                            ...q,
                            customer_name: getCustomerName(q.customer_id),
                            agent_name: getAgentName(q.agent_id),
                          })
                        }
                      >
                        Edit
                      </button>

                      {/* ⭐ Send Email only when status is draft */}
                      {q.status === "draft" && (
                        <button
                          className="px-3 py-1 primaryBtn text-white rounded-md"
                          onClick={() => handleSendEmail(q.id)}
                        >
                          Send Email
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {isPopupOpen && selectedQuotation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 w-80 flex flex-col items-center space-y-4">
                <h2 className="text-lg font-semibold">Update Status</h2>

                <p className="text-sm text-gray-500">
                  Quotation No: {selectedQuotation.quote_no}
                </p>

                <p className="text-sm">
                  Current Status:{" "}
                  <span
                    className={`font-semibold ${
                      selectedQuotation.status === "approved"
                        ? "text-green-600"
                        : selectedQuotation.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {selectedQuotation.status}
                  </span>
                </p>

                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    disabled={selectedQuotation.status === "approved"}
                  >
                    Approve
                  </button>

                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    disabled={selectedQuotation.status === "rejected"}
                  >
                    Reject
                  </button>
                </div>

                <button
                  onClick={closePopup}
                  className="mt-2 px-3 py-1 text-gray-700 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Edit Quotation */}
          {editingQuotation && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
              <div className="bg-white w-full max-w-6xl rounded-xl overflow-y-auto max-h-[90vh]">
                <CreateCargoQuote
                  mode="edit"
                  initialData={editingQuotation}
                  onSuccess={() => {
                    dispatch(getAllCargoQuotations());
                  }}
                  onClose={() => setEditingQuotation(null)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CargoQuoteList;
