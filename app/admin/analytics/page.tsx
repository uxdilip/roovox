"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign,
  Star,
  MapPin,
  Smartphone,
  Laptop,
  Download,
  RefreshCw,
  Filter,
  PieChart,
  LineChart,
  Activity
} from "lucide-react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  bookings: any[];
  payments: any[];
  users: any[];
  providers: any[];
  customers: any[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  averageRating: number;
  completionRate: number;
  monthlyGrowth: number;
  topProviders: any[];
  topDevices: any[];
  revenueByMonth: ChartData;
  bookingsByStatus: ChartData;
  userGrowth: ChartData;
  deviceDistribution: ChartData;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    bookings: [],
    payments: [],
    users: [],
    providers: [],
    customers: []
  });
  const [reports, setReports] = useState<ReportData>({
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    averageRating: 0,
    completionRate: 0,
    monthlyGrowth: 0,
    topProviders: [],
    topDevices: [],
    revenueByMonth: { labels: [], datasets: [] },
    bookingsByStatus: { labels: [], datasets: [] },
    userGrowth: { labels: [], datasets: [] },
    deviceDistribution: { labels: [], datasets: [] }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last6months");
  
  const { toast } = useToast();

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch all collections, but handle errors gracefully
      let bookingsResponse: any = { documents: [] };
      let paymentsResponse: any = { documents: [] };
      let usersResponse: any = { documents: [] };
      let providersResponse: any = { documents: [] };
      let customersResponse: any = { documents: [] };

      try {
        const [bookingsData, paymentsData, usersData, providersData, customersData] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.BOOKINGS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PAYMENTS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PROVIDERS),
          databases.listDocuments(DATABASE_ID, 'customers')
        ]);
        
        bookingsResponse = bookingsData;
        paymentsResponse = paymentsData;
        usersResponse = usersData;
        providersResponse = providersData;
        customersResponse = customersData;
      } catch (error) {
        console.log("Some collections not accessible, using available data");
        
        // Try to fetch individual collections that might be accessible
        try {
          const usersData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
          usersResponse = usersData;
        } catch (e) {
          console.log("Users collection not accessible");
        }
        
        try {
          const providersData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROVIDERS);
          providersResponse = providersData;
        } catch (e) {
          console.log("Providers collection not accessible");
        }
      }

      const analyticsData: AnalyticsData = {
        bookings: bookingsResponse.documents,
        payments: paymentsResponse.documents,
        users: usersResponse.documents,
        providers: providersResponse.documents,
        customers: customersResponse.documents
      };

      setData(analyticsData);
      generateReports(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const generateReports = (analyticsData: AnalyticsData) => {
    const { bookings, payments, users, providers, customers } = analyticsData;

    // Calculate basic metrics
    const totalRevenue = payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    const totalBookings = bookings.length;
    const totalUsers = users.length;
    
    const completedBookings = bookings.filter((booking: any) => booking.status === 'completed');
    const ratedBookings = completedBookings.filter((booking: any) => booking.rating && booking.rating > 0);
    const averageRating = ratedBookings.length > 0 
      ? ratedBookings.reduce((sum: number, booking: any) => sum + booking.rating, 0) / ratedBookings.length
      : 0;
    
    const completionRate = totalBookings > 0 ? (completedBookings.length / totalBookings) * 100 : 0;

    // Calculate monthly growth
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthBookings = bookings.filter((booking: any) => {
      const bookingDate = new Date(booking.created_at);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });

    const lastMonthBookings = bookings.filter((booking: any) => {
      const bookingDate = new Date(booking.created_at);
      return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastYear;
    });

    const monthlyGrowth = lastMonthBookings.length > 0 
      ? ((currentMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100
      : 0;

    // Generate revenue by month chart
    const revenueByMonth = generateRevenueChart(payments, timeRange);

    // Generate bookings by status chart
    const bookingsByStatus = generateBookingsStatusChart(bookings);

    // Generate user growth chart
    const userGrowth = generateUserGrowthChart(users, timeRange);

    // Generate device distribution chart
    const deviceDistribution = generateDeviceDistributionChart(bookings);

    // Top providers (by revenue)
    const providerRevenue = providers.map((provider: any) => {
      const providerBookings = bookings.filter((booking: any) => booking.provider_id === provider.$id);
      const revenue = providerBookings
        .filter((booking: any) => booking.status === 'completed')
        .reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0);
      return {
        ...provider,
        revenue,
        bookings: providerBookings.length
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Top devices (by bookings)
    const deviceBookings = bookings.reduce((acc: any, booking: any) => {
      const deviceId = booking.device_id;
      acc[deviceId] = (acc[deviceId] || 0) + 1;
      return acc;
    }, {});

    const topDevices = Object.entries(deviceBookings)
      .map(([deviceId, count]) => ({ deviceId, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    setReports({
      totalRevenue,
      totalBookings,
      totalUsers,
      averageRating,
      completionRate,
      monthlyGrowth,
      topProviders: providerRevenue,
      topDevices,
      revenueByMonth,
      bookingsByStatus,
      userGrowth,
      deviceDistribution
    });
  };

  const generateRevenueChart = (payments: any[], timeRange: string): ChartData => {
    const months = getMonthsArray(timeRange);
    const revenueData = months.map(month => {
      const monthPayments = payments.filter((payment: any) => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate.getMonth() === month.month && 
               paymentDate.getFullYear() === month.year &&
               payment.status === 'completed';
      });
      return monthPayments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    });

    return {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'Revenue',
        data: revenueData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: ['rgba(59, 130, 246, 0.1)'],
        fill: true
      }]
    };
  };

  const generateBookingsStatusChart = (bookings: any[]): ChartData => {
    const statusCounts = bookings.reduce((acc: any, booking: any) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#10B981', '#F59E0B', '#EF4444', '#6B7280', '#8B5CF6'];

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: 'Bookings',
        data: Object.values(statusCounts),
        backgroundColor: colors.slice(0, Object.keys(statusCounts).length)
      }]
    };
  };

  const generateUserGrowthChart = (users: any[], timeRange: string): ChartData => {
    const months = getMonthsArray(timeRange);
    const userData = months.map(month => {
      const monthUsers = users.filter((user: any) => {
        const userDate = new Date(user.created_at);
        return userDate.getMonth() === month.month && userDate.getFullYear() === month.year;
      });
      return monthUsers.length;
    });

    return {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'New Users',
        data: userData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: ['rgba(34, 197, 94, 0.1)'],
        fill: true
      }]
    };
  };

  const generateDeviceDistributionChart = (bookings: any[]): ChartData => {
    const deviceCounts = bookings.reduce((acc: any, booking: any) => {
      // For now, we'll categorize by device type (phone/laptop)
      // In a real implementation, you'd fetch device details
      const deviceType = booking.device_id.includes('phone') ? 'Phone' : 'Laptop';
      acc[deviceType] = (acc[deviceType] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(deviceCounts),
      datasets: [{
        label: 'Bookings',
        data: Object.values(deviceCounts),
        backgroundColor: ['#3B82F6', '#10B981']
      }]
    };
  };

  const getMonthsArray = (timeRange: string) => {
    const months = [];
    const now = new Date();
    let count = 6; // default 6 months

    switch (timeRange) {
      case 'last3months':
        count = 3;
        break;
      case 'last6months':
        count = 6;
        break;
      case 'last12months':
        count = 12;
        break;
    }

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }

    return months;
  };

  const exportReport = () => {
    const reportData = {
      summary: {
        totalRevenue: reports.totalRevenue,
        totalBookings: reports.totalBookings,
        totalUsers: reports.totalUsers,
        averageRating: reports.averageRating,
        completionRate: reports.completionRate,
        monthlyGrowth: reports.monthlyGrowth
      },
      topProviders: reports.topProviders,
      topDevices: reports.topDevices,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            Analytics & Reports
          </h1>
          <p className="text-gray-600">
            Data-driven insights and business intelligence
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{reports.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {reports.monthlyGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${reports.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(reports.monthlyGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{reports.totalBookings}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {reports.completionRate.toFixed(1)}% completion rate
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{reports.totalUsers}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {reports.averageRating.toFixed(1)} avg rating
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold">{reports.averageRating.toFixed(1)}/5</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {reports.totalBookings} bookings
                </p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {reports.revenueByMonth.labels.map((label, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ 
                          height: `${Math.max((reports.revenueByMonth.datasets[0].data[index] / Math.max(...reports.revenueByMonth.datasets[0].data)) * 200, 4)}px` 
                        }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bookings by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Bookings by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.bookingsByStatus.labels.map((label, index) => {
                    const count = reports.bookingsByStatus.datasets[0].data[index];
                    const percentage = reports.totalBookings > 0 ? (count / reports.totalBookings) * 100 : 0;
                    return (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: reports.bookingsByStatus.datasets[0].backgroundColor?.[index] }}
                          ></div>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{count}</span>
                          <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Monthly Average</p>
                  <p className="text-2xl font-bold">
                    ₹{(reports.totalRevenue / Math.max(reports.revenueByMonth.labels.length, 1)).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Growth Rate</p>
                  <p className={`text-2xl font-bold ${reports.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reports.monthlyGrowth >= 0 ? '+' : ''}{reports.monthlyGrowth.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{data.payments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.topProviders.map((provider, index) => (
                    <div key={provider.$id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{provider.email}</p>
                          <p className="text-sm text-gray-600">{provider.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{provider.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.topDevices.map((device, index) => (
                    <div key={device.deviceId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Device {device.deviceId.slice(-6)}</p>
                          <p className="text-sm text-gray-600">{device.count} bookings</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {reports.userGrowth.labels.map((label, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ 
                        height: `${Math.max((reports.userGrowth.datasets[0].data[index] / Math.max(...reports.userGrowth.datasets[0].data)) * 200, 4)}px` 
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.deviceDistribution.labels.map((label, index) => {
                    const count = reports.deviceDistribution.datasets[0].data[index];
                    const percentage = reports.totalBookings > 0 ? (count / reports.totalBookings) * 100 : 0;
                    return (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: reports.deviceDistribution.datasets[0].backgroundColor?.[index] }}
                          ></div>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{count}</span>
                          <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">{reports.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <span className="font-medium">{reports.averageRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Growth</span>
                    <span className={`font-medium ${reports.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reports.monthlyGrowth >= 0 ? '+' : ''}{reports.monthlyGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <span className="font-medium">{reports.totalUsers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 