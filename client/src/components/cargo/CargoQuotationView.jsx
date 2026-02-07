"use client";

import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import { Printer, Download, X } from "lucide-react";
import { useRouter } from "next/navigation";

const CargoQuotationView = ({ quotationData }) => {
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

  if (!q)
    return <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>;

  /* ===================== HELPERS ===================== */
  const isCCF = (charge) =>
    charge?.charge_name?.toLowerCase().includes("ccf");

  /* ===================== CHARGES ===================== */
  const freightCharges = q.charges.filter(
    (c) => c.type === "freight" && !isCCF(c)
  );

  const ccfCharge = q.charges.find(
    (c) => c.type === "freight" && isCCF(c)
  );

  const destinationCharges = q.charges.filter(
    (c) => c.type === "destination"
  );

  const clearanceCharges = q.charges.filter(
    (c) => c.type === "clearance"
  );

  /* ===================== WEIGHT ===================== */
  const actualWeight = Number(q.actual_weight || 0);

  const volumetricWeight =
    q.packages?.reduce((sum, p) => {
      const vol =
        (Number(p.length) * Number(p.width) * Number(p.height)) / 6000;
      return sum + vol * Number(p.same_size || 1);
    }, 0) || 0;

  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  /* ===================== TOTALS ===================== */
const calcFreightTotal = (charge) =>
  Number(charge.rate_per_kg || 0) * chargeableWeight;

// Freight subtotal (WITHOUT CCF)
const freightSubTotal = freightCharges.reduce(
  (sum, c) => sum + calcFreightTotal(c),
  0
);

// ✅ STATIC CCF (2%)
const CCF_PERCENT = 2;

// ✅ CCF amount = 2% of freight subtotal
const ccfAmount = (freightSubTotal * CCF_PERCENT) / 100;

// ✅ Final freight total (WITH CCF)
const freightTotal = freightSubTotal + ccfAmount;

const destinationTotal = destinationCharges.reduce(
  (sum, c) => sum + Number(c.amount || 0),
  0
);

const clearanceTotal = clearanceCharges.reduce(
  (sum, c) => sum + Number(c.amount || 0),
  0
);

const subTotal = freightTotal + destinationTotal + clearanceTotal;
const gst = subTotal * 0.18;
const grandTotal = subTotal + gst;

  /* ===================== PRINT ===================== */
  const printInvoice = () => {
    const printContents = pdfRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  /* ===================== PDF ===================== */
  const downloadPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, {
      scale: 1.8,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    pdf.save(`cargo-quotation-${q.id}.pdf`);
  };

  /* ===================== PRINT HEADER FIX ===================== */
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

  const globalSmallText = { fontSize: "11px", lineHeight: "1.3" };

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
        {/* FLOATING BUTTONS */}
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
          <button onClick={printInvoice} style={btnStyle("#2563eb")}>
            <Printer size={20} />
          </button>

          <button onClick={downloadPDF} style={btnStyle("#16a34a")}>
            <Download size={20} />
          </button>

          <button
            onClick={() => router.push("/admin/quotation")}
            style={btnStyle("#dc2626")}
          >
            <X size={20} />
          </button>
        </div>

        {/* PDF CONTENT */}
        <div
          ref={pdfRef}
          style={{
            padding: "12px 24px",
            width: "750px",
            margin: "0 auto",
            ...globalSmallText,
          }}
        >
          {/* HEADER */}
          <div
            style={{
              borderBottom: "1px solid #d1d5db",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <p style={{ fontSize: "24px" }}>
              <strong>{q.quote_no}</strong>
            </p>

            <div style={{ textAlign: "right" }}>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(q.created_at).toLocaleDateString("en-GB")}
              </p>
              <p>Email: info@multilogistics.co.in</p>
              <p>Phone: +91 8411007077</p>
            </div>
          </div>

          {/* FREIGHT */}
          <ChargesSection
            title="Freight Charges"
            rows={freightCharges.map((c) => ({
              name: c.charge_name,
              rate: c.rate_per_kg,
              weight: chargeableWeight.toFixed(2),
              total: calcFreightTotal(c),
            }))}
            total={freightSubTotal}
            showWeight
          />

          {/* ✅ CCF BELOW FREIGHT */}
          {freightSubTotal > 0 && (
  <table style={{ ...tableStyle, marginTop: "4px" }}>
    <tbody>
      <tr>
        <td style={{ ...td, fontWeight: "600" }}>
          CCF (2%)
        </td>
        <td style={{ ...td, textAlign: "right", fontWeight: "600" }}>
          {ccfAmount.toFixed(2)}
        </td>
      </tr>
    </tbody>
  </table>
)}

          {/* DESTINATION */}
          <SimpleChargesSection
            title="Destination Charges"
            rows={destinationCharges}
            total={destinationTotal}
          />

          {/* CLEARANCE */}
          <SimpleChargesSection
            title="Clearance Charges"
            rows={clearanceCharges}
            total={clearanceTotal}
          />

          {/* GRAND TOTAL */}
          <table style={{ ...tableStyle, marginTop: "10px" }}>
            <tbody>
              <tr>
                <td style={td}>Sub Total</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {subTotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={td}>GST (18%)</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {gst.toFixed(2)}
                </td>
              </tr>
              <tr style={{ background: "#f3f4f6" }}>
                <td style={{ ...td, fontWeight: "700" }}>Grand Total</td>
                <td
                  style={{
                    ...td,
                    fontWeight: "700",
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
  );
};

/* ===================== STYLES ===================== */
const btnStyle = (bg) => ({
  padding: "12px",
  borderRadius: "50%",
  background: bg,
  color: "white",
  cursor: "pointer",
  boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
});

const InfoBox = ({ title, children }) => (
  <div
    style={{
      background: "#f9fafb",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      padding: "10px 16px",
    }}
  >
    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
      {title}
    </h3>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginTop: "10px" }}>
    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
      {title}
    </h3>
    {children}
  </div>
);

const ChargesSection = ({ title, rows, total, showWeight }) => (
  <Section title={title}>
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thHeader}>Charge Name</th>
          <th style={thHeader}>Rate/KG</th>
          {showWeight && <th style={thHeader}>Weight</th>}
          <th style={thHeader}>Total Freight</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={td}>{r.name}</td>
            <td style={td}>{r.rate}</td>
            {showWeight && <td style={td}>{r.weight}</td>}
            <td style={td}>{r.total.toFixed(2)}</td>
          </tr>
        ))}
        <tr style={{ background: "#f3f4f6" }}>
          <td colSpan={showWeight ? 3 : 2} style={td}>
            <b>Total</b>
          </td>
          <td style={td}>
            <b>{total.toFixed(2)}</b>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
);

const SimpleChargesSection = ({ title, rows, total }) => (
  <Section title={title}>
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thHeader}>Charge Name</th>
          <th style={thHeader}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => (
          <tr key={i}>
            <td style={td}>{c.charge_name}</td>
            <td style={td}>{Number(c.amount).toFixed(2)}</td>
          </tr>
        ))}
        <tr style={{ background: "#f3f4f6" }}>
          <td style={td}>
            <b>Total</b>
          </td>
          <td style={td}>
            <b>{total.toFixed(2)}</b>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
);

const thHeader = {
  border: "1px solid #d1d5db",
  padding: "6px",
  fontSize: "14px",
  fontWeight: "600",
  background: "#1C5070",
  color: "white",
  textAlign: "center",
};

const td = {
  border: "1px solid #d1d5db",
  padding: "6px",
  fontSize: "14px",
};

const tableStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderCollapse: "collapse",
};

export default CargoQuotationView;