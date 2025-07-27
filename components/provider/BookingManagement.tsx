"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Star,
  User,
  Calendar,
  Package,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateBookingStatus, updateBookingRating } from '@/lib/appwrite-services';

interface BookingManagementProps {
  booking: any;
  onUpdateStatus: (bookingId: string, status: string, notes?: string) => void;
  onUploadPhoto: (bookingId: string, photo: File) => void;
  onCompleteService: (bookingId: string, finalNotes: string) => void;
  onRefresh: () => void;
}

export function BookingManagement({ 
  booking, 
  onUpdateStatus, 
  onUploadPhoto, 
  onCompleteService,
  onRefresh
}: BookingManagementProps) {
  const [workNotes, setWorkNotes] = useState(booking.work_notes || '');
  const [newStatus, setNewStatus] = useState(booking.status);
  const [finalNotes, setFinalNotes] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === booking.status) return;
    
    setIsUpdating(true);
    try {
      await updateBookingStatus(booking.id, newStatus, workNotes);
      onUpdateStatus(booking.id, newStatus, workNotes);
      toast({
        title: "Status Updated",
        description: `Booking status updated to ${newStatus.replace('_', ' ')}`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadPhoto(booking.id, file);
    }
  };

  const handleCompleteService = async () => {
    setIsUpdating(true);
    try {
      await updateBookingStatus(booking.id, 'completed', finalNotes);
      onCompleteService(booking.id, finalNotes);
      setShowCompleteForm(false);
      toast({
        title: "Service Completed",
        description: "Booking marked as completed successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete service",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateBookingRating(booking.id, rating, review);
      setShowRatingDialog(false);
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim();
    }
    return 'Address not available';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              <span>Booking #{booking.id?.slice(-8)}</span>
              <Badge className={getStatusColor(booking.status)}>
                {getStatusIcon(booking.status)}
                <span className="ml-1">{booking.status.replace('_', ' ')}</span>
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.appointment_time)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>${booking.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreditCard className="h-4 w-4" />
                <span>{booking.payment_status}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer & Device Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center">
              <User className="h-4 w-4 mr-2" />
              Customer Details
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.customer_phone || 'Phone not available'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{formatAddress(booking.customer_address)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Service: {booking.location_type}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Device & Service
            </h4>
            <div className="space-y-1 text-sm">
              <p><strong>Device:</strong> {booking.device_brand || 'Unknown'} {booking.device_model || ''}</p>
              <p><strong>Issue:</strong> {booking.issue_description || booking.issues?.join(', ') || 'Not specified'}</p>
              <p><strong>Part Quality:</strong> {booking.part_quality || 'Standard'}</p>
              <p><strong>Service Type:</strong> {booking.location_type}</p>
            </div>
          </div>
        </div>

        {/* Status Update */}
        <div className="space-y-4">
          <h4 className="font-semibold">Update Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Service Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleStatusUpdate} 
                className="w-full"
                disabled={isUpdating || newStatus === booking.status}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>

        {/* Work Notes */}
        <div>
          <Label htmlFor="workNotes">Work Notes</Label>
          <Textarea
            id="workNotes"
            value={workNotes}
            onChange={(e) => setWorkNotes(e.target.value)}
            placeholder="Document your work progress, findings, and any issues..."
            rows={3}
          />
        </div>

        {/* Photo Upload */}
        <div>
          <Label>Progress Photos</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Document before/after photos and work progress
                </p>
              </div>
            </div>
          </div>

          {/* Existing Photos */}
          {booking.progress_photos?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Uploaded Photos:</p>
              <div className="grid grid-cols-4 gap-2">
                {booking.progress_photos.map((photo: string, index: number) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded border">
                    <img 
                      src={photo} 
                      alt={`Progress photo ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message Customer
          </Button>
          <Button variant="outline" className="flex-1">
            <Phone className="h-4 w-4 mr-2" />
            Call Customer
          </Button>
          {booking.status !== 'completed' && (
            <Button 
              onClick={() => setShowCompleteForm(true)}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Service
            </Button>
          )}
          {booking.status === 'completed' && !booking.rating && (
            <Button 
              onClick={() => setShowRatingDialog(true)}
              variant="outline"
              className="flex-1"
            >
              <Star className="h-4 w-4 mr-2" />
              Rate Service
            </Button>
          )}
        </div>

        {/* Complete Service Form */}
        <Dialog open={showCompleteForm} onOpenChange={setShowCompleteForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Service</DialogTitle>
              <DialogDescription>
                Mark this booking as completed and add final notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="finalNotes">Final Notes</Label>
                <Textarea
                  id="finalNotes"
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  placeholder="Describe the work completed, parts used, and any recommendations..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCompleteService} disabled={isUpdating}>
                  {isUpdating ? 'Completing...' : 'Complete Service'}
                </Button>
                <Button variant="outline" onClick={() => setShowCompleteForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Your Service</DialogTitle>
              <DialogDescription>
                How would you rate the quality of service provided?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant={rating >= star ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRating(star)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="review">Review (Optional)</Label>
                <Textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this service..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRatingSubmit} disabled={isUpdating}>
                  {isUpdating ? 'Submitting...' : 'Submit Rating'}
                </Button>
                <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}