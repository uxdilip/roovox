"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  Smartphone, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  RefreshCw,
  Star
} from "lucide-react";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Booking {
  $id: string;
  customer_id: string;
  provider_id: string;
  device_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  location_type: string;
  total_amount: number;
  appointment_time: string;
  customer_address: string;
  selected_issues: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  device_display?: string;
  provider_name?: string;
  rating?: number;
  review?: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  averageRating: number;
}

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, paymentFilter, dateFilter, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const response = await databases.listDocuments(DATABASE_ID, 'bookings');
      
      const bookingsWithDetails = await Promise.all(
        response.documents.map(async (booking: any) => {
          try {
            // Fetch customer details - following the same pattern as customer dashboard
            let customerName = "Unknown Customer";
            try {
              // 1. Fetch customer details from customers collection first
              let customerResponse;
              try {
                customerResponse = await databases.listDocuments(
                  DATABASE_ID,
                  'customers',
                  [Query.equal("user_id", booking.customer_id), Query.limit(1)]
                );
              } catch (customerError) {
                console.error("Error fetching customer data:", customerError);
              }

              // 2. Fetch customer details from User collection as fallback
              let userResponse;
              try {
                userResponse = await databases.listDocuments(
                  DATABASE_ID,
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

            // Fetch provider details
            let providerName = "Unknown Provider";
            try {
              const businessSetupResponse = await databases.listDocuments(
                DATABASE_ID,
                'business_setup',
                [Query.equal("user_id", booking.provider_id)]
              );
              
              if (businessSetupResponse.documents.length > 0) {
                const onboardingData = JSON.parse(businessSetupResponse.documents[0].onboarding_data || '{}');
                providerName = onboardingData.businessInfo?.businessName || "Unknown Provider";
              }
            } catch (error) {
              console.error("Error fetching provider details:", error);
            }

            // Fetch device details
            let deviceBrand = "Unknown Device";
            let deviceModel = "";
            
            try {
              let deviceResponse;
              try {
                deviceResponse = await databases.getDocument(
                  DATABASE_ID,
                  'phones',
                  booking.device_id
                );
              } catch (phoneError) {
                try {
                  deviceResponse = await databases.getDocument(
                    DATABASE_ID,
                    'laptops',
                    booking.device_id
                  );
                } catch (laptopError) {
                  console.error("Device not found in either collection");
                  throw laptopError;
                }
              }
              
              deviceBrand = deviceResponse.brand || "Unknown Brand";
              deviceModel = deviceResponse.model || "";
            } catch (error) {
              console.error("Error fetching device details:", error);
            }

            return {
              ...booking,
              customer_name: customerName,
              provider_name: providerName,
              device_display: `${deviceBrand} ${deviceModel}`.trim()
            };
          } catch (error) {
            console.error("Error processing booking:", error);
            return booking;
          }
        })
      );

      setBookings(bookingsWithDetails);
      calculateStats(bookingsWithDetails);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookings: Booking[]) => {
    const stats: BookingStats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      inProgress: bookings.filter(b => b.status === 'in_progress').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
      averageRating: 0
    };

    const ratedBookings = bookings.filter(b => b.rating && b.rating > 0);
    if (ratedBookings.length > 0) {
      stats.averageRating = ratedBookings.reduce((sum, b) => sum + b.rating!, 0) / ratedBookings.length;
    }

    setStats(stats);
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.device_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.$id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        switch (dateFilter) {
          case "today":
            return bookingDate >= today;
          case "yesterday":
            return bookingDate >= yesterday && bookingDate < today;
          case "lastWeek":
            return bookingDate >= lastWeek;
          case "lastMonth":
            return bookingDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(booking => booking.status === activeTab);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingBooking(bookingId);
      
      await databases.updateDocument(
        DATABASE_ID,
        'bookings',
        bookingId,
        {
          status: newStatus,
          updated_at: new Date().toISOString()
        }
      );

      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`,
      });

      // Refresh bookings
      await fetchBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setUpdatingBooking(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const getIssuesString = (booking: Booking) => {
    if (!booking.selected_issues) return "No specific issues mentioned";
    
    try {
      const issues = JSON.parse(booking.selected_issues);
      if (Array.isArray(issues) && issues.length > 0) {
        return issues.map((issue: any) => issue.name).join(", ");
      }
    } catch (e) {
      console.error("Error parsing issues:", e);
    }
    
    return "No specific issues mentioned";
  };

  const exportBookings = () => {
    const csvContent = [
      ['Booking ID', 'Customer', 'Provider', 'Device', 'Status', 'Payment Status', 'Amount', 'Appointment Time', 'Created At'].join(','),
      ...filteredBookings.map(booking => [
        booking.$id,
        booking.customer_name,
        booking.provider_name,
        booking.device_display,
        booking.status,
        booking.payment_status,
        booking.total_amount,
        booking.appointment_time,
        booking.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage all service bookings
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportBookings}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchBookings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPaymentFilter("all");
                setDateFilter("all");
                setActiveTab("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({stats.cancelled})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {booking.device_display || "Device"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Booking #{booking.$id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{booking.customer_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Provider:</span>
                          <span className="font-medium">{booking.provider_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(booking.appointment_time)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-bold">₹{booking.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Issues:</strong> {getIssuesString(booking)}
                        </p>
                        {booking.customer_address && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Address:</strong> {booking.customer_address}
                          </p>
                        )}
                      </div>
                      
                      {booking.rating && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{booking.rating}/5</span>
                          </div>
                          {booking.review && (
                            <p className="text-sm text-gray-600 mt-1">"{booking.review}"</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Created: {formatDateTime(booking.created_at)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/bookings/${booking.$id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => updateBookingStatus(booking.$id, value)}
                              disabled={updatingBooking === booking.$id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 