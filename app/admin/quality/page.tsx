"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Shield,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Eye,
  MessageCircle,
  Award,
  Clock,
  User,
  Calendar
} from "lucide-react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Review {
  $id: string;
  booking_id: string;
  rating: number;
  review: string;
  created_at: string;
  booking_details?: {
    customer_name: string;
    provider_name: string;
    device_display: string;
    total_amount: number;
    status: string;
  };
}

interface Dispute {
  $id: string;
  booking_id: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
  resolved_at?: string;
  booking_details?: {
    customer_name: string;
    provider_name: string;
    device_display: string;
    total_amount: number;
  };
}

interface QualityStats {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  totalDisputes: number;
  resolvedDisputes: number;
  pendingDisputes: number;
  qualityScore: number;
}

export default function QualityAssurancePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<QualityStats>({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    totalDisputes: 0,
    resolvedDisputes: 0,
    pendingDisputes: 0,
    qualityScore: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [disputeFilter, setDisputeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("reviews");
  
  const { toast } = useToast();

  const fetchQualityData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch bookings data
      let bookingsResponse: any = { documents: [] };
      
      try {
        const bookingsData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.BOOKINGS);
        bookingsResponse = bookingsData;
      } catch (error) {
        console.log("Bookings collection not accessible, using mock data");
        // Use mock data if bookings collection is not accessible
        bookingsResponse = {
          documents: [
            {
              $id: "booking1",
              rating: 4.5,
              review: "Great service, very professional",
              created_at: new Date().toISOString(),
              customer_id: "customer1",
              provider_id: "provider1",
              device_id: "device1",
              total_amount: 1500,
              status: "completed"
            },
            {
              $id: "booking2", 
              rating: 3.0,
              review: "Service was okay but took longer than expected",
              created_at: new Date(Date.now() - 86400000).toISOString(),
              customer_id: "customer2",
              provider_id: "provider2", 
              device_id: "device2",
              total_amount: 2000,
              status: "completed"
            }
          ]
        };
      }

      // Extract reviews from bookings (those with ratings)
      const reviewsData = bookingsResponse.documents
        .filter((booking: any) => booking.rating && booking.rating > 0)
        .map((booking: any) => {
          return {
            $id: booking.$id,
            booking_id: booking.$id,
            rating: booking.rating,
            review: booking.review || "",
            created_at: booking.created_at,
            booking_details: {
              customer_name: `Customer ${booking.customer_id?.slice(-4) || 'Unknown'}`,
              provider_name: `Provider ${booking.provider_id?.slice(-4) || 'Unknown'}`,
              device_display: `Device ${booking.device_id?.slice(-4) || 'Unknown'}`,
              total_amount: booking.total_amount || 0,
              status: booking.status || 'unknown'
            }
          };
        });

      // Mock disputes data (since we don't have a disputes collection yet)
      const disputesData: Dispute[] = [
        {
          $id: "dispute1",
          booking_id: "booking1",
          type: "service_quality",
          status: "pending",
          description: "Service was not completed as promised",
          created_at: new Date().toISOString(),
          booking_details: {
            customer_name: "John Doe",
            provider_name: "TechFix Pro",
            device_display: "iPhone 12",
            total_amount: 1500
          }
        },
        {
          $id: "dispute2",
          booking_id: "booking2",
          type: "payment_issue",
          status: "resolved",
          description: "Payment was charged twice",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          resolved_at: new Date().toISOString(),
          booking_details: {
            customer_name: "Jane Smith",
            provider_name: "Mobile Repair Co",
            device_display: "Samsung Galaxy S21",
            total_amount: 2000
          }
        }
      ];

      setReviews(reviewsData);
      setDisputes(disputesData);
      calculateStats(reviewsData, disputesData);
    } catch (error) {
      console.error('Error fetching quality data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quality data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calculateStats = (reviews: Review[], disputes: Dispute[]) => {
    const stats: QualityStats = {
      totalReviews: reviews.length,
      averageRating: 0,
      positiveReviews: reviews.filter(r => r.rating >= 4).length,
      negativeReviews: reviews.filter(r => r.rating <= 2).length,
      totalDisputes: disputes.length,
      resolvedDisputes: disputes.filter(d => d.status === 'resolved').length,
      pendingDisputes: disputes.filter(d => d.status === 'pending').length,
      qualityScore: 0
    };

    // Calculate average rating
    if (reviews.length > 0) {
      stats.averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    }

    // Calculate quality score (based on ratings and dispute resolution)
    const ratingScore = (stats.averageRating / 5) * 60; // 60% weight for ratings
    const disputeScore = stats.totalDisputes > 0 
      ? ((stats.resolvedDisputes / stats.totalDisputes) * 40) // 40% weight for dispute resolution
      : 40; // Full score if no disputes
    stats.qualityScore = Math.round(ratingScore + disputeScore);

    setStats(stats);
  };

  const filterData = useCallback(() => {
    // Filter reviews
    let filteredReviews = reviews;

    if (searchTerm) {
      filteredReviews = filteredReviews.filter(review =>
        review.booking_details?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.booking_details?.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== "all") {
      switch (ratingFilter) {
        case "positive":
          filteredReviews = filteredReviews.filter(review => review.rating >= 4);
          break;
        case "neutral":
          filteredReviews = filteredReviews.filter(review => review.rating === 3);
          break;
        case "negative":
          filteredReviews = filteredReviews.filter(review => review.rating <= 2);
          break;
      }
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filteredReviews = filteredReviews.filter(review => {
        const reviewDate = new Date(review.created_at);
        switch (dateFilter) {
          case "today":
            return reviewDate >= today;
          case "yesterday":
            return reviewDate >= yesterday && reviewDate < today;
          case "lastWeek":
            return reviewDate >= lastWeek;
          case "lastMonth":
            return reviewDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    setFilteredReviews(filteredReviews);

    // Filter disputes
    let filteredDisputes = disputes;

    if (searchTerm) {
      filteredDisputes = filteredDisputes.filter(dispute =>
        dispute.booking_details?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.booking_details?.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (disputeFilter !== "all") {
      filteredDisputes = filteredDisputes.filter(dispute => dispute.status === disputeFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filteredDisputes = filteredDisputes.filter(dispute => {
        const disputeDate = new Date(dispute.created_at);
        switch (dateFilter) {
          case "today":
            return disputeDate >= today;
          case "yesterday":
            return disputeDate >= yesterday && disputeDate < today;
          case "lastWeek":
            return disputeDate >= lastWeek;
          case "lastMonth":
            return disputeDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    setFilteredDisputes(filteredDisputes);
  }, [reviews, disputes, searchTerm, ratingFilter, disputeFilter, dateFilter, activeTab]);

  useEffect(() => {
    fetchQualityData();
  }, [fetchQualityData]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDateTime = (dt: string) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return d.toLocaleString();
  };

  const exportQualityData = () => {
    const csvContent = [
      ['Type', 'ID', 'Customer', 'Provider', 'Device', 'Rating', 'Review', 'Status', 'Created At'].join(','),
      ...filteredReviews.map(review => [
        'Review',
        review.$id,
        review.booking_details?.customer_name,
        review.booking_details?.provider_name,
        review.booking_details?.device_display,
        review.rating,
        review.review,
        'Completed',
        formatDateTime(review.created_at)
      ].join(',')),
      ...filteredDisputes.map(dispute => [
        'Dispute',
        dispute.$id,
        dispute.booking_details?.customer_name,
        dispute.booking_details?.provider_name,
        dispute.booking_details?.device_display,
        '',
        dispute.description,
        dispute.status,
        formatDateTime(dispute.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quality data...</p>
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
            Quality Assurance
          </h1>
          <p className="text-gray-600">
            Monitor reviews, ratings, and dispute resolution
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportQualityData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchQualityData}>
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
                <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                <p className={`text-2xl font-bold ${getQualityScoreColor(stats.qualityScore)}`}>
                  {stats.qualityScore}%
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Disputes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingDisputes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
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
                placeholder="Search reviews/disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="positive">Positive (4-5)</SelectItem>
                <SelectItem value="neutral">Neutral (3)</SelectItem>
                <SelectItem value="negative">Negative (1-2)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={disputeFilter} onValueChange={setDisputeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Dispute Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
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
                setRatingFilter("all");
                setDisputeFilter("all");
                setDateFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reviews">Reviews ({filteredReviews.length})</TabsTrigger>
              <TabsTrigger value="disputes">Disputes ({filteredDisputes.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews" className="mt-6">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Star className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {review.booking_details?.customer_name}
                              </h3>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className={`ml-1 font-medium ${getRatingColor(review.rating)}`}>
                                  {review.rating}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              Service by {review.booking_details?.provider_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(review.created_at)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{review.booking_details?.customer_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Provider:</span>
                          <span>{review.booking_details?.provider_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Device:</span>
                          <span>{review.booking_details?.device_display}</span>
                        </div>
                      </div>
                      
                      {review.review && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                                     <p className="text-sm text-gray-700 italic">&ldquo;{review.review}&rdquo;</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Booking ID: {review.booking_id.slice(-8)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/bookings/${review.booking_id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Booking
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="disputes" className="mt-6">
              {filteredDisputes.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDisputes.map((dispute) => (
                    <div key={dispute.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {dispute.type.replace('_', ' ').toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {dispute.booking_details?.customer_name} vs {dispute.booking_details?.provider_name}
                            </p>
                          </div>
                        </div>
                        <Badge className={getDisputeStatusColor(dispute.status)}>
                          {dispute.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{dispute.booking_details?.customer_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Provider:</span>
                          <span>{dispute.booking_details?.provider_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Device:</span>
                          <span>{dispute.booking_details?.device_display}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">{dispute.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Created: {formatDateTime(dispute.created_at)}
                          {dispute.resolved_at && (
                            <span className="ml-4">Resolved: {formatDateTime(dispute.resolved_at)}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/bookings/${dispute.booking_id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Booking
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rating Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter(r => r.rating === rating).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-16">
                              <span className="text-sm font-medium">{rating}</span>
                              <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Dispute Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resolved</span>
                        <span className="font-medium text-green-600">{stats.resolvedDisputes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <span className="font-medium text-yellow-600">{stats.pendingDisputes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resolution Rate</span>
                        <span className="font-medium">
                          {stats.totalDisputes > 0 
                            ? Math.round((stats.resolvedDisputes / stats.totalDisputes) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 