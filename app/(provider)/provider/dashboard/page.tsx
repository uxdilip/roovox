"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ProviderServicesPage from "../services/page";
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

const ServiceSetupStep = dynamic(() => import("@/components/provider/onboarding/steps/ServiceSetupStep"), { ssr: false });

export default function ProviderDashboardPage() {
  const { user, roles, isLoading } = useAuth();
  const [tab, setTab] = useState("overview");
  const router = useRouter();

  // --- Overview Tab State ---
  const [profile, setProfile] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [businessSetup, setBusinessSetup] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // --- Bookings Tab State ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
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

  useEffect(() => {
    if (tab !== "overview" || !user) return;
    let isMounted = true;
    setLoadingOverview(true);
    const fetchData = async () => {
      try {
        // 1. User profile
        const userRes = await databases.listDocuments(
          DATABASE_ID,
          "User",
          [Query.equal("user_id", user.id), Query.limit(1)]
        );
        const userDoc = userRes.documents[0];
        // 2. Provider status
        const providerRes = await databases.listDocuments(
          DATABASE_ID,
          "providers",
          [Query.equal("providerId", user.id), Query.limit(1)]
        );
        const providerDoc = providerRes.documents[0];
        // 3. Business setup
        const businessRes = await databases.listDocuments(
          DATABASE_ID,
          "business_setup",
          [Query.equal("user_id", user.id), Query.limit(1)]
        );
        const businessDoc = businessRes.documents[0];
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
        // 4. Booking stats
        const bookingsRes = await databases.listDocuments(
          DATABASE_ID,
          "bookings",
          [Query.equal("provider_id", user.id)]
        );
        const bookings = bookingsRes.documents;
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
          setLoadingOverview(false);
        }
      } catch (error) {
        setLoadingOverview(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [tab, user]);

  useEffect(() => {
    if (tab !== "bookings" || !user) return;
    let isMounted = true;
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoadingBookings(true);
        
        // Fetch bookings for this provider
        const bookingsResponse = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
          [Query.equal("provider_id", user.id)]
        );

        console.log("Found bookings:", bookingsResponse.documents.length);

        // Fetch additional details for each booking
        const bookingsWithDetails = await Promise.all(
          bookingsResponse.documents.map(async (booking: any) => {
            try {
              // Fetch customer details - following the same pattern as customer dashboard
              let customerName = "Unknown Customer";

              try {
                // 1. Fetch customer details from customers collection first
                let customerResponse;
                try {
                  customerResponse = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    COLLECTIONS.CUSTOMERS,
                    [Query.equal("user_id", booking.customer_id), Query.limit(1)]
                  );
                } catch (customerError) {
                  console.error("Error fetching customer data:", customerError);
                }

                // 2. Fetch customer details from User collection as fallback
                let userResponse;
                try {
                  userResponse = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    'User',
                    [Query.equal("user_id", booking.customer_id), Query.limit(1)]
                  );
                } catch (userError) {
                  console.error("Error fetching customer user data:", userError);
                }

                // 3. Set customer name with proper fallback logic
                const customerFullName = customerResponse?.documents[0]?.full_name || "";
                const userName = userResponse?.documents[0]?.name || "";
                customerName = customerFullName || userName || "Unknown Customer";

              } catch (error) {
                console.error("Error fetching customer details:", error);
                customerName = "Unknown Customer";
              }

              // Fetch device details
              let deviceBrand = "Unknown Device";
              let deviceModel = "";
              let deviceImage = "";
              
              try {
                // Try to fetch from Phones collection first
                let deviceResponse;
                try {
                  deviceResponse = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    'Phones',
                    booking.device_id
                  );
                } catch (phoneError) {
                  // If not found in Phones, try Laptops collection
                  try {
                    deviceResponse = await databases.getDocument(
                      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                      'Laptops',
                      booking.device_id
                    );
                  } catch (laptopError) {
                    console.error("Device not found in either collection:", booking.device_id);
                  }
                }
                
                if (deviceResponse) {
                  deviceBrand = deviceResponse.brand || "Unknown Brand";
                  deviceModel = deviceResponse.model || "";
                  deviceImage = deviceResponse.image_url || "";
                }
              } catch (error) {
                console.error("Error fetching device details:", error);
              }

              // Fetch payment details
              let paymentMethod = "Online"; // Default to Online
              try {
                const paymentsResponse = await databases.listDocuments(
                  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                  'payments',
                  [Query.equal("booking_id", booking.$id)]
                );
                
                if (paymentsResponse.documents.length > 0) {
                  const payment = paymentsResponse.documents[0];
                  paymentMethod = payment.payment_method === "COD" ? "COD" : "Online";
                } else {
                  // If no payment record found, determine based on payment_status
                  // COD bookings typically have payment_status "pending" initially
                  paymentMethod = booking.payment_status === "pending" ? "COD" : "Online";
                }
              } catch (error) {
                console.error("Error fetching payment details:", error);
                // Fallback logic
                paymentMethod = booking.payment_status === "pending" ? "COD" : "Online";
              }

              return {
                ...booking,
                customer_name: customerName,
                device_brand: deviceBrand,
                device_model: deviceModel,
                device_image: deviceImage,
                device_display: `${deviceBrand} ${deviceModel}`.trim(),
                payment_method: paymentMethod
              };
            } catch (error) {
              console.error("Error processing booking:", error);
              return booking;
            }
          })
        );

        setBookings(bookingsWithDetails);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
    return () => { isMounted = false; };
  }, [tab, user]);

  // Enhanced bookingsByTab with search and status filter
  const bookingsByTab = useMemo(() => {
    let filtered = bookings;
    if (bookingsTab === "upcoming") {
      filtered = filtered.filter(b => ["pending", "confirmed", "in_progress", "pending_cod_collection"].includes(b.status));
    } else if (bookingsTab === "completed") {
      filtered = filtered.filter(b => b.status === "completed");
    } else if (bookingsTab === "cancelled") {
      filtered = filtered.filter(b => b.status === "cancelled");
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        (b.device || b.device_id || "").toLowerCase().includes(term) ||
        (customerName(b) || "").toLowerCase().includes(term) ||
        (issuesString(b) || "").toLowerCase().includes(term)
      );
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

  // Helper: get issues as string
  const issuesString = (booking: any) => {
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

  const handleBookingAction = async (booking: any, action: string) => {
    console.log('handleBookingAction called with:', { action, bookingId: booking.$id });
    try {
      let update: any = {};
      if (action === "accept") {
        update.status = "in_progress"; // Directly to in_progress when accepted
        console.log('Setting status to in_progress');
      } else if (action === "decline") {
        update.status = "cancelled";
        update.cancellation_reason = declineReason;
        // For COD bookings, set payment_status to 'cancelled' when cancelled
        // For online bookings, keep payment_status as 'completed' since payment was already made
        if (booking.payment_status === "pending") {
          update.payment_status = "cancelled"; // COD booking cancelled
        }
        console.log('Setting status to cancelled with reason:', declineReason);
      } else if (action === "complete") {
        // Check if this is a COD booking
        if (booking.payment_status === "pending") {
          if (booking.location_type === "doorstep") {
            // COD + Doorstep: Set to pending_cod_collection for pickup
            update.status = "pending_cod_collection";
            console.log('Setting status to pending_cod_collection (COD + Doorstep)');
          } else {
            // COD + Instore: Mark as completed and update payment status
            update.status = "completed";
            update.payment_status = "completed";
            console.log('Setting status to completed and payment_status to completed (COD + Instore)');
          }
        } else {
          // Online payment: Just mark as completed
          update.status = "completed";
          console.log('Setting status to completed (Online payment)');
        }
      } else if (action === "confirm_cod") {
        // Confirm COD collection for doorstep bookings
        update.status = "completed";
        update.payment_status = "completed";
        console.log('Confirming COD collection and marking as completed');
      }
      update.updated_at = new Date().toISOString();
      console.log('Updating booking with:', update);
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
    console.log('Decline clicked for booking:', booking.$id);
    setBookingToDecline(booking);
    setDeclineModalOpen(true);
  };

  const handleDeclineSubmit = () => {
    console.log('Decline submit clicked, reason:', declineReason);
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    if (!bookingToDecline) {
      toast.error("No booking selected for decline");
      return;
    }
    console.log('Calling handleBookingAction with decline');
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
                // Refetch dashboard data
                setLoadingOverview(true);
                // Wait a moment for DB update
                setTimeout(() => setLoadingOverview(false), 1200);
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
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 w-full flex gap-2 bg-muted rounded-lg p-1">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="bookings" className="flex-1">Bookings</TabsTrigger>
          <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
              </TabsList>
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <TabsContent value="overview" forceMount>
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
                    {loadingOverview ? (
                      <div className="py-10 text-center text-muted-foreground">Loading...</div>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              </TabsContent>
          )}
          {tab === "bookings" && (
            <TabsContent value="bookings" forceMount>
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
                          Upcoming ({bookings.filter(b => ["pending", "confirmed", "in_progress", "pending_cod_collection"].includes(b.status)).length})
                        </ShadTabsTrigger>
                        <ShadTabsTrigger value="completed" className="flex-1">
                          Completed ({bookings.filter(b => b.status === "completed").length})
                        </ShadTabsTrigger>
                        <ShadTabsTrigger value="cancelled" className="flex-1">
                          Cancelled ({bookings.filter(b => b.status === "cancelled").length})
                        </ShadTabsTrigger>
                      </ShadTabsList>
                      <ShadTabsContent value="upcoming">
                        {loadingBookings ? (
                          <div className="py-10 text-center text-muted-foreground">Loading...</div>
                        ) : bookingsByTab.length === 0 ? (
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
                                      {/* pending_cod_collection: Confirm COD collection */}
                                      {booking.status === "pending_cod_collection" && (
                                        <Button size="sm" variant="default" onClick={() => handleBookingAction(booking, "confirm_cod")}>
                                          Confirm COD Collection
                                        </Button>
                                      )}
                                      {/* completed/cancelled: No actions */}
                                      {(booking.status === "completed" || booking.status === "cancelled") && (
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
                        {loadingBookings ? (
                          <div className="py-10 text-center text-muted-foreground">Loading...</div>
                        ) : bookingsByTab.length === 0 ? (
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
                        {loadingBookings ? (
                          <div className="py-10 text-center text-muted-foreground">Loading...</div>
                        ) : bookingsByTab.length === 0 ? (
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
            </TabsContent>
          )}
          {tab === "services" && (
            <TabsContent value="services" forceMount>
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <ProviderServicesPage />
              </motion.div>
              </TabsContent>
          )}
        </AnimatePresence>
            </Tabs>
          </div>
  );
}