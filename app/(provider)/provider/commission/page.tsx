"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  CreditCard
} from "lucide-react";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CommissionRecord {
  $id: string;
  booking_id: string;
  commission_amount: number;
  status: 'pending' | 'completed' | 'overdue';
  due_date: string;
  collection_method: string;
  created_at: string;
  booking_details?: {
    customer_name: string;
    device_display: string;
    total_amount: number;
    service_date: string;
  };
}

interface CommissionStats {
  totalPending: number;
  totalCompleted: number;
  totalOverdue: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  overdueAmount: number;
}

export default function ProviderCommissionPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalPending: 0,
    totalCompleted: 0,
    totalOverdue: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedAmount: 0,
    overdueAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchCommissions();
    }
  }, [user, activeTab]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [PROVIDER-COMMISSION] Fetching commissions for user:', user?.id);
      console.log('🔍 [PROVIDER-COMMISSION] Active tab:', activeTab);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        'commission_collections',
        [
          Query.equal('provider_id', user?.id || ''),
          Query.equal('status', activeTab)
        ]
      );

      console.log('🔍 [PROVIDER-COMMISSION] Found', response.documents.length, 'commission collections');
      response.documents.forEach((doc: any, index: number) => {
        console.log(`🔍 [PROVIDER-COMMISSION] Commission ${index + 1}:`, {
          id: doc.$id,
          provider_id: doc.provider_id,
          status: doc.status,
          commission_amount: doc.commission_amount
        });
      });

      // Debug: Fetch all commission collections without filtering
      try {
        const allCommissionsResponse = await databases.listDocuments(
          DATABASE_ID,
          'commission_collections',
          []
        );
        console.log('🔍 [PROVIDER-COMMISSION] Total commission collections in database:', allCommissionsResponse.documents.length);
        allCommissionsResponse.documents.forEach((doc: any, index: number) => {
          console.log(`🔍 [PROVIDER-COMMISSION] All Commission ${index + 1}:`, {
            id: doc.$id,
            provider_id: doc.provider_id,
            status: doc.status,
            commission_amount: doc.commission_amount
          });
        });
      } catch (error) {
        console.error('❌ [PROVIDER-COMMISSION] Error fetching all commissions:', error);
      }

      const commissionsWithDetails = await Promise.all(
        response.documents.map(async (commission: any) => {
          try {
            console.log('🔍 Fetching details for commission:', commission.$id);
            
            // Fetch booking details
            const bookingResponse = await databases.listDocuments(
              DATABASE_ID,
              'bookings',
              [Query.equal('$id', commission.booking_id), Query.limit(1)]
            );
            
            const booking = bookingResponse.documents[0];
            if (!booking) {
              console.error('❌ Booking not found for commission:', commission.booking_id);
              return {
                ...commission,
                booking_details: {
                  customer_name: 'Unknown Customer',
                  device_display: 'Unknown Device',
                  total_amount: 0,
                  service_date: ''
                }
              };
            }
            
            console.log('✅ Found booking:', {
              booking_id: booking.$id,
              customer_id: booking.customer_id,
              device_id: booking.device_id
            });
            
            // Fetch customer details using the same approach as booking cards
            let customerName = 'Unknown Customer';
            try {
              // Try customers collection first, then User collection as fallback
              const [customerResponse, userResponse] = await Promise.all([
                databases.listDocuments(
                  DATABASE_ID,
                  'customers',
                  [Query.equal("user_id", booking.customer_id), Query.limit(1)]
                ).catch(() => ({ documents: [] })),
                databases.listDocuments(
                  DATABASE_ID,
                  'User',
                  [Query.equal("user_id", booking.customer_id), Query.limit(1)]
                ).catch(() => ({ documents: [] }))
              ]);

              const customerFullName = customerResponse.documents[0]?.full_name || "";
              const userName = userResponse.documents[0]?.name || "";
              customerName = customerFullName || userName || "Unknown Customer";
              
              console.log('✅ Found customer:', customerName);
            } catch (customerError) {
              console.error('❌ Error fetching customer details:', customerError);
            }

            // Fetch device details using the same approach as booking cards
            let deviceDisplay = 'Unknown Device';
            if (booking.device_id) {
              try {
                // Try Phones collection first, then Laptops collection as fallback
                const deviceResponse = await databases.getDocument(
                  DATABASE_ID,
                  'Phones',
                  booking.device_id
                ).catch(() => 
                  databases.getDocument(
                    DATABASE_ID,
                    'Laptops',
                    booking.device_id
                  ).catch(() => null)
                );

                if (deviceResponse) {
                  deviceDisplay = `${deviceResponse.brand || "Unknown Brand"} ${deviceResponse.model || ""}`.trim();
                  console.log('✅ Found device:', deviceDisplay);
                }
              } catch (deviceError) {
                console.error('❌ Error fetching device details:', deviceError);
              }
            } else if (booking.device_display) {
              deviceDisplay = booking.device_display;
            } else if (booking.device) {
              deviceDisplay = booking.device;
            }

            console.log('📋 Final details:', {
              customer_name: customerName,
              device_display: deviceDisplay,
              total_amount: booking.total_amount
            });

            return {
              ...commission,
              booking_details: {
                customer_name: customerName,
                device_display: deviceDisplay,
                total_amount: booking.total_amount || 0,
                service_date: booking.appointment_time
              }
            };
          } catch (error) {
            console.error('❌ Error fetching commission details:', error);
            return {
              ...commission,
              booking_details: {
                customer_name: 'Unknown Customer',
                device_display: 'Unknown Device',
                total_amount: 0,
                service_date: ''
              }
            };
          }
        })
      );

      setCommissions(commissionsWithDetails);
      
      // Fetch overall stats
      await fetchStats();
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch all commissions for this provider
      const allCommissionsResponse = await databases.listDocuments(
        DATABASE_ID,
        'commission_collections',
        [Query.equal('provider_id', user?.id || '')]
      );

      const allCommissions = allCommissionsResponse.documents;
      
      const stats: CommissionStats = {
        totalPending: allCommissions.filter(c => c.status === 'pending').length,
        totalCompleted: allCommissions.filter(c => c.status === 'completed').length,
        totalOverdue: allCommissions.filter(c => c.status === 'overdue').length,
        totalAmount: allCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        pendingAmount: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        completedAmount: allCommissions.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        overdueAmount: allCommissions.filter(c => c.status === 'overdue').reduce((sum, c) => sum + (c.commission_amount || 0), 0)
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePayCommission = async (commissionId: string, amount: number) => {
    try {
      console.log('🔍 [PROVIDER-COMMISSION] Starting commission payment:', {
        commissionId,
        amount
      });

      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/pay-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commission_id: commissionId,
          provider_id: user?.id || "",
          amount: amount
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      console.log('✅ [PROVIDER-COMMISSION] Payment order created:', orderData);

      // Check if Razorpay script is already loaded
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Razorpay) {
        console.log('✅ [PROVIDER-COMMISSION] Razorpay already loaded, proceeding with payment');
        initializeRazorpay(orderData, commissionId, amount);
      } else {
        console.log('🔍 [PROVIDER-COMMISSION] Loading Razorpay script...');
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log('✅ [PROVIDER-COMMISSION] Razorpay script loaded successfully');
          initializeRazorpay(orderData, commissionId, amount);
        };

        script.onerror = () => {
          console.error('❌ [PROVIDER-COMMISSION] Failed to load Razorpay script');
          toast({
            title: "Error",
            description: "Failed to load payment gateway",
            variant: "destructive",
          });
        };

        document.body.appendChild(script);
      }

    } catch (error: any) {
      console.error('❌ [PROVIDER-COMMISSION] Error processing commission payment:', error);
      toast({
        title: "Error",
        description: "Failed to process commission payment: " + error.message,
        variant: "destructive",
      });
    }
  };

  const initializeRazorpay = (orderData: any, commissionId: string, amount: number) => {
    try {
      console.log('🔍 [PROVIDER-COMMISSION] Initializing Razorpay with options:', {
        key: orderData.key,
        amount: orderData.amount,
        order_id: orderData.order_id
      });

      // Initialize Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Device Repair Platform',
        description: `Commission Payment - ₹${amount}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          console.log('🔍 [PROVIDER-COMMISSION] Payment successful:', response);
          
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify-commission-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                commission_id: commissionId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast({
                title: "Success",
                description: "Commission payment completed successfully!",
              });
              
              // Refresh the commission list
              fetchCommissions();
            } else {
              console.error('❌ [PROVIDER-COMMISSION] Payment verification failed:', verifyData.error);
              toast({
                title: "Error",
                description: "Payment verification failed: " + verifyData.error,
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('❌ [PROVIDER-COMMISSION] Error verifying payment:', error);
            toast({
              title: "Error",
              description: "Failed to verify payment",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };

      // @ts-ignore
      if (typeof window !== 'undefined' && window.Razorpay) {
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        console.log('✅ [PROVIDER-COMMISSION] Opening Razorpay modal...');
        rzp.open();
      } else {
        throw new Error('Razorpay not loaded');
      }
    } catch (error: any) {
      console.error('❌ [PROVIDER-COMMISSION] Error initializing Razorpay:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment gateway: " + error.message,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Commission Management
              </h1>
              <p className="text-gray-600">
                Track and pay your commission dues from COD bookings
              </p>
            </div>
            <Button 
              onClick={fetchCommissions}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From all COD bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">
                ₹{stats.pendingAmount.toLocaleString()} due
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompleted}</div>
              <p className="text-xs text-muted-foreground">
                ₹{stats.completedAmount.toLocaleString()} paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOverdue}</div>
              <p className="text-xs text-muted-foreground">
                ₹{stats.overdueAmount.toLocaleString()} overdue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No commission records found
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'pending' ? 'No pending commissions' : 
                   activeTab === 'completed' ? 'No completed commissions' : 
                   'No overdue commissions'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <Card key={commission.$id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            ₹{commission.commission_amount?.toLocaleString()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Commission for {commission.booking_details?.device_display}
                          </p>
                        </div>
                        {getStatusBadge(commission.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-medium">{commission.booking_details?.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Service Date</p>
                          <p className="font-medium">{formatDateTime(commission.booking_details?.service_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Collection Method</p>
                          <p className="font-medium capitalize">{commission.collection_method.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium">{formatDateTime(commission.due_date)}</p>
                        </div>
                      </div>

                      {commission.status === 'pending' && (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handlePayCommission(commission.$id, commission.commission_amount)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Commission
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 