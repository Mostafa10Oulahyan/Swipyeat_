import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import SubscriptionGuard from "@/components/dashboard/SubscriptionGuard";
import SecurityShield from "@/components/dashboard/SecurityShield";
import RoleGuard from "@/components/dashboard/RoleGuard";
import DashboardProviders from "@/components/dashboard/DashboardProviders";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <DashboardProviders>
      <div className="flex min-h-screen bg-[#f7fafc] text-[0.925rem]">
        {/* Sidebar - Fixed Left (responsive) */}
        <Sidebar />

        {/* Main Content Area - responsive margin for sidebar */}
        <div className="flex-1 flex flex-col lg:ml-[200px] xl:ml-[220px] 2xl:ml-[240px] min-h-screen max-w-[1920px]">
          {/* Header */}
          <Header />

          {/* Page Content - responsive padding */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 bg-[#f7fafc]">
            <SecurityShield>
              <RoleGuard>
                <SubscriptionGuard>
                  {children}
                </SubscriptionGuard>
              </RoleGuard>
            </SecurityShield>
          </main>
        </div>
      </div>
    </DashboardProviders>
  );
}
