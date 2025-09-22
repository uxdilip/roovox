"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { simpleMessageAlertService } from '@/lib/message-alert-service';
import NotificationBanner, { useNotificationStatus, NotificationStatus } from '@/components/admin/NotificationBanner';
import NotificationStatusIndicator from '@/components/admin/NotificationStatusIndicator';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, adminUser, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('checking');

  // Skip authentication check for login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Only check authentication for non-login pages
    if (!isLoginPage && !isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Start simple message alert monitoring when admin is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoginPage) {
      console.log('🚨 Starting simple message alert monitoring...');
      simpleMessageAlertService.startMonitoring();

      // Cleanup when component unmounts or auth changes
      return () => {
        console.log('🚨 Stopping simple message alert monitoring...');
        simpleMessageAlertService.stopMonitoring();
      };
    }
  }, [isAuthenticated, isLoginPage]);

  // Handle notification status indicator click
  const handleNotificationIndicatorClick = () => {
    if (notificationStatus !== 'enabled' && notificationStatus !== 'checking') {
      // Scroll to banner or trigger banner visibility
      const banner = document.querySelector('[data-notification-banner]');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Show loading while checking authentication
  if (!isLoginPage && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Logged in as {adminUser?.name} ({adminUser?.phone})
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notification Status Indicator */}
              <NotificationStatusIndicator 
                status={notificationStatus} 
                onClick={handleNotificationIndicatorClick}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AdminBreadcrumbs />
          
          {/* Smart Notification Banner */}
          <NotificationBanner 
            userId="admin_alerts" 
            userType="admin"
            onStatusChange={setNotificationStatus}
          />
          
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminAuthProvider>
  );
} 