"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, CreditCard, Smartphone, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Booking {
  $id: string;
  customer_id: string;
  provider_id: string;
  device_id: string;
  status: string;
  appointment_time: string;
  total_amount: number;
  payment_status: string;
  location_type: string;
  selected_issues: string;
  cancellation_reason?: string;
  customer_name?: string;
  device_display?: string;
}

export default function ProviderBookingDetails() {
  const { booking_id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!booking_id || !user) return;

      try {
        setLoading(true);
        
        // Fetch booking details
        const bookingResponse = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
          booking_id as string
        );

        // Fetch customer details
        let customerName = "Unknown Customer";
        try {
          const customerResponse = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'user',
            bookingResponse.customer_id
          );
          customerName = customerResponse.name || "Unknown Customer";
        } catch (error) {
          console.error("Error fetching customer details:", error);
        }

        // Fetch device details
        let deviceDisplay = "Unknown Device";
        try {
          let deviceResponse;
          try {
            deviceResponse = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              'Phones',
              bookingResponse.device_id
            );
          } catch (phoneError) {
            try {
              deviceResponse = await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'Laptops',
                bookingResponse.device_id
              );
            } catch (laptopError) {
              console.error("Device not found:", bookingResponse.device_id);
            }
          }
          
          if (deviceResponse) {
            deviceDisplay = `${deviceResponse.brand} ${deviceResponse.model}`.trim();
          }
        } catch (error) {
          console.error("Error fetching device details:", error);
        }

        setBooking({
          $id: bookingResponse.$id,
          customer_id: bookingResponse.customer_id,
          provider_id: bookingResponse.provider_id,
          device_id: bookingResponse.device_id,
          status: bookingResponse.status,
          appointment_time: bookingResponse.appointment_time,
          total_amount: bookingResponse.total_amount,
          payment_status: bookingResponse.payment_status,
          location_type: bookingResponse.location_type,
          selected_issues: bookingResponse.selected_issues,
          cancellation_reason: bookingResponse.cancellation_reason,
          customer_name: customerName,
          device_display: deviceDisplay
        });
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [booking_id, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Booking not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/provider/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Device:</span>
              <span>{booking.device_display}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDateTime(booking.appointment_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{booking.location_type === "doorstep" ? "Doorstep" : "Provider Location"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span>{booking.payment_status === "pending" ? "COD" : "Online"}</span>
              <Badge className={getPaymentStatusColor(booking.payment_status)}>
                {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
              </Badge>
            </div>
            <div className="pt-4 border-t">
              <div className="text-2xl font-bold text-primary">
                ₹{booking.total_amount?.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {booking.selected_issues ? (
              (() => {
                try {
                  const issues = JSON.parse(booking.selected_issues);
                  if (Array.isArray(issues) && issues.length > 0) {
                    return (
                      <div className="space-y-2">
                        {issues.map((issue: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="font-medium">{issue.name}</div>
                            {issue.part_quality && (
                              <div className="text-sm text-gray-600">
                                Part Quality: {issue.part_quality}
                              </div>
                            )}
                            {issue.warranty && (
                              <div className="text-sm text-gray-600">
                                Warranty: {issue.warranty}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return <div className="text-gray-500">No specific issues mentioned</div>;
                  }
                } catch (e) {
                  return <div className="text-gray-500">No specific issues mentioned</div>;
                }
              })()
            ) : (
              <div className="text-gray-500">No specific issues mentioned</div>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Reason */}
        {booking.status === "cancelled" && booking.cancellation_reason && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-red-600">Cancellation Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{booking.cancellation_reason}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 