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
import { Star, Calendar, Clock, MapPin, Phone, Mail, ArrowLeft, Smartphone, CreditCard, User } from "lucide-react";
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
            console.error("Device not found in either Phones or Laptops collections");
          }
        }

        // Fetch provider details
        let providerName = "Unknown Provider";
        let providerEmail = "";
        let providerPhone = "";
        let providerAverageRating = 0;
        let providerTotalReviews = 0;
        
        try {
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
        } catch (error) {
          console.error("Error fetching provider business setup:", error);
        }

        // Fetch provider average rating
        try {
          const providerRatingResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            'provider_ratings',
            [Query.equal("provider_id", bookingResponse.provider_id)]
          );
          
          if (providerRatingResponse.documents.length > 0) {
            providerAverageRating = providerRatingResponse.documents[0].average_rating || 0;
            providerTotalReviews = providerRatingResponse.documents[0].total_reviews || 0;
          }
        } catch (error) {
          console.error("Error fetching provider rating:", error);
        }

        // Fetch payment details
        let paymentMethod = "Unknown";
        let paymentStatus = bookingResponse.payment_status || "pending";
        let transactionId = "";
        
        try {
          const paymentResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID!,
            [Query.equal("booking_id", bookingId)]
          );
          
          if (paymentResponse.documents.length > 0) {
            paymentMethod = paymentResponse.documents[0].payment_method || "Unknown";
            // Use booking's payment_status as primary, fallback to payment collection
            paymentStatus = bookingResponse.payment_status || paymentResponse.documents[0].status || "pending";
            transactionId = paymentResponse.documents[0].transaction_id || "";
          }
        } catch (error) {
          console.error("Error fetching payment:", error);
          // If payment collection fails, still use booking's payment_status
          paymentStatus = bookingResponse.payment_status || "pending";
        }

        setBooking({
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
            averageRating: providerAverageRating,
            totalReviews: providerTotalReviews
          },
          payment: {
            payment_method: paymentMethod,
            status: paymentStatus,
            transaction_id: transactionId
          }
        } as unknown as Booking);
      } catch (error) {
        console.error("Error fetching booking details:", error);
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [user, bookingId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
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
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      
      toast.success("Review submitted successfully");
      // Refresh booking data
      const updatedBooking = { ...booking, rating, review };
      setBooking(updatedBooking);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
            <Link href="/customer/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
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
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/customer/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Bookings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
        </div>

        <div className="grid gap-6">
          {/* Booking Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Device Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {booking.device?.image_url ? (
                    <img 
                      src={booking.device.image_url} 
                      alt={`${booking.device.brand} ${booking.device.model}`}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Smartphone className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {booking.device?.brand} {booking.device?.model}
                  </h3>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Issues */}
              <div>
                <h4 className="font-medium mb-2">Selected Issues</h4>
                <div className="space-y-2">
                  {selectedIssues.map((issue: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{issue.name}</span>
                      {booking.part_quality && (
                        <Badge variant="outline" className="text-xs">
                          {booking.part_quality.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warranty */}
              {booking.warranty && (
                <div>
                  <h4 className="font-medium mb-2">Warranty</h4>
                  <p className="text-sm text-gray-600">{booking.warranty}</p>
                </div>
              )}

              {/* Appointment */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.appointment_time)}</span>
              </div>

              {/* Total Price */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{booking.total_amount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Provider Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Provider Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{booking.provider?.name}</h3>
                  {booking.provider?.averageRating && booking.provider.averageRating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {booking.provider.averageRating.toFixed(1)} ({booking.provider.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {booking.provider?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{booking.provider.email}</span>
                  </div>
                )}
                {booking.provider?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{booking.provider.phone}</span>
                  </div>
                )}
              </div>

              {/* Service Location */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{booking.location_type} Service</span>
              </div>

              {customerAddress && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-1">Service Address</h4>
                  <p className="text-sm text-gray-600">
                    {customerAddress.flat && `${customerAddress.flat}, `}
                    {customerAddress.street}, {customerAddress.city}, {customerAddress.state} {customerAddress.zip}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Payment Method</span>
                <span className="font-medium">
                  {booking.payment?.payment_method ? 
                    booking.payment.payment_method.charAt(0).toUpperCase() + booking.payment.payment_method.slice(1) : 
                    "Unknown"
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Payment Status</span>
                <Badge className={getPaymentStatusColor(booking.payment?.status || "pending")}>
                  {booking.payment?.status ? 
                    booking.payment.status.charAt(0).toUpperCase() + booking.payment.status.slice(1) : 
                    "Pending"
                  }
                </Badge>
              </div>

              {booking.payment?.transaction_id && (
                <div className="flex items-center justify-between">
                  <span>Transaction ID</span>
                  <span className="text-sm text-gray-600 font-mono">
                    {booking.payment.transaction_id}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Section */}
          {booking.status === "completed" && (
            <Card>
              <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Review
              </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.rating && booking.review ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < booking.rating! ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({booking.rating}/5)</span>
                    </div>
                    <p className="text-gray-700">{booking.review}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-1 rounded ${
                              star <= rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Review</label>
                      <Textarea
                        placeholder="Share your experience with this service..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={submittingReview || rating === 0}
                      className="w-full"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
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