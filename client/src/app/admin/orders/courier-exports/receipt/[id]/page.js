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
          console.log('Quotation data:', quotationRes);
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

  const e = exportData || {};
  const q = quotationData || {};

  return (
    <div className="w-full flex justify-center bg-white min-h-screen py-10">
         {/* Floating buttons */}
      <div className="absolute right-5 top-30 flex flex-col gap-4">
        <button onClick={printInvoice} className="p-3 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700" title="Print">
          <Printer size={20} />
        </button>
        <button onClick={downloadPDF} className="p-3 rounded-full bg-green-600 text-white shadow-md hover:bg-green-700" title="Download PDF">
          <Download size={20} />
        </button>
        <button onClick={() => router.back()} className="p-3 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700" title="Close">
          <X size={20} />
        </button>
      </div>
      <div ref={pdfRef} className="bg-white shadow-lg rounded-xl p-8 w-full max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          {/* <img src="/assets/logo/logo.png" alt="logo" className="h-20" /> */}
          <p style={{ fontSize: "20px" }}><strong>{e.awb_number || "-"}</strong> </p>
          <div className="text-right text-xs space-y-1">
            <p><strong>Corporate Office:</strong> MULTILOGISTICS PRIVATE LIMITED, Pune - 411030</p>
            <p><strong>Tel:</strong> (020) 2444 6770</p>
            <p><strong>Email:</strong> info@multilogistics.co.in</p>
            <p><strong>Web:</strong> https://multilogistics.co.in/</p>
            
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full border border-gray-300 text-sm border-collapse">
          <tbody>

            {/* Account / Reference / Origin / Destination */}
            <tr>
              <td className="border p-2 font-semibold">Account Number</td>
              <td className="border p-2" colSpan={2} >{e.account_number || ""}</td>
              <td className="border p-2 font-semibold">Shipper's Referren</td>
              <td className="border p-2">{e.shipper_reference || ""}</td>
              <td className="border p-2 font-semibold">ORIGIN</td>
              <td className="border p-2">{q.origin || "-"}</td>
              <td className="border p-2 font-semibold">DESTINATION</td>
              <td className="border p-2">{e.place_of_delivery || "-"}</td>
            </tr>

            {/* Pieces / DOX / Weight / Dimensions */}
            <tr>
              <td className="border p-2 font-semibold">PIECES</td>
              <td className="border p-2">{e.package_count || "-"}</td>
              <td className="border p-2 font-semibold">DOX/SPX</td>
              <td className="border p-2">{e.document_type || "-"}</td>
              <td className="border p-2 font-semibold">WEIGHT</td>
              <td className="border p-2">{e.weight || "-"}</td>
              <td className="border p-2 font-semibold">DIMENSIONS (cm)</td>
              <td className="border p-2" colspan={2}>{e.dimensions || "0 x 0 x 0"}</td>
            </tr>

            {/* Shipper / Consignee */}
            <tr>
              <td className="border p-2 font-semibold">Shipper:</td>
              <td className="border p-2" colSpan={3}>
                {e.shipper_name || "-"}<br />
                {e.shipper_address || "-"}<br />
                Tel: {e.shipper_mobile || "-"}
              </td>
              <td className="border p-2 font-semibold">Consignee:</td>
              <td className="border p-2" colSpan={4}>
                {e.consignee_name || "-"}<br />
                {e.consignee_address || "-"}<br />
                Tel: {e.consignee_mobile || "-"}
              </td>
            </tr>

            {/* Description / Declared Value */}
            <tr>
              <td className="border p-2 font-semibold text-center" colSpan={4}>
                DESCRIPTION OF GOODS (NO CASH ALLOWED)
              </td>
              <td className="border p-2" colSpan={4}>
                {e.description || "-"}<br />
                Other Instructions: {e.special_instructions || "-"}
              </td>
              <td className="border p-2 text-center">
                DECLARED VALUE<br />
                {e.declared_value || "-"}
              </td>
            </tr>

            {/* Method of Payment */}
            <tr>
              <td className="border p-2 font-semibold">METHOD OF PAYMENT</td>
              <td className="border p-2" colSpan={9}>
                <div className="flex gap-4">
                  <label><input type="checkbox" disabled checked={e.payment_method === "PREPAID"} /> PREPAID</label>
                  <label><input type="checkbox" disabled checked={e.payment_method === "SHIPPER"} /> SHIPPER'S ACCOUNT</label>
                  <label><input type="checkbox" disabled checked={e.payment_method === "CONSIGNEE"} /> CONSIGNEE (COLLECT)</label>
                  <label><input type="checkbox" disabled checked={e.payment_method === "CASH"} /> CASH</label>
                </div>
              </td>
            </tr>

            {/* Signatures / Date */}
            <tr>
              <td className="border p-2 font-semibold">Shipper's Signature:</td>
              <td className="border p-2" colSpan={2}></td>
              <td className="border p-2 font-semibold">Date:</td>
              <td className="border p-2">{e.booking_date ? new Date(e.booking_date).toLocaleDateString("en-GB") : "-"}</td>
              <td className="border p-2 font-semibold">Yes / No</td>
              <td className="border p-2" colSpan={1}></td>
              <td className="border p-2 font-semibold">Receiver's Signature:</td>
              <td className="border p-2"></td>
            </tr>

            {/* Charges */}
            <tr>
              <td className="border p-2 font-semibold" colSpan={7}>This is non-negotiable courier way bill and all business undertaken is subject to our standard trading conditions printer on the reverse. If this Shipper copy. By tendering materials for shipment via MULTILOGISTICS PRIVATE LIMITED, it is deemed that shipper agrees to the terms and conditions stated here in and warrants that the information contained on this way bill is true & correct and that this package does not contain cash or any such item which congruences the provision of the Indian Post Office Act 1983. In case this consignment contains anything of value MULTILOGISTICS PRIVATE LIMITED recommends insurance of the same. MULTILOGISTICS PRIVATE LIMITED's liability on this shipment is limited to Rs. 100/- CWB or cost of reconstruction whichever is lower.        </td>
              <td className="border p-2" colSpan={2}>
  <table className="w-full border-collapse text-sm">
    <tbody>
      <tr>
        <td className="border p-1 font-semibold">CHARGES</td>
        <td className="border p-1 text-right">{e.charges || ""}</td>
      </tr>
      <tr>
        <td className="border p-1 font-semibold">SERVICE</td>
        <td className="border p-1 text-right">{e.service || ""}</td>
      </tr>
      <tr>
        <td className="border p-1 font-semibold">TAX</td>
        <td className="border p-1 text-right">{e.tax || ""}</td>
      </tr>
      <tr>
        <td className="border p-1 font-semibold">E.C.TAX</td>
        <td className="border p-1 text-right" >{e.ec_tax || ""}</td>
      </tr>
      <tr>
        <td className="border p-1 font-semibold">TOTAL</td>
        <td className="border p-1 text-right ">{e.total || ""}</td>
      </tr>
    </tbody>
  </table>
</td>

            </tr>

            {/* Footer */}
           
            <tr>
              <td className="border p-2 font-semibold">Print Name:</td>
              <td className="border p-2" colSpan={3}></td>
              <td className="border p-2 font-semibold">Received in Good order and condition:</td>
              <td className="border p-2" colSpan={4}></td>
            </tr>

            <tr>
              <td className="border p-2 font-semibold">Date:</td>
              <td className="border p-2" colSpan={3}></td>
              <td className="border p-2 font-semibold">Time:</td>
              <td className="border p-2" colSpan={4}></td>
            </tr>

          </tbody>
        </table>
      </div>

     
    </div>
  );
};

export default ModernReceipt;
