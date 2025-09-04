"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderByUserId } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Loader2 } from 'lucide-react';

interface ProviderRouteGuardProps {
  children: React.ReactNode;
  requireOnboarding?: boolean; // true for onboarding pages, false for dashboard
}

export default function ProviderRouteGuard({ children, requireOnboarding = false }: ProviderRouteGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProviderStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        // Not logged in, redirect to login
        router.push('/provider/login');
        return;
      }

      try {
        
        // Check for business_setup document (new onboarding flow)
        let hasOnboardingData = false;
        let isOnboardingCompleted = false;
        
        try {
          const businessSetupRes = await databases.listDocuments(
            DATABASE_ID,
            'business_setup',
            [Query.equal('user_id', user.id), Query.limit(1)]
          );
          
          if (businessSetupRes.documents.length > 0) {
            hasOnboardingData = true;
            const onboardingData = JSON.parse(businessSetupRes.documents[0].onboarding_data || '{}');
            
            // Check if all required steps are completed (removed service selection check)
            const hasPersonalDetails = !!onboardingData.personalDetails?.fullName;
            const hasBusinessInfo = !!onboardingData.businessInfo?.businessName;
            const hasServiceSetup = !!onboardingData.serviceSetup?.location;
            const hasPayment = !!onboardingData.upi;
            
            isOnboardingCompleted = Boolean(hasPersonalDetails && hasBusinessInfo && hasServiceSetup && hasPayment);
          }
        } catch (error) {
        }
        
        // Fallback: Check for provider document (old flow)
        let hasProviderDoc = false;
        if (!hasOnboardingData) {
          try {
            const provider = await getProviderByUserId(user.id);
            hasProviderDoc = !!provider;
            if (provider) {
              isOnboardingCompleted = Boolean(provider.business_name && provider.business_name !== 'Your Business');
            }
          } catch (error) {
          }
        }
        
        // If no onboarding data exists, this is a new user
        if (!hasOnboardingData && !hasProviderDoc) {
          if (requireOnboarding) {
            // This is an onboarding page, allow access for new users
            setChecking(false);
          } else {
            // This is a dashboard page, redirect new users to onboarding
            router.push('/provider/onboarding');
          }
          return;
        }

        if (requireOnboarding) {
          // This is an onboarding page
          if (isOnboardingCompleted) {
            // Onboarding already completed, redirect to dashboard
            router.push('/provider/dashboard');
          } else {
            // Onboarding not completed, allow access to onboarding page
            setChecking(false);
          }
        } else {
          // This is a dashboard page
          if (!isOnboardingCompleted) {
            // Onboarding not completed, redirect to onboarding
            router.push('/provider/onboarding');
          } else {
            // Onboarding completed, allow access to dashboard
            setChecking(false);
          }
        }
      } catch (error) {
        console.error('Error checking provider status:', error);
        if (requireOnboarding) {
          // For onboarding pages, allow access on error (new users)
          setChecking(false);
        } else {
          // For dashboard pages, redirect to onboarding on error
          router.push('/provider/onboarding');
        }
      }
    };

    checkProviderStatus();
  }, [user, authLoading, requireOnboarding, router]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking provider status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 