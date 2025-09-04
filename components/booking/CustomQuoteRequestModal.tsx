"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  DollarSign, 
  Clock, 
  Smartphone, 
  Wrench, 
  Send,
  X,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createConversation, sendMessage, getExistingConversation, updateConversationContext } from '@/lib/chat-services';
import { useAuth } from '@/contexts/AuthContext';

// Form validation schema
const quoteRequestSchema = z.object({
  requirements: z.string().min(10, 'Please provide detailed requirements (at least 10 characters)').max(1000, 'Requirements too long (max 1000 characters)'),
  timeline: z.enum(['asap', '1-2_days', '1_week', 'flexible']),
  urgency_level: z.enum(['low', 'medium', 'high']),
  budget_min: z.string().optional().transform(val => val ? Number(val) : undefined),
  budget_max: z.string().optional().transform(val => val ? Number(val) : undefined)
});

type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;

interface CustomQuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    name: string;
    businessName?: string;
    rating?: number;
    yearsOfExperience?: number;
    location?: string;
    profilePicture?: string;
  };
  device: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
  selectedIssues: Array<{
    id: string;
    name?: string;
    partType?: string;
  }>;
  initialTierPrices: Array<{
    issue: string;
    price: number;
    partType?: string;
  }>;
  onSubmit: (requestData: QuoteRequestFormData & {
    provider_id: string;
    device_info: {
      brand: string;
      model: string;
      category: string;
    };
    service_issues: string[];
    initial_tier_prices: any;
  }) => void;
}

