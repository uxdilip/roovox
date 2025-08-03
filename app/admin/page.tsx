"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Smartphone,
  Laptop,
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalProviders: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  activeProviders: number;
  pendingProviders: number;
  totalDevices: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'provider' | 'customer';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalProviders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    activeProviders: 0,
    pendingProviders: 0,
    totalDevices: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all collections data
      const [
        usersResponse,
        customersResponse,
        providersResponse,
        bookingsResponse,
        paymentsResponse,
        phonesResponse,
        laptopsResponse
      ] = await Promise.all([
        databases.listDocuments(DATABASE_ID, 'users'),
        databases.listDocuments(DATABASE_ID, 'customers'),
        databases.listDocuments(DATABASE_ID, 'providers'),
        databases.listDocuments(DATABASE_ID, 'bookings'),
        databases.listDocuments(DATABASE_ID, 'payments'),
        databases.listDocuments(DATABASE_ID, 'phones'),
        databases.listDocuments(DATABASE_ID, 'laptops')
      ]);

      // Calculate statistics
      const totalUsers = usersResponse.documents.length;
      const totalCustomers = customersResponse.documents.length;
      const totalProviders = providersResponse.documents.length;
      const totalBookings = bookingsResponse.documents.length;
      
      const pendingBookings = bookingsResponse.documents.filter(
        (booking: any) => booking.status === 'pending'
      ).length;
      
      const completedBookings = bookingsResponse.documents.filter(
        (booking: any) => booking.status === 'completed'
      ).length;

      const totalRevenue = paymentsResponse.documents.reduce(
        (sum: number, payment: any) => sum + (payment.amount || 0), 0
      );

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = paymentsResponse.documents
        .filter((payment: any) => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

      const activeProviders = providersResponse.documents.filter(
        (provider: any) => provider.isVerified && provider.isApproved
      ).length;

      const pendingProviders = providersResponse.documents.filter(
        (provider: any) => !provider.isVerified || !provider.isApproved
      ).length;

      const totalDevices = phonesResponse.documents.length + laptopsResponse.documents.length;

      // Calculate average rating
      const ratedBookings = bookingsResponse.documents.filter(
        (booking: any) => booking.rating && booking.rating > 0
      );
      const averageRating = ratedBookings.length > 0 
        ? ratedBookings.reduce((sum: number, booking: any) => sum + booking.rating, 0) / ratedBookings.length
        : 0;

      setStats({
        totalUsers,
        totalCustomers,
        totalProviders,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        monthlyRevenue,
        averageRating,
        activeProviders,
        pendingProviders,
        totalDevices
      });

      // Generate recent activity
      const activity: RecentActivity[] = [];
      
      // Add recent bookings
      const recentBookings = bookingsResponse.documents
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      recentBookings.forEach((booking: any) => {
        activity.push({
          id: booking.$id,
          type: 'booking',
          title: `New booking created`,
          description: `Booking #${booking.$id.slice(-8)} - ₹${booking.total_amount}`,
          timestamp: booking.created_at,
          status: booking.status === 'completed' ? 'success' : 
                  booking.status === 'pending' ? 'warning' : 'info'
        });
      });

      // Add recent payments
      const recentPayments = paymentsResponse.documents
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      
      recentPayments.forEach((payment: any) => {
        activity.push({
          id: payment.$id,
          type: 'payment',
          title: `Payment received`,
          description: `₹${payment.amount} - ${payment.payment_method}`,
          timestamp: payment.created_at,
          status: payment.status === 'completed' ? 'success' : 'warning'
        });
      });

      // Add recent providers
      const recentProviders = providersResponse.documents
        .sort((a: any, b: any) => new Date(b.joinedAt || b.created_at).getTime() - new Date(a.joinedAt || a.created_at).getTime())
        .slice(0, 2);
      
      recentProviders.forEach((provider: any) => {
        activity.push({
          id: provider.$id,
          type: 'provider',
          title: `New provider joined`,
          description: provider.email,
          timestamp: provider.joinedAt || provider.created_at,
          status: provider.isVerified ? 'success' : 'warning'
        });
      });

      setRecentActivity(activity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'provider': return <Users className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor and manage your device repair platform
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers} customers, {stats.totalProviders} providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingBookings} pending, {stats.completedBookings} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₹{stats.monthlyRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProviders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingProviders} pending verification
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/verify-providers">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Verify Providers ({stats.pendingProviders})
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/cash-collection">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Cash Collection
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Bookings
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/payments">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Payment Management
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average customer rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Catalog</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Total device models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBookings > 0 
                ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Bookings completed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 