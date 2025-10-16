// DashboardPage.jsx
"use client";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarAdmin from "@/components/SidebarAdmin";

// Import section components
import Overview from "../overview/Overview";
import Orders from "../orders/Orders";
import CustDetails from "../customers/CustDetails";
import Agents from "../agents/Agents";
import QuotationList from "../quotation/QuotationList";

export default function DashboardPage() {
  const { isAuthenticated, username, loading } = useSelector(
    (state) => state.auth
  );
  const activeTab = useSelector((state) => state.dashboard.activeTab);
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [ordersSubTab, setOrdersSubTab] = useState("Import"); // New state for orders dropdown

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/");
      } else {
        setCheckingAuth(false);
      }
    }
  }, [isAuthenticated, loading, router]);

  const renderContent = () => {
    switch (activeTab) {
      case "Overview":
        return <Overview />;
      case "Orders":
        return <Orders subTab={ordersSubTab} setSubTab={setOrdersSubTab} />; // Pass props
      case "Agents":
        return <Agents />;
      case "Quotation":
        return <QuotationList />;
      case "Customers":
        return <CustDetails />;
      default:
        return <Overview />;
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold text-gray-600">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <SidebarAdmin username={username} />
      <div className="flex-1 bg-[#FBFDFE] p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
