"use client";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Sidebar, TopNav } from "@/components/layout";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  const derivedUser = {
    name: loading
      ? ""
      : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account",
    email: loading ? "" : user?.email || "",
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} user={derivedUser} />
        <main className="flex-1 overflow-y-auto pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
