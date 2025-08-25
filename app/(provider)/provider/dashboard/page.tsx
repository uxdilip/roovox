"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Star, CheckCircle, AlertCircle, MapPin, Calendar, DollarSign, Clock, Smartphone, User, CreditCard } from "lucide-react";
import { Tabs as ShadTabs, TabsList as ShadTabsList, TabsTrigger as ShadTabsTrigger, TabsContent as ShadTabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import Link from "next/link";
import ProviderCommissionTab from "@/components/provider/ProviderCommissionTab";
import TierPricingTab from "@/components/provider/TierPricingTab";
import ProviderChatTab from "@/components/provider/ProviderChatTab";
import { EnhancedTabs } from "@/components/ui/enhanced-tabs";

const ServiceSetupStep = dynamic(() => import("@/components/provider/onboarding/steps/ServiceSetupStep"), { ssr: false });

export default function ProviderDashboardPage() {
  const { user, roles, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize tab from URL parameter or default to overview
  const [tab, setTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam || "overview";
  });

  // --- Overview Tab State ---
  const [profile, setProfile] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [businessSetup, setBusinessSetup] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // --- Bookings Tab State ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsTab, setBookingsTab] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit Availability Modal State
  const [editAvailabilityOpen, setEditAvailabilityOpen] = useState(false);
  const [availabilityEditData, setAvailabilityEditData] = useState<any>(null);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [bookingToDecline, setBookingToDecline] = useState<any>(null);

  // Redirect to home if logged out
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);
  
  // Auth protection: Only allow provider
  useEffect(() => {
    if (!isLoading && user && !roles.includes("provider")) {
      router.replace("/provider/login");
    }
  }, [user, roles, isLoading, router]);

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [searchParams, tab]);

  // Update URL when tab changes - with debouncing to prevent rapid switches
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tab && tab !== 'overview') {
        const newUrl = `/provider/dashboard?tab=${tab}`;
        router.replace(newUrl, { scroll: false });
      } else if (tab === 'overview') {
        router.replace('/provider/dashboard', { scroll: false });
      }
    }, 100); // 100ms delay to prevent rapid tab switching

    return () => clearTimeout(timeoutId);
  }, [tab, router]);

  useEffect(() => {
    if (tab !== "overview" || !user) return;
    
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for maximum speed
        const [userRes, providerRes, businessRes, bookingsRes] = await Promise.all([
          // 1. User profile
          databases.listDocuments(
            DATABASE_ID,
            "User",
            [Query.equal("user_id", user.id), Query.limit(1)]
          ),
          // 2. Provider status
          databases.listDocuments(
            DATABASE_ID,
            "providers",
            [Query.equal("providerId", user.id), Query.limit(1)]
          ),
          // 3. Business setup
          databases.listDocuments(
            DATABASE_ID,
            "business_setup",
            [Query.equal("user_id", user.id), Query.limit(1)]
          ),
          // 4. Booking stats
          databases.listDocuments(
            DATABASE_ID,
            "bookings",
            [Query.equal("provider_id", user.id)]
          )
        ]);

        const userDoc = userRes.documents[0];
        const providerDoc = providerRes.documents[0];
        const businessDoc = businessRes.documents[0];
        const bookings = bookingsRes.documents;

        // Process business setup data
        let onboarding: any = {};
        try {
          onboarding = businessDoc ? JSON.parse(businessDoc.onboarding_data || '{}') : {};
          // Deep-parse any stringified fields
          ['personalDetails', 'businessSetup', 'serviceSetup'].forEach(key => {
            if ((onboarding as any)[key] && typeof (onboarding as any)[key] === 'string') {
              try { (onboarding as any)[key] = JSON.parse((onboarding as any)[key]); } catch {}
            }
          });
          if ((onboarding as any).businessSetup && (onboarding as any).businessSetup.business && typeof (onboarding as any).businessSetup.business === 'string') {
            try { (onboarding as any).businessSetup.business = JSON.parse((onboarding as any).businessSetup.business); } catch {}
          }
          if ((onboarding as any).serviceSetup && typeof (onboarding as any).serviceSetup === 'string') {
            try { (onboarding as any).serviceSetup = JSON.parse((onboarding as any).serviceSetup); } catch {}
          }
        } catch { onboarding = {}; }

        // Stats calculations
        const totalBookings = bookings.length;
        const completedBookings = bookings.filter(b => b.status === "completed");
        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const ratedBookings = bookings.filter(b => b.rating && b.rating > 0);
        const averageRating = ratedBookings.length > 0 ? (ratedBookings.reduce((sum, b) => sum + b.rating, 0) / ratedBookings.length) : null;

        if (isMounted) {
          setProfile(userDoc);
          setProviderStatus(providerDoc);
          setBusinessSetup(onboarding);
          setStats({ totalBookings, averageRating, totalRevenue });
        }
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    };
    
    // ✅ CRITICAL FIX: Use setTimeout to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchData();
      }
    }, 100);
    
    return () => { 
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [tab, user]);

  useEffect(() => {
    if (tab !== "bookings" || !user) return;
    
    let isMounted = true;
    const fetchBookings = async () => {
      if (!user) return;

      try {

        // Fetch bookings for this provider
        const bookingsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.BOOKINGS,
          [Query.equal("provider_id", user.id)]
        );



        // Extract unique customer IDs and device IDs for batch fetching
        const uniqueCustomerIds = [...new Set(bookingsResponse.documents.map(b => b.customer_id))];
        const uniqueDeviceIds = [...new Set(bookingsResponse.documents.map(b => b.device_id))];
        const uniqueBookingIds = [...new Set(bookingsResponse.documents.map(b => b.$id))];

        // Batch fetch all customer data in parallel
        const customerDataPromises = uniqueCustomerIds.map(async (customerId) => {
          try {
            // Try customers collection first, then User collection as fallback
            const [customerResponse, userResponse] = await Promise.all([
              databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.CUSTOMERS,
                [Query.equal("user_id", customerId), Query.limit(1)]
              ).catch(() => ({ documents: [] })),
              databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal("user_id", customerId), Query.limit(1)]
              ).catch(() => ({ documents: [] }))
            ]);

            const customerFullName = customerResponse.documents[0]?.full_name || "";
            const userName = userResponse.documents[0]?.name || "";
            const customerName = customerFullName || userName || "Unknown Customer";

            return { customerId, customerName };
          } catch (error) {
            console.error("Error fetching customer data:", error);
            return { customerId, customerName: "Unknown Customer" };
          }
        });

        // Batch fetch all device data in parallel
        const deviceDataPromises = uniqueDeviceIds.map(async (deviceId) => {
          try {
            // Handle generic device IDs from new tier pricing system
            if (deviceId === 'phone' || deviceId === 'laptop') {
              return {
                deviceId,
                deviceBrand: deviceId === 'phone' ? 'Smartphone' : 'Laptop',
                deviceModel: 'Device',
                deviceImage: ""
              };
            }

            // Try Phones collection first, then Laptops collection as fallback
            const deviceResponse = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.PHONES,
              deviceId
            ).catch(() => 
              databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.LAPTOPS,
                deviceId
              ).catch(() => null)
            );

            if (deviceResponse) {
              return {
                deviceId,
                deviceBrand: deviceResponse.brand || "Unknown Brand",
                deviceModel: deviceResponse.model || "",
                deviceImage: deviceResponse.image_url || ""
              };
            }
            return { deviceId, deviceBrand: "Unknown Device", deviceModel: "", deviceImage: "" };
          } catch (error) {
            console.error("Error fetching device data:", error);
            return { deviceId, deviceBrand: "Unknown Device", deviceModel: "", deviceImage: "" };
          }
        });

        // Batch fetch all payment data in parallel
        const paymentDataPromises = uniqueBookingIds.map(async (bookingId) => {
          try {
            const paymentsResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.PAYMENTS,
              [Query.equal("booking_id", bookingId)]
            );
            
            const payment = paymentsResponse.documents[0];
            return {
              bookingId,
              paymentMethod: payment?.payment_method || "Online",
              paymentStatus: payment?.status || "pending"
            };
          } catch (error) {
            console.error("Error fetching payment data:", error);
            return { bookingId, paymentMethod: "Online", paymentStatus: "pending" };
          }
        });

        // Wait for all batch operations to complete
        const [customerData, deviceData, paymentData] = await Promise.all([
          Promise.all(customerDataPromises),
          Promise.all(deviceDataPromises),
          Promise.all(paymentDataPromises)
        ]);

        // Create lookup maps for fast access
        const customerMap = new Map(customerData.map(c => [c.customerId, c.customerName]));
        const deviceMap = new Map(deviceData.map(d => [d.deviceId, d]));
        const paymentMap = new Map(paymentData.map(p => [p.bookingId, p]));

        // ✅ FIXED: Combine all data efficiently with device_info fallback
        const bookingsWithDetails = bookingsResponse.documents.map(booking => {
          const customerName = customerMap.get(booking.customer_id) || "Unknown Customer";
          const deviceInfo = deviceMap.get(booking.device_id) || { deviceBrand: "Unknown Device", deviceModel: "", deviceImage: "" };
          const paymentInfo = paymentMap.get(booking.$id) || { paymentMethod: "Online", paymentStatus: "pending" };

          // ✅ FIXED: Use device_info if available, otherwise fall back to device lookup
          let finalDeviceDisplay = `${deviceInfo.deviceBrand} ${deviceInfo.deviceModel}`.trim();
          
          if (booking.device_info) {
            try {
              const parsedDeviceInfo = JSON.parse(booking.device_info);
              if (parsedDeviceInfo.brand && parsedDeviceInfo.model) {
                finalDeviceDisplay = `${parsedDeviceInfo.brand} ${parsedDeviceInfo.model}`;
              }
            } catch (error) {
              console.warn('Error parsing device_info:', error);
            }
          }

          return {
            ...booking,
            customer_name: customerName,
            device_brand: deviceInfo.deviceBrand,
            device_model: deviceInfo.deviceModel,
            device_image: deviceInfo.deviceImage,
            device_display: finalDeviceDisplay, // ✅ FIXED: Use device_info when available
            payment_method: paymentInfo.paymentMethod,
            payment_status: paymentInfo.paymentStatus
          };
        });

        // ✅ CRITICAL FIX: Check if component is still mounted before setting state
        if (isMounted) {
          setBookings(bookingsWithDetails);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    
    // ✅ CRITICAL FIX: Use setTimeout to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchBookings();
      }
    }, 100);
    
    return () => { 
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [tab, user]);



  // Enhanced bookingsByTab with search and status filter
  const bookingsByTab = useMemo(() => {
    let filtered = bookings;
    if (bookingsTab === "upcoming") {
      filtered = filtered.filter(b => ["pending", "confirmed", "in_progress"].includes(b.status));
    } else if (bookingsTab === "completed") {
      filtered = filtered.filter(b => b.status === "completed");
    } else if (bookingsTab === "cancelled") {
      filtered = filtered.filter(b => b.status === "cancelled");
    }

    // ✅ FIXED: Apply search filter including selected_issues
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        // Check device display
        if ((b.device_display || b.device || "").toLowerCase().includes(query)) return true;
        
        // Check customer name
        if ((b.customer_name || "").toLowerCase().includes(query)) return true;
        
        // Check selected_issues (the actual field from database)
        if (b.selected_issues) {
          try {
            let issues: any[] = [];
            if (typeof b.selected_issues === 'string') {
              issues = JSON.parse(b.selected_issues);
            } else if (Array.isArray(b.selected_issues)) {
              issues = b.selected_issues;
            }
            
            if (issues.some((issue: any) => 
              (issue.name || issue.id || '').toLowerCase().includes(query)
            )) return true;
          } catch (error) {
            console.warn('Error parsing selected_issues for search:', error);
          }
        }
        
        // Fallback to old issues field
        if ((b.issues || []).some((issue: string) => issue.toLowerCase().includes(query))) return true;
        
        return false;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    return filtered;
  }, [bookings, bookingsTab, searchTerm, statusFilter]);

  // Extract fields for display
  const name = businessSetup?.personalDetails?.fullName || profile?.name || "-";
  const businessName = businessSetup?.businessInfo?.businessName || profile?.business_name || "-";
  const email = businessSetup?.personalDetails?.email || profile?.email || "-";
  const phone = businessSetup?.personalDetails?.mobile || profile?.phone || "-";
  const isVerified = providerStatus?.isVerified;
  const isApproved = providerStatus?.isApproved;
  const serviceArea = businessSetup?.serviceSetup?.location ? `${businessSetup.serviceSetup.location.city || "-"}, ${businessSetup.serviceSetup.location.state || "-"} ${businessSetup.serviceSetup.location.zip || ""}` : "-";
  const availability = businessSetup?.serviceSetup?.availability || "-";

  // Format availability (simple string or object)
  const availabilityString = useMemo(() => {
    if (!availability || typeof availability === "string") return availability || "-";
    // If object, format as e.g. Mon–Fri 10AM–7PM
    if (typeof availability === "object") {
      const days = Object.keys(availability).filter(day => availability[day]?.available);
      if (days.length === 0) return "-";
      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      const start = availability[firstDay]?.start;
      const end = availability[firstDay]?.end;
      return `${firstDay.charAt(0).toUpperCase() + firstDay.slice(1)}–${lastDay.charAt(0).toUpperCase() + lastDay.slice(1)} ${start}–${end}`;
    }
    return "-";
  }, [availability]);

  // Format currency
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Helper: format date/time
  const formatDateTime = (dt: string) => {
    if (!dt) return "-";
    const d = new Date(dt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    let datePrefix = "";
    if (bookingDate.getTime() === today.getTime()) {
      datePrefix = "Today";
    } else if (bookingDate.getTime() === tomorrow.getTime()) {
      datePrefix = "Tomorrow";
    } else {
      datePrefix = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
      });
    }
    
    const timeString = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    
    return `${datePrefix}, ${timeString}`;
  };

  // Helper: status badge
  const statusBadge = (status: string) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "confirmed":
          return "bg-blue-100 text-blue-800";
        case "in_progress":
          return "bg-orange-100 text-orange-800";
        case "pending_cod_collection":
          return "bg-green-100 text-green-800"; // Show as green (completed) to provider
        case "completed":
          return "bg-green-100 text-green-800";
        case "cancelled":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getStatusDisplay = (status: string) => {
      switch (status) {
        case "pending_cod_collection":
          return "Completed"; // Provider sees "Completed" even though it's pending cash collection
        default:
          return status.charAt(0).toUpperCase() + status.slice(1);
      }
    };

    return (
      <Badge className={getStatusColor(status)}>
        {getStatusDisplay(status)}
      </Badge>
    );
  };

  // ✅ FIXED: Helper to get issues as string from selected_issues
  const issuesString = (booking: any) => {
    // First try to parse selected_issues (the actual field from database)
    if (booking.selected_issues) {
      try {
        // If it's a JSON string, parse it
        if (typeof booking.selected_issues === 'string') {
          const parsed = JSON.parse(booking.selected_issues);
          if (Array.isArray(parsed)) {
            // Extract service names from the objects
            const serviceNames = parsed.map(issue => issue.name || issue.id || 'Unknown Service');
            return serviceNames.join(", ");
          }
        }
        // If it's already an array
        if (Array.isArray(booking.selected_issues)) {
          const serviceNames = booking.selected_issues.map((issue: any) => issue.name || issue.id || 'Unknown Service');
          return serviceNames.join(", ");
        }
      } catch (error) {
        console.warn('Error parsing selected_issues:', error);
      }
    }
    
    // Fallback to other fields
    if (Array.isArray(booking.issues)) return booking.issues.join(", ");
    if (typeof booking.issues === "string") return booking.issues;
    if (booking.issue_description) return booking.issue_description;
    
    return "-";
  };

  // Helper: get customer name (if available)
  const customerName = (booking: any) => booking.customer_name || booking.customer || booking.customer_id || "Unknown Customer";

  // Add handler to open modal with current availability
  const handleEditAvailability = () => {
    setAvailabilityEditData(businessSetup?.serviceSetup || {});
    setEditAvailabilityOpen(true);
  };

  // Create tabs array for EnhancedTabs
  const tabs = [
    {
      value: "overview",
      label: "Overview",
      content: (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Profile Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-xl font-semibold">{name}</div>
                        <div className="text-lg font-semibold">{businessName}</div>
                        <div className="text-muted-foreground text-sm">{email}</div>
                        <div className="text-muted-foreground text-sm">{phone}</div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={isVerified ? "default" : "secondary"}>{isVerified ? "Verified" : "Not Verified"}</Badge>
                        <Badge variant={isApproved ? "default" : "secondary"}>{isApproved ? "Approved" : "Not Approved"}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Service Area: {serviceArea}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Availability: {availabilityString}</span>
                      <Button size="sm" variant="outline" className="ml-2" onClick={handleEditAvailability}>Edit Availability</Button>
                    </div>
                  </div>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-muted">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBookings ?? "N/A"}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.averageRating ? stats.averageRating.toFixed(2) : "N/A"}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalRevenue !== undefined ? formatCurrency(stats.totalRevenue) : "N/A"}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
            </CardContent>
          </Card>
        </motion.div>
      )
    },
    {
      value: "bookings",
      label: "Bookings",
      content: (
        <motion.div
          key="bookings"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by device, customer, or issue..."
                    className="w-64"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchTerm || statusFilter !== "all") && (
                    <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>Reset Filters</Button>
                  )}
                </div>
              </div>
              <ShadTabs value={bookingsTab} onValueChange={setBookingsTab} className="w-full">
                <ShadTabsList className="mb-4 w-full flex gap-2 bg-muted rounded-lg p-1">
                  <ShadTabsTrigger value="upcoming" className="flex-1">
                    Upcoming ({bookings.filter(b => ["pending", "confirmed", "in_progress"].includes(b.status)).length})
                  </ShadTabsTrigger>
                  <ShadTabsTrigger value="completed" className="flex-1">
                    Completed ({bookings.filter(b => b.status === "completed").length})
                  </ShadTabsTrigger>
                  <ShadTabsTrigger value="cancelled" className="flex-1">
                    Cancelled ({bookings.filter(b => b.status === "cancelled").length})
                  </ShadTabsTrigger>
                </ShadTabsList>
                <ShadTabsContent value="upcoming">
                  {bookingsByTab.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">No upcoming bookings.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bookingsByTab.map(booking => (
                        <Card key={booking.$id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-base">{booking.device_display || booking.device || booking.device_id || "Device"}</div>
                                <div className="text-muted-foreground text-xs">{issuesString(booking)}</div>
                              </div>
                            </div>
                            {statusBadge(booking.status)}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateTime(booking.appointment_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{customerName(booking)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {booking.payment_method || (booking.payment_status === "pending" ? "COD" : "Online")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="text-lg font-bold text-primary">
                                ₹{booking.total_amount?.toLocaleString() || "0"}
                              </div>
                              <div className="flex items-center gap-2">
                                {/* COD, pending: Accept/Decline */}
                                {booking.payment_status === "pending" && booking.status === "pending" && (
                                  <>
                                    <Button size="sm" variant="default" onClick={() => handleBookingAction(booking, "accept")}>Accept</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeclineClick(booking)}>Decline</Button>
                                  </>
                                )}
                                {/* Online payment, confirmed: Start Service */}
                                {booking.payment_status === "completed" && booking.status === "confirmed" && (
                                  <Button size="sm" variant="default" onClick={() => handleBookingAction(booking, "complete")}>Mark as Completed</Button>
                                )}
                                {/* COD, confirmed: Start Service */}
                                {booking.payment_status === "pending" && booking.status === "confirmed" && (
                                  <Button size="sm" variant="default" onClick={() => handleBookingAction(booking, "complete")}>Mark as Completed</Button>
                                )}
                                {/* in_progress: Mark as Completed */}
                                {booking.status === "in_progress" && (
                                  <Button size="sm" variant="default" onClick={() => handleBookingAction(booking, "complete")}>Mark as Completed</Button>
                                )}
                                {/* pending_cod_collection: No actions */}
                                {booking.status === "pending_cod_collection" && (
                                  <span className="text-xs text-muted-foreground">No actions</span>
                                )}
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/provider/bookings/${booking.$id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ShadTabsContent>
                <ShadTabsContent value="completed">
                  {bookingsByTab.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">No completed bookings.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bookingsByTab.map(booking => (
                        <Card key={booking.$id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-base">{booking.device_display || booking.device || booking.device_id || "Device"}</div>
                                <div className="text-muted-foreground text-xs">{issuesString(booking)}</div>
                              </div>
                            </div>
                            {statusBadge(booking.status)}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateTime(booking.appointment_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{customerName(booking)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {booking.payment_method || (booking.payment_status === "pending" ? "COD" : "Online")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="text-lg font-bold text-primary">
                                ₹{booking.total_amount?.toLocaleString() || "0"}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/provider/bookings/${booking.$id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ShadTabsContent>
                <ShadTabsContent value="cancelled">
                  {bookingsByTab.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">No cancelled bookings.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bookingsByTab.map(booking => (
                        <Card key={booking.$id} className="shadow-sm border hover:shadow-md transition-shadow">
                          <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="font-semibold text-base">{booking.device_display || booking.device || booking.device_id || "Device"}</div>
                                <div className="text-muted-foreground text-xs">{issuesString(booking)}</div>
                              </div>
                            </div>
                            {statusBadge(booking.status)}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateTime(booking.appointment_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{customerName(booking)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {booking.payment_method || (booking.payment_status === "pending" ? "COD" : "Online")}
                              </span>
                              <Badge className={booking.payment_status === "completed" ? "bg-green-100 text-green-800" : booking.payment_status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                {booking.payment_status === "completed" ? "Completed" : booking.payment_status === "cancelled" ? "Cancelled" : "Pending"}
                              </Badge>
                            </div>
                            {booking.status === "cancelled" && booking.cancellation_reason && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800">
                                  <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="text-lg font-bold text-primary">
                                ₹{booking.total_amount?.toLocaleString() || "0"}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/provider/bookings/${booking.$id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ShadTabsContent>
              </ShadTabs>
            </CardContent>
          </Card>
        </motion.div>
      )
    },
    {
      value: "commission",
      label: "Commission",
      content: (
        <motion.div
          key="commission"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <ProviderCommissionTab />
        </motion.div>
      )
    },
    {
      value: "chat",
      label: "Chat",
      content: (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <ProviderChatTab />
        </motion.div>
      )
    },
    {
      value: "tier-pricing",
      label: "Tier Pricing",
      content: (
        <motion.div
          key="tier-pricing"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <TierPricingTab />
        </motion.div>
      )
    }
  ];

  const handleBookingAction = async (booking: any, action: string) => {
    
    try {
      let update: any = {};
      if (action === "accept") {
        update.status = "in_progress"; // Directly to in_progress when accepted

      } else if (action === "decline") {
        update.status = "cancelled";
        update.cancellation_reason = declineReason;
        // For COD bookings, set payment_status to 'cancelled' when cancelled
        // For online bookings, keep payment_status as 'completed' since payment was already made
        if (booking.payment_status === "pending") {
          update.payment_status = "cancelled"; // COD booking cancelled
        }

      } else if (action === "complete") {
        // Check if this is a COD booking
        if (booking.payment_status === "pending") {
          if (booking.location_type === "doorstep") {
            // COD + Doorstep: Mark as completed directly (platform handles verification)
            update.status = "completed";
            update.payment_status = "completed";
          } else {
            // ✅ FIXED: COD + Instore: Mark as completed and create commission collection
            update.status = "completed";
            update.payment_status = "completed";
            
            // Create commission collection record
            try {
              await createCommissionCollection(booking.$id, booking.provider_id);
            } catch (error) {
              console.error('Error creating commission collection:', error);
              // Don't fail the booking completion if commission collection fails
            }
          }
        } else {
          // Online payment: Just mark as completed
          update.status = "completed";
        }
      }
      update.updated_at = new Date().toISOString();
      await databases.updateDocument(
        DATABASE_ID,
        "bookings",
        booking.$id,
        update
      );
      toast.success("Booking updated!");
      // Refresh bookings
      setBookings((prev) => prev.map(b => b.$id === booking.$id ? { ...b, ...update } : b));
      // Close decline modal if it was open
      if (action === "decline") {
        setDeclineModalOpen(false);
        setDeclineReason("");
        setBookingToDecline(null);
      }
    } catch (error) {
      console.error('Error in handleBookingAction:', error);
      toast.error("Failed to update booking");
    }
  };

  const handleDeclineClick = (booking: any) => {
    setBookingToDecline(booking);
    setDeclineModalOpen(true);
  };

  // ✅ NEW FUNCTION: Create commission collection record
  const createCommissionCollection = async (bookingId: string, providerId: string) => {
    try {
      const response = await fetch('/api/payments/collect-cod-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          provider_id: providerId,
          collection_method: 'upi' // Default to UPI
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create commission collection');
      }

      return data;
    } catch (error) {
      console.error('❌ Error creating commission collection:', error);
      throw error;
    }
  };

  const handleDeclineSubmit = () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    if (!bookingToDecline) {
      toast.error("No booking selected for decline");
      return;
    }
    handleBookingAction(bookingToDecline, "decline");
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">

      {/* Edit Availability Modal */}
      {editAvailabilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setEditAvailabilityOpen(false)}>&times;</button>
            <ServiceSetupStep
              data={availabilityEditData || {}}
              setData={setAvailabilityEditData}
              onNext={async () => {
                setEditAvailabilityOpen(false);
                setTab('overview');
                // Refetch dashboard data - no loading state needed
              }}
              onPrev={() => setEditAvailabilityOpen(false)}
            />
          </div>
        </div>
      )}
      {/* Decline Reason Modal */}
      {declineModalOpen && bookingToDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Reason for Declining Booking</h3>
            <textarea
              className="w-full p-2 border rounded-md mb-4"
              rows={4}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason for declining the booking..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeclineModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeclineSubmit}>Decline</Button>
            </div>
          </div>
        </div>
      )}
              <EnhancedTabs 
                tabs={tabs} 
                defaultValue={tab} 
                className="w-full"
                onTabChange={setTab}
              />
          </div>
  );
}