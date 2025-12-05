"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourierExportById, clearSelectedExport } from "@/store/slices/courierExportSlice";
import { Printer, Download, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRouter } from "next/navigation";

const AddressPage = ({ params }) => {
    const { id } = React.use(params); 
  const exportId = id;
  const dispatch = useDispatch();
  const router = useRouter();
  const { selectedExport, loading, error } = useSelector((state) => state.courierExports);
  const pdfRef = useRef(null);

  // Fetch export data by ID
  useEffect(() => {
    if (exportId) dispatch(fetchCourierExportById(exportId));
    return () => dispatch(clearSelectedExport());
  }, [exportId, dispatch]);

  if (loading) return <p className="text-center p-6">Loading address label...</p>;
  if (error) return <p className="text-red-600 text-center p-6">{error}</p>;
  if (!selectedExport) return null;

  const s = selectedExport;

  // Print function
  const handlePrint = () => {
    if (!pdfRef.current) return;
    const printContents = pdfRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Download PDF function
  const handleDownload = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
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
    pdf.save(`awb-${s.awb_number || "export"}.pdf`);
  };

  return (
    <div className="flex justify-center py-10 bg-gray-100">
      <div className="relative bg-white border-2 border-black p-8 w-[650px]" ref={pdfRef}>
        {/* Floating Buttons */}
        <div className="absolute right-[-90px] top-0 flex flex-col gap-4">
          <button onClick={handlePrint} className="p-3 bg-blue-600 text-white rounded-full">
            <Printer size={20} />
          </button>
          <button onClick={handleDownload} className="p-3 bg-green-600 text-white rounded-full">
            <Download size={20} />
          </button>
          {/* Close */}
          <button
            onClick={() => router.push("/admin/shipments")}
            className="p-3 bg-red-600 text-white rounded-full"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* AWB No */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-extrabold tracking-widest">{s.awb_number}</h1>
        </div>

        {/* TO (Consignee) */}
        <div className="mb-6 ">
          <h2 className="text-4xl font-bold  mb-2">TO:</h2>
          {/* <p className="text-xl font-semibold">{s.consignee_name}</p> */}
          <p className="text-4xl">{s.consignee_address}</p>
          <p className="text-4xl  mt-1">Mobile: {s.consignee_mobile}</p>
        </div>

        {/* Horizontal Line */}
        <hr className="border-black border-2 my-6" />

        {/* FROM (Shipper) */}
        <div>
          <h2 className="text-4xl font-bold  mb-2">FROM:</h2>
          {/* <p className="text-3xl font-extrabold">{s.shipper_name}</p> */}
          <p className="text-4xl">{s.shipper_address}</p>
          <p className="text-4xl mt-1">Mobile: {s.shipper_mobile}</p>
        </div>
      </div>
    </div>
  );
};

export default AddressPage;
