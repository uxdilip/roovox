import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/lib/appwrite';
import { Permission, Role, ID } from 'appwrite';
import { updateBusinessSetupKycDocs, upsertBusinessSetup } from '@/lib/appwrite-services';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const DOCS = [
  { key: 'aadhaar', label: 'Aadhaar Card', required: true },
  { key: 'pan', label: 'PAN Card', required: true },
  { key: 'gst', label: 'GST Certificate', required: false },
  { key: 'shop_reg', label: 'Shop License or Registration Certificate', required: false },
];

const VerificationStep: React.FC<VerificationStepProps> = ({ data, setData, onNext, onPrev }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<{ [k: string]: boolean }>({});
  const [previews, setPreviews] = useState<{ [k: string]: string | null }>({});
  const [files, setFiles] = useState<{ [k: string]: File | null }>({});
  const [kycDocs, setKycDocs] = useState<any>(data.kyc_docs || {});

  // Use actual user ID instead of temp-provider-id
  const providerId = user?.id || 'temp-provider-id';

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(f => ({ ...f, [key]: file }));
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreviews(p => ({ ...p, [key]: e.target?.result as string }));
      reader.readAsDataURL(file);
    } else {
      setPreviews(p => ({ ...p, [key]: null }));
    }
  };

  const handleUpload = async (key: string) => {
    const file = files[key];
    if (!file) return;
    setUploading(u => ({ ...u, [key]: true }));
    try {
      console.log('🔍 Debug: Starting upload for', key, 'for user:', user?.id);
      const ext = file.name.split('.').pop();
      const fileName = `${key}.${ext}`;
      // Upload to Appwrite Storage (bucketId must be set in env or code)
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_DOCS_BUCKET_ID || 'provider_docs';
      if (!user?.id) throw new Error('No user ID found. Please log in again.');
      const permissions = [
        Permission.read(Role.any()),
        Permission.write(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
        Permission.read(Role.users()),
        Permission.write(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ];
      const res = await storage.createFile(bucketId, ID.unique(), file, permissions);
      console.log('✅ File uploaded successfully:', res.$id);
      
      // Save file ID or URL
      setKycDocs((prev: any) => {
        const wasAlreadyUploaded = !!prev[key];
        const next = { ...prev, [key]: res.$id };
        console.log('🔍 Debug: Updated kyc_docs:', next);
        setData({ ...data, kyc_docs: next });
        // Use updateBusinessSetupKycDocs to save kyc_docs
        updateBusinessSetupKycDocs(providerId, next).then(() => {
          console.log('✅ KYC docs saved to business_setup successfully');
        }).catch(err => {
          console.error('❌ Error saving KYC docs:', err);
          toast({ title: 'Failed to update KYC docs in business_setup', description: String(err), variant: 'destructive' });
        });
        if (wasAlreadyUploaded) {
          toast({ title: `${DOCS.find(d => d.key === key)?.label} replaced successfully!` });
        } else {
          toast({ title: `${DOCS.find(d => d.key === key)?.label} uploaded successfully!` });
        }
        return next;
      });
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      let errorMessage = 'Upload failed. Please try again.';
      if (err.code === 401) {
        errorMessage = 'Permission denied. Please check your session and try again.';
      } else if (err.code === 413) {
        errorMessage = 'File too large. Please choose a smaller file.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast({ title: 'Upload failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  // Validation: Aadhaar and PAN required
  const isValid = kycDocs.aadhaar && kycDocs.pan;

  return (
    <form className="space-y-8" onSubmit={e => { e.preventDefault(); if (isValid) onNext(); }}>
      <h2 className="text-2xl font-bold mb-6 text-center">Document Verification</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {DOCS.map(doc => (
          <Card key={doc.key}>
            <CardHeader>
              <CardTitle>
                <Label>{doc.label} {doc.required && <span className="text-red-500">*</span>}</Label>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFileChange(doc.key, e.target.files?.[0] || null)} />
              {previews[doc.key] ? (
                <img src={previews[doc.key]!} alt="preview" className="w-32 h-32 object-contain border rounded" />
              ) : files[doc.key] ? (
                <span className="text-xs text-gray-600">{files[doc.key]?.name}</span>
              ) : kycDocs[doc.key] ? (
                <span className="text-xs text-green-600">Uploaded</span>
              ) : null}
              {files[doc.key] ? (
                <Button type="button" variant="secondary" disabled={uploading[doc.key]} onClick={() => handleUpload(doc.key)}>
                  {uploading[doc.key] ? 'Uploading...' : (kycDocs[doc.key] ? 'Replace' : 'Upload')}
                </Button>
              ) : kycDocs[doc.key] ? (
                <Button type="button" variant="secondary" disabled>
                  Uploaded
                </Button>
              ) : (
                <Button type="button" variant="secondary" disabled>
                  Upload
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {!isValid && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded p-4 mb-4 space-y-2 text-center">
          Aadhaar Card and PAN Card are required.
        </div>
      )}
      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button type="submit" disabled={!isValid}>Next</Button>
      </div>
    </form>
  );
};

export default VerificationStep; 