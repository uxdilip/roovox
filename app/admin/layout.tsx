import React from "react";
import AdminNavigation from "@/components/admin/AdminNavigation";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <AdminNavigation className="flex-shrink-0" />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <AdminHeader />
        <div className="p-6">
          <AdminBreadcrumbs />
          {children}
        </div>
      </div>
    </div>
  );
} 