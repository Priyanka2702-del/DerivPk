import { ReactNode } from "react";
import { redirect } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { requireAuth } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuth();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <TopBar />

        <main className="px-6 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}