"use client";
import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Printer, Download, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchCourierExportById, clearSelectedExport } from "@/store/slices/courierExportSlice";

const thHeader = {
  border: "1px solid #d1d5db",
  padding: "6px",
  fontSize: "14px",
  fontWeight: "600",
  background: "#1C5070",
  color: "white",
  textAlign: "center",
  verticalAlign: "top",
};

const td = {
  border: "1px solid #d1d5db",
  padding: "6px",
  fontSize: "14px",
  verticalAlign: "top",
};

const tableStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  borderCollapse: "collapse",
  borderSpacing: 0,
  overflow: "hidden",
  verticalAlign: "top",
};

const CourierExportView = ({ params }) => {
     const pdfRef = useRef(null);
     const resolvedParams = React.use(params);    // ✔ Correct
  const { id } = resolvedParams;    
  const router = useRouter();
  const dispatch = useDispatch();
 
  // fallback to selectedExport in store
  const { selectedExport, loading, error } = useSelector((state) => state.courierExports);
//   const exportData = courierExportData || selectedExport || {};

const data = selectedExport || {};  // Fetch export data by ID
    useEffect(() => {
  if (id) dispatch(fetchCourierExportById(id));

  return () => dispatch(clearSelectedExport());
}, [id, dispatch]);

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
    return () => document.head.removeChild(style);
  }, []);

  // Protective default values
  const {
    awb_number,
    quotation_no,
    quotation_id,
    booking_date,
    document_type,
    shipper_name,
    shipper_email,
    shipper_address,
    shipper_mobile,
    consignee_name,
    consignee_email,
    consignee_address,
    consignee_mobile,
    place_of_delivery,
    forwarding_company,
    correspondence_number,
    length,
    width,
    height,
    weight,
    package_count,
    amount,
    packages = [],
    charges = [],
    created_at,
  } = data;

  // Safely handle items
