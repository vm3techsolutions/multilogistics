"use client";

export default function StatsCard({ title, value, icon: Icon, color = "bg-blue-500" }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 flex items-center border border-gray-200 hover:shadow-lg transition-all">
      {/* Icon */}
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-full text-white mr-4 ${color}`}
      >
        <Icon className="w-6 h-6" />
      </div>

      {/* Text */}
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
      </div>
    </div>
  );
}