export const CustomQuoteRequestModal: React.FC<CustomQuoteRequestModalProps> = ({
  isOpen,
  onClose,
  provider,
  device,
  selectedIssues,
  initialTierPrices,
  onSubmit
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetRange, setBudgetRange] = useState([0, 0]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      budget_min: undefined,
      budget_max: undefined,
      requirements: '',
      timeline: 'flexible',
      urgency_level: 'medium'
    }
  });

  const watchedValues = watch();

  // Calculate total initial tier price
  const totalInitialPrice = initialTierPrices.reduce((sum, service) => sum + service.price, 0);

  // Handle budget range change
  const handleBudgetChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    if (type === 'min') {
      setValue('budget_min', value as any); // Keep as string for form validation
      setBudgetRange([numValue, budgetRange[1]]);
    } else {
      setValue('budget_max', value as any); // Keep as string for form validation
      setBudgetRange([budgetRange[0], numValue]);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: QuoteRequestFormData) => {
    
    if (!user) {
      alert('Please log in to submit a quote request.');
      return;
    }
    
    // Don't check isValid, let's see what happens

    setIsSubmitting(true);
    try {
      // Prepare data for submission
      const requestData = {
        ...data,
        provider_id: provider.id,
        device_info: {
          brand: device.brand,
          model: device.model,
          category: device.category
        },
        service_issues: selectedIssues.map(issue => issue.name || issue.id),
        initial_tier_prices: initialTierPrices.reduce((acc, service) => {
          acc[service.issue] = service.price;
          return acc;
        }, {} as Record<string, number>)
      };

      // Check for existing conversation first
      const existingResult = await getExistingConversation(user.id, provider.id);
      
      let conversationId: string;
      
      if (existingResult.success && existingResult.conversation) {
        // Use existing conversation and update context
        conversationId = existingResult.conversation.id;
        
        // Update conversation with new device/service context
        await updateConversationContext(
          conversationId,
          {
            brand: device.brand,
            model: device.model,
            category: device.category as 'phone' | 'laptop'
          },
          selectedIssues.map(issue => issue.name || issue.id)
        );
      } else {
        // Create new conversation
        const conversationResult = await createConversation(
          user.id,
          provider.id,
          {
            brand: device.brand,
            model: device.model,
            category: device.category as 'phone' | 'laptop'
          },
          selectedIssues.map(issue => issue.name || issue.id)
        );

        if (!conversationResult.success || !conversationResult.conversationId) {
          throw new Error('Failed to create conversation');
        }
        
        conversationId = conversationResult.conversationId;
      }

      // Send quote request as first message
      const messageContent = `Quote request for ${device.brand} ${device.model}:
Services needed: ${selectedIssues.map(issue => issue.name || issue.id).join(', ')}
Timeline: ${data.timeline}
Urgency: ${data.urgency_level}
Budget range: ₹${data.budget_min || 0} - ₹${data.budget_max || 'Flexible'}
Requirements: ${data.requirements}`;

      const messageResult = await sendMessage(
        conversationId,
        user.id,
        'customer',
        messageContent,
        'quote_request',
        {
          quote_request: {
            budget_min: data.budget_min || 0,
            budget_max: data.budget_max || 0,
            timeline: data.timeline,
            additional_notes: data.requirements
          }
        }
      );

      if (!messageResult.success) {
        throw new Error('Failed to send quote request message');
      }

      await onSubmit(requestData);
      
      // Reset form and close modal
      reset();
      onClose();
    } catch (error) {
      console.error('❌ Error submitting quote request:', error);
      alert(`Error submitting request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Request Custom Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider & Device Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <img
                  src={provider.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName || provider.name)}`}
                  alt={provider.businessName || provider.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {provider.businessName || provider.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {provider.rating && (
                      <span className="flex items-center gap-1">
                        ⭐ {provider.rating.toFixed(1)}
                      </span>
                    )}
                    {provider.yearsOfExperience && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {provider.yearsOfExperience}+ years
                      </span>
                    )}
                    {provider.location && (
                      <span className="flex items-center gap-1">
                        📍 {provider.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Device
                  </h4>
                  <p className="text-sm text-gray-600">
                    {device.brand} {device.model}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Services Needed
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedIssues.map((issue, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {issue.name || issue.id}
                        {issue.partType && ` (${issue.partType})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Quote Request Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Budget Range */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Your Budget Range
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_min" className="text-sm text-gray-600">
                    Minimum Budget (₹)
                  </Label>
                  <Input
                    id="budget_min"
                    type="text"
                    placeholder="Enter minimum budget"
                    {...register('budget_min')}
                    onChange={(e) => handleBudgetChange('min', e.target.value)}
                    className={errors.budget_min ? 'border-red-500' : ''}
                  />
                  {errors.budget_min && (
                    <p className="text-xs text-red-500 mt-1">{errors.budget_min.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="budget_max" className="text-sm text-gray-600">
                    Maximum Budget (₹)
                  </Label>
                  <Input
                    id="budget_max"
                    type="text"
                    placeholder="Enter maximum budget"
                    {...register('budget_max')}
                    onChange={(e) => handleBudgetChange('max', e.target.value)}
                    className={errors.budget_max ? 'border-red-500' : ''}
                  />
                  {errors.budget_max && (
                    <p className="text-xs text-red-500 mt-1">{errors.budget_max.message}</p>
                  )}
                </div>
              </div>
              {budgetRange[0] > 0 && budgetRange[1] > 0 && (
                <div className="text-sm text-gray-600">
                  Budget range: ₹{budgetRange[0].toLocaleString()} - ₹{budgetRange[1].toLocaleString()}
                </div>
              )}
            </div>

            {/* Detailed Requirements */}
            <div className="space-y-3">
              <Label htmlFor="requirements" className="text-base font-medium">
                Detailed Requirements
              </Label>
              <Textarea
                id="requirements"
                placeholder="Describe your device's current condition, specific issues, and any special requirements..."
                rows={4}
                {...register('requirements')}
                className={errors.requirements ? 'border-red-500' : ''}
              />
              {errors.requirements && (
                <p className="text-xs text-red-500">{errors.requirements.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Be specific about the condition, any previous repairs, and your expectations.
              </p>
            </div>

            {/* Timeline & Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="timeline" className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline Preference
                </Label>
                <Select
                  value={watchedValues.timeline}
                  onValueChange={(value) => setValue('timeline', value as any)}
                >
                  <SelectTrigger className={errors.timeline ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP (Same day)</SelectItem>
                    <SelectItem value="1-2_days">1-2 days</SelectItem>
                    <SelectItem value="1_week">1 week</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                {errors.timeline && (
                  <p className="text-xs text-red-500">{errors.timeline.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="urgency_level" className="text-base font-medium">
                  Urgency Level
                </Label>
                <Select
                  value={watchedValues.urgency_level}
                  onValueChange={(value) => setValue('urgency_level', value as any)}
                >
                  <SelectTrigger className={errors.urgency_level ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - No rush</SelectItem>
                    <SelectItem value="medium">Medium - Normal priority</SelectItem>
                    <SelectItem value="high">High - Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.urgency_level && (
                  <p className="text-xs text-red-500">{errors.urgency_level.message}</p>
                )}
              </div>
            </div>





            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
