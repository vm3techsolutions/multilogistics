"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getAllQuotations } from "@/store/slices/quotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import QuotationView from "../../QuotationView";

export default function QuotationInvoice() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { quotations, loading, error } = useSelector((state) => state.quotation);
  const { list: customers } = useSelector((state) => state.customers);
  const { agents } = useSelector((state) => state.agents);

  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    dispatch(getAllQuotations());
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  useEffect(() => {
    if (quotations.length > 0) {
      const q = quotations.find((q) => q.id.toString() === id.toString());
      setQuotation(q);
    }
  }, [quotations, id]);

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error: {error}</p>;
  if (!quotation) return <p className="text-center py-10">Quotation not found</p>;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-5xl">
        <QuotationView
          quotationData={quotation}
          onClose={() => router.push("/admin/quotation")}
        />
      </div>
    </div>
  );
}
