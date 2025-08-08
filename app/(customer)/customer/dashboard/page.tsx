"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Star, PlusCircle, Smartphone, User, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  $id: string;
  customer_id: string;
  provider_id: string;
  device_id: string;
  service_id: string;
  issue_description: string;
  selected_issues: string;
  part_quality: string | null;
  status: string;
  appointment_time: string;
  total_amount: number;
  payment_status: string;
  location_type: string;
  customer_address: string;
  rating: number | null;
  review: string | null;
  warranty: string;
  serviceMode: string;
  created_at: string;
  updated_at: string;
  provider?: {
    name: string;
    rating: number;
    totalReviews: number;
    avatar?: string;
  };
  device?: {
    brand: string;
    model: string;
    image_url?: string;
  };
  payment?: {
    payment_method: string;
    status: string;
  };
  cancellation_reason?: string;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch customer name and bookings in parallel
        const [customerResponse, bookingsResponse] = await Promise.all([
          // Fetch customer name from customers collection
          databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'customers',
            [Query.equal('user_id', user.id), Query.limit(1)]
          ),
          // Fetch bookings for this customer
          databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
            [Query.equal("customer_id", user.id)]
          )
        ]);

        // Set customer name
        if (customerResponse.documents.length > 0) {
          setCustomerName(customerResponse.documents[0].full_name || "Customer");
        } else {
          // Fallback to user collection if customer profile doesn't exist
          try {
            const userResponse = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              'user',
              user.id
            );
            setCustomerName(userResponse.name || "Customer");
          } catch (error) {
            console.error("Error fetching user data:", error);
            setCustomerName("Customer");
          }
        }

        // Extract unique provider IDs for batch fetching
        const uniqueProviderIds = [...new Set(bookingsResponse.documents.map(b => b.provider_id))];
        const uniqueDeviceIds = [...new Set(bookingsResponse.documents.map(b => b.device_id))];

        // Batch fetch all provider data in parallel
        const providerDataPromises = uniqueProviderIds.map(async (providerId) => {
          try {
            // Fetch provider data in parallel
            const [userResponse, businessSetupResponse, providerBookingsResponse] = await Promise.all([
              databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'User',
                [Query.equal("user_id", providerId), Query.limit(1)]
              ).catch(() => ({ documents: [] })),
              databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'business_setup',
                [Query.equal("user_id", providerId), Query.limit(1)]
              ).catch(() => ({ documents: [] })),
              databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
                [Query.equal("provider_id", providerId)]
              ).catch(() => ({ documents: [] }))
            ]);

            // Calculate provider rating
            const providerBookings = providerBookingsResponse.documents;
            const ratings = providerBookings
              .map((b: any) => b.rating)
              .filter((r: any) => typeof r === 'number' && r > 0);
            
            const providerTotalReviews = ratings.length;
            const providerRating = ratings.length > 0 
              ? (ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length)
              : 0;

            // Parse business setup data and get business name
            let businessName = "";
            if (businessSetupResponse && businessSetupResponse.documents && businessSetupResponse.documents.length > 0) {
              try {
                const firstDocument = businessSetupResponse.documents[0];
                const onboardingData = JSON.parse(firstDocument.onboarding_data || '{}');
                businessName = onboardingData?.businessInfo?.businessName || "";
              } catch (parseError) {
                console.error("Error parsing business setup onboarding data:", parseError);
              }
            }

            // Set provider name with proper fallback logic
            const userName = userResponse?.documents[0]?.name || "";
            const providerName = businessName || userName || "Unknown Provider";

            return {
              providerId,
              providerName,
              providerRating,
              providerTotalReviews
            };
          } catch (error) {
            console.error("Error fetching provider details:", error);
            return {
              providerId,
              providerName: "Unknown Provider",
              providerRating: 0,
              providerTotalReviews: 0
            };
          }
        });

        // Batch fetch all device data in parallel
        const deviceDataPromises = uniqueDeviceIds.map(async (deviceId) => {
          try {
            // Try Phones collection first, then Laptops collection as fallback
            const deviceResponse = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              'Phones',
              deviceId
            ).catch(() => 
              databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'Laptops',
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

        // Wait for all batch operations to complete
        const [providerData, deviceData] = await Promise.all([
          Promise.all(providerDataPromises),
          Promise.all(deviceDataPromises)
        ]);

        // Create lookup maps for fast access
        const providerMap = new Map(providerData.map(p => [p.providerId, p]));
        const deviceMap = new Map(deviceData.map(d => [d.deviceId, d]));

        // Combine all data efficiently
        const bookingsWithDetails = bookingsResponse.documents.map(booking => {
          const providerInfo = providerMap.get(booking.provider_id) || { 
            providerName: "Unknown Provider", 
            providerRating: 0, 
            providerTotalReviews: 0 
          };
          const deviceInfo = deviceMap.get(booking.device_id) || { 
            deviceBrand: "Unknown Device", 
            deviceModel: "", 
            deviceImage: "" 
          };

          return {
            ...booking,
            provider: {
              name: providerInfo.providerName,
              rating: providerInfo.providerRating,
              totalReviews: providerInfo.providerTotalReviews,
              avatar: undefined
            },
            device: {
              brand: deviceInfo.deviceBrand,
              model: deviceInfo.deviceModel,
              image_url: deviceInfo.deviceImage
            },
            payment: {
              payment_method: "Online", // Default for now
              status: booking.payment_status || "pending"
            }
          };
        });

        setBookings(bookingsWithDetails);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getBookingsByStatus = (status: 'upcoming' | 'completed' | 'cancelled') => {
    // Map dashboard status to actual database status values
    const statusMapping: Record<'upcoming' | 'completed' | 'cancelled', string[]> = {
      'upcoming': ['pending', 'confirmed', 'in_progress', 'pending_cod_collection'], // pending, confirmed, in_progress, and pending_cod_collection bookings are upcoming
      'completed': ['completed'], // completed bookings
      'cancelled': ['cancelled']  // cancelled bookings
    };
    
    const actualStatuses = statusMapping[status];
    const filteredBookings = bookings.filter(booking => actualStatuses.includes(booking.status));
    console.log(`getBookingsByStatus(${status}):`, {
      totalBookings: bookings.length,
      filteredCount: filteredBookings.length,
      statuses: bookings.map(b => b.status),
      filteredStatuses: filteredBookings.map(b => b.status)
    });
    return filteredBookings;
  };

  const getDeviceImage = (deviceType: string, deviceModel: string) => {
    // You can implement device image logic here
    // For now, return a placeholder
    return "/assets/undraw_access-account_aydp.svg";
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {customerName}
          </h1>
              <p className="text-gray-600 mt-2">
                Manage your device repairs and track your bookings
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/book">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Book New Repair
              </Link>
            </Button>
            </div>
          </div>
        </div>

        {/* Booking List Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">My Bookings</h2>
          </div>
          
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 p-6 pt-0">
              <TabsTrigger value="upcoming">
                Upcoming ({getBookingsByStatus("upcoming").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({getBookingsByStatus("completed").length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({getBookingsByStatus("cancelled").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="p-6 pt-0">
              {getBookingsByStatus("upcoming").length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="h-16 w-16 mx-auto" />
              </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                  <p className="text-gray-600 mb-6">You have no upcoming bookings yet.</p>
                  <Button asChild>
                    <Link href="/book">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Book New Repair
                    </Link>
              </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getBookingsByStatus("upcoming").map((booking) => (
                    <BookingCard key={booking.$id} booking={booking} formatDate={formatDate} getDeviceImage={getDeviceImage} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="p-6 pt-0">
              {getBookingsByStatus("completed").length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <CheckCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed bookings</h3>
                  <p className="text-gray-600">You haven't completed any repairs yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getBookingsByStatus("completed").map((booking) => (
                    <BookingCard key={booking.$id} booking={booking} formatDate={formatDate} getDeviceImage={getDeviceImage} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="p-6 pt-0">
              {getBookingsByStatus("cancelled").length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <XCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cancelled bookings</h3>
                  <p className="text-gray-600">You haven't cancelled any bookings yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {getBookingsByStatus("cancelled").map((booking) => (
                    <BookingCard key={booking.$id} booking={booking} formatDate={formatDate} getDeviceImage={getDeviceImage} />
                  ))}
              </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  formatDate: (date: string) => string;
  getDeviceImage: (deviceType: string, deviceModel: string) => string;
}

function BookingCard({ booking, formatDate, getDeviceImage }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "pending_cod_collection":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Device Image */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              {booking.device?.image_url ? (
                <img 
                  src={booking.device.image_url} 
                  alt={`${booking.device.brand} ${booking.device.model}`}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Smartphone className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {booking.device?.brand} {booking.device?.model}
                  </h3>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status === "pending_cod_collection" 
                      ? "Service Completed - Pay on Delivery" 
                      : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                    }
                  </Badge>
                </div>

                {/* Selected Issues */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Selected Issues:</p>
                  <div className="flex flex-wrap gap-1">
                    {booking.selected_issues ? (
                      (() => {
                        try {
                          const issues = JSON.parse(booking.selected_issues);
                          if (Array.isArray(issues) && issues.length > 0) {
                            return issues.map((issue, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {issue.name}
                              </Badge>
                            ));
                          } else {
                            return <span className="text-xs text-gray-500">No specific issues mentioned</span>;
                          }
                        } catch (e) {
                          return <span className="text-xs text-gray-500">No specific issues mentioned</span>;
                        }
                      })()
                    ) : (
                      <span className="text-xs text-gray-500">No specific issues mentioned</span>
                    )}
                  </div>
                </div>

                {/* Appointment Time */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(booking.appointment_time)}</span>
                </div>

                {/* Provider Info */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={booking.provider?.avatar} />
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">
                    {booking.provider?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">
                      {booking.provider?.rating ? booking.provider.rating.toFixed(1) : "0.0"} ({booking.provider?.totalReviews || 0} reviews)
                    </span>
                  </div>
                </div>
                {booking.status === "cancelled" && booking.cancellation_reason && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                    </p>
                  </div>
                )}
                {/* Payment Info */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {booking.payment?.payment_method ? 
                        booking.payment.payment_method.charAt(0).toUpperCase() + booking.payment.payment_method.slice(1) : 
                        "Unknown"
                      }
                    </span>
                  </div>
                  <Badge className={getPaymentStatusColor(booking.payment_status || "pending")}>
                    {booking.payment_status ? 
                      booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1) : 
                      "Pending"
                    }
                  </Badge>
                </div>
        </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/customer/bookings/${booking.$id}`}>
                    View Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
      </CardContent>
    </Card>
  );
} 