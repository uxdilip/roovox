"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

export default function CashCollectionPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingBooking, setConfirmingBooking] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingCashCollectionBookings();
  }, []);

  const fetchPendingCashCollectionBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings with status pending_cod_collection
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'bookings',
        [Query.equal('status', 'pending_cod_collection')]
      );

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
                  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
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

            // Fetch provider details
            let providerName = "Unknown Provider";
            try {
              const businessSetupResponse = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
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
                  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                  'Phones',
                  booking.device_id
                );
              } catch (phoneError) {
                try {
                  deviceResponse = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    'Laptops',
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
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending cash collection bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCashCollection = async (bookingId: string) => {
    try {
      setConfirmingBooking(bookingId);
      
      // Update booking status to completed
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'bookings',
        bookingId,
        {
          status: 'completed',
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        }
      );

      toast({
        title: "Success",
        description: "Cash collection confirmed and booking marked as completed",
      });

      // Refresh the list
      await fetchPendingCashCollectionBookings();
    } catch (error) {
      console.error("Error confirming cash collection:", error);
      toast({
        title: "Error",
        description: "Failed to confirm cash collection",
        variant: "destructive",
      });
    } finally {
      setConfirmingBooking(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending cash collection bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cash Collection Dashboard
          </h1>
          <p className="text-gray-600">
            Confirm cash collection for COD + Doorstep bookings
          </p>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <CreditCard className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending cash collection bookings
                </h3>
                <p className="text-gray-600">
                  All COD + Doorstep bookings have been processed
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.$id} className="shadow-sm border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-base">
                        {booking.device_display || "Device"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {getIssuesString(booking)}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    Awaiting Cash Collection
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(booking.appointment_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>Doorstep Service</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {booking.customer_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{booking.provider_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">COD</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-lg font-bold text-primary">
                      ₹{booking.total_amount?.toLocaleString() || "0"}
                    </div>
                    <Button
                      onClick={() => handleConfirmCashCollection(booking.$id)}
                      disabled={confirmingBooking === booking.$id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {confirmingBooking === booking.$id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirming...
                        </>
                      ) : (
                        "Confirm Cash Collected"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 