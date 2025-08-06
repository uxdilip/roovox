'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NotificationTester() {
  const [email, setEmail] = useState('');
  const [type, setType] = useState('booking-confirmation');
  const [loading, setLoading] = useState(false);

  const notificationTypes = [
    { value: 'booking-confirmation', label: 'Booking Confirmation' },
    { value: 'new-booking', label: 'New Booking (Provider)' },
    { value: 'service-started', label: 'Service Started' },
    { value: 'service-completed', label: 'Service Completed' },
    { value: 'booking-cancelled', label: 'Booking Cancelled' },
  ];

  const handleTestNotification = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
        <CardDescription>
          Send test email notifications to verify the system is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email to test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            Notification Type
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select notification type" />
            </SelectTrigger>
            <SelectContent>
              {notificationTypes.map((notificationType) => (
                <SelectItem key={notificationType.value} value={notificationType.value}>
                  {notificationType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleTestNotification} 
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </Button>

        <div className="text-xs text-gray-500 mt-4">
          <p>Make sure you have:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Set up your RESEND_API_KEY in .env.local</li>
            <li>Verified your domain with Resend</li>
            <li>Added the email address to your allowed recipients</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 