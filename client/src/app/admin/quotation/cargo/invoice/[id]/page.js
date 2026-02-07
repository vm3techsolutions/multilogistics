"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { getAllCargoQuotations } from "@/store/slices/cargoQuotationSlice";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { getAgents } from "@/store/slices/agentSlice";
import CargoQuotationView from "@/components/cargo/CargoQuotationView";

export default function CargoQuotationInvoice() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();

  const { quotations, loading, error } = useSelector(
    (state) => state.cargoQuotation
  );

  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    dispatch(getAllCargoQuotations());
    dispatch(fetchCustomers());
    dispatch(getAgents());
  }, [dispatch]);

  useEffect(() => {
    if (quotations?.length) {
      const q = quotations.find((q) => q.id.toString() === id);
      setQuotation(q);
    }
  }, [quotations, id]);

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!quotation) return <p className="text-center py-10">Quotation not found</p>;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-5xl">
        <CargoQuotationView
          quotationData={quotation}
          onClose={() => router.push("/admin/cargo-quotation")}
        />
      </div>
    </div>
  );
}