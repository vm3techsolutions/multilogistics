"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAgents, createAgent } from "@/store/slices/agentSlice";
import { Search, X } from "lucide-react";
import AddAgentForm from "./AddAgentForm";

export default function Agents() {
  const dispatch = useDispatch();
  const { agents, loading, error } = useSelector((state) => state.agents);

  const [searchId, setSearchId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;

  useEffect(() => {
    dispatch(getAgents());
  }, [dispatch]);

  const handleAddAgent = (agentData) => {
    dispatch(createAgent(agentData)).then(() => {
      setShowForm(false);
    });
  };

  // Sort first, then filter
  const sortedAgents = [...agents].sort((a, b) => (b.id || 0) - (a.id || 0));

  // Filter
  const filteredAgents = sortedAgents.filter((agent) => {
    const matchesSearch =
      searchId === "" ||
      (agent.id && agent.id.toString().includes(searchId.trim())) ||
      (agent.name &&
        agent.name.toLowerCase().includes(searchId.toLowerCase())) ||
      (agent.contact_person_name &&
        agent.contact_person_name
          .toLowerCase()
          .includes(searchId.toLowerCase()));

    const matchesType =
      typeFilter === "" ||
      (agent.type && agent.type.toLowerCase() === typeFilter.toLowerCase());

    return matchesSearch && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);
  const startIndex = (currentPage - 1) * agentsPerPage;
  const currentAgents = filteredAgents.slice(
    startIndex,
    startIndex + agentsPerPage
  );

  return (
    <div className="max-w-full mx-auto relative">
      {/* Search & Filter */}
      <div className="flex items-center gap-4 bg-white px-6 py-8 border-1 rounded-2xl border-gray-300">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name"
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F7FCFE] pl-10 p-2 rounded w-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-800"
          />
        </div>
        <select
          className="bg-[#F7FCFE] px-4 py-3 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-800"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Type</option>
          <option value="import">Import</option>
          <option value="export">Export</option>
        </select>
      </div>

      {/* Agents Table */}
      <div className="relative mt-8 bg-white p-6 border border-gray-300 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold primaryText">Agents</h2>

          {/* Add Agent Button inside title row */}
          <button
            onClick={() => setShowForm(true)}
            className="primaryBg text-white px-5 py-2 rounded-md shadow hover:bg-green-700 transition"
          >
            + Add Agent
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : agents.length === 0 ? (
          <p>No agents found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-500">
                    <th className="p-3 border border-gray-200">ID</th>
                    <th className="p-3 border border-gray-200">Agency Name</th>
                    <th className="p-3 border border-gray-200">
                      Contact Person
                    </th>
                    <th className="p-3 border border-gray-200">Email</th>
                    <th className="p-3 border border-gray-200">Phone</th>
                    <th className="p-3 border border-gray-200">Address</th>
                    <th className="p-3 border border-gray-200">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAgents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="hover:bg-gray-50 transition text-gray-800"
                    >
                      <td className="p-3 border border-gray-200">{agent.id}</td>
                      <td className="p-3 border border-gray-200">
                        {agent.name}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {agent.contact_person_name}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {agent.email}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {agent.phone}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {agent.country}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {agent.type || "N/A"}
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
                  {Math.min(startIndex + agentsPerPage, filteredAgents.length)}{" "}
                  of {filteredAgents.length}
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
        )}
      </div>

      {/* Modal Popup for Add Agent */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 transform transition-all duration-300 scale-95 animate-fadeIn">
            {/* Close button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>

            <AddAgentForm
              onSubmit={handleAddAgent}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
