// Orders.jsx
"use client";
import Import from "./Import";
import Export from "./CourierExports";

export default function Orders({ subTab, setSubTab }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 primaryText">Orders</h2>

      <div className="flex space-x-4 mb-4 border-b border-gray-300">
        <button
          onClick={() => setSubTab("Import")}
          className={`px-4 py-2 transition ${
            subTab === "Import"
              ? "border-b-2 border-blue-600 primaryText font-semibold"
              : "hover:text-blue-600 primaryText"
          }`}
        >
          Import
        </button>
        <button
          onClick={() => setSubTab("Export")}
          className={`px-4 py-2 transition ${
            subTab === "Export"
              ? "border-b-2 border-blue-600 primaryText font-semibold"
              : "hover:text-blue-600 primaryText"
          }`}
        >
          Export
        </button>
      </div>

      <div>
        {subTab === "Import" && <Import />}
        {subTab === "Export" && <Export />}
      </div>
    </div>
  );
}
