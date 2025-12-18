/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Printer, Download, X } from "lucide-react";
import { fetchCourierExportById } from "@/store/slices/courierExportSlice";
import { getQuotationById } from "@/store/slices/quotationSlice";

const ModernReceipt = () => {
  const { id } = useParams();
  const pdfRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const exportRes = await dispatch(fetchCourierExportById(id)).unwrap();
        setExportData(exportRes);

        if (exportRes?.quotation_id) {
          const quotationRes = await dispatch(getQuotationById(exportRes.quotation_id)).unwrap();
          setQuotationData(quotationRes);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch, id]);

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
    const canvas = await html2canvas(pdfRef.current, {
      scale: 1.8,
      useCORS: true,
      backgroundColor: "#ffffff",
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
    pdf.save(`receipt-${id}.pdf`);
  };

  if (loading) return <p className="p-5 text-center">Loading...</p>;
  if (!exportData) return <p className="p-5 text-center">No export data found</p>;

  // convenience vars & safe fallbacks
  const e = exportData || {};
  const q = quotationData || {};

  // charges may be an object or fields - handle both
  const chargesObj = e.charges_object || {};
  const service = chargesObj.service ?? e.service ?? "";
  const tax = chargesObj.tax ?? e.tax ?? "";
  const otherCharges = chargesObj.other ?? e.other_charges ?? "";
  const ecTax = chargesObj.ec_tax ?? e.ec_tax ?? "";
  const totalAmount = e.amount ?? e.total ?? "";

  // dimensions: either e.dimensions string or separate fields
  const dimL = e.length ?? e.dimensions_l ?? (e.dimensions?.split?.("x")?.[0] ?? "");
  const dimW = e.width ?? e.dimensions_w ?? (e.dimensions?.split?.("x")?.[1] ?? "");
  const dimH = e.height ?? e.dimensions_h ?? (e.dimensions?.split?.("x")?.[2] ?? "");

  return (
    <div className="w-full flex justify-center bg-gray-50 min-h-screen py-8">
      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        .awb-print-area { page-break-inside: avoid; }
        @media print {
          body * { visibility: hidden; }
          .awb-print-area, .awb-print-area * { visibility: visible; }
          .awb-print-area { position: absolute; left: 0; top: 0; width: 210mm; }
        }
      `}</style>

      {/* Floating buttons */}
      <div className="fixed right-6 top-24 z-50 flex flex-col gap-3 print:hidden">
        <button onClick={printInvoice} className="p-3 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700" title="Print">
          <Printer size={18} />
        </button>
        <button onClick={downloadPDF} className="p-3 rounded-full bg-green-600 text-white shadow-md hover:bg-green-700" title="Download PDF">
          <Download size={18} />
        </button>
        <button onClick={() => router.back()} className="p-3 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700" title="Close">
          <X size={18} />
        </button>
      </div>

      {/* Main printable AWB */}
      <div
        ref={pdfRef}
        className="awb-print-area bg-white shadow-lg rounded-lg p-6 max-w-[920px] w-full print:w-[210mm] print:min-h-[297mm] print:shadow-none"
        style={{ boxSizing: "border-box" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <img src="/assets/logo/logo.png" alt="logo" className="h-20 object-contain" />
            <div className="text-xs leading-4 hidden print:block">
              <p><strong>Corporate Office:</strong> MULTILOGISTICS PRIVATE LIMITED, Pune - 411030</p>
              <p><strong>Tel:</strong> (020) 2444 6770</p>
              <p><strong>Email:</strong> info@multilogistics.co.in</p>
              <p><strong>Web:</strong> https://multilogistics.co.in/</p>
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <p><strong>Corporate Office:</strong> MULTILOGISTICS PRIVATE LIMITED, Pune - 411030</p>
            <p><strong>Tel:</strong> (020) 2444 6770</p>
            <p><strong>Email:</strong> info@multilogistics.co.in</p>
            <p><strong>Web:</strong> https://multilogistics.co.in/</p>
            <p><strong>Airway Bill:</strong> {e.awb_number || "-"}</p>
          </div>
        </div>

        {/* TOP micro-rows */}
        <div className="grid grid-cols-12 gap-2 text-sm mb-3">
          <div className="col-span-3 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">Account Number</div>
            <div className="mt-1">{e.account_number || "-"}</div>
          </div>

          <div className="col-span-3 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">Shipper's Reference</div>
            <div className="mt-1">{e.shipper_reference || "-"}</div>
          </div>

          <div className="col-span-3 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">Origin</div>
            <div className="mt-1">{q.origin || "-"}</div>
          </div>

          <div className="col-span-3 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">Destination</div>
            <div className="mt-1">{e.place_of_delivery || e.destination || "-"}</div>
          </div>
        </div>

        {/* Pieces / DOX / Weight / Dimensions (still top area) */}
        <div className="grid grid-cols-12 gap-2 text-sm mb-4">
          <div className="col-span-2 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">Pieces</div>
            <div className="mt-1">{e.package_count ?? "-"}</div>
          </div>

          <div className="col-span-2 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">DOX / SPX</div>
            <div className="mt-1">{e.document_type ?? e.dox_spx ?? "-"}</div>
          </div>

          <div className="col-span-2 border-2 border-gray-300 p-2">
            <div className="font-semibold text-xs">Weight (kg)</div>
            <div className="mt-1">{e.weight ?? "-"}</div>
          </div>

          <div className="col-span-6 grid grid-cols-3 gap-2">
            <div className="col-span-1 border-2 border-gray-300 p-2">
              <div className="font-semibold text-xs">Length (cm)</div>
              <div className="mt-1">{dimL || "-"}</div>
            </div>
            <div className="col-span-1 border-2 border-gray-300 p-2">
              <div className="font-semibold text-xs">Width (cm)</div>
              <div className="mt-1">{dimW || "-"}</div>
            </div>
            <div className="col-span-1 border-2 border-gray-300 p-2">
              <div className="font-semibold text-xs">Height (cm)</div>
              <div className="mt-1">{dimH || "-"}</div>
            </div>
          </div>
        </div>

        {/* MAIN TWO-PARTITION ROW */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* LEFT PARTITION (contains the specific fields you requested) */}
          <div className="col-span-6">
            <div className="border-2 border-gray-300 h-full p-4 flex flex-col justify-between">
              <div>
                <div className="font-semibold mb-2">Shipper Details</div>
                <div className="text-sm mb-2"><strong>Address:</strong> {e.shipper_address || "-"}</div>
                <div className="text-sm mb-2"><strong>Tel:</strong> {e.shipper_mobile || "-"}</div>
                <div className="text-sm mb-2"><strong>Email:</strong> {e.shipper_email || "-"}</div>
              </div>

              <div className="mt-3">
                <div className="font-semibold mb-1">Description of Goods</div>
                <div className="text-sm mb-2">{e.description || "-"}</div>
              </div>

              {/* Shipper Signature box */}
              <div className="mt-3">
                <div className="font-semibold mb-1">Shipper's Signature</div>
                <div className="h-20 border-2 border-gray-300"></div>
              </div>

              {/* Received By / Time / Date (three horizontal boxes as requested) */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="border-2 border-gray-300 p-2 text-sm">
                  <div className="font-semibold text-xs">Received By</div>
                  <div className="mt-1">{e.received_by || "-"}</div>
                </div>
                <div className="border-2 border-gray-300 p-2 text-sm">
                  <div className="font-semibold text-xs">Time</div>
                  <div className="mt-1">{e.received_time || e.booking_time || "-"}</div>
                </div>
                <div className="border-2 border-gray-300 p-2 text-sm">
                  <div className="font-semibold text-xs">Date</div>
                  <div className="mt-1">{e.received_date || (e.booking_date ? new Date(e.booking_date).toLocaleDateString("en-GB") : "-")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PARTITION (remaining fields) */}
          <div className="col-span-6 space-y-3">
            <div className="border-2 border-gray-300 p-3">
              <div className="font-semibold mb-2">Consignee</div>
              <div className="text-sm mb-1"><strong>Name:</strong> {e.consignee_name || "-"}</div>
              <div className="text-sm mb-1"><strong>Address:</strong> {e.consignee_address || "-"}</div>
              <div className="text-sm mb-1"><strong>Phone:</strong> {e.consignee_mobile || "-"}</div>
              <div className="text-sm"><strong>Email:</strong> {e.consignee_email || "-"}</div>
            </div>

            <div className="border-2 border-gray-300 p-3 grid grid-cols-2 gap-2">
              <div>
                <div className="font-semibold text-sm">Declared Value</div>
                <div className="mt-1 text-sm">{e.declared_value ?? "-"}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Method of Payment</div>
                <div className="flex flex-col text-sm mt-1">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={e.payment_method === "PREPAID"} readOnly /> PREPAID</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={e.payment_method === "SHIPPER"} readOnly /> SHIPPER'S ACCOUNT</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={e.payment_method === "CONSIGNEE"} readOnly /> CONSIGNEE (COLLECT)</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={e.payment_method === "CASH"} readOnly /> CASH</label>
                </div>
              </div>
            </div>

            {/* Charges table */}
            <div className="border-2 border-gray-300 p-3">
              <div className="font-semibold mb-2">Charges</div>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr>
                    <td className="border p-1">CHARGES</td>
                    <td className="border p-1 text-right">{service || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-1">SERVICE</td>
                    <td className="border p-1 text-right">{service || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-1">TAX</td>
                    <td className="border p-1 text-right">{tax || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-1">E.C.TAX</td>
                    <td className="border p-1 text-right">{ecTax || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border p-1">OTHER</td>
                    <td className="border p-1 text-right">{otherCharges || "-"}</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="border p-1">TOTAL</td>
                    <td className="border p-1 text-right">{totalAmount || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Receiver signature + Received in good order + Print name */}
            <div className="border-2 border-gray-300 p-3">
              <div className="font-semibold mb-2">Receiver's Signature</div>
              <div className="h-20 border-2 border-gray-300 mb-3"></div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Print Name:</strong> {e.print_name || "-"}</div>
                <div><strong>Received in Good order:</strong> {e.received_in_good_order ? "Yes" : "-"}</div>
                <div><strong>Date:</strong> {e.booking_date ? new Date(e.booking_date).toLocaleDateString("en-GB") : "-"}</div>
                <div><strong>Time:</strong> {e.booking_time || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="border-2 border-gray-300 p-3 text-xs mt-3">
          {e.notes || e.disclaimer_text || "This is non-negotiable courier way bill and all business undertaken is subject to our standard trading conditions printed on the reverse. Ensure shipment complies with Indian Post Office Act 1983."}
        </div>
      </div>
    </div>
  );
};

export default ModernReceipt;
