"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  addCustomer,
  getKycDocuments,
  editCustomer,
  updateCustomerStatus,
} from "@/store/slices/customerSlice";
import {
  Search,
  X,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
} from "lucide-react";
import AddCustomerForm from "./AddCustomerForm";

export default function CustDetails() {
  const dispatch = useDispatch();
  const { list: customers, loading, error, kycDocuments } = useSelector(
    (state) => state.customers
  );
  console.log("Fetched Customers:", customers);


  const [searchId, setSearchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  // ✅ Fetch all customers
  useEffect(() => {
    dispatch(fetchCustomers());


  }, [dispatch]);

  // ✅ Add new customer
  const handleAddCustomer = (formData) => {
    dispatch(addCustomer(formData)).then(() => {
      setShowForm(false);
    });
  };

  // ✅ Sort by ID
  const handleSortById = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // ✅ Toggle Status (Enable/Disable)
  const handleDelete = (id, is_active) => {
    const newStatus = !is_active;
    if (confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this customer?`)) {
      dispatch(updateCustomerStatus({ id, status: newStatus }))
        .unwrap()
        .then(() => {
          alert(`Customer ${newStatus ? 'activated' : 'deactivated'} successfully!`);
          dispatch(fetchCustomers());
        })
        .catch((err) => {
          console.error("Failed to update status:", err);
          alert("Failed to update status");
        });
    }
  };


  // ✅ View Documents
  const handleViewDocuments = async (custId) => {
    try {
      const result = await dispatch(getKycDocuments(custId)).unwrap();
      if (result && result.documents && result.documents.length > 0) {
        setSelectedDocs(result.documents);
      } else {
        setSelectedDocs([]);
      }
      setShowDocsModal(true);
    } catch (err) {
      console.error("Failed to fetch KYC documents:", err);
      setSelectedDocs([]);
      setShowDocsModal(true);
    }
  };

  // ✅ Filter & sort customers
  const filteredCustomers = customers
    .filter((cust) => {
      const matchesSearch =
        searchId === "" ||
        cust.id.toString().includes(searchId.trim()) ||
        cust.name.toLowerCase().includes(searchId.toLowerCase());

        const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && cust.is_active) ||
      (statusFilter === "inactive" && !cust.is_active);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (sortOrder === "asc" ? a.id - b.id : b.id - a.id));

  // ✅ Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const currentCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + customersPerPage
  );

  return (
    <div className="max-w-full mx-auto relative">
      {/* 🔍 Search */}
      <div className="flex flex-wrap items-center gap-4 bg-white px-6 py-8 border rounded-2xl border-gray-300">
        {/* 🔍 Search Bar */}
        <div className="relative flex-1 min-w-[250px]">
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

        {/* ⚙️ Active / Inactive Filter */}
        <div>
          <select
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F7FCFE] p-2 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-800 border border-gray-300"
          >
            {/* <option value="all">All Customers</option> */}
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>


      {/* 📋 Customers Table */}
      <div className="relative mt-8 bg-white p-6 border border-gray-300 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold primaryText">Customers</h2>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
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
                      Documents
                    </th>

                    <th className="p-3 border border-gray-200 text-center">
                      Actions
                    </th>

                    <th className="p-3 border border-gray-200 text-center">
                      Status
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
                      <td className="p-3 border border-gray-200">{cust.address}</td>

                      {/* ✅ Documents */}
                      <td className="p-3 border border-gray-200 text-center">
                        <button
                          onClick={() => handleViewDocuments(cust.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </td>

                      {/* ✅ Actions */}
                      <td className="p-3 border border-gray-200 text-center space-x-2">
                        <button
                          onClick={() => {
                            setEditData(cust);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Customer"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {/* <button
                          onClick={() => handleToggleStatus(cust)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Customer"
                        >
                          <Trash2 size={18} />
                        </button> */}
                      </td>

                      {/* ✅ Status Column */}
                      <td className="p-3 border border-gray-200 text-center">
                        <button
                          onClick={() => handleDelete(cust.id, cust.is_active)}
                          className={`text-sm px-2 py-1 rounded ${cust.is_active ? 'bg-green-500' : 'bg-red-500'} text-white`}
                        >
                          {cust.is_active ? 'Active' : 'Inactive'}
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Documents Modal */}
            {showDocsModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 relative">
                  <button
                    onClick={() => setShowDocsModal(false)}
                    className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h3 className="text-xl font-semibold mb-4">KYC Documents</h3>

                  {selectedDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedDocs.map((doc, index) => (
                        <div
                          key={index}
                          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                          {doc.mimeType?.includes("image") ? (
                            <img
                              src={doc.document_url}
                              alt={doc.document_type}
                              className="w-full h-40 object-cover cursor-pointer"
                              onClick={() =>
                                window.open(doc.document_url, "_blank")
                              }
                            />
                          ) : (
                            <div
                              onClick={() =>
                                window.open(doc.document_url, "_blank")
                              }
                              className="flex flex-col items-center justify-center h-40 bg-gray-100 cursor-pointer"
                            >
                              <FileText className="text-gray-600 w-10 h-10 mb-2" />
                              <span className="text-gray-700 text-sm">
                                {doc.document_type}
                              </span>
                              <p className="text-xs text-gray-400">
                                (Click to view)
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center">
                      No documents found.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1}–
                  {Math.min(
                    startIndex + customersPerPage,
                    filteredCustomers.length
                  )}{" "}
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
                      className={`px-3 py-1 border rounded ${currentPage === i + 1
                        ? "bg-green-600 text-white"
                        : "bg-white"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
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

      {/* 🧾 Add/Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => {
                setShowForm(false);
                setEditData(null);
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>

            <AddCustomerForm
              editData={editData}
              onClose={() => {
                setShowForm(false);
                setEditData(null);
                dispatch(fetchCustomers());
              }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
