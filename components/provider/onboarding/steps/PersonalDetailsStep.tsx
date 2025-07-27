import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { upsertBusinessSetup, uploadProviderDoc } from '@/lib/appwrite-services';
import { useToast } from '@/hooks/use-toast';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface PersonalDetailsStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev?: () => void;
}

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const validatePhone = (phone: string) => /^\d{10,15}$/.test(phone);
const validatePassword = (pw: string) => pw.length >= 8;

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({ data, setData, onNext, onPrev }) => {
  const [touched, setTouched] = useState<{[k: string]: boolean}>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(data.profilePhoto || null);
  const [loading, setLoading] = useState(false);
  const { user, refreshSession } = useAuth();
  const { toast } = useToast();

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
    setTouched(t => ({ ...t, [field]: true }));
    if (field === 'profilePhoto' && value instanceof File) {
      const reader = new FileReader();
      reader.onload = e => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(value);
    }
  };

  const errors = {
    fullName: !data.fullName ? 'Full name is required' : '',
    contact: !data.contact ? 'Contact number is required' : (!validatePhone(data.contact) ? 'Enter a valid phone number' : ''),
    email: !data.email ? 'Email is required' : (!validateEmail(data.email) ? 'Enter a valid email' : ''),
    password: !data.password ? 'Password is required' : (!validatePassword(data.password) ? 'Password must be at least 8 characters' : ''),
    terms: !data.terms ? 'You must accept the terms' : '',
  };
  const isValid = Object.values(errors).every(e => !e);

  // Password strength
  const pwStrength = data.password ? (data.password.length >= 12 ? 'strong' : data.password.length >= 8 ? 'medium' : 'weak') : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user) return;
    setLoading(true);
    try {
      // First, check if user session is valid
      console.log('🔍 Checking user session for:', user.id);
      
      let profilePicture = data.profilePicture || '';
      if (data.profilePhoto instanceof File) {
        // Upload profile photo to provider_docs
        const fileId = await uploadProviderDoc(data.profilePhoto, user.id);
        profilePicture = fileId;
      }
      
      // Fetch latest onboarding_data from DB
      let onboarding_data = {};
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', user.id), Query.limit(1)]
        );
        if (res.documents.length > 0) {
          try {
            onboarding_data = JSON.parse(res.documents[0].onboarding_data || '{}');
          } catch {
            onboarding_data = {};
          }
        }
      } catch (error) {
        console.error('❌ Error fetching existing onboarding data:', error);
        // Continue with empty onboarding_data
        onboarding_data = {};
      }
      
      onboarding_data = {
        ...onboarding_data,
        personalDetails: {
          fullName: data.fullName,
          mobile: data.contact,
          email: data.email,
          profilePicture,
        },
      };
      
      console.log('💾 Saving onboarding data for user:', user.id);
      await upsertBusinessSetup({
        user_id: user.id,
        onboarding_data,
      });
      
      setData({ ...data, onboarding_data });
      toast({ title: 'Personal details saved', description: 'Your personal details have been saved successfully.' });
      onNext();
    } catch (err: any) {
      console.error('❌ Error saving personal details:', err);
      if (err.code === 401) {
        await refreshSession();
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
      } else {
        toast({ 
          title: 'Error', 
          description: `Failed to save personal details: ${err.message || 'Please try again.'}`, 
          variant: 'destructive' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          type="text"
          value={data.fullName || ''}
          onChange={e => handleChange('fullName', e.target.value)}
          aria-invalid={!!errors.fullName}
          aria-describedby="fullName-error"
          placeholder="e.g. John Doe"
        />
        {touched.fullName && errors.fullName && <div id="fullName-error" className="text-red-500 text-xs mt-1">{errors.fullName}</div>}
      </div>
      <div>
        <Label htmlFor="contact">Contact Number *</Label>
        <Input
          id="contact"
          type="tel"
          value={data.contact || ''}
          onChange={e => handleChange('contact', e.target.value)}
          aria-invalid={!!errors.contact}
          aria-describedby="contact-error"
          placeholder="e.g. 9876543210"
        />
        {touched.contact && errors.contact && <div id="contact-error" className="text-red-500 text-xs mt-1">{errors.contact}</div>}
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={data.email || ''}
          onChange={e => handleChange('email', e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          placeholder="e.g. john@example.com"
        />
        {touched.email && errors.email && <div id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</div>}
      </div>
      <div>
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={data.password || ''}
          onChange={e => handleChange('password', e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          placeholder="At least 8 characters"
        />
        {touched.password && errors.password && <div id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</div>}
        {data.password && (
          <div className="text-xs mt-1">
            Strength: <span className={pwStrength === 'strong' ? 'text-green-600' : pwStrength === 'medium' ? 'text-yellow-600' : 'text-red-600'}>{pwStrength}</span>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="profilePhoto">Profile Photo (optional)</Label>
        <Input
          id="profilePhoto"
          type="file"
          accept="image/*"
          onChange={e => handleChange('profilePhoto', e.target.files?.[0])}
        />
        {photoPreview && <img src={photoPreview} alt="Profile preview" className="mt-2 w-20 h-20 rounded-full object-cover" />}
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={!!data.terms}
          onChange={e => handleChange('terms', e.target.checked)}
          id="terms"
          className="accent-primary h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-primary"
        />
        <Label htmlFor="terms" className="ml-2 text-sm font-normal">
          I accept the <a href="/terms" target="_blank" rel="noopener" className="underline">platform terms and conditions</a> *
        </Label>
      </div>
      {touched.terms && errors.terms && <div className="text-red-500 text-xs mt-1">{errors.terms}</div>}
      <div className="flex justify-between mt-8">
        {onPrev && <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>}
        <Button type="submit" className="btn btn-primary w-full mt-4" disabled={!isValid || loading}> 
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep; 