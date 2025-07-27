import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { upsertBusinessSetup } from '@/lib/appwrite-services';

interface PaymentInfoStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const PaymentInfoStep: React.FC<PaymentInfoStepProps> = ({ data, setData, onNext, onPrev }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Expect data to be onboarding_data object
  const [upi, setUpi] = useState(data?.upi || '');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = upi.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || !user) return;
    setLoading(true);
    try {
      // Merge with any other onboarding data if present
      const onboarding_data = { ...data, upi };
      await upsertBusinessSetup({
        user_id: user.id,
        onboarding_data,
      });
      setData(onboarding_data);
      toast({ title: 'UPI ID saved', description: 'Your UPI ID has been saved successfully.' });
      onNext();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save UPI ID. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="text-green-600" size={24} />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        <div>
            <Label htmlFor="upi">Your UPI ID <span className="text-red-500">*</span></Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <CreditCard size={18} />
              </span>
              <Input
                id="upi"
                type="text"
                placeholder="e.g. repairtech@upi"
                value={upi}
                onChange={e => setUpi(e.target.value)}
                required
                autoComplete="off"
                disabled={loading}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This UPI ID will be shown to customers for payment. Please double-check accuracy.
            </p>
            {touched && !isValid && (
              <div className="text-red-500 text-xs mt-1">UPI ID is required.</div>
            )}
          </div>
          <div className="flex justify-between mt-8">
            <Button type="button" variant="outline" onClick={onPrev} disabled={loading}>Previous</Button>
            <Button type="submit" disabled={!isValid || loading}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>
        </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default PaymentInfoStep; 