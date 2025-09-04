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
  Users, 
  UserCheck, 
  UserX, 
  UserPlus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Activity,
  Star,
  DollarSign,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface User {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  userType?: string;
  created_at: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  isActive?: boolean;
  lastLogin?: string;
  stats?: {
    totalBookings: number;
    completedBookings: number;
    totalSpent: number;
    averageRating: number;
    devicesRegistered: number;
  };
}

interface UserStats {
  totalUsers: number;
  totalCustomers: number;
  totalProviders: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalRevenue: number;
  averageRating: number;
  topCustomers: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalProviders: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalRevenue: 0,
    averageRating: 0,
    topCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all user types from their respective collections
      let usersResponse: any = { documents: [] };
      let customersResponse: any = { documents: [] };
      let providersResponse: any = { documents: [] };
      let bookingsResponse: any = { documents: [] };
      let customerDevicesResponse: any = { documents: [] };

      // Try to fetch all collections
      try {
        const [usersData, customersData, providersData, bookingsData, customerDevicesData] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.CUSTOMERS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PROVIDERS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.BOOKINGS),
          databases.listDocuments(DATABASE_ID, 'customer_devices')
        ]);
        
        usersResponse = usersData;
        customersResponse = customersData;
        providersResponse = providersData;
        bookingsResponse = bookingsData;
        customerDevicesResponse = customerDevicesData;
      } catch (error) {
        
        // Try to fetch collections individually
        try {
          const usersData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
          usersResponse = usersData;
        } catch (e) {
        }
        
        try {
          const customersData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CUSTOMERS);
          customersResponse = customersData;
        } catch (e) {
        }
        
        try {
          const providersData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROVIDERS);
          providersResponse = providersData;
        } catch (e) {
        }
        
        try {
          const bookingsData = await databases.listDocuments(DATABASE_ID, COLLECTIONS.BOOKINGS);
          bookingsResponse = bookingsData;
        } catch (e) {
        }
        
        try {
          const customerDevicesData = await databases.listDocuments(DATABASE_ID, 'customer_devices');
          customerDevicesResponse = customerDevicesData;
        } catch (e) {
        }
      }

      // Combine all users from different collections
      const allUsers: any[] = [];

      // Add users from users collection
      usersResponse.documents.forEach((user: any) => {
        allUsers.push({
          ...user,
          userType: 'user',
          role: user.role || 'user'
        });
      });

      // Add customers from customers collection
      customersResponse.documents.forEach((customer: any) => {
        allUsers.push({
          ...customer,
          userType: 'customer',
          role: 'customer',
          name: customer.full_name || customer.name || 'Customer',
          email: customer.email,
          phone: customer.phone,
          created_at: customer.created_at
        });
      });

      // Add providers from providers collection
      providersResponse.documents.forEach((provider: any) => {
        allUsers.push({
          ...provider,
          userType: 'provider',
          role: 'provider',
          name: provider.name || 'Provider',
          email: provider.email,
          phone: provider.phone,
          created_at: provider.joinedAt || provider.created_at
        });
      });

      // Process each user to add stats
      const usersWithDetails = allUsers.map((user: any) => {
        try {
          let userStats = {
            totalBookings: 0,
            completedBookings: 0,
            totalSpent: 0,
            averageRating: 0,
            devicesRegistered: 0
          };

          if (user.role === 'customer' || user.userType === 'customer') {
            // Get customer bookings
            const customerBookings = bookingsResponse.documents.filter(
              (booking: any) => booking.customer_id === user.$id
            );

            const completedBookings = customerBookings.filter(
              (booking: any) => booking.status === 'completed'
            );

            userStats = {
              totalBookings: customerBookings.length,
              completedBookings: completedBookings.length,
              totalSpent: completedBookings.reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0),
              averageRating: 0,
              devicesRegistered: customerDevicesResponse.documents.filter(
                (device: any) => device.customer_id === user.$id
              ).length
            };

            // Calculate average rating
            const ratedBookings = completedBookings.filter(
              (booking: any) => booking.rating && booking.rating > 0
            );
            if (ratedBookings.length > 0) {
              userStats.averageRating = ratedBookings.reduce((sum: number, booking: any) => sum + booking.rating, 0) / ratedBookings.length;
            }
          } else if (user.role === 'provider' || user.userType === 'provider') {
            // Get provider bookings
            const providerBookings = bookingsResponse.documents.filter(
              (booking: any) => booking.provider_id === user.$id
            );

            const completedBookings = providerBookings.filter(
              (booking: any) => booking.status === 'completed'
            );

            userStats = {
              totalBookings: providerBookings.length,
              completedBookings: completedBookings.length,
              totalSpent: completedBookings.reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0),
              averageRating: 0,
              devicesRegistered: 0
            };

            // Calculate average rating
            const ratedBookings = completedBookings.filter(
              (booking: any) => booking.rating && booking.rating > 0
            );
            if (ratedBookings.length > 0) {
              userStats.averageRating = ratedBookings.reduce((sum: number, booking: any) => sum + booking.rating, 0) / ratedBookings.length;
            }
          }

          return {
            ...user,
            stats: userStats,
            isActive: userStats.totalBookings > 0
          };
        } catch (error) {
          console.error("Error processing user:", error);
          return {
            ...user,
            stats: {
              totalBookings: 0,
              completedBookings: 0,
              totalSpent: 0,
              averageRating: 0,
              devicesRegistered: 0
            },
            isActive: false
          };
        }
      });

      setUsers(usersWithDetails);
      calculateStats(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calculateStats = (users: User[]) => {
    const stats: UserStats = {
      totalUsers: users.length,
      totalCustomers: users.filter(u => u.role === 'customer' || u.userType === 'customer').length,
      totalProviders: users.filter(u => u.role === 'provider' || u.userType === 'provider').length,
      activeUsers: users.filter(u => u.isActive).length,
      newUsersThisMonth: 0,
      totalRevenue: 0,
      averageRating: 0,
      topCustomers: 0
    };

    // Calculate new users this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    stats.newUsersThisMonth = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    }).length;

    // Calculate total revenue and average rating
    const customersWithStats = users.filter(u => (u.role === 'customer' || u.userType === 'customer') && u.stats);
    stats.totalRevenue = customersWithStats.reduce((sum, user) => sum + (user.stats?.totalSpent || 0), 0);
    
    const ratedUsers = users.filter(u => u.stats && u.stats.averageRating > 0);
    if (ratedUsers.length > 0) {
      stats.averageRating = ratedUsers.reduce((sum, user) => sum + (user.stats?.averageRating || 0), 0) / ratedUsers.length;
    }

    // Top customers (those with high spending)
    stats.topCustomers = customersWithStats.filter(u => (u.stats?.totalSpent || 0) > 1000).length;

    setStats(stats);
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.address_city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => 
        user.role === roleFilter || 
        user.userType === roleFilter
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          filtered = filtered.filter(user => user.isActive);
          break;
        case "inactive":
          filtered = filtered.filter(user => !user.isActive);
          break;
        case "new":
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          filtered = filtered.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
          });
          break;
      }
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at);
        switch (dateFilter) {
          case "today":
            return userDate >= today;
          case "yesterday":
            return userDate >= yesterday && userDate < today;
          case "lastWeek":
            return userDate >= lastWeek;
          case "lastMonth":
            return userDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(user => user.role === activeTab);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, dateFilter, activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'provider': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dt: string) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return d.toLocaleDateString();
  };

  const exportUsers = () => {
    const csvContent = [
      ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Total Bookings', 'Completed Bookings', 'Total Spent', 'Average Rating', 'Devices', 'Created At', 'Location'].join(','),
      ...filteredUsers.map(user => [
        user.$id,
        user.name,
        user.email,
        user.phone || '',
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        user.stats?.totalBookings || 0,
        user.stats?.completedBookings || 0,
        user.stats?.totalSpent || 0,
        user.stats?.averageRating || 0,
        user.stats?.devicesRegistered || 0,
        formatDateTime(user.created_at),
        `${user.address_city || ''}, ${user.address_state || ''}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            User Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage all platform users
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchUsers}>
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
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newUsersThisMonth}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Customers</p>
                <p className="text-2xl font-bold text-purple-600">{stats.topCustomers}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="new">New This Month</SelectItem>
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
                setRoleFilter("all");
                setStatusFilter("all");
                setDateFilter("all");
                setActiveTab("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.totalUsers})</TabsTrigger>
              <TabsTrigger value="customer">Customers ({stats.totalCustomers})</TabsTrigger>
              <TabsTrigger value="provider">Providers ({stats.totalProviders})</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.isActive || false)}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{user.phone || 'No phone'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{user.address_city}, {user.address_state}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Joined: {formatDateTime(user.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span>{user.stats?.totalBookings || 0} bookings</span>
                        </div>
                      </div>
                      
                      {user.stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total Bookings</p>
                            <p className="text-lg font-bold">{user.stats.totalBookings}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-lg font-bold text-green-600">{user.stats.completedBookings}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-lg font-bold">₹{user.stats.totalSpent.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Rating</p>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-bold">{user.stats.averageRating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {user.role === 'customer' && user.stats && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Devices Registered:</p>
                          <Badge variant="outline">
                            {user.stats.devicesRegistered} devices
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          ID: {user.$id.slice(-8)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/users/${user.$id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 