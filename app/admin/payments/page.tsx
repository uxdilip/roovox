"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Banknote,
  Calendar,
  User,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  PieChart
} from "lucide-react";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Payment {
  $id: string;
  booking_id: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id?: string;
  commission_amount: number;
  provider_payout: number;
  created_at: string;
  updated_at: string;
  booking_details?: {
    customer_name: string;
    provider_name: string;
    device_display: string;
    total_amount: number;
  };
}

interface PaymentStats {
  totalPayments: number;
  totalRevenue: number;
  totalCommission: number;
  totalPayouts: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  averagePayment: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  commission: number;
  payouts: number;
}

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalPayouts: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    averagePayment: 0
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter, activeTab]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      const response = await databases.listDocuments(DATABASE_ID, 'payments');
      
      const paymentsWithDetails = await Promise.all(
        response.documents.map(async (payment: any) => {
          try {
            // Fetch booking details
            let bookingDetails = {
              customer_name: "Unknown Customer",
              provider_name: "Unknown Provider",
              device_display: "Unknown Device",
              total_amount: payment.amount
            };

            try {
              const bookingResponse = await databases.getDocument(
                DATABASE_ID,
                'bookings',
                payment.booking_id
              );

              // Fetch customer details
              let customerName = "Unknown Customer";
              try {
                const customerResponse = await databases.getDocument(
                  DATABASE_ID,
                  'customers',
                  bookingResponse.customer_id
                );
                customerName = customerResponse.full_name || "Unknown Customer";
              } catch (error) {
                console.error("Error fetching customer details:", error);
              }

              // Fetch provider details
              let providerName = "Unknown Provider";
              try {
                const businessSetupResponse = await databases.listDocuments(
                  DATABASE_ID,
                  'business_setup',
                  [Query.equal("user_id", bookingResponse.provider_id)]
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
                    DATABASE_ID,
                    'phones',
                    bookingResponse.device_id
                  );
                } catch (phoneError) {
                  try {
                    deviceResponse = await databases.getDocument(
                      DATABASE_ID,
                      'laptops',
                      bookingResponse.device_id
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

              bookingDetails = {
                customer_name: customerName,
                provider_name: providerName,
                device_display: `${deviceBrand} ${deviceModel}`.trim(),
                total_amount: bookingResponse.total_amount || payment.amount
              };
            } catch (error) {
              console.error("Error fetching booking details:", error);
            }

            return {
              ...payment,
              booking_details: bookingDetails
            };
          } catch (error) {
            console.error("Error processing payment:", error);
            return payment;
          }
        })
      );

      setPayments(paymentsWithDetails);
      calculateStats(paymentsWithDetails);
      generateRevenueData(paymentsWithDetails);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (payments: Payment[]) => {
    const stats: PaymentStats = {
      totalPayments: payments.length,
      totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalCommission: payments.reduce((sum, p) => sum + (p.commission_amount || 0), 0),
      totalPayouts: payments.reduce((sum, p) => sum + (p.provider_payout || 0), 0),
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      monthlyRevenue: 0,
      weeklyRevenue: 0,
      averagePayment: 0
    };

    // Calculate monthly and weekly revenue
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeek = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);

    const monthlyPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear &&
             payment.status === 'completed';
    });

    const weeklyPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      const paymentWeek = Math.ceil((paymentDate.getDate() + new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1).getDay()) / 7);
      return paymentWeek === currentWeek && 
             paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear &&
             payment.status === 'completed';
    });

    stats.monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    stats.weeklyRevenue = weeklyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    stats.averagePayment = stats.totalRevenue / stats.totalPayments || 0;

    setStats(stats);
  };

  const generateRevenueData = (payments: Payment[]) => {
    // Generate last 30 days revenue data
    const revenueData: RevenueData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate.toISOString().split('T')[0] === dateStr && 
               payment.status === 'completed';
      });
      
      const revenue = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const commission = dayPayments.reduce((sum, p) => sum + (p.commission_amount || 0), 0);
      const payouts = dayPayments.reduce((sum, p) => sum + (p.provider_payout || 0), 0);
      
      revenueData.push({
        date: dateStr,
        revenue,
        commission,
        payouts
      });
    }
    
    setRevenueData(revenueData);
  };

  const filterPayments = () => {
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.booking_details?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.booking_details?.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.$id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter(payment => payment.payment_method === methodFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        switch (dateFilter) {
          case "today":
            return paymentDate >= today;
          case "yesterday":
            return paymentDate >= yesterday && paymentDate < today;
          case "lastWeek":
            return paymentDate >= lastWeek;
          case "lastMonth":
            return paymentDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(payment => payment.status === activeTab);
    }

    setFilteredPayments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'online': return <CreditCard className="h-4 w-4" />;
      case 'cod': return <Banknote className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dt: string) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return d.toLocaleString();
  };

  const exportPayments = () => {
    const csvContent = [
      ['Payment ID', 'Booking ID', 'Customer', 'Provider', 'Amount', 'Commission', 'Provider Payout', 'Status', 'Method', 'Transaction ID', 'Created At'].join(','),
      ...filteredPayments.map(payment => [
        payment.$id,
        payment.booking_id,
        payment.booking_details?.customer_name,
        payment.booking_details?.provider_name,
        payment.amount,
        payment.commission_amount,
        payment.provider_payout,
        payment.status,
        payment.payment_method,
        payment.transaction_id || '',
        payment.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
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
            Payment & Revenue Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor financial transactions and revenue analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportPayments}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchPayments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRevenue > 0 ? Math.round((stats.totalCommission / stats.totalRevenue) * 100) : 0}% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provider Payouts</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average: ₹{stats.averagePayment.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments} pending, {stats.failedPayments} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Trend (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-1">
            {revenueData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.max((data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 200, 4)}px` 
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(data.date).getDate()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Commission</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Payouts</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
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
                setStatusFilter("all");
                setMethodFilter("all");
                setDateFilter("all");
                setActiveTab("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payments ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.totalPayments})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pendingPayments})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completedPayments})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({stats.failedPayments})</TabsTrigger>
              <TabsTrigger value="refunded">Refunded</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div key={payment.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getMethodIcon(payment.payment_method)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              ₹{payment.amount?.toLocaleString()}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Payment #{payment.$id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                          <Badge variant="outline">
                            {payment.payment_method}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{payment.booking_details?.customer_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Provider:</span>
                          <span className="font-medium">{payment.booking_details?.provider_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(payment.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Device:</span>
                          <span className="font-medium">{payment.booking_details?.device_display}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Commission</p>
                          <p className="text-lg font-bold text-blue-600">₹{payment.commission_amount?.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Provider Payout</p>
                          <p className="text-lg font-bold text-green-600">₹{payment.provider_payout?.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Transaction ID</p>
                          <p className="text-sm font-mono">{payment.transaction_id || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Created: {formatDateTime(payment.created_at)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/payments/${payment.$id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
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