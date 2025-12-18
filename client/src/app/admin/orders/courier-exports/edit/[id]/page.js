"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";

import {
  fetchCourierExportById,
  resetCourierExportState,
} from "@/store/slices/courierExportSlice";

import CreateCourierExportPage from "../../../CreateCourierExport";

const EditCourierExportPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { selectedExport, loading, error } = useSelector(
    (state) => state.courierExports
  );

  useEffect(() => {
    dispatch(fetchCourierExportById(id));

    return () => {
      dispatch(resetCourierExportState());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (selectedExport?.id) {
      // OPTIONAL: redirect after successful update handled in slice
    }
  }, [selectedExport]);

  if (loading) {
    return <p className="p-6">Loading export details...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!selectedExport) {
    return null;
  }

  return (
    <CreateCourierExportPage
      mode="edit"
      exportId={id}
      initialData={selectedExport}
    />
  );
};

export default EditCourierExportPage;
