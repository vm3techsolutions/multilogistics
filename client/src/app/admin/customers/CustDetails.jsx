"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  addCustomer,
  fetchCustomerKycDocuments,
  deleteCustomer,
} from "@/store/slices/customerSlice"; // ✅ Make sure to create delete & fetch KYC slice
import { Search, X, Eye, Edit, Trash2, CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import AddCustomerForm from "./AddCustomerForm";

export default function CustDetails() {
  const dispatch = useDispatch();
  const { list: customers, loading, error } = useSelector(
    (state) => state.customers
  );

  const [searchId, setSearchId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  // ✅ Fetch all customers on mount
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  // ✅ Add new customer
  const handleAddCustomer = (formData) => {
    dispatch(addCustomer(formData)).then(() => {
      setShowForm(false);
    });
  };


  // Sorting Function
  const handleSortById = () => {
    setSortOrder( sortOrder === "asc" ? "desc" : "asc" );
  };

  // ✅ Delete customer
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      dispatch(deleteCustomer(id));
    }
  };

  // ✅ Filtered customers
  const filteredCustomers = customers.filter(
    (cust) => {
      const matchesSearch =
        searchId === "" ||
        cust.id.toString().includes(searchId.trim()) ||
        cust.name.toLowerCase().includes(searchId.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.id - b.id;
      else return b.id-a.id;
    });

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const currentCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + customersPerPage
  );

  return (
    <div className="max-w-full mx-auto relative">
      {/* 🔍 Search */}
      <div className="flex items-center gap-4 bg-white px-6 py-8 border-1 rounded-2xl border-gray-300">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by ID or Name"
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F7FCFE] pl-10 p-2 text-gray-700 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-800"
          />
        </div>
      </div>

      {/* 📋 Customers Table */}
      <div className="relative mt-8 bg-white p-6 border border-gray-300 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold primaryText">Customers</h2>
          <button
            onClick={() => setShowForm(true)}
            className="primaryBg text-white px-5 py-2 rounded-md shadow hover:bg-green-700 transition"
          >
            + Add Customer
          </button>
        </div>

        {loading ? (
          <p className="text-gray-700">Loading...</p>
        ) : currentCustomers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border text-gray-700 border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th
                      className="p-3 border border-gray-200 cursor-pointer select-none"
                      onClick={handleSortById}
                    >
                      <div className="flex items-center gap-1">
                        <span>ID</span>
                        {sortOrder === "asc" ? (
                          <ChevronUp size={16} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-600" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 border border-gray-200">Name</th>
                    <th className="p-3 border border-gray-200">Company</th>
                    <th className="p-3 border border-gray-200">Email</th>
                    <th className="p-3 border border-gray-200">Phone</th>
                    <th className="p-3 border border-gray-200">Address</th>
                    <th className="p-3 border border-gray-200 text-center">
                      Document
                    </th>
                    <th className="p-3 border border-gray-200 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 border border-gray-200">{cust.id}</td>
                      <td className="p-3 border border-gray-200">{cust.name}</td>
                      <td className="p-3 border border-gray-200">
                        {cust.company_name}
                      </td>
                      <td className="p-3 border border-gray-200">{cust.email}</td>
                      <td className="p-3 border border-gray-200">{cust.phone}</td>
                      <td className="p-3 border border-gray-200">
                        {cust.address}
                      </td>

                      {/* ✅ Document status */}
                      <td className="p-3 border border-gray-200 text-center">
                        {cust.document_uploaded ? (
                          <span className="flex items-center justify-center text-green-600 gap-1">
                            <CheckCircle size={18} /> Uploaded
                          </span>
                        ) : (
                          <span className="flex items-center justify-center text-red-600 gap-1">
                            <XCircle size={18} /> Missing
                          </span>
                        )}
                      </td>

                      {/* ✅ Action Buttons */}
                      <td className="p-3 border border-gray-200 text-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="View Customer"
                          onClick={() => alert(`Viewing customer ${cust.id}`)}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Edit Customer"
                          onClick={() => alert(`Editing customer ${cust.id}`)}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete Customer"
                          onClick={() => handleDelete(cust.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + customersPerPage, filteredCustomers.length)}{" "}
                  of {filteredCustomers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === i + 1
                          ? "bg-green-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-700">No customers found.</p>
        )}
      </div>

      {/* 🧾 Modal Popup for Add Customer */}
      {showForm && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 relative transform transition-all duration-300 scale-95 animate-fadeIn">
      <button
        onClick={() => setShowForm(false)}
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
      >
        <X className="w-6 h-6" />
      </button>

      <AddCustomerForm
        onSubmit={handleAddCustomer}
        onCancel={() => setShowForm(false)}
      />
    </div>
  </div>
)}


      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