const itemsArray = Array.isArray(data.items) ? data.items : [];
  
   if (loading) return <p className="p-5 text-lg">Loading...</p>;
  if (error) return <p className="p-5 text-red-600">Error loading data</p>;
  if (!selectedExport)
    return <p className="p-5 text-red-500">No data found</p>;


  const printInvoice = () => {
    if (!pdfRef.current) return;
    const printContents = pdfRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;

    const canvas = await html2canvas(element, {
      scale: 1.8,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let imgWidth = pageWidth;
    let imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      imgWidth = (canvas.width * pageHeight) / canvas.height;
    }

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    const filename = `courier-export-${awb_number || quotation_no || (created_at || "").slice(0,10)}.pdf`;
    pdf.save(filename);
  };

  // Simple totals (you can adapt to include VAT/GST etc.)
//   const itemsTotal = items.reduce((sum, it) => {
//     const q = Number(it.item_quantity || 0);
//     const w = Number(it.item_weight || 0);
//     // if there's an item-level value/amount, you can include it here
//     return sum + 0; // placeholder: adjust if you have item values
//   }, 0);

const chargesTotal = charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
const grandTotal = Number(amount || 0) + chargesTotal;


  // Render packages rows: prefer exportData.packages; fallback to length/width/height & package_count
  const packagesToRender =
  packages.length > 0
    ? packages
    : Array.from({ length: Number(package_count || 0) }).map(() => ({
        length,
        width,
        height,
        weight,
      }));

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
            title="Print"
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
            title="Download PDF"
          >
            <Download size={20} />
          </button>

          <button
            onClick={() => router.back()}
            style={{
              padding: "12px",
              borderRadius: "50%",
              background: "#dc2626",
              color: "white",
              cursor: "pointer",
              boxShadow: "0px 3px 10px rgba(0,0,0,0.3)",
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* PDF wrapper */}
        <div
          ref={pdfRef}
          style={{
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingTop: "12px",
            paddingBottom: "12px",
            width: "750px",
            margin: "0 auto",
            fontSize: "11px",
            lineHeight: "1.3",
          }}
        >
          {/* Header */}
          <div
            style={{
              borderBottom: "1px solid #d1d5db",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <img src="/assets/logo/logo.png" style={{ height: "80px" }} alt="logo" />

            <div style={{ textAlign: "center", fontSize: "20px" }}>
              <p><strong>{awb_number || "-"}</strong> </p>
            </div>

            <div style={{ textAlign: "right", fontSize: "14px" }}>
              <p><strong>Booking Date:</strong> {booking_date ? new Date(booking_date).toLocaleDateString("en-GB") : (created_at ? new Date(created_at).toLocaleDateString("en-GB") : "-")}</p>
            </div>
          </div>

          {/* Parties */}
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
                Shipper Details
              </h3>

              <p><strong>Customer Name:</strong> {shipper_name || "-"}</p>
              <p><strong>Customer Email:</strong> {shipper_email || "-"}</p>
              <p><strong>Customer Phone:</strong> {shipper_mobile || "-"}</p>
              <p><strong>Customer Address:</strong> {shipper_address || "-"}</p>
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
                Consignee Details
              </h3>

              <p><strong>Name:</strong> {consignee_name || "-"}</p>
              <p><strong>Email:</strong> {consignee_email || "-"}</p>
              <p><strong>Phone:</strong> {consignee_mobile || "-"}</p>
              <p><strong>Address:</strong> {consignee_address || "-"}</p>
            </div>
          </div>

          {/* Shipment summary row */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div style={{ background: "#fff", padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <p><strong>Place Of Delivery:</strong> {place_of_delivery || "-"}</p>
              <p><strong>Forwarding Company:</strong> {forwarding_company || "-"}</p>
            </div>
            <div style={{ background: "#fff", padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <p><strong>Correspondence No:</strong> {correspondence_number || "-"}</p>
              <p><strong>Packages:</strong> {package_count || packagesToRender.length || "-"}</p>
            </div>
            <div style={{ background: "#fff", padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <p><strong>Gross Weight:</strong> {weight || "-"}</p>
              <p><strong>Amount:</strong> {amount ? `₹${Number(amount).toFixed(2)}` : "-"}</p>
            </div>
          </div>

          {/* Items table */}
          <div style={{ marginTop: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Items</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thHeader}>Item</th>
                  <th style={thHeader}>Qty</th>
                  <th style={thHeader}>Weight</th>
                  <th style={thHeader}>Description</th>
                </tr>
              </thead>
              <tbody>
                {itemsArray.length > 0
  ? itemsArray.map((it, idx) => (
                      <tr key={idx}>
                        <td style={td}>{it?.item_name || "-"}</td>
                        <td style={{ ...td, textAlign: "center" }}>{it?.item_quantity || "-"}</td>
                        <td style={{ ...td, textAlign: "center" }}>{it?.item_weight || "-"}</td>
                        <td style={td}>{it?.item_description || "-"}</td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colSpan="4" style={{ ...td, textAlign: "center" }}>No items added</td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>

          

          {/* Totals */}
          <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
            <table style={{ width: "360px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ ...td, border: "none" }}>Amount</td>
                  <td style={{ ...td, border: "none", textAlign: "right" }}>{amount ? `₹${Number(amount).toFixed(2)}` : "-"}</td>
                </tr>
                <tr>
                  <td style={{ ...td, border: "none" }}>Charges</td>
                  <td style={{ ...td, border: "none", textAlign: "right" }}>{`₹${chargesTotal.toFixed(2)}`}</td>
                </tr>
                <tr style={{ background: "#f3f4f6" }}>
                  <td style={{ ...td, border: "none", fontWeight: "700", fontSize: "16px" }}>Grand Total</td>
                  <td style={{ ...td, border: "none", textAlign: "right", fontWeight: "700", fontSize: "16px", color: "#15803d" }}>₹{Number(grandTotal || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer / notes */}
          <div style={{ marginTop: "18px", fontSize: "12px", color: "#374151" }}>
            <p><strong>Notes:</strong></p>
            <p>1. Please ensure all customs paperwork is completed prior to collection.</p>
            <p>2. This document is system-generated and does not require signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierExportView;
