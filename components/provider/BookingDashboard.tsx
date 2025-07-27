"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  DollarSign, 
  Star, 
  Search,
  Filter,
  Eye,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBookingsByProviderId, getBookingStats } from '@/lib/appwrite-services';
import { BookingManagement } from './BookingManagement';

interface BookingDashboardProps {
  providerId: string;
}

export function BookingDashboard({ providerId }: BookingDashboardProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [providerId]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await getBookingsByProviderId(providerId);
      setBookings(bookingsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getBookingStats(providerId, 'provider');
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.device_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.device_model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(booking => booking.status === activeTab);
    }

    setFilteredBookings(filtered);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      return `${address.city || ''}, ${address.state || ''}`.trim();
    }
    return 'Address not available';
  };

  const handleBookingUpdate = async (bookingId: string, status: string, notes?: string) => {
    // This will be handled by the BookingManagement component
    await fetchBookings();
    await fetchStats();
  };

  const handleUploadPhoto = async (bookingId: string, photo: File) => {
    // TODO: Implement photo upload functionality
    toast({
      title: "Photo Upload",
      description: "Photo upload functionality coming soon",
    });
  };

  const handleCompleteService = async (bookingId: string, finalNotes: string) => {
    // This will be handled by the BookingManagement component
    await fetchBookings();
    await fetchStats();
  };

  const handleRefresh = async () => {
    await fetchBookings();
    await fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending || 0})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({stats.confirmed || 0})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({stats.in_progress || 0})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed || 0})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({stats.cancelled || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusIcon(booking.status)}
                                <span className="ml-1">{booking.status.replace('_', ' ')}</span>
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                #{booking.id?.slice(-8)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(booking.appointment_time)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span>${booking.total_amount?.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <strong>Device:</strong> {booking.device_brand} {booking.device_model}
                                </div>
                                <div className="text-sm">
                                  <strong>Service:</strong> {booking.location_type}
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatAddress(booking.customer_address)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{booking.customer_phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Booking Management Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Manage Booking</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
              <BookingManagement
                booking={selectedBooking}
                onUpdateStatus={handleBookingUpdate}
                onUploadPhoto={handleUploadPhoto}
                onCompleteService={handleCompleteService}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 