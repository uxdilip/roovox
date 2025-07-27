import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { upsertBusinessSetup, uploadProviderDoc } from '@/lib/appwrite-services';
import { useToast } from '@/hooks/use-toast';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const serviceModes = [
  { value: 'doorstep', label: 'Doorstep' },
  { value: 'in-store', label: 'In-Store' },
  { value: 'both', label: 'Both' },
];

interface BusinessSetupStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev?: () => void;
}

const BusinessSetupStep = ({ data, setData, onNext, onPrev }: BusinessSetupStepProps) => {
  const [business, setBusiness] = useState({
    name: data.business?.name || '',
    description: data.business?.description || '',
    photos: data.business?.photos || [],
    experience: data.business?.experience || '',
    serviceMode: data.business?.serviceMode || '',
  });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(business.photos || []);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleChange = (field: string, value: any) => {
    setBusiness(prev => ({ ...prev, [field]: value }));
    setData((f: any) => ({ ...f, business: { ...business, [field]: value } }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleChange('photos', files);
    const readers = files.map(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      return new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string);
      });
    });
    Promise.all(readers).then(setPhotoPreviews);
  };

  const isValid = business.name && business.description && business.serviceMode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user) return;
    setLoading(true);
    try {
      let shopImages: string[] = [];
      if (Array.isArray(business.photos) && business.photos.length > 0 && business.photos[0] instanceof File) {
        // Upload all photos to provider_docs
        shopImages = await Promise.all(
          business.photos.map((file: File) => uploadProviderDoc(file, user.id))
        );
      }
      // Fetch latest onboarding_data from DB
      let onboarding_data = {};
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
      onboarding_data = {
        ...onboarding_data,
        businessInfo: {
          businessName: business.name,
          businessType: business.serviceMode,
          yearsOfExperience: business.experience,
          businessBio: business.description,
          shopImages,
        },
      };
      await upsertBusinessSetup({
        user_id: user.id,
        onboarding_data,
      });
      setData({ ...data, onboarding_data });
      toast({ title: 'Business info saved', description: 'Your business info has been saved successfully.' });
      onNext();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save business info. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6">Business Details</h2>
      <div className="bg-gray-50 p-6 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
        <div className="col-span-2">
          <Label htmlFor="business-name">Business Name *</Label>
          <Input id="business-name" type="text" value={business.name} onChange={e => handleChange('name', e.target.value)} required placeholder="e.g. TechFix Solutions" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="business-description">Description / Short Bio *</Label>
          <Input id="business-description" type="text" value={business.description} onChange={e => handleChange('description', e.target.value)} required placeholder="Describe your shop or business" className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="shop-photos">Upload Shop Photos (optional)</Label>
          <Input id="shop-photos" type="file" accept="image/*" multiple onChange={handlePhotoChange} />
          <div className="flex flex-wrap gap-2 mt-2">
            {photoPreviews.map((src, idx) => (
              <img key={idx} src={src} alt="Shop preview" className="w-20 h-20 rounded object-cover border" />
            ))}
          </div>
      </div>
        <div>
          <Label htmlFor="experience">Years of Experience (optional)</Label>
          <Input id="experience" type="number" min={0} value={business.experience} onChange={e => handleChange('experience', e.target.value)} placeholder="e.g. 5" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="service-mode">Service Mode *</Label>
          <select
            id="service-mode"
            value={business.serviceMode}
            onChange={e => handleChange('serviceMode', e.target.value)}
            required
            className="input w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select...</option>
            {serviceModes.map(mode => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-between mt-8">
        {onPrev && <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>}
        <Button type="submit" disabled={!isValid || loading}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  );
};

export default BusinessSetupStep; 