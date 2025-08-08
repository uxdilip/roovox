import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProvider, createUserDocument, addProviderRole, updateUserDocument, upsertBusinessSetup } from '@/lib/appwrite-services';
import { account } from '@/lib/appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Building2, MapPin, Clock, Shield, CreditCard, ArrowLeft, Check } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { getUserByUserId } from '@/lib/appwrite-services';

interface FinishStepProps {
  data: any;
  onPrev: () => void;
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const FinishStep: React.FC<FinishStepProps> = ({ data, onPrev }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const { toast } = useToast();

  // Load onboarding data from database
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!user) return;
      
      try {
        setDataLoading(true);
        const res = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', user.id), Query.limit(1)]
        );
        
        if (res.documents.length > 0) {
          const savedData = res.documents[0];
          console.log('🔍 Debug: Complete business_setup document:', savedData);
          const parsedData = JSON.parse(savedData.onboarding_data || '{}');
          console.log('🔍 Debug: Loaded onboarding data from database:', parsedData);
          console.log('🔍 Debug: KYC docs from document:', savedData.kyc_docs);
          console.log('🔍 Debug: Raw kyc_docs type:', typeof savedData.kyc_docs);
          setOnboardingData({
            ...parsedData,
            kyc_docs: savedData.kyc_docs ? JSON.parse(savedData.kyc_docs) : {}
          });
        } else {
          console.log('⚠️ No onboarding data found in database');
          setOnboardingData({});
        }
      } catch (error) {
        console.error('❌ Error loading onboarding data:', error);
        setOnboardingData({});
      } finally {
        setDataLoading(false);
      }
    };

    loadOnboardingData();
  }, [user]);

  // Extract and format data from previous steps
  const extractReviewData = () => {
    // Use the loaded onboarding data from database
    const data = onboardingData || {};
    
    console.log('🔍 Debug: Extracting review data from:', data);
    console.log('🔍 Debug: KYC docs data:', data.kyc_docs);
    console.log('🔍 Debug: Verification data:', data.verification);
    console.log('🔍 Debug: KYC docs structure:', {
      aadhaar: data.kyc_docs?.aadhaar,
      pan: data.kyc_docs?.pan,
      gst: data.kyc_docs?.gst,
      shop_reg: data.kyc_docs?.shop_reg
    });
    
    const reviewData = {
      personalDetails: {
        fullName: data.personalDetails?.fullName || 'Not provided',
        email: data.personalDetails?.email || 'Not provided',
        contact: data.personalDetails?.mobile || 'Not provided',
        profilePicture: data.personalDetails?.profilePicture || null
      },
      businessDetails: {
        name: data.businessInfo?.businessName || 'Not provided',
        description: data.businessInfo?.businessBio || 'Not provided',
        experience: data.businessInfo?.yearsOfExperience || 'Not provided',
        serviceMode: data.businessInfo?.businessType || 'Not provided',
        shopImages: data.businessInfo?.shopImages || []
      },
      serviceArea: {
        city: data.serviceSetup?.location?.city || 'Not provided',
        state: data.serviceSetup?.location?.state || 'Not provided',
        zip: data.serviceSetup?.location?.zip || 'Not provided',
        radius: data.serviceSetup?.radius || 'Not provided',
        locationType: data.serviceSetup?.locationType || 'Not provided'
      },
      availability: data.serviceSetup?.availability || {},
      verification: {
        identityDocument: data.kyc_docs?.aadhaar ? 'Aadhaar Card Uploaded' : 'Not uploaded',
        businessLicense: data.kyc_docs?.pan ? 'PAN Card Uploaded' : 'Not uploaded',
        insuranceCertificate: data.kyc_docs?.gst ? 'GST Certificate Uploaded' : 'Not uploaded',
        backgroundCheck: data.kyc_docs?.shop_reg ? 'Shop License Uploaded' : 'Not uploaded'
      },
      payment: {
        payoutMethod: 'UPI',
        accountName: 'Not provided',
        accountNumber: 'Not provided',
        bankName: 'Not provided',
        ifsc: 'Not provided',
        upi: data.upi || 'Not provided'
      }
    };

    console.log('🔍 Debug: Extracted review data:', reviewData);
    return reviewData;
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setError('User not found. Please log in again.');
        setLoading(false);
        return;
      }
      console.debug('[DEBUG] Starting provider onboarding completion');
      console.debug('[DEBUG] User ID:', user.id);
      console.debug('[DEBUG] Full onboardingData object:', onboardingData);
      
      // Extract details from onboardingData
      const personalDetails = onboardingData?.personalDetails || {};
      const serviceSetup = onboardingData?.serviceSetup || {};
      const location = serviceSetup.location || {};
      
      // Fetch current user document to merge roles
      let mergedRoles = ["provider"];
      try {
        const userDoc = await getUserByUserId(user.id);
        if (userDoc && Array.isArray(userDoc.roles)) {
          const currentRoles = userDoc.roles;
          mergedRoles = Array.from(new Set([...currentRoles, "provider"]));
        }
        console.debug('[DEBUG] Merged roles:', mergedRoles);
      } catch (e) {
        console.debug('[DEBUG] Error fetching user roles, fallback to provider:', e);
      }
      
      // Upsert user document with onboarding details and merged roles
      try {
        // Ensure valid email
        let email = personalDetails.email || user.email || "";
        console.debug('[DEBUG] Using email for user document:', email);
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          setError("A valid email address is required. Please check your email in Personal Details.");
          setLoading(false);
          return;
        }
        const userUpdatePayload = {
          name: personalDetails.fullName || user.name,
          email,
          phone: personalDetails.contact || user.phone,
          roles: JSON.stringify(Array.from(new Set([...mergedRoles, 'provider']))),
          active_role: 'provider',
          address_city: location.city || '',
          address_state: location.state || '',
          address_zip: location.zip || '',
          address_lat: location.coordinates?.[0] || 0,
          address_lng: location.coordinates?.[1] || 0,
          updated_at: new Date().toISOString(),
        };
        console.debug('[DEBUG] Attempting to update user document with:', userUpdatePayload);
        const updateResult = await updateUserDocument(user.id, userUpdatePayload);
        console.debug('[DEBUG] updateUserDocument result:', updateResult);
        if (!updateResult) {
          // If update failed (user doc not found), create it
          const userCreatePayload = {
            userId: user.id,
            name: personalDetails.fullName || user.name,
            email,
            phone: personalDetails.contact || user.phone,
            roles: Array.from(new Set([...mergedRoles, 'provider'])),
            activeRole: 'provider' as 'provider',
            addressCity: location.city || '',
            addressState: location.state || '',
            addressZip: location.zip || '',
            addressLat: location.coordinates?.[0] || 0,
            addressLng: location.coordinates?.[1] || 0,
          };
          console.debug('[DEBUG] Attempting to create user document with:', userCreatePayload);
          const createResult = await createUserDocument(userCreatePayload);
          console.debug('[DEBUG] createUserDocument result:', createResult);
          console.log('✅ User document created after missing update');
        } else {
          console.log('✅ User document updated with onboarding details and merged roles');
        }
      } catch (error) {
        setError('Failed to update or create user document. Please check your details and try again.');
        setLoading(false);
        console.debug('[DEBUG] Error updating/creating user document:', error);
        return;
      }
      
      const providerData = {
        providerId: user.id,
        email: personalDetails.email || user.email,
        phone: personalDetails.contact || user.phone,
        role: 'provider',
        isVerified: false,
        isApproved: false,
        onboardingCompleted: true,
        joinedAt: new Date().toISOString(),
      };
      console.debug('[DEBUG] Creating provider with:', providerData);
      await createProvider(providerData);
      console.debug('[DEBUG] Provider created');
      
      // Add provider role to the user document
      try {
        await addProviderRole(user.id);
        console.log('✅ Provider role added to user document');
      } catch (error) {
        console.error('❌ Error adding provider role to user document:', error);
      }
      
      // Save business details to business_setup collection
      try {
        const businessSetupData = {
          businessSetup: onboardingData?.businessSetup,
          personalDetails: onboardingData?.personalDetails,
          serviceSetup: onboardingData?.serviceSetup,
          verification: onboardingData?.verification,
          payment: onboardingData?.payment,
        };
        console.debug('[DEBUG] Upserting business_setup with:', businessSetupData);
        await upsertBusinessSetup({
          user_id: user.id,
          onboarding_data: businessSetupData,
          created_at: new Date().toISOString(),
        });
        console.log('✅ Business setup data upserted successfully');
      } catch (error) {
        setError('Failed to save business setup data. Please try again.');
        setLoading(false);
        console.debug('[DEBUG] Error saving business setup data:', error);
        return;
      }
      
      toast({
        title: 'Onboarding Complete!',
        description: 'Your provider profile has been created successfully. You can now set up your services in the dashboard.',
      });
      
      setSubmitted(true);
      console.debug('[DEBUG] Onboarding submitted, setSubmitted(true)');
      
      // Refresh AuthContext/session so dashboard sees provider role
      if (refreshSession) {
        try {
          await refreshSession();
          console.debug('[DEBUG] Called refreshSession after onboarding');
        } catch (e) {
          console.error('[DEBUG] Error calling refreshSession:', e);
        }
      }
    } catch (err) {
      console.error('❌ Error during onboarding completion:', err);
      setError('Failed to complete onboarding. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submitted) {
      console.log('🔍 Debug: Onboarding submitted, starting redirect to dashboard...');
      const timeout = setTimeout(() => {
        console.log('🔍 Debug: Redirecting to /provider/dashboard');
        router.push('/provider/dashboard');
        
        // Fallback redirect after 3 seconds if the first one doesn't work
        setTimeout(() => {
          console.log('🔍 Debug: Fallback redirect to /provider/dashboard');
          router.replace('/provider/dashboard');
        }, 3000);
      }, 1000); // Reduced from 2000ms to 1000ms
      return () => clearTimeout(timeout);
    }
  }, [submitted, router]);

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-green-700">🎉 Onboarding Complete!</h2>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <p className="text-lg text-green-800">
              Thank you for completing your provider onboarding. Our team will review your details and contact you soon.
            </p>
            <p className="text-sm text-green-700 mt-2">
              You can now set up your services in the dashboard.
            </p>
          </CardContent>
        </Card>
        <div className="text-gray-500 mt-4">Redirecting to your dashboard...</div>
        <div className="mt-4">
          <Button 
            onClick={() => router.push('/provider/dashboard')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-700">Loading your information...</h2>
        <p className="text-gray-600">Please wait while we fetch your onboarding data.</p>
      </div>
    );
  }

  const reviewData = extractReviewData();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Review & Submit</h2>
        <p className="text-gray-600">Please review all your information before submitting your application.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{reviewData.personalDetails.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{reviewData.personalDetails.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contact:</span>
              <span className="font-medium">{reviewData.personalDetails.contact}</span>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Building2 className="h-5 w-5 mr-2 text-green-600" />
            <CardTitle className="text-lg">Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Business Name:</span>
              <span className="font-medium">{reviewData.businessDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Mode:</span>
              <Badge variant="secondary">{reviewData.businessDetails.serviceMode}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Experience:</span>
              <span className="font-medium">{reviewData.businessDetails.experience}</span>
            </div>
          </CardContent>
        </Card>

        {/* Service Area */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <MapPin className="h-5 w-5 mr-2 text-red-600" />
            <CardTitle className="text-lg">Service Area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium text-right max-w-xs">Kharar, Kharar Tahsil, Sahibzada Ajit Singh Nagar, Punjab, 140300, India</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">City:</span>
              <span className="font-medium">Kharar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">State:</span>
              <span className="font-medium">Punjab</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Zip:</span>
              <span className="font-medium">140300</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coordinates:</span>
              <span className="font-medium">30.7469° N, 76.6464° E</span>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Clock className="h-5 w-5 mr-2 text-purple-600" />
            <CardTitle className="text-lg">Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
              const val = reviewData.availability[day];
              return (
              <div key={day} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{DAY_LABELS[day]}:</span>
                  {val && val.available ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {val.start}–{val.end}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not available</Badge>
                )}
              </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Verification Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
            <CardTitle className="text-lg">Verification Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Identity Document:</span>
              <Badge variant={reviewData.verification.identityDocument !== 'Not uploaded' ? 'default' : 'secondary'}>
                {reviewData.verification.identityDocument}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Business License:</span>
              <Badge variant={reviewData.verification.businessLicense !== 'Not uploaded' ? 'default' : 'secondary'}>
                {reviewData.verification.businessLicense}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Insurance Certificate:</span>
              <Badge variant={reviewData.verification.insuranceCertificate !== 'Not uploaded' ? 'default' : 'secondary'}>
                {reviewData.verification.insuranceCertificate}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Background Check:</span>
              <Badge variant={reviewData.verification.backgroundCheck !== 'Not uploaded' ? 'default' : 'secondary'}>
                {reviewData.verification.backgroundCheck}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Payout Method:</span>
              <span className="font-medium">{reviewData.payment.payoutMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">UPI ID:</span>
              <span className="font-medium">{reviewData.payment.upi}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-700 text-center">{error}</div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrev} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleFinish} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FinishStep; 