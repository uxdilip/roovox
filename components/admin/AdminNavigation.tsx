"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  LayoutDashboard,
  Calendar,
  DollarSign,
  Users,
  Building,
  CreditCard,
  Settings,
  BarChart3,
  Shield,
  MessageSquare,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Download,
  Bell,
  Mail
} from "lucide-react";
import { MessageNotificationEnvelope } from "@/components/ui/message-notification-envelope";
import { Badge } from "@/components/ui/badge";
import { useAdminNotifications } from "@/hooks/use-admin-notifications";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview and analytics"
  },
  {
    title: "Message Alerts",
    href: "/admin/message-alerts",
    icon: Mail,
    description: "Customer messages & alerts",
    showBadge: true
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
    description: "Manage service bookings"
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: DollarSign,
    description: "Financial transactions"
  },
  {
    title: "Providers",
    href: "/admin/providers",
    icon: Building,
    description: "Manage and verify providers"
  },
  {
    title: "Cash Collection",
    href: "/admin/cash-collection",
    icon: CreditCard,
    description: "COD payment management"
  },
  {
    title: "Commission Collection",
    href: "/admin/commission-collection",
    icon: DollarSign,
    description: "Track COD commission collections"
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Customer management"
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Reports and insights"
  },
  {
    title: "Quality Assurance",
    href: "/admin/quality",
    icon: Shield,
    description: "Reviews and disputes"
  },
  {
    title: "Data Export",
    href: "/admin/data-export",
    icon: Download,
    description: "Export device collections to CSV"
  },
  {
    title: "Communication",
    href: "/admin/communication",
    icon: MessageSquare,
    description: "Messages and notifications"
  },
  {
    title: "Content",
    href: "/admin/content",
    icon: FileText,
    description: "FAQ and policies"
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Platform configuration"
  }
];

interface AdminNavigationProps {
  className?: string;
}

export default function AdminNavigation({ className }: AdminNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get notification count for message alerts
  const { chatUnreadCount } = useAdminNotifications();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex flex-col h-screen bg-white border-r transition-all duration-300", 
        isCollapsed ? "w-16" : "w-80", 
        className
      )}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="transition-all duration-300">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Device Repair Platform</p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const showNotificationBadge = item.showBadge && item.href === '/admin/message-alerts' && chatUnreadCount > 0;
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start h-auto p-3 transition-all duration-200 relative",
                        isCollapsed ? "justify-center px-2" : "justify-start",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <div className="relative">
                        <item.icon className={cn(
                          "h-4 w-4 transition-all duration-200",
                          isCollapsed ? "mr-0" : "mr-3"
                        )} />
                        {/* Show notification dot for message alerts */}
                        {showNotificationBadge && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.title}</span>
                            {showNotificationBadge && (
                              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="max-w-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {showNotificationBadge && (
                          <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                            {chatUnreadCount > 99 ? '99' : chatUnreadCount}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className={cn(
                  "w-full justify-start h-auto p-3 transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "justify-start"
                )}
              >
                <LogOut className={cn(
                  "h-4 w-4 transition-all duration-200",
                  isCollapsed ? "mr-0" : "mr-3"
                )} />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
} 