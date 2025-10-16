"use client";
import React, { useState } from "react";
import Orders from "./Orders";

export default function OrdersPage() {
  const [subTab, setSubTab] = useState("Import"); // default tab

  return (
    <div>
      <Orders subTab={subTab} setSubTab={setSubTab} />
    </div>
  );
}
