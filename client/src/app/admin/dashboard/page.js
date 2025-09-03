"use client";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarAdmin from "@/components/SidebarAdmin";

// Import section components
import Overview from "./overview/Overview";
import Orders from "./orders/Orders";
// import Shipments from "./Shipments/Shipments";
// import Invoice from "./invoice/Invoice";
// import Receipt from "./Receipt/Receipt";
import Quotation from "./Quotation/Quotation";
import CustDetails from "./customer-details/CustDetails";
import Agents from "./agents/Agents";

export default function DashboardPage() {
  const { isAuthenticated, username, loading } = useSelector(
    (state) => state.auth
  );
  const activeTab = useSelector((state) => state.dashboard.activeTab);
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if not logged in
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
        return <Orders />;
      // case "Shipments": return <Shipments />;
      case "Agents": return <Agents />;
      case "Quotation": return <Quotation />;
      case "Customers": 
        return <CustDetails />;
        // case "Invoice": return <Invoice />;
      // case "Receipt": return <Receipt />;
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
    <>  
    <div className="flex h-screen">
      {/* Sidebar */}
      <SidebarAdmin username={username} />

      {/* Right Content Area */}
      <div className="flex-1 bg-[#FBFDFE] p-6 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
    </>
    
  );
}
