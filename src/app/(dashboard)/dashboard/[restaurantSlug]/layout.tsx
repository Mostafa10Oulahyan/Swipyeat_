import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import SubscriptionGuard from "@/components/dashboard/SubscriptionGuard";
import SecurityShield from "@/components/dashboard/SecurityShield";

type Props = {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { restaurantSlug } = await params;
  return (
    <div className="flex h-screen bg-[#f7fafc]">
      {/* Sidebar - Fixed Left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-[220px] overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f7fafc]">
          <SecurityShield>
            <SubscriptionGuard>
              {children}
            </SubscriptionGuard>
          </SecurityShield>
        </main>
      </div>
    </div>
  );
}
