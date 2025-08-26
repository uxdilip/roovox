"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Star, PlusCircle, Smartphone, User, CreditCard, CheckCircle, XCircle, StarIcon } from "lucide-react";
import { GradientBackground } from "@/components/ui/gradient-background";

import { EnhancedStatusBadge } from "@/components/ui/enhanced-status-badge";
import { BookingProgress } from "@/components/ui/booking-progress";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

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

        // ✅ FIXED: Batch fetch all device data in parallel with better fallback logic
        const deviceDataPromises = uniqueDeviceIds.map(async (deviceId) => {
          try {
            // If device_id is a generic category (like "phone", "laptop"), use fallback
            if (deviceId === "phone" || deviceId === "laptop") {
              return {
                deviceId,
                deviceBrand: deviceId === "phone" ? "Smartphone" : "Laptop",
                deviceModel: "Device",
                deviceImage: ""
              };
            }
            
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

        // ✅ FIXED: Combine all data efficiently with device_info fallback
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

          // ✅ FIXED: Use device_info if available, otherwise fall back to device lookup
          let finalDeviceBrand = deviceInfo.deviceBrand;
          let finalDeviceModel = deviceInfo.deviceModel;
          
          // ✅ DEBUG: Log device_info for troubleshooting
          console.log('🔍 [CUSTOMER MY-BOOKINGS] Booking device_info:', {
            booking_id: booking.$id,
            device_info: booking.device_info,
            device_id: booking.device_id,
            deviceInfo: deviceInfo
          });
          
          if (booking.device_info) {
            try {
              const parsedDeviceInfo = JSON.parse(booking.device_info);
              console.log('🔍 [CUSTOMER MY-BOOKINGS] Parsed device_info:', parsedDeviceInfo);
              if (parsedDeviceInfo.brand && parsedDeviceInfo.model) {
                finalDeviceBrand = parsedDeviceInfo.brand;
                finalDeviceModel = parsedDeviceInfo.model;
                console.log('🔍 [CUSTOMER MY-BOOKINGS] Using device_info:', { finalDeviceBrand, finalDeviceModel });
              }
            } catch (error) {
              console.warn('Error parsing device_info:', error);
            }
          }

          return {
            ...booking,
            // Ensure all required Booking interface properties are present
            customer_id: booking.customer_id || '',
            provider_id: booking.provider_id || '',
            device_id: booking.device_id || '',
            service_id: booking.service_id || '',
            issue_description: booking.issue_description || '',
            selected_issues: booking.selected_issues || '',
            part_quality: booking.part_quality || null,
            status: booking.status || 'pending',
            appointment_time: booking.appointment_time || '',
            total_amount: booking.total_amount || 0,
            payment_status: booking.payment_status || 'pending',
            location_type: booking.location_type || '',
            customer_address: booking.customer_address || '',
            rating: booking.rating || null,
            review: booking.review || '',
            warranty: booking.warranty || '',
            serviceMode: booking.serviceMode || '',
            created_at: booking.created_at || '',
            updated_at: booking.updated_at || '',
            cancellation_reason: booking.cancellation_reason || '',
            provider: {
              name: providerInfo.providerName,
              rating: providerInfo.providerRating,
              totalReviews: providerInfo.providerTotalReviews,
              avatar: undefined
            },
            device: {
              brand: finalDeviceBrand, // ✅ FIXED: Use device_info when available
              model: finalDeviceModel, // ✅ FIXED: Use device_info when available
              image_url: deviceInfo.deviceImage
            },
            payment: {
              // ✅ FIXED: Use same payment method logic as provider dashboard
              payment_method: (() => {
                // If we have a specific payment method from the database, use it
                if (booking.payment_method) {
                  return booking.payment_method;
                }
                // Otherwise, determine based on payment status (same logic as provider dashboard)
                if (booking.payment_status === "pending") {
                  return "COD"; // Pending payments are typically COD
                } else {
                  return "Online"; // Completed payments are typically online
                }
              })(),
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

  const updateBookingRating = (bookingId: string, newRating: number, newReview: string) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.$id === bookingId 
          ? { ...booking, rating: newRating, review: newReview }
          : booking
      )
    );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Unified Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Welcome back, {customerName.split(' ')[0]}! 👋
                </h1>
                <p className="text-slate-600 mt-3 text-lg">
                  Here's what's happening with your device repairs
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0">
                  <Link href="/book">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Book New Repair
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active Repairs</p>
                    <p className="text-2xl font-bold text-gray-900">{getBookingsByStatus("upcoming").length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{getBookingsByStatus("completed").length}</p>
                  </div>
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex space-x-8 px-6">
              {[
                { value: "upcoming", label: "Upcoming", count: getBookingsByStatus("upcoming").length },
                { value: "completed", label: "Completed", count: getBookingsByStatus("completed").length },
                { value: "cancelled", label: "Cancelled", count: getBookingsByStatus("cancelled").length }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as 'upcoming' | 'completed' | 'cancelled')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.value
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{tab.label}</span>
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "upcoming" && (
              <div>
                {getBookingsByStatus("upcoming").length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No upcoming repairs</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">Ready to get your device fixed? Book a repair and we'll connect you with trusted local experts.</p>
                    <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0">
                      <Link href="/book">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Book Your First Repair
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {getBookingsByStatus("upcoming").map((booking) => (
                      <BookingCard key={booking.$id} booking={booking} formatDate={formatDate} getDeviceImage={getDeviceImage} updateBookingRating={updateBookingRating} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div>
                {getBookingsByStatus("completed").length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No completed repairs yet</h3>
                    <p className="text-slate-600">Your completed repairs will appear here once they're finished.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {getBookingsByStatus("completed").map((booking) => (
                      <BookingCard key={booking.$id} booking={booking} formatDate={formatDate} getDeviceImage={getDeviceImage} updateBookingRating={updateBookingRating} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "cancelled" && (
              <div>
                {getBookingsByStatus("cancelled").length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No cancelled bookings</h3>
                    <p className="text-slate-600">Great! You haven't had to cancel any repairs yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {getBookingsByStatus("cancelled").map((booking) => (
                      <BookingCard key={booking.$id} booking={booking} formatDate={formatDate} getDeviceImage={getDeviceImage} updateBookingRating={updateBookingRating} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  formatDate: (date: string) => string;
  getDeviceImage: (deviceType: string, deviceModel: string) => string;
  updateBookingRating: (bookingId: string, newRating: number, newReview: string) => void;
}

function BookingCard({ booking, formatDate, getDeviceImage, updateBookingRating }: BookingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [rating, setRating] = useState(booking.rating || 0);
  const [review, setReview] = useState(booking.review || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-red-100 text-red-800 border-red-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Update the booking with rating and review
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'bookings',
        booking.$id,
        {
          rating: rating,
          review: review
        }
      );
      
      // Update provider ratings
      try {
        // Get existing provider rating
        const existingRatingResponse = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'provider_ratings',
          [Query.equal("provider_id", booking.provider_id)]
        );
        
        if (existingRatingResponse.documents.length > 0) {
          // Update existing provider rating
          const existingRating = existingRatingResponse.documents[0];
          const newTotalRating = existingRating.total_rating + rating;
          const newTotalReviews = existingRating.total_reviews + 1;
          const newAverageRating = newTotalRating / newTotalReviews;
          
          await databases.updateDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'provider_ratings',
            existingRating.$id,
            {
              average_rating: newAverageRating,
              total_reviews: newTotalReviews,
              total_rating: newTotalRating,
              last_updated: new Date().toISOString()
            }
          );
        } else {
          // Create new provider rating
          await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'provider_ratings',
            'unique()',
            {
              provider_id: booking.provider_id,
              average_rating: rating,
              total_reviews: 1,
              total_rating: rating,
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString()
            }
          );
        }
      } catch (error) {
        console.error("Error updating provider rating:", error);
        // Don't fail the review submission if provider rating update fails
      }
      
      // Show success message
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      
      // Update parent component state to reflect the submitted rating
      updateBookingRating(booking.$id, rating, review);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error submitting review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="bg-white hover:bg-gray-50/50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Device Image */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                {booking.device?.image_url ? (
                  <img 
                    src={booking.device.image_url} 
                    alt={`${booking.device.brand} ${booking.device.model}`}
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                ) : (
                  <Smartphone className="h-8 w-8 text-slate-400" />
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {booking.device?.brand} {booking.device?.model}
                    </h3>
                    <EnhancedStatusBadge 
                      status={booking.status} 
                      showProgress={false}
                    />
                  </div>

                  {/* Selected Issues */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Selected Issues:</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.selected_issues ? (
                        (() => {
                          try {
                            const issues = JSON.parse(booking.selected_issues);
                            if (Array.isArray(issues) && issues.length > 0) {
                              return issues.map((issue, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100">
                                  {issue.name}
                                </Badge>
                              ));
                            } else {
                              return <span className="text-sm text-slate-500">No specific issues mentioned</span>;
                            }
                          } catch (e) {
                            return <span className="text-sm text-slate-500">No specific issues mentioned</span>;
                          }
                        })()
                      ) : (
                        <span className="text-sm text-slate-500">No specific issues mentioned</span>
                      )}
                    </div>
                  </div>

                  {/* Appointment Time */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{formatDate(booking.appointment_time)}</span>
                  </div>

                  {/* Provider Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-8 w-8 border-2 border-slate-200">
                      <AvatarImage src={booking.provider?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-slate-100 to-gray-100 text-slate-700 text-sm font-medium">
                        {booking.provider?.name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {booking.provider?.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-current" />
                        <span className="text-xs text-slate-600">
                          {booking.provider?.rating ? booking.provider.rating.toFixed(1) : "0.0"} ({booking.provider?.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-slate-100 rounded-md flex items-center justify-center">
                        <CreditCard className="h-3 w-3 text-slate-600" />
                      </div>
                      <span className="text-slate-700">
                        {booking.payment?.payment_method ? 
                          booking.payment.payment_method.charAt(0).toUpperCase() + booking.payment.payment_method.slice(1) : 
                          "Online"
                        }
                      </span>
                    </div>
                    <Badge className={`px-3 py-1 text-xs font-medium border ${getPaymentStatusColor(booking.payment_status || "pending")}`}>
                      {booking.payment_status ? 
                        booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1) : 
                        "Pending"
                      }
                    </Badge>
                  </div>

                  {booking.status === "cancelled" && booking.cancellation_reason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                      </p>
                    </div>
                  )}

                  {/* Rating and Review Section - Only for Completed Bookings */}
                  {booking.status === "completed" && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-5 w-5 text-gray-600" />
                        <h4 className="text-sm font-semibold text-gray-800">Rate Your Experience</h4>
                      </div>
                      
                      {!showReviewForm ? (
                        <div className="space-y-3">
                          {rating > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">({rating}/5)</span>
                              {review && <span className="text-sm text-gray-500">• Review submitted</span>}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">How was your service experience?</p>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowReviewForm(true)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                          >
                            {rating > 0 ? "Update Review" : "Rate Provider"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Star Rating */}
                          <div>
                            <p className="text-sm font-medium text-gray-800 mb-2">Rating:</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="p-1 hover:scale-110 transition-transform"
                                >
                                  <StarIcon
                                    className={`h-5 w-5 ${
                                      star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Review Text */}
                          <div>
                            <p className="text-sm font-medium text-gray-800 mb-2">Review:</p>
                            <textarea
                              value={review}
                              onChange={(e) => setReview(e.target.value)}
                              placeholder="Share your experience with this service..."
                              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                              rows={3}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSubmitReview}
                              disabled={isSubmitting}
                              className="bg-gray-800 hover:bg-gray-900 text-white"
                            >
                              {isSubmitting ? "Submitting..." : "Submit Review"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowReviewForm(false)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm" asChild className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors">
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
    </motion.div>
  );
} 