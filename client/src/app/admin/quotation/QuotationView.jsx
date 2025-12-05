"use client";
import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import { Printer, Download, X } from "lucide-react";
import { useRouter } from "next/navigation";

const QuotationView = ({ quotationData }) => {
  const q = quotationData;
  const router = useRouter();
  const dispatch = useDispatch();

  const { list: customers = [] } = useSelector((state) => state.customers);
  const { agents = [] } = useSelector((state) => state.agents);

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  const customer = customers.find((c) => c.id === q.customer_id);
  const agent = agents.find((a) => a.id === q.agent_id);

  const pdfRef = useRef(null);

  if (!q) return <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>;

  const courierCharge = q.charges.filter(
    (c) => c.type === "freight" && c.charge_name.toLowerCase() === "courier"
  );

  const otherFreightCharges = q.charges.filter(
    (c) => c.type === "freight" && c.charge_name.toLowerCase() !== "courier"
  );

  const destinationCharges = q.charges.filter((c) => c.type === "destination");

  const printInvoice = () => {
    const printContents = pdfRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

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

  // Include freight + FSC
  const freight = Number(q.total_freight_amount) || 0; 
  // Include freight + FSC + destination
  const finalTotal = Number(q.total) || 0;
  //  calculate gst on finalTotal
  const gst = (finalTotal) * 0.18;
  const grandTotal = Number(q.final_total);

  const calcFreightTotal = (charge) => {
    if (charge.amount) return Number(charge.amount);
    return Number(charge.rate_per_kg || 0) * Number(charge.weight || 0);
  };

  useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    @media print {
      thead th {
        background: #1C5070 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
  document.head.appendChild(style);
}, []);


  return (
    <div className="w-full flex justify-center pb-10">
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          padding: "32px",
          position: "relative",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        }}
        className="w-full max-w-4xl"
      >

        {/* Floating Buttons */}
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <button
            onClick={printInvoice}
            style={{
              padding: "12px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
            }}
          >
            <Printer size={20} />
          </button>

          <button
            onClick={downloadPDF}
            style={{
              padding: "12px",
              borderRadius: "50%",
              background: "#16a34a",
              color: "white",
              cursor: "pointer",
              boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
            }}
          >
            <Download size={20} />
          </button>

          <button
            onClick={() => router.push("/quotations")}
            style={{
              padding: "12px",
              borderRadius: "50%",
              background: "#dc2626",
              color: "white",
              cursor: "pointer",
              boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* PDF WRAPPER */}
        <div ref={pdfRef} style={{ paddingLeft: "24px", paddingRight: "24px" }}>

          {/* HEADER */}
          <div
            style={{
              borderBottom: "1px solid #d1d5db",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <img src="/assets/logo/logo.png" style={{ height: "80px" }} />

            <div style={{ textAlign: "right", fontSize: "14px" }}>
              <p><strong>Quotation No:</strong> {q.quote_no}</p>
              <p><strong>Date:</strong> {new Date(q.created_at).toLocaleDateString("en-GB")}</p>
              <p><strong>Email:</strong> info@multilogistics.co.in</p>
              <p><strong>Phone:</strong> +91 8411007077</p>
            </div>
          </div>

          {/* CUSTOMER + SHIPMENT */}
          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "10px 16px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                Customer Details
              </h3>

              <p><strong>Name:</strong> {customer?.name || q.customer_name}</p>
              <p><strong>Email:</strong> {customer?.email}</p>
              <p><strong>Phone:</strong> {customer?.phone}</p>
              <p><strong>Address:</strong> {q.address}</p>
            </div>

            <div
              style={{
                background: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "10px 16px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                Shipment Details
              </h3>

              <p><strong>Origin:</strong> {q.origin}</p>
              <p><strong>Destination:</strong> {q.destination}</p>
              <p><strong>Packages:</strong> {q.packages?.length}</p>
              <p><strong>Agent:</strong> {agent?.name || q.agent_name}</p>
            </div>
          </div>

          {/* PACKAGES TABLE */}
          <div style={{ marginTop: "10px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
              Packages
            </h3>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thHeader}>Length</th>
                  <th style={thHeader}>Width</th>
                  <th style={thHeader}>Height</th>
                  <th style={thHeader}>Qty</th>
                </tr>
              </thead>

              <tbody>
                {q.packages.map((p, i) => (
                  <tr key={i} style={{ textAlign: "center" }}>
                    <td style={td}>{p.length}</td>
                    <td style={td}>{p.width}</td>
                    <td style={td}>{p.height}</td>
                    <td style={td}>{p.same_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FREIGHT CHARGES */}
          <div style={{ marginTop: "10px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
              Freight Charges
            </h3>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thHeader}>Charge Name</th>
                  <th style={thHeader}>Rate/KG</th>
                  <th style={thHeader}>Weight</th>
                  <th style={thHeader}>Amount</th>
                  <th style={thHeader}>Total</th>
                </tr>
              </thead>

              <tbody>
                {[...courierCharge, ...otherFreightCharges].map((c, i) => {
  const total = calcFreightTotal(c);

  const isFsc = c?.charge_name?.toLowerCase() === "fsc";

  return (
    <tr key={i}>
      {/* Charge Name */}
      <td style={td}>{c.charge_name}</td>

      {/* Rate Per KG */}
      <td style={{ ...td, textAlign: "center" }}>{c.rate_per_kg}</td>

      {/* Weight – blank when FSC */}
      <td style={{ ...td, textAlign: "center" }}>
        {isFsc ? "" : c.weight_kg}
      </td>

      {/* Amount */}
      <td style={{ ...td, textAlign: "right" }}>{c.amount}</td>

      {/* Total – show total_freight_amount for FSC */}
      <td style={{ ...td, textAlign: "right", fontWeight: "600" }}>
        {isFsc ? q.total_freight_amount : total}
      </td>
    </tr>
  );
})}


                <tr style={{ background: "#f3f4f6" }}>
                  <td colSpan="4" style={{ ...td, fontWeight: "600" }}>
                    Freight Total
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: "700" }}>
                    {q.total_freight_amount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DESTINATION CHARGES */}
          <div style={{ marginTop: "10px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
              Destination Charges
            </h3>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thHeader}>Charge Name</th>
                  <th style={{ ...thHeader, textAlign: "right" }}>Amount</th>
                  <th style={{ ...thHeader, textAlign: "right" }}>Total</th>
                </tr>
              </thead>

              <tbody>
                {destinationCharges.map((c, i) => {
                  const destSumTillRow = destinationCharges
                    .slice(0, i + 1)
                    .reduce((sum, item) => sum + Number(item.amount), 0);

                  const baseAmount = Number(q.total_freight_amount);
                  const rowTotal = baseAmount + destSumTillRow;

                  return (
                    <tr key={i}>
                      <td style={td}>{c.charge_name}</td>
                      <td style={{ ...td, textAlign: "right" }}>{c.amount}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: "600" }}>{rowTotal}</td>
                    </tr>
                  );
                })}

                <tr style={{ background: "#f3f4f6" }}>
                  <td style={{ ...td, fontWeight: "600" }}>Final Total</td>
                  <td colSpan="2" style={{ ...td, textAlign: "right", fontWeight: "700" }}>
                    {Number(q.total_freight_amount) +
                      destinationCharges.reduce((sum, item) => sum + Number(item.amount), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* GRAND TOTAL */}
          <div style={{ marginTop: "10px" }}>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...td, fontWeight: "600" }}>GST (18%)</td>
                  <td style={{ ...td, textAlign: "right" }}>{gst.toFixed(2)}</td>
                </tr>

                <tr style={{ background: "#f3f4f6" }}>
                  <td style={{ ...td, fontWeight: "700", fontSize: "18px", color: "#1f2937" }}>
                    Grand Total
                  </td>
                  <td
                    style={{
                      ...td,
                      fontWeight: "700",
                      fontSize: "18px",
                      textAlign: "right",
                      color: "#15803d",
                    }}
                  >
                    ₹{grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

/* --- FIXED HEADER BACKGROUND (works with print + PDF) --- */
const thHeader = {
  border: "1px solid #d1d5db",
  padding: "6px",
  fontSize: "14px",
  fontWeight: "600",
  background: "#1C5070",
  color: "white",
  textAlign: "center",
};

/* NORMAL CELL */
const td = {
  border: "1px solid #d1d5db",
  padding: "6px",
  fontSize: "14px",
};

/* TABLE STYLE (rounded with working print mode) */
const tableStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  borderCollapse: "separate",
  borderSpacing: 0,
  overflow: "hidden",
};

export default QuotationView;
