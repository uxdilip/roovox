"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Clock, 
  DollarSign,
  FileText,
  Shield,
  Award
} from 'lucide-react';
import { getDevices } from '@/lib/appwrite-services';
import type { Device } from '@/types';
import Image from 'next/image';
import StepIndicator from '@/components/provider/onboarding/StepIndicator';
import PersonalDetailsStep from '@/components/provider/onboarding/steps/PersonalDetailsStep';
import BusinessSetupStep from '@/components/provider/onboarding/steps/BusinessSetupStep';
import VerificationStep from '@/components/provider/onboarding/steps/VerificationStep';
import PaymentInfoStep from '@/components/provider/onboarding/steps/PaymentStep';
import FinishStep from '@/components/provider/onboarding/steps/FinishStep';
import LocationAvailabilityStep from '@/components/provider/onboarding/steps/ServiceSetupStep';
import ServiceSelectionStep from '@/components/provider/onboarding/steps/ServiceSelectionStep';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProviderRouteGuard from '@/components/provider/ProviderRouteGuard';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface ProviderOnboardingFormData {
  businessName: string;
  businessDescription: string;
  businessPhotos: string[];
  serviceRadius: number;
  workingHours: { day: string; start: string; end: string; available: boolean }[];
  supported_brands: {
    brand: string;
    models: {
      model: string;
      services: {
        service: string;
        pricing: {
          basic: number;
          standard: number;
          premium: number;
        };
      }[];
    }[];
  }[];
  certifications: string[];
  identityDocument: File | null;
  businessLicense: File | null;
  insuranceCertificate: File | null;
  backgroundCheck: File | null;
}

type DeviceWithImage = Device & { image_url: string };

const TOTAL_STEPS = 7;
const STEP_LABELS = [
  'Personal Details',
  'Business Setup',
  'Location & Availability',
  'Service Selection',
  'Verification',
  'Payment Setup',
  'Finish'
];

export default function ProviderOnboardingWizard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/provider/login');
    }
  }, [user, isLoading, router]);

  // State for current step and all form data
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('providerOnboarding');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });
  const [resumeChecked, setResumeChecked] = useState(false);

  // Resume logic: fetch business_setup on mount
  useEffect(() => {
    async function fetchAndResume() {
      if (!user) return;
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', user.id), Query.limit(1)]
        );
        if (res.documents.length > 0) {
          const onboardingData = JSON.parse(res.documents[0].onboarding_data || '{}');
          setFormData(onboardingData);
          // Determine last completed step
          let step = 1;
          if (onboardingData.personalDetails) step = 2;
          if (onboardingData.businessSetup) step = 3;
          if (onboardingData.serviceSetup) step = 4;
          if (onboardingData.serviceSelection) step = 5;
          if (onboardingData.verification) step = 6;
          if (onboardingData.payment) step = 7;
          setCurrentStep(step);
        }
      } catch (err) {
        // Ignore errors, just start fresh
      } finally {
        setResumeChecked(true);
      }
    }
    if (!resumeChecked && user) fetchAndResume();
  }, [user, resumeChecked]);

  // Guard: Ensure currentStep is always valid
  useEffect(() => {
    if (currentStep < 1 || currentStep > TOTAL_STEPS) setCurrentStep(1);
  }, [currentStep]);

  // Save progress to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('providerOnboarding', JSON.stringify(formData));
    }
  }, [formData]);

  // Debug log
  console.log("Current step:", currentStep, "formData:", formData);

  // Navigation handlers
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // Step rendering
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalDetailsStep data={formData.personalDetails ?? {}} setData={d => setFormData((f: any) => ({ ...f, personalDetails: d }))} onNext={goNext} />;
      case 2:
        return <BusinessSetupStep data={formData.businessSetup ?? {}} setData={d => setFormData((f: any) => ({ ...f, businessSetup: d }))} onNext={goNext} onPrev={goPrev} />;
      case 3:
        return <LocationAvailabilityStep data={formData.serviceSetup ?? {}} setData={d => setFormData((f: any) => ({ ...f, serviceSetup: d }))} onNext={goNext} onPrev={goPrev} />;
      case 4:
        return <ServiceSelectionStep data={formData.serviceSelection ?? {}} setData={d => setFormData((f: any) => ({ ...f, serviceSelection: d }))} onNext={goNext} onPrev={goPrev} />;
      case 5:
        return <VerificationStep data={formData.verification ?? {}} setData={d => setFormData((f: any) => ({ ...f, verification: d }))} onNext={goNext} onPrev={goPrev} />;
      case 6:
        return <PaymentInfoStep data={formData.payment ?? {}} setData={d => setFormData((f: any) => ({ ...f, payment: d }))} onNext={goNext} onPrev={goPrev} />;
      case 7:
        console.log('🔍 Debug: Passing data to FinishStep:', formData);
        return <FinishStep data={formData ?? {}} onPrev={goPrev} />;
      default:
        return <div>Unknown step. Please restart onboarding.</div>;
    }
  };

  return (
    <ProviderRouteGuard requireOnboarding={true}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />
        <div className="mt-8">
          {renderStep()}
        </div>
      </div>
    </ProviderRouteGuard>
  );
}