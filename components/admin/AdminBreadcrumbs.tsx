"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Admin", href: "/admin" }
    ];

    if (segments.length > 1) {
      const section = segments[1];
      const sectionLabel = getSectionLabel(section);
      
      if (sectionLabel) {
        breadcrumbs.push({
          label: sectionLabel,
          href: segments.length === 2 ? undefined : `/${segments.slice(0, 2).join('/')}`
        });
      }

      // Add specific page if it exists
      if (segments.length > 2) {
        const page = segments[2];
        const pageLabel = getPageLabel(page, segments);
        
        if (pageLabel) {
          breadcrumbs.push({
            label: pageLabel,
            href: undefined
          });
        }
      }
    }

    return breadcrumbs;
  };

  const getSectionLabel = (section: string): string => {
    const sectionMap: Record<string, string> = {
      'bookings': 'Bookings',
      'payments': 'Payments',
      'providers': 'Providers',
      'verify-providers': 'Verify Providers',
      'cash-collection': 'Cash Collection',
      'users': 'Users',
      'analytics': 'Analytics',
      'quality': 'Quality Assurance',
      'communication': 'Communication',
      'content': 'Content',
      'settings': 'Settings'
    };
    
    return sectionMap[section] || section.charAt(0).toUpperCase() + section.slice(1);
  };

  const getPageLabel = (page: string, segments: string[]): string => {
    // Handle specific page types
    if (page === '[id]' && segments.length > 2) {
      const section = segments[1];
      if (section === 'providers') {
        return 'Provider Details';
      }
      if (section === 'bookings') {
        return 'Booking Details';
      }
      if (section === 'users') {
        return 'User Details';
      }
    }
    
    return page.charAt(0).toUpperCase() + page.slice(1);
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? (
                <Home className="h-4 w-4" />
              ) : (
                item.label
              )}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
} 