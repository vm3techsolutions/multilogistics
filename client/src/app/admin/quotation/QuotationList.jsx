"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllQuotations, clearQuotationMessages, approveQuotation } from "@/store/slices/quotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import EditQuotation from "./EditQuotation";
import QuotationView from "./QuotationView";
import { useRouter } from "next/navigation";

const QuotationList = ({ searchQuery, statusFilter }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { quotations, loading, error, successMessage } = useSelector((state) => state.quotation);
    const { list: customers } = useSelector((state) => state.customers);
    const { agents } = useSelector((state) => state.agents);

    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [editingQuotation, setEditingQuotation] = useState(null);

    const [viewingQuotation, setViewingQuotation] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        dispatch(getAllQuotations());
        dispatch(fetchCustomers());
        dispatch(getAgents());

        return () => {
            dispatch(clearQuotationMessages());
        };
    }, [dispatch]);

    const getCustomerName = (customerId) => {
        const customer = customers?.find((c) => c.id === customerId);
        return customer ? customer.name : "Unknown";
    };

    const getAgentName = (agentId) => {
        const agent = agents?.find((a) => a.id === agentId);
        return agent ? agent.name : "Unknown";
    };

    const filteredQuotations = quotations.filter((q) => {
        const matchesSearch =
            q.quote_no.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            getCustomerName(q.customer_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
            getAgentName(q.agent_id).toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter ? q.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredQuotations.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(filteredQuotations.length / rowsPerPage);

    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const openStatusPopup = (quotation) => {
        setSelectedQuotation(quotation);
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setSelectedQuotation(null);
        setIsPopupOpen(false);
    };

    const handleApprove = () => {
        dispatch(approveQuotation({ id: selectedQuotation.id, status: "approved" }));
        dispatch(getAllQuotations());
        closePopup();
    };

    const handleReject = () => {
        dispatch(approveQuotation({ id: selectedQuotation.id, status: "rejected" }));
        dispatch(getAllQuotations());
        closePopup();
    };

    if (editingQuotation) {
        return (
            <EditQuotation
                quotationData={editingQuotation}
                onClose={() => setEditingQuotation(null)}
            />
        );
    }

    if (viewingQuotation) {
        return (
            <QuotationView
                quotationData={viewingQuotation}
                onClose={() => setViewingQuotation(null)}
            />
        );
    }

    if (loading) return <p className="text-gray-500">Loading quotations...</p>;
    if (error) return <p className="text-red-500">Error: {error.message || error}</p>;

    return (
        <div className={`p-5 ${isPopupOpen ? "blur-sm" : ""}relative`}>
            <div className="transition-all">
                {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

                {filteredQuotations.length === 0 ? (
                    <p>No quotations found.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
                                <thead className="lightBg">
                                    <tr className="text-center">
                                        <th className="px-4 py-2 border">Date</th>
                                        <th className="px-4 py-2 border">Quotation No</th>
                                        <th className="px-4 py-2 border">Customer Name</th>
                                        <th className="px-4 py-2 border">Address</th>
                                        <th className="px-4 py-2 border">Agent Name</th>
                                        <th className="px-4 py-2 border">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map((q) => (
                                        <tr key={q.id} className="text-center hover:bg-gray-50">
                                            <td className="px-4 py-2 border">{new Date(q.created_at).toLocaleDateString("en-GB")}</td>
                                            {/* <td
                                                className="px-4 py-2 border border-gray-800 text-blue-600 cursor-pointer"
                                                onClick={() => setViewingQuotation(q)}
                                            >
                                                {q.quote_no}
                                            </td> */}
                                            <td
                                                className="px-4 py-2 border border-gray-800 text-blue-600 cursor-pointer"
                                                onClick={() => router.push(`/admin/quotation/invoice/${q.id}`)}
                                            >
                                                {q.quote_no}
                                            </td>
                                            <td className="px-4 py-2 border">{getCustomerName(q.customer_id)}</td>
                                            <td className="px-4 py-2 border">{q.address || "-"}</td>
                                            <td className="px-4 py-2 border">{getAgentName(q.agent_id)}</td>
                                            <td className="px-4 py-2 border flex justify-center gap-2">
                                                <button
                                                    className="px-3 py-1 primaryBtn text-white rounded-md "
                                                    onClick={() => openStatusPopup(q)}
                                                >
                                                    Status
                                                </button>
                                                <button
                                                    className="px-3 py-1 primaryBtn text-white rounded-md"
                                                    onClick={() => setEditingQuotation(q)}
                                                >
                                                    Edit
                                                </button>

                                                {/* <button className="px-3 py-1 primaryBtn text-white rounded-md ">
                                                    Delete
                                                </button> */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>


                        {/* Pagination */}
                        {/* Numbered Pagination */}
                        <div className="flex justify-center items-center mt-4 gap-2 flex-wrap">
                            {/* Prev Button */}
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded ${currentPage === page
                                        ? "primaryBg text-white"
                                        : "bg-gray-300 hover:bg-blue-400"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Next Button */}
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>

                    </>
                )}
            </div>

            {/* Centered Popup Modal */}
            {isPopupOpen && selectedQuotation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-80 flex flex-col items-center space-y-4">
                        <h2 className="text-lg font-semibold">Update Status</h2>
                        <p className="text-sm text-gray-500">Quotation No: {selectedQuotation.quote_no}</p>

                        {/* Current Status */}
                        <p className="text-sm">
                            Current Status:{" "}
                            <span
                                className={`font-semibold ${selectedQuotation.status === "approved"
                                    ? "text-green-600"
                                    : selectedQuotation.status === "rejected"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                    }`}
                            >
                                {selectedQuotation.status}
                            </span>
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                                disabled={selectedQuotation.status === "approved"} // disable if already approved
                            >
                                Approve
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                                disabled={selectedQuotation.status === "rejected"} // disable if already rejected
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

        </div>
    );
};

export default QuotationList;
