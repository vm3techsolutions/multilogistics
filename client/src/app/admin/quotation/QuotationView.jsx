"use client";
import React, { useRef } from "react";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


const QuotationView = ({ quotationData, onClose }) => {
  const q = quotationData;

  // Fetch agent & customer info from slice
  const agent = useSelector((state) => state.agent.agents);
  const customer = useSelector((state) => state.customer.customers);

  const pdfRef = useRef(null);

  if (!q) return <p className="text-center py-10">Loading...</p>;

  /* ------------------ SORTING CHARGES ------------------ */
  const courierCharge = q.charges.filter(
    (c) => c.type === "freight" && c.charge_name.toLowerCase() === "courier"
  );

  const otherFreightCharges = q.charges.filter(
    (c) => c.type === "freight" && c.charge_name.toLowerCase() !== "courier"
  );

  const destinationCharges = q.charges.filter((c) => c.type === "destination");

  /* ------------------ PDF DOWNLOAD ------------------ */
  const downloadPDF = async () => {
    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`quotation-${q.quote_no}.pdf`);
  };

  /* ------------------ CALCULATE TOTALS ------------------ */
  const calcFreightTotal = (charge) => {
    if (charge.amount) return Number(charge.amount);
    return Number(charge.rate_per_kg || 0) * Number(charge.weight || 0);
  };

  return (
    <div className="w-full flex justify-center pb-10">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl border p-8 relative">
        
        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 mb-5">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Print
          </button>

          <button
            onClick={downloadPDF}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Download PDF
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Close
          </button>
        </div>

        {/* QUOTATION AREA */}
        <div ref={pdfRef} className="px-6">

          {/* HEADER */}
          <div className="flex justify-between items-start border-b pb-4">
            <img src="/assets/logo/logo.png" alt="Logo" className="h-16" />

            <div className="text-right text-sm">
              <p><strong>Quotation No:</strong> {q.quote_no}</p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(q.created_at).toLocaleDateString("en-GB")}
              </p>

              {/* EMAIL & PHONE */}
              <p><strong>Email:</strong> {agent?.email || "N/A"}</p>
              <p><strong>Phone:</strong> {agent?.phone || "N/A"}</p>

              <p><strong>Agent:</strong> {agent?.name || q.agent_name}</p>
              <p><strong>Subject:</strong> {q.subject || "-"}</p>
            </div>
          </div>

          {/* CUSTOMER + SHIPMENT DETAILS */}
          <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl border">
              <h3 className="font-semibold text-lg text-[#1E123A] mb-2">
                Customer Details
              </h3>
              <p><strong>Name:</strong> {customer?.name || q.customer_name}</p>
              <p><strong>Email:</strong> {customer?.email}</p>
              <p><strong>Phone:</strong> {customer?.phone}</p>
              <p className="mt-1"><strong>Address:</strong> {q.address}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border">
              <h3 className="font-semibold text-lg text-[#1E123A] mb-2">
                Shipment Details
              </h3>
              <p><strong>Origin:</strong> {q.origin}</p>
              <p><strong>Destination:</strong> {q.destination}</p>
              <p><strong>Packages:</strong> {q.packages?.length}</p>
            </div>
          </div>

          {/* PACKAGES TABLE */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg text-[#1E123A] mb-3">
              Packages
            </h3>

            <table className="w-full border rounded-xl overflow-hidden text-sm">
              <thead className="bg-[#1E123A] text-white">
                <tr>
                  <th className="border px-2 py-2">Length</th>
                  <th className="border px-2 py-2">Width</th>
                  <th className="border px-2 py-2">Height</th>
                  <th className="border px-2 py-2">Qty</th>
                </tr>
              </thead>

              <tbody>
                {q.packages?.map((p, i) => (
                  <tr key={i} className="text-center hover:bg-gray-50">
                    <td className="border px-2 py-2">{p.length}</td>
                    <td className="border px-2 py-2">{p.width}</td>
                    <td className="border px-2 py-2">{p.height}</td>
                    <td className="border px-2 py-2">{p.same_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FREIGHT CHARGES */}
          <div className="mt-10">
            <h3 className="font-semibold text-lg text-[#1E123A] mb-3">
              Freight Charges
            </h3>

            <table className="w-full border rounded-xl overflow-hidden text-sm">
              <thead className="bg-[#1E123A] text-white">
                <tr>
                  <th className="px-3 py-2">Charge Name</th>
                  <th className="px-3 py-2">Rate/KG</th>
                  <th className="px-3 py-2">Weight</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>

              <tbody>
                {[...courierCharge, ...otherFreightCharges].map((c, i) => {
                  const total = calcFreightTotal(c);

                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{c.charge_name}</td>
                      <td className="border px-3 py-2 text-center">{c.rate_per_kg}</td>
                      <td className="border px-3 py-2 text-center">{c.weight_kg}</td>
                      <td className="border px-3 py-2 text-right">{c.amount}</td>
                      <td className="border px-3 py-2 text-right font-semibold">
                        {total}
                      </td>
                    </tr>
                  );
                })}

                <tr className="bg-gray-100">
                  <td colSpan="4" className="border px-3 py-2 font-semibold">
                    Freight Total
                  </td>
                  <td className="border px-3 py-2 text-right font-bold">
                    {q.total_freight_amount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DESTINATION CHARGES */}
          <div className="mt-10">
            <h3 className="font-semibold text-lg text-[#1E123A] mb-3">
              Destination Charges
            </h3>

            <table className="w-full border rounded-xl overflow-hidden text-sm">
              <thead className="bg-[#1E123A] text-white">
                <tr>
                  <th className="px-3 py-2">Charge Name</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {destinationCharges.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{c.charge_name}</td>
                    <td className="border px-3 py-2 text-right">{c.amount}</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {q.total}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-100">
                  <td className="border px-3 py-2 font-semibold">
                    Destination Total
                  </td>
                  <td colSpan="2" className="border px-3 py-2 text-right font-bold">
                    {q.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* GRAND TOTAL */}
          <div className="mt-10 text-right">
            <p className="text-md"><strong>GST:</strong> 18%</p>
            <p className="text-xl font-bold text-[#FF442A] mt-2">
              Grand Total: ₹{q.final_total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationView;
