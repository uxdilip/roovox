"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ProviderServicesPage from "../services/page";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Star, CheckCircle, AlertCircle, MapPin, Calendar, DollarSign, Clock } from "lucide-react";
import { Tabs as ShadTabs, TabsList as ShadTabsList, TabsTrigger as ShadTabsTrigger, TabsContent as ShadTabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

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
    setLoadingBookings(true);
    const fetchBookings = async () => {
      try {
        const bookingsRes = await databases.listDocuments(
          DATABASE_ID,
          "bookings",
          [Query.equal("provider_id", user.id)]
        );
        if (isMounted) setBookings(bookingsRes.documents);
      } catch {
        if (isMounted) setBookings([]);
      } finally {
        if (isMounted) setLoadingBookings(false);
      }
    };
    fetchBookings();
    return () => { isMounted = false; };
  }, [tab, user]);

  // Enhanced bookingsByTab with search and status filter
  const bookingsByTab = useMemo(() => {
    let filtered = bookings;
    if (bookingsTab === "upcoming") {
      filtered = filtered.filter(b => ["pending", "confirmed"].includes(b.status));
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
    return d.toLocaleString();
  };

  // Helper: status badge
  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "confirmed") return <Badge variant="default">Confirmed</Badge>;
    if (status === "completed") return <Badge variant="default">Completed</Badge>;
    if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge>{status}</Badge>;
  };

  // Helper: get issues as string
  const issuesString = (booking: any) => {
    if (Array.isArray(booking.issues)) return booking.issues.join(", ");
    if (typeof booking.issues === "string") return booking.issues;
    if (booking.issue_description) return booking.issue_description;
    return "-";
  };

  // Helper: get customer name (if available)
  const customerName = (booking: any) => booking.customer_name || booking.customer || booking.customer_id || "-";

  // Add handler to open modal with current availability
  const handleEditAvailability = () => {
    setAvailabilityEditData(businessSetup?.serviceSetup || {});
    setEditAvailabilityOpen(true);
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
                        <ShadTabsTrigger value="upcoming" className="flex-1">Upcoming</ShadTabsTrigger>
                        <ShadTabsTrigger value="completed" className="flex-1">Completed</ShadTabsTrigger>
                        <ShadTabsTrigger value="cancelled" className="flex-1">Cancelled</ShadTabsTrigger>
                      </ShadTabsList>
                      <ShadTabsContent value="upcoming">
                        {loadingBookings ? (
                          <div className="py-10 text-center text-muted-foreground">Loading...</div>
                        ) : bookingsByTab.length === 0 ? (
                          <div className="py-10 text-center text-muted-foreground">No upcoming bookings.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {bookingsByTab.map(booking => (
                              <Card key={booking.$id} className="shadow-sm border">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                  <div className="flex flex-col gap-1">
                                    <div className="font-semibold text-base">{booking.device || booking.device_id || "Device"}</div>
                                    <div className="text-muted-foreground text-xs">{issuesString(booking)}</div>
                                  </div>
                                  {statusBadge(booking.status)}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDateTime(booking.appointment_time)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Customer:</span>
                                    <span>{customerName(booking)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Total:</span>
                                    <span className="text-primary font-bold">₹{booking.total_amount?.toLocaleString() || "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button size="sm" variant="outline">View Details</Button>
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
                              <Card key={booking.$id} className="shadow-sm border">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                  <div className="flex flex-col gap-1">
                                    <div className="font-semibold text-base">{booking.device || booking.device_id || "Device"}</div>
                                    <div className="text-muted-foreground text-xs">{issuesString(booking)}</div>
                                  </div>
                                  {statusBadge(booking.status)}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDateTime(booking.appointment_time)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Customer:</span>
                                    <span>{customerName(booking)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Total:</span>
                                    <span className="text-primary font-bold">₹{booking.total_amount?.toLocaleString() || "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button size="sm" variant="outline">View Details</Button>
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
                              <Card key={booking.$id} className="shadow-sm border">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                  <div className="flex flex-col gap-1">
                                    <div className="font-semibold text-base">{booking.device || booking.device_id || "Device"}</div>
                                    <div className="text-muted-foreground text-xs">{issuesString(booking)}</div>
                                  </div>
                                  {statusBadge(booking.status)}
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDateTime(booking.appointment_time)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Customer:</span>
                                    <span>{customerName(booking)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Total:</span>
                                    <span className="text-primary font-bold">₹{booking.total_amount?.toLocaleString() || "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button size="sm" variant="outline">View Details</Button>
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