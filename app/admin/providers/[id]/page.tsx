"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar, 
  Star, 
  FileText,
  Shield,
  Clock,
  DollarSign,
  Package,
  Settings
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
  joinedAt?: string;
  role?: string;
  onboardingCompleted?: boolean;
}

interface BusinessSetup {
  $id: string;
  user_id: string;
  personal_details?: string;
  business_details?: string;
  pricing_warranty?: string;
  verification?: string;
  payment_setup?: string;
  created_at?: string;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [businessSetup, setBusinessSetup] = useState<BusinessSetup | null>(null);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const providerId = params.id as string;

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      
      // Fetch provider document
      const providerDoc = await databases.getDocument(
        DATABASE_ID,
        'providers',
        providerId
      );
      setProvider(providerDoc as unknown as Provider);

      // Fetch business setup document
      try {
        const businessSetupDocs = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', providerId)]
        );
        
        if (businessSetupDocs.documents.length > 0) {
          const setupDoc = businessSetupDocs.documents[0] as unknown as BusinessSetup;
          setBusinessSetup(setupDoc);
          
          // Parse onboarding data
          if (setupDoc.personal_details) {
            try {
              const parsed = JSON.parse(setupDoc.personal_details);
              setOnboardingData(prev => ({ ...prev, personalDetails: parsed }));
            } catch (error) {
              console.error('Error parsing personal_details:', error);
            }
          }
          
          if (setupDoc.business_details) {
            try {
              const parsed = JSON.parse(setupDoc.business_details);
              setOnboardingData(prev => ({ ...prev, businessDetails: parsed }));
            } catch (error) {
              console.error('Error parsing business_details:', error);
            }
          }
          
          if (setupDoc.pricing_warranty) {
            try {
              const parsed = JSON.parse(setupDoc.pricing_warranty);
              setOnboardingData(prev => ({ ...prev, pricingWarranty: parsed }));
            } catch (error) {
              console.error('Error parsing pricing_warranty:', error);
            }
          }
          
          if (setupDoc.verification) {
            try {
              const parsed = JSON.parse(setupDoc.verification);
              setOnboardingData(prev => ({ ...prev, verification: parsed }));
            } catch (error) {
              console.error('Error parsing verification:', error);
            }
          }
          
          if (setupDoc.payment_setup) {
            try {
              const parsed = JSON.parse(setupDoc.payment_setup);
              setOnboardingData(prev => ({ ...prev, paymentSetup: parsed }));
            } catch (error) {
              console.error('Error parsing payment_setup:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching business setup:', error);
      }
      
    } catch (error) {
      console.error('Error fetching provider:', error);
      toast({
        title: "Error",
        description: "Failed to fetch provider details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyProvider = async () => {
    if (!provider) return;
    
    try {
      setVerifying(true);
      
      // Update provider document
      await databases.updateDocument(
        DATABASE_ID,
        'providers',
        providerId,
        {
          isVerified: true,
          isApproved: true
        }
      );

      // Update business setup verification
      if (businessSetup) {
        const verificationData = {
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: 'admin'
        };
        
        await databases.updateDocument(
          DATABASE_ID,
          'business_setup',
          businessSetup.$id,
          {
            verification: JSON.stringify(verificationData)
          }
        );
      }

      // Refresh data
      await fetchProviderData();
      
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
      setVerifying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileUrl = (fileId: string) => {
    if (!fileId) return null;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687398a90012d5a8d92f';
    return `${endpoint}/storage/buckets/provider_docs/files/${fileId}/view?project=${projectId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Provider Not Found</h1>
          <Button asChild>
            <Link href="/admin/verify-providers">Back to Providers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const personal = onboardingData.personalDetails || {};
  const business = onboardingData.businessDetails || {};
  const pricing = onboardingData.pricingWarranty || {};
  const verification = onboardingData.verification || {};
  const payment = onboardingData.paymentSetup || {};

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild>
              <Link href="/admin/verify-providers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Providers
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Provider Details</h1>
              <p className="text-gray-600">Review provider information and verification status</p>
            </div>
            {!provider.isVerified && (
              <Button
                onClick={verifyProvider}
                disabled={verifying}
                className="bg-green-600 hover:bg-green-700"
              >
                {verifying ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {verifying ? 'Verifying...' : 'Verify Provider'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {personal.profilePicture ? (
                      (() => {
                        const imageUrl = getFileUrl(personal.profilePicture);
                        return imageUrl ? (
                          <AvatarImage src={imageUrl} alt={personal.fullName} />
                        ) : (
                          <AvatarFallback>{personal.fullName?.[0] || "P"}</AvatarFallback>
                        );
                      })()
                    ) : (
                      <AvatarFallback>{personal.fullName?.[0] || "P"}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{personal.fullName || provider.business_name || 'N/A'}</h3>
                    <p className="text-muted-foreground">{provider.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.email}</span>
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

                {/* Verification Status */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Verification Status</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Verified:</span>
                      <Badge variant={provider.isVerified ? "default" : "secondary"}>
                        {provider.isVerified ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Approved:</span>
                      <Badge variant={provider.isApproved ? "default" : "secondary"}>
                        {provider.isApproved ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Onboarding:</span>
                      <Badge variant={provider.onboardingCompleted ? "default" : "secondary"}>
                        {provider.onboardingCompleted ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    {provider.created_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Created: {formatDate(provider.created_at)}</span>
                      </div>
                    )}
                    {provider.joinedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Joined: {formatDate(provider.joinedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Provider
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Documents
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  {/* Personal Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {personal.fullName ? (
                        <div className="space-y-2">
                          <p><strong>Full Name:</strong> {personal.fullName}</p>
                          <p><strong>Email:</strong> {personal.email || provider.email}</p>
                          <p><strong>Phone:</strong> {personal.phone || provider.phone}</p>
                          {personal.address && (
                            <p><strong>Address:</strong> {personal.address}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No personal details available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Business Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {business.businessName ? (
                        <div className="space-y-2">
                          <p><strong>Business Name:</strong> {business.businessName}</p>
                          <p><strong>Business Type:</strong> {business.businessType || 'N/A'}</p>
                          <p><strong>Experience:</strong> {business.experienceYears || 'N/A'} years</p>
                          {business.description && (
                            <p><strong>Description:</strong> {business.description}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No business details available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Location & Availability */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Location & Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {business.location ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{business.location.city}, {business.location.state}</span>
                          </div>
                          {business.availability && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Available: {business.availability}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No location information available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="business" className="mt-6">
                <div className="space-y-6">
                  {/* Pricing & Warranty */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing & Warranty
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pricing.baseRate ? (
                        <div className="space-y-2">
                          <p><strong>Base Rate:</strong> ₹{pricing.baseRate}</p>
                          <p><strong>Emergency Rate:</strong> ₹{pricing.emergencyRate || 'N/A'}</p>
                          <p><strong>Travel Fee:</strong> ₹{pricing.travelFee || 'N/A'}</p>
                          <p><strong>Warranty Period:</strong> {pricing.warrantyPeriod || 'N/A'} months</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No pricing information available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Setup */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {payment.paymentMethod ? (
                        <div className="space-y-2">
                          <p><strong>Payment Method:</strong> {payment.paymentMethod}</p>
                          {payment.bankDetails && (
                            <p><strong>Bank Account:</strong> {payment.bankDetails}</p>
                          )}
                          {payment.upiId && (
                            <p><strong>UPI ID:</strong> {payment.upiId}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No payment information available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Services Offered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Service information will be displayed here when available.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Verification Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Document verification information will be displayed here when available.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 