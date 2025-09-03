"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Star, Calendar, Clock, MapPin, Phone, Mail, ArrowLeft, Smartphone, CreditCard, User, CheckCircle, AlertCircle } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Query } from "node-appwrite";

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
  device?: {
    brand: string;
    model: string;
    image_url?: string;
  };
  provider?: {
    name: string;
    email: string;
    phone: string;
    averageRating: number;
    totalReviews: number;
  };
  payment?: {
    payment_method: string;
    status: string;
    transaction_id?: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const bookingId = params.bookingId as string;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!user || !bookingId) return;

      try {
        // Fetch booking details
        const bookingResponse = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'bookings',
          bookingId
        );

        // Fetch device details
        let deviceBrand = "Unknown Device";
        let deviceModel = "";
        let deviceImage = "";
        
        try {
          const deviceResponse = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'Phones',
            bookingResponse.device_id
          );
          deviceBrand = deviceResponse.brand || "Unknown Brand";
          deviceModel = deviceResponse.model || "";
          deviceImage = deviceResponse.image_url || "";
        } catch (phoneError) {
          try {
            const deviceResponse = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              'Laptops',
              bookingResponse.device_id
            );
            deviceBrand = deviceResponse.brand || "Unknown Brand";
            deviceModel = deviceResponse.model || "";
            deviceImage = deviceResponse.image_url || "";
          } catch (laptopError) {
            console.error("Error fetching device details:", laptopError);
          }
        }

        // Fetch provider details
        let providerName = "Unknown Provider";
        let providerEmail = "";
        let providerPhone = "";
        let providerRating = 0;
        let providerReviews = 0;
        
        try {
          // Use the same logic as the booking card - fetch from business_setup collection
          const businessSetupResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'business_setup',
            [Query.equal("user_id", bookingResponse.provider_id)]
          );
          
          if (businessSetupResponse.documents.length > 0) {
            const onboardingData = JSON.parse(businessSetupResponse.documents[0].onboarding_data || '{}');
            providerName = onboardingData.businessInfo?.businessName || "Unknown Provider";
            providerEmail = onboardingData.personalDetails?.email || "";
            providerPhone = onboardingData.personalDetails?.mobile || "";
          }
          
          // Fetch provider ratings
          try {
            const ratingResponse = await databases.listDocuments(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              'provider_ratings',
              [Query.equal("provider_id", bookingResponse.provider_id)]
            );
            if (ratingResponse.documents.length > 0) {
              providerRating = ratingResponse.documents[0].average_rating || 0;
              providerReviews = ratingResponse.documents[0].total_reviews || 0;
            }
          } catch (ratingError) {
            console.error("Error fetching provider ratings:", ratingError);
          }
        } catch (providerError) {
          console.error("Error fetching provider details:", providerError);
        }

        // Fetch payment details
        let paymentData = null;
        try {
          const paymentsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'payments',
            [Query.equal("booking_id", bookingResponse.$id)]
          );
          
          console.log("🔍 Customer: Payment records found:", paymentsResponse.documents.length);
          
          if (paymentsResponse.documents.length > 0) {
            const payment = paymentsResponse.documents[0];
            console.log("🔍 Customer: Payment method from record:", payment.payment_method);
            paymentData = {
              payment_method: payment.payment_method,
              status: payment.status,
              transaction_id: payment.transaction_id
            };
          } else {
            console.log("🔍 Customer: No payment record found, defaulting to online");
            // Simple fallback: default to online if no payment record exists
            paymentData = {
              payment_method: "online",
              status: bookingResponse.payment_status,
              transaction_id: null
            };
          }
        } catch (error) {
          console.error("Error fetching payment details:", error);
          // Simple fallback: default to online if payment fetch fails
          paymentData = {
            payment_method: "online",
            status: bookingResponse.payment_status,
            transaction_id: null
          };
        }

        // Set booking with all details
        const bookingData = {
          ...bookingResponse,
          device: {
            brand: deviceBrand,
            model: deviceModel,
            image_url: deviceImage
          },
          provider: {
            name: providerName,
            email: providerEmail,
            phone: providerPhone,
            averageRating: providerRating,
            totalReviews: providerReviews
          },
          payment: paymentData
        } as unknown as Booking;
        
        setBooking(bookingData);
        
        // Initialize rating and review state with existing data
        if (bookingData.rating) {
          setRating(bookingData.rating);
        }
        if (bookingData.review) {
          setReview(bookingData.review);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
        toast.error("Failed to fetch booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [user, bookingId]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending_cod_collection":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "pending_cod_collection":
        return "Service Completed - Cash Collection Pending";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "in_progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmittingReview(true);
    try {
      // Update the booking with rating and review
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'bookings',
        bookingId,
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
      
      toast.success(isEditing ? "Review updated successfully" : "Review submitted successfully");
      // Refresh booking data
      const updatedBooking = { ...booking, rating, review };
      setBooking(updatedBooking);
      
      // Reset editing state
      setIsEditing(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/customer/my-bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Bookings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectedIssues = booking.selected_issues ? JSON.parse(booking.selected_issues) : [];
  const customerAddress = booking.customer_address ? JSON.parse(booking.customer_address) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 hover:bg-gray-100">
            <Link href="/customer/my-bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Bookings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
        </div>

        <div className="grid gap-8">
          {/* Main Booking Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  {booking.device?.image_url ? (
                    <img 
                      src={booking.device.image_url} 
                      alt={`${booking.device.brand} ${booking.device.model}`}
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                  ) : (
                    <Smartphone className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {booking.device?.brand} {booking.device?.model}
                  </h2>
                  <p className="text-gray-600">Device Repair Service</p>
                </div>
              </div>
              <Badge className={`px-4 py-2 text-sm font-medium border ${getStatusColor(booking.status)}`}>
                {getStatusDisplayText(booking.status)}
              </Badge>
            </div>

            <Separator className="my-6" />

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Appointment</p>
                    <p className="font-medium text-gray-900">{formatDate(booking.appointment_time)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-gray-900">₹{booking.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Location</p>
                    <p className="font-medium text-gray-900">
                      {booking.location_type === "home" ? "Home Service" : "Store Visit"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Issues and Details */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Selected Issues */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Selected Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedIssues.length > 0 ? (
                    selectedIssues.map((issue: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{issue.name}</span>
                        {booking.part_quality && (
                          <Badge variant="outline" className="text-xs border-gray-300">
                            {booking.part_quality.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No specific issues mentioned</p>
                  )}
                </div>
                
                {booking.warranty && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Warranty</p>
                    <p className="text-gray-900 font-medium">{booking.warranty}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium text-gray-900">
                    {booking.payment?.payment_method ? 
                      booking.payment.payment_method.charAt(0).toUpperCase() + booking.payment.payment_method.slice(1) : 
                      "Online"
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge className={`px-3 py-1 text-xs font-medium border ${getPaymentStatusColor(booking.payment?.status || "pending")}`}>
                    {booking.payment?.status ? 
                      booking.payment.status.charAt(0).toUpperCase() + booking.payment.status.slice(1) : 
                      "Pending"
                    }
                  </Badge>
                </div>

                {/* Special message for COD orders pending collection */}
                {booking.status === "pending_cod_collection" && booking.payment?.payment_method === "COD" && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Service Completed</p>
                        <p className="text-sm text-yellow-700">
                          Your device has been repaired successfully. Our team will collect the payment of ₹{booking.total_amount.toLocaleString()} shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {booking.payment?.transaction_id && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {booking.payment.transaction_id}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Provider Information */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Service Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-lg font-semibold">
                    {booking.provider?.name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{booking.provider?.name}</h3>
                  {booking.provider?.averageRating && booking.provider.averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < booking.provider!.averageRating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {booking.provider.averageRating.toFixed(1)} ({booking.provider.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {booking.provider?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{booking.provider.email}</span>
                      </div>
                    )}
                    {booking.provider?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{booking.provider.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Section - Only for Completed Bookings */}
          {booking.status === "completed" && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Rate Your Experience
                </CardTitle>
                <CardDescription>
                  Help other customers by sharing your feedback about this service
                </CardDescription>
              </CardHeader>
              <CardContent>
                {booking.rating && booking.review && !isEditing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-6 w-6 ${
                              i < booking.rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-medium text-gray-900">({booking.rating}/5)</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{booking.review}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setRating(booking.rating || 0);
                        setReview(booking.review || "");
                        setIsEditing(true);
                      }}
                      className="bg-black hover:bg-gray-800 text-white px-6"
                    >
                      Update Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">How would you rate this service?</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-lg transition-all ${
                              star <= rating 
                                ? "text-yellow-400 bg-yellow-50" 
                                : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-50"
                            }`}
                          >
                            <Star className="h-8 w-8 fill-current" />
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-sm text-gray-600 mt-2">You selected {rating} star{rating > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Share your experience</label>
                      <Textarea
                        placeholder="Tell us about your service experience, what went well, and any suggestions for improvement..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={4}
                        className="border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSubmitReview}
                        disabled={submittingReview || rating === 0}
                        className="bg-black hover:bg-gray-800 text-white px-8"
                      >
                        {submittingReview ? "Submitting..." : (isEditing ? "Update Review" : "Submit Review")}
                      </Button>
                      
                      {isEditing && (
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setRating(booking.rating || 0);
                            setReview(booking.review || "");
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6"
                        >
                          Cancel
                        </Button>
                      )}
                      
                      {rating === 0 && (
                        <p className="text-sm text-gray-500 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Please select a rating
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 