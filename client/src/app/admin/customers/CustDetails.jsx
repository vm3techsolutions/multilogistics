"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers, addCustomer } from "@/store/slices/customerSlice";
import { Search, X } from "lucide-react";
import AddCustomerForm from "./AddCustomerForm";

export default function CustDetails() {
  const dispatch = useDispatch();
  const { list: customers, loading, error } = useSelector(
    (state) => state.customers
  );

  const [searchId, setSearchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  // Fetch all customers
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Add new customer
  const handleAddCustomer = (customerData) => {
    dispatch(addCustomer(customerData)).then(() => {
      setShowForm(false);
    });
  };

  // Filtered customer list
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      searchId === "" ||
      cust.id.toString().includes(searchId.trim()) ||
      cust.name.toLowerCase().includes(searchId.toLowerCase());

    const matchesStatus =
      statusFilter === "" || cust.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const currentCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + customersPerPage
  );

  return (
    <div className="max-w-full mx-auto relative">
      {/* Search & Filter */}
      <div className="flex items-center gap-4 bg-white px-6 py-8 border-1 rounded-2xl border-gray-300">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by ID/Name"
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F7FCFE] pl-10 p-2 text-gray-700 rounded w-full focus:outline-none focus:ring-2 focus:ring-cyan-800"
          />
        </div>
        {/* <select
          className="bg-[#F7FCFE] px-4 py-3 rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-800"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select> */}
      </div>

      {/* Customers Table Section */}
      <div className="relative mt-8 bg-white p-6 border border-gray-300 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold primaryText">Customers</h2>
          {/* Add Customer Button inside title row */}
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
                    <th className="p-3 border border-gray-200">ID</th>
                    <th className="p-3 border border-gray-200">Name</th>
                    <th className="p-3 border border-gray-200">Company</th>
                    <th className="p-3 border border-gray-200">Email</th>
                    <th className="p-3 border border-gray-200">Phone</th>
                    <th className="p-3 border border-gray-200">Address</th>
                    {/* <th className="p-3 border border-gray-200">Status</th> */}
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 border border-gray-200">{cust.id}</td>
                      <td className="p-3 border border-gray-200">{cust.name}</td>
                      <td className="p-3 border border-gray-200">{cust.company_name}</td>
                      <td className="p-3 border border-gray-200">{cust.email}</td>
                      <td className="p-3 border border-gray-200">{cust.phone}</td>
                      <td className="p-3 border border-gray-200">{cust.address}</td>
                      {/* <td className="p-3 border border-gray-200">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cust.status === "active"
                              ? "bg-green-100 text-green-700"
                              : cust.status === "inactive"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {cust.status || "Active"}
                        </span>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + customersPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                        currentPage === i + 1 ? "bg-green-600 text-white" : "bg-white"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {/* Modal Popup for Add Customer */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative transform transition-all duration-300 scale-95 animate-fadeIn">
            {/* Close button */}
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
