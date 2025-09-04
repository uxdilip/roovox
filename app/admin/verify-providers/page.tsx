"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Eye,
  User,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import Link from 'next/link';

interface Provider {
  $id: string;
  email: string;
  phone: string;
  business_name?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  created_at?: string;
}

export default function VerifyProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        'providers',
        []
      );
      setProviders(response.documents as unknown as Provider[]);
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

  const verifyProvider = async (providerId: string) => {
    try {
      setVerifying(providerId);
      
      // Update provider document - use correct attribute names
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
      }

      // Refresh the list
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Providers</h1>
          <p className="text-gray-600">Review and verify provider applications</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers by email, business name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                  <p className="text-2xl font-bold">{providers.length}</p>
                </div>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Verification</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingProviders.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{verifiedProviders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Providers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Verification ({pendingProviders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingProviders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending providers to verify</p>
            ) : (
              <div className="space-y-4">
                {pendingProviders.map((provider) => (
                  <div key={provider.$id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{provider.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{provider.phone}</span>
                        </div>
                        {provider.business_name && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{provider.business_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Pending
                        </Badge>
                        {provider.created_at && (
                          <span className="text-sm text-muted-foreground">
                            Applied: {new Date(provider.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/providers/${provider.$id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        onClick={() => verifyProvider(provider.$id)}
                        disabled={verifying === provider.$id}
                        className="bg-green-600 hover:bg-green-700"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verified Providers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Verified Providers ({verifiedProviders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verifiedProviders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No verified providers</p>
            ) : (
              <div className="space-y-4">
                {verifiedProviders.map((provider) => (
                  <div key={provider.$id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{provider.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{provider.phone}</span>
                        </div>
                        {provider.business_name && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{provider.business_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                        {provider.created_at && (
                          <span className="text-sm text-muted-foreground">
                            Joined: {new Date(provider.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/providers/${provider.$id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 