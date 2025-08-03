"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Star,
  Building,
  Download,
  RefreshCw,
  Mail,
  Phone
} from "lucide-react";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Provider {
  $id: string;
  email: string;
  phone: string;
  business_name?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  created_at?: string;
}

interface ProviderStats {
  totalProviders: number;
  verifiedProviders: number;
  pendingProviders: number;
}

export default function ProviderManagementPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    totalProviders: 0,
    verifiedProviders: 0,
    pendingProviders: 0
  });
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [providers]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      
      const providersResponse = await databases.listDocuments(DATABASE_ID, 'providers');
      
      const providersWithDetails = providersResponse.documents.map((provider: any) => ({
        ...provider,
        business_name: provider.business_name || "Unknown Business"
      }));

      setProviders(providersWithDetails);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats: ProviderStats = {
      totalProviders: providers.length,
      verifiedProviders: providers.filter(p => p.isVerified && p.isApproved).length,
      pendingProviders: providers.filter(p => !p.isVerified || !p.isApproved).length
    };

    setStats(stats);
  };

  const verifyProvider = async (providerId: string) => {
    try {
      setVerifying(providerId);
      
      await databases.updateDocument(
        DATABASE_ID,
        'providers',
        providerId,
        {
          isVerified: true,
          isApproved: true
        }
      );

      // Update business_setup if it exists
      try {
        const businessSetupDocs = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', providerId)]
        );
        
        if (businessSetupDocs.documents.length > 0) {
          const providerSetup = businessSetupDocs.documents[0];
          const onboardingData = JSON.parse(providerSetup.onboarding_data || '{}');
          onboardingData.verification = {
            status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: 'admin'
          };
          
          await databases.updateDocument(
            DATABASE_ID,
            'business_setup',
            providerSetup.$id,
            {
              onboarding_data: JSON.stringify(onboardingData)
            }
          );
        }
      } catch (error) {
        console.log('Could not update business_setup verification:', error);
      }

      await fetchProviders();
      
      toast({
        title: "Success",
        description: "Provider verified successfully",
      });
    } catch (error) {
      console.error('Error verifying provider:', error);
      toast({
        title: "Error",
        description: "Failed to verify provider",
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const getStatusColor = (provider: Provider) => {
    if (provider.isVerified && provider.isApproved) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDateTime = (dt: string) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return d.toLocaleDateString();
  };

  const exportProviders = () => {
    const csvContent = [
      ['Provider ID', 'Email', 'Phone', 'Business Name', 'Status', 'Joined Date'].join(','),
      ...providers.map(provider => [
        provider.$id,
        provider.email,
        provider.phone,
        provider.business_name,
        provider.isVerified && provider.isApproved ? 'Verified' : 'Pending',
        formatDateTime(provider.created_at || '')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `providers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProviders = providers.filter(provider =>
    provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.phone.includes(searchTerm)
  );

  const pendingProviders = filteredProviders.filter(
    provider => !provider.isVerified || !provider.isApproved
  );

  const verifiedProviders = filteredProviders.filter(
    provider => provider.isVerified && provider.isApproved
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading providers...</p>
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
            Provider Management
          </h1>
          <p className="text-gray-600">
            Monitor, manage, and verify service providers
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportProviders}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchProviders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                <p className="text-2xl font-bold">{stats.totalProviders}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Providers</p>
                <p className="text-2xl font-bold text-green-600">{stats.verifiedProviders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingProviders}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Providers List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Providers ({filteredProviders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({filteredProviders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingProviders.length})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({verifiedProviders.length})</TabsTrigger>
            </TabsList>
            
            {/* All Providers Tab */}
            <TabsContent value="all" className="mt-6">
              {filteredProviders.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                  <p className="text-gray-600">Try adjusting your search</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProviders.map((provider) => (
                    <div key={provider.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {provider.business_name || "Unknown Business"}
                            </h3>
                            <p className="text-sm text-gray-600">{provider.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(provider)}>
                            {provider.isVerified && provider.isApproved ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{provider.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Joined:</span>
                          <span>{formatDateTime(provider.created_at || '')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">ID:</span>
                          <span className="text-gray-500">{provider.$id.slice(-8)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          ID: {provider.$id.slice(-8)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/providers/${provider.$id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          {(!provider.isVerified || !provider.isApproved) && (
                            <Button
                              onClick={() => verifyProvider(provider.$id)}
                              disabled={verifying === provider.$id}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              {verifying === provider.$id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pending Providers Tab */}
            <TabsContent value="pending" className="mt-6">
              {pendingProviders.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending providers</h3>
                  <p className="text-gray-600">All providers have been verified</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProviders.map((provider) => (
                    <div key={provider.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-yellow-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {provider.business_name || "Unknown Business"}
                            </h3>
                            <p className="text-sm text-gray-600">{provider.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pending Verification
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{provider.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Applied:</span>
                          <span>{formatDateTime(provider.created_at || '')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">ID:</span>
                          <span className="text-gray-500">{provider.$id.slice(-8)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          ID: {provider.$id.slice(-8)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/providers/${provider.$id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>
                          <Button
                            onClick={() => verifyProvider(provider.$id)}
                            disabled={verifying === provider.$id}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            {verifying === provider.$id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Verified Providers Tab */}
            <TabsContent value="verified" className="mt-6">
              {verifiedProviders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No verified providers</h3>
                  <p className="text-gray-600">No providers have been verified yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifiedProviders.map((provider) => (
                    <div key={provider.$id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-green-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {provider.business_name || "Unknown Business"}
                            </h3>
                            <p className="text-sm text-gray-600">{provider.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{provider.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Joined:</span>
                          <span>{formatDateTime(provider.created_at || '')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">ID:</span>
                          <span className="text-gray-500">{provider.$id.slice(-8)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          ID: {provider.$id.slice(-8)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/providers/${provider.$id}`}>
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
