"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Calendar, 
  User, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";

interface CommissionCollection {
  $id: string;
  booking_id: string;
  provider_id: string;
  commission_amount: number;
  collection_method: string;
  status: 'pending' | 'completed' | 'overdue';
  due_date: string;
  created_at: string;
  booking_details?: {
    customer_name: string;
    provider_name: string;
    device_display: string;
    total_amount: number;
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

export default function CommissionCollectionPage() {
  const [collections, setCollections] = useState<CommissionCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState<CommissionStats>({
    totalPending: 0,
    totalCompleted: 0,
    totalOverdue: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedAmount: 0,
    overdueAmount: 0
  });
  const [confirmingCollection, setConfirmingCollection] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissionCollections();
  }, [activeTab]);

  const fetchCommissionCollections = async () => {
    try {
      setLoading(true);
      
      // Fetch collections for current tab
      const response = await databases.listDocuments(
        DATABASE_ID,
        'commission_collections',
        [Query.equal('status', activeTab)]
      );

      const collectionsWithDetails = await Promise.all(
        response.documents.map(async (collection: any) => {
          try {
            // Fetch booking details
            const bookingResponse = await databases.listDocuments(
              DATABASE_ID,
              'bookings',
              [Query.equal('$id', collection.booking_id), Query.limit(1)]
            );
            
            const booking = bookingResponse.documents[0];
            if (!booking) {
              console.error('Booking not found for collection:', collection.booking_id);
              return collection;
            }
            
            // Fetch customer and provider details
            const [customerResponse, providerResponse] = await Promise.all([
              databases.listDocuments(DATABASE_ID, 'User', [Query.equal('user_id', booking.customer_id), Query.limit(1)]),
              databases.listDocuments(DATABASE_ID, 'User', [Query.equal('user_id', collection.provider_id), Query.limit(1)])
            ]);

            // Fetch provider details using comprehensive approach
            let providerName = 'Unknown Provider';
            try {
              // Try both collection.provider_id and booking.provider_id
              const providerIds = [collection.provider_id, booking.provider_id].filter(Boolean);
              
              for (const providerId of providerIds) {
                if (!providerId) continue;
                
                try {
                  const businessSetupResponse = await databases.listDocuments(
                    DATABASE_ID,
                    'business_setup',
                    [Query.equal("user_id", providerId), Query.limit(1)]
                  );
                  
                  if (businessSetupResponse.documents.length > 0) {
                    const onboardingData = JSON.parse(businessSetupResponse.documents[0].onboarding_data || '{}');
                    
                    if (onboardingData.businessInfo?.businessName) {
                      providerName = onboardingData.businessInfo.businessName;
                      break; // Found the business name, exit the loop
                    }
                  }
                } catch (error) {
                  console.error('Error fetching business_setup for provider:', providerId, error);
                }
              }
              
              // Fallback to User collection name if no business name found
              if (providerName === 'Unknown Provider') {
                for (const providerId of providerIds) {
                  if (!providerId) continue;
                  
                  try {
                    const userResponse = await databases.listDocuments(
                      DATABASE_ID,
                      'User',
                      [Query.equal('user_id', providerId), Query.limit(1)]
                    );
                    
                    if (userResponse.documents.length > 0) {
                      providerName = userResponse.documents[0]?.name || 'Unknown Provider';
                      break;
                    }
                  } catch (error) {
                    console.error('Error fetching User for provider:', providerId, error);
                  }
                }
              }
            } catch (providerError) {
              console.error('Error in provider fetching logic:', providerError);
              // Final fallback
              providerName = 'Unknown Provider';
            }

            // Fetch customer details using comprehensive approach
            let customerName = 'Unknown Customer';
            try {
              // Try customers collection first, then User collection as fallback
              const [customerFullResponse] = await Promise.all([
                databases.listDocuments(
                  DATABASE_ID,
                  'customers',
                  [Query.equal("user_id", booking.customer_id), Query.limit(1)]
                ).catch(() => ({ documents: [] }))
              ]);

              const customerFullName = customerFullResponse.documents[0]?.full_name || "";
              const userName = customerResponse.documents[0]?.name || "";
              customerName = customerFullName || userName || "Unknown Customer";
              
            } catch (customerError) {
              console.error('Error fetching customer details:', customerError);
            }

            // Fetch device details using comprehensive approach
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
                }
              } catch (deviceError) {
                console.error('Error fetching device details:', deviceError);
              }
            } else if (booking.device_display) {
              deviceDisplay = booking.device_display;
            } else if (booking.device) {
              deviceDisplay = booking.device;
            }

            return {
              ...collection,
              booking_details: {
                customer_name: customerName,
                provider_name: providerName,
                device_display: deviceDisplay,
                total_amount: booking.total_amount || 0
              }
            };
          } catch (error) {
            console.error('Error fetching collection details:', error);
            return collection;
          }
        })
      );

      setCollections(collectionsWithDetails);
      
      // Fetch overall stats
      await fetchStats();
    } catch (error) {
      console.error('Error fetching commission collections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch commission collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch all collections for stats
      const allCollectionsResponse = await databases.listDocuments(
        DATABASE_ID,
        'commission_collections',
        []
      );

      const allCollections = allCollectionsResponse.documents;
      
      const stats: CommissionStats = {
        totalPending: allCollections.filter(c => c.status === 'pending').length,
        totalCompleted: allCollections.filter(c => c.status === 'completed').length,
        totalOverdue: allCollections.filter(c => c.status === 'overdue').length,
        totalAmount: allCollections.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        pendingAmount: allCollections.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        completedAmount: allCollections.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        overdueAmount: allCollections.filter(c => c.status === 'overdue').reduce((sum, c) => sum + (c.commission_amount || 0), 0)
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleConfirmCollection = async (collectionId: string) => {
    try {
      setConfirmingCollection(collectionId);
      
      // Update collection status to completed
      await databases.updateDocument(
        DATABASE_ID,
        'commission_collections',
        collectionId,
        {
          status: 'completed',
          collected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      // Find the collection to get booking_id
      const collection = collections.find(c => c.$id === collectionId);
      if (collection) {
        // Update payment record
        const paymentResponse = await databases.listDocuments(
          DATABASE_ID,
          'payments',
          [Query.equal('booking_id', collection.booking_id), Query.limit(1)]
        );

        if (paymentResponse.documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            'payments',
            paymentResponse.documents[0].$id,
            {
              is_commission_settled: true,
              updated_at: new Date().toISOString()
            }
          );
        }
      }

      toast({
        title: "Success",
        description: "Commission collection confirmed",
      });

      // Refresh the list
      await fetchCommissionCollections();
    } catch (error) {
      console.error('Error confirming collection:', error);
      toast({
        title: "Error",
        description: "Failed to confirm collection",
        variant: "destructive",
      });
    } finally {
      setConfirmingCollection(null);
    }
  };

  const formatDateTime = (dateString: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Commission Collection Dashboard
              </h1>
              <p className="text-gray-600">
                Track and manage commission collection from COD bookings
              </p>
            </div>
            <Button 
              onClick={fetchCommissionCollections}
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
                From all collections
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
                ₹{stats.pendingAmount.toLocaleString()} pending
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
                ₹{stats.completedAmount.toLocaleString()} collected
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

        {/* Collections List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending Collections</TabsTrigger>
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
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No commission collections found
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'pending' ? 'No pending collections' : 
                   activeTab === 'completed' ? 'No completed collections' : 
                   'No overdue collections'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {collections.map((collection) => (
                  <Card key={collection.$id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            ₹{collection.commission_amount?.toLocaleString()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Commission from {collection.booking_details?.device_display}
                          </p>
                        </div>
                        {getStatusBadge(collection.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Provider</p>
                          <p className="font-medium">{collection.booking_details?.provider_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-medium">{collection.booking_details?.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Collection Method</p>
                          <p className="font-medium capitalize">{collection.collection_method.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium">{formatDateTime(collection.due_date)}</p>
                        </div>
                      </div>

                      {collection.status === 'pending' && (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleConfirmCollection(collection.$id)}
                            disabled={confirmingCollection === collection.$id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {confirmingCollection === collection.$id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Confirming...
                              </>
                            ) : (
                              "Confirm Collected"
                            )}
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